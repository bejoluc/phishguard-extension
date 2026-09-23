import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { UrlHeuristicsEngine } from '../src/detectors/urlDetector.js';
import { RiskCalculator } from '../src/scoring/riskScoring.js';
import { UiRenderer } from '../src/ui/renderResults.js';

function makeElement() {
  const element = {
    textContent: '',
    innerHTML: '',
    className: '',
    children: [],
    appendChild(child) { this.children.push(child); },
  };
  element.classList = { add(name) { element.className += ` ${name}`; } };
  return element;
}

function render(assessment, systemUrl) {
  const previousDocument = globalThis.document;
  const elements = {
    domainDisplay: makeElement(),
    riskScore: makeElement(),
    statusBadge: makeElement(),
    confidenceBadge: makeElement(),
    indicatorsList: makeElement(),
  };
  globalThis.document = { createElement: makeElement };
  UiRenderer.elements = elements;
  try {
    if (systemUrl === 'scan') UiRenderer.renderScanning();
    else if (systemUrl) UiRenderer.renderSystemPage(systemUrl);
    else UiRenderer.renderAssessment(assessment);
  } finally {
    globalThis.document = previousDocument;
  }
  return elements;
}

test('a missing DOM scan never presents a clean URL as safe', () => {
  const assessment = RiskCalculator.calculate([], null, 'example.com');
  const ui = render(assessment);

  assert.equal(assessment.score, 0);
  assert.equal(assessment.analysisComplete, false);
  assert.equal(assessment.status, 'Incomplete');
  assert.equal(ui.statusBadge.textContent, 'Niepełna');
  assert.equal(ui.confidenceBadge.textContent, 'Niepełna');
  assert.match(ui.indicatorsList.children[0].textContent, /tylko adres URL/);
  assert.doesNotMatch(ui.indicatorsList.innerHTML, /Brak anomalii|Bezpieczny/);
});

test('a dangerous URL still warns even if the DOM scan failed', () => {
  const url = new URL('http://fakepaypal.com/login');
  const indicators = UrlHeuristicsEngine.analyze(url);
  const assessment = RiskCalculator.calculate(indicators, null, url.hostname);
  const ui = render(assessment);

  assert.equal(assessment.score, 75);
  assert.equal(assessment.status, 'Dangerous');
  assert.equal(assessment.analysisComplete, false);
  assert.equal(ui.statusBadge.textContent, 'Zagrożenie');
  assert.equal(ui.confidenceBadge.textContent, 'Niepełna');
  assert.match(ui.indicatorsList.children[0].textContent, /może być zaniżony/);
});

test('a complete scan can still return zero detected indicators', () => {
  const telemetry = {
    hasPasswordField: false,
    insecureFormActions: [],
    externalFormActions: [],
    detectedBrandKeywords: [],
  };
  const assessment = RiskCalculator.calculate([], telemetry, 'example.com');
  const ui = render(assessment);

  assert.equal(assessment.analysisComplete, true);
  assert.equal(assessment.status, 'Safe');
  assert.equal(ui.statusBadge.textContent, 'Bezpieczny');
  assert.match(ui.indicatorsList.innerHTML, /Nie wykryto wskaźników/);
  assert.equal(ui.indicatorsList.children.length, 0);
});

test('internal browser pages are reported as not evaluated', () => {
  const ui = render(null, 'chrome://extensions/');

  assert.equal(ui.riskScore.textContent, '--');
  assert.equal(ui.statusBadge.textContent, 'Nie oceniono');
  assert.match(ui.indicatorsList.children[0].textContent, /nie jest dostępna do analizy/);
});

test('the initial popup and subsequent scans show a pending state', () => {
  const html = readFileSync(new URL('../popup.html', import.meta.url), 'utf8');
  const ui = render(null, 'scan');

  assert.match(html, /id="risk-score">--<\/span>/);
  assert.match(html, /class="status-badge pending">Skanowanie<\/div>/);
  assert.equal(ui.riskScore.textContent, '--');
  assert.equal(ui.statusBadge.textContent, 'Skanowanie');
  assert.match(ui.indicatorsList.children[0].textContent, /Trwa analiza/);
});
