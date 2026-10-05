import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

import { UrlHeuristicsEngine } from '../src/detectors/urlDetector.js';
import { RiskCalculator } from '../src/scoring/riskScoring.js';

const detectorScript = readFileSync(new URL('../src/detectors/domDetector.js', import.meta.url), 'utf8');

// Small DOM fixture: selectors and textContent behave like the elements used by the detector.
function element(tagName, { text = '', attrs = {}, children = [] } = {}) {
  const node = {
    tagName: tagName.toUpperCase(),
    directText: text,
    parentElement: null,
    children,
    get textContent() { return text + this.children.map(child => child.textContent).join(''); },
    getAttribute(name) { return attrs[name] ?? null; },
    contains(other) { return this === other || this.children.some(child => child.contains(other)); },
    querySelectorAll(selector) {
      const tags = selector.split(',').map(part => part.trim().toLowerCase());
      const matches = child => tags.some(tag => {
        if (tag === 'input[type="password"]') {
          return child.tagName === 'INPUT' && child.getAttribute('type') === 'password';
        }
        if (tag === 'input[type="submit"]' || tag === 'input[type="button"]') {
          return child.tagName === 'INPUT' && child.getAttribute('type') === tag.slice(12, -2);
        }
        if (tag === '[role="button"]') return child.getAttribute('role') === 'button';
        return child.tagName.toLowerCase() === tag;
      });
      return this.children.flatMap(child => [
        ...(matches(child) ? [child] : []), ...child.querySelectorAll(selector)
      ]);
    },
    querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; },
  };
  children.forEach(child => { child.parentElement = node; });
  return node;
}

function scan({ href = 'https://portal.example.test/login', title = 'Panel logowania', body }) {
  const root = element('body', { children: body });
  const document = {
    title,
    querySelectorAll(selector) { return root.querySelectorAll(selector); },
    createTreeWalker(start, show) {
      assert.equal(show, 4);
      const fragments = [];
      const visit = node => {
        if (node.directText) fragments.push({ textContent: node.directText });
        node.children.forEach(visit);
      };
      visit(start);
      let index = 0;
      return { nextNode: () => fragments[index++] ?? null };
    },
  };
  const window = { location: { href, hostname: new URL(href).hostname } };
  runInNewContext(detectorScript, { window, document, URL, NodeFilter: { SHOW_TEXT: 4 } });
  const telemetry = window.DomDetector.scan();
  const url = new URL(href);
  const assessment = RiskCalculator.calculate(UrlHeuristicsEngine.analyze(url), telemetry, url.hostname);
  return { telemetry, assessment };
}

const email = () => element('input', { attrs: { type: 'email', name: 'email' } });
const password = () => element('input', { attrs: { type: 'password', name: 'password' } });
const form = (children, action) => element('form', {
  attrs: action === undefined ? {} : { action, method: 'post' }, children,
});
const indicatorIds = assessment => assessment.indicators.map(indicator => indicator.id);

test('a local password form yields login evidence without reading entered values', () => {
  const field = password();
  Object.defineProperty(field, 'value', { get() { throw new Error('Must not read form values'); } });
  const { telemetry, assessment } = scan({ body: [form([email(), field], '/session')] });

  assert.equal(telemetry.passwordFieldCount, 1);
  assert.equal(telemetry.formCount, 1);
  assert.equal(telemetry.hasPasswordField, true);
  assert.equal(telemetry.insecureFormActions.length, 0);
  assert.equal(telemetry.externalFormActions.length, 0);
  assert.equal(assessment.score, 25);
  assert.deepEqual(indicatorIds(assessment), ['suspicious-keywords', 'password-field-present']);
});

test('external HTTPS and same-host HTTP login actions yield distinct signals', () => {
  const external = scan({ body: [form([password()], 'https://collector.example.test/session')] });
  const insecure = scan({ body: [form([password()], 'http://portal.example.test/session')] });

  assert.equal(external.telemetry.externalFormActions.length, 1);
  assert.equal(external.telemetry.insecureFormActions.length, 0);
  assert.deepEqual(indicatorIds(external.assessment), [
    'suspicious-keywords', 'password-field-present', 'external-form-action'
  ]);
  assert.equal(insecure.telemetry.externalFormActions.length, 0);
  assert.equal(insecure.telemetry.insecureFormActions.length, 1);
  assert.deepEqual(indicatorIds(insecure.assessment), [
    'suspicious-keywords', 'password-field-present', 'insecure-form-action'
  ]);
});

test('a single OAuth button inside a login form is one brand mention', () => {
  const oauth = element('button', { text: 'Zaloguj przez Google' });
  const { telemetry, assessment } = scan({ body: [form([email(), oauth], '/session')] });

  assert.equal(telemetry.hasPasswordField, false);
  assert.deepEqual(Array.from(telemetry.detectedBrandKeywords), []);
  assert.ok(!indicatorIds(assessment).includes('brand-mismatch'));
});

test('one brand heading inside a password form is one brand mention', () => {
  const heading = element('h2', { text: 'PayPal' });
  const { telemetry } = scan({ body: [form([heading, password()], '/session')] });

  assert.deepEqual(Array.from(telemetry.detectedBrandKeywords), []);
});

test('two independent mentions in the login context identify an unofficial brand', () => {
  const heading = element('h2', { text: 'PayPal' });
  const label = element('label', { text: 'Dane konta PayPal' });
  const { telemetry, assessment } = scan({ body: [form([heading, label, password()], '/session')] });

  assert.deepEqual(Array.from(telemetry.detectedBrandKeywords), ['paypal']);
  assert.ok(indicatorIds(assessment).includes('brand-mismatch'));
});

test('brand names embedded in longer words do not count as brand mentions', () => {
  const { telemetry } = scan({
    title: 'PayPalify',
    body: [form([element('h2', { text: 'PayPalify' }), password()], '/session')],
  });

  assert.deepEqual(Array.from(telemetry.detectedBrandKeywords), []);
});

test('a mention in the footer is ignored and the official host is exempt', () => {
  const footer = element('footer', { text: 'PayPal PayPal' });
  const generic = scan({ body: [form([password()], '/session'), footer] });
  const official = scan({
    href: 'https://paypal.com/login',
    title: 'PayPal',
    body: [form([element('h2', { text: 'PayPal' }), password()], '/session')],
  });

  assert.deepEqual(Array.from(generic.telemetry.detectedBrandKeywords), []);
  assert.deepEqual(Array.from(official.telemetry.detectedBrandKeywords), []);
});
