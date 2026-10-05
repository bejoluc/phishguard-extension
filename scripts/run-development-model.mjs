import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';

import { UrlHeuristicsEngine } from '../src/detectors/urlDetector.js';
import { RiskCalculator } from '../src/scoring/riskScoring.js';

// This runner reproduces SPEC_40 in a small DOM model. It does not open Chrome,
// resolve the model hostnames, send forms, or assert the reference label.
const defaultIds = ['C01', 'C07', 'C10', 'C11', 'C16'];
const ids = process.argv.slice(2).length ? process.argv.slice(2) : defaultIds;
const csvUrl = new URL('../docs/przypadki-testowe.csv', import.meta.url);
const detectorUrl = new URL('../src/detectors/domDetector.js', import.meta.url);
const csv = readFileSync(csvUrl, 'utf8').replace(/^\uFEFF/, '');
const detectorScript = readFileSync(detectorUrl, 'utf8');

function parseRow(line) {
  const cells = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') { value += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ';' && !quoted) {
      cells.push(value);
      value = '';
    } else {
      value += char;
    }
  }
  if (quoted) throw new Error('Unclosed quoted CSV field');
  cells.push(value);
  return cells;
}

const [heading, ...lines] = csv.trimEnd().split(/\r?\n/).map(parseRow);
const rows = new Map(lines.map(values => {
  if (values.length !== heading.length) throw new Error('CSV column count mismatch');
  const row = Object.fromEntries(heading.map((key, index) => [key, values[index]]));
  return [row.id, row];
}));

function element(tagName, { text = '', attrs = {}, children = [] } = {}) {
  const node = {
    tagName: tagName.toUpperCase(), directText: text, children, parentElement: null,
    get textContent() { return text + children.map(child => child.textContent).join(''); },
    getAttribute(name) { return attrs[name] ?? null; },
    contains(other) { return this === other || children.some(child => child.contains(other)); },
    querySelectorAll(selector) {
      const selectors = selector.split(',').map(part => part.trim().toLowerCase());
      const matches = child => selectors.some(part => {
        if (part.startsWith('input[type="')) {
          return child.tagName === 'INPUT' && child.getAttribute('type') === part.slice(12, -2);
        }
        if (part === '[role="button"]') return child.getAttribute('role') === 'button';
        return child.tagName.toLowerCase() === part;
      });
      return children.flatMap(child => [
        ...(matches(child) ? [child] : []), ...child.querySelectorAll(selector)
      ]);
    },
    querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; },
  };
  children.forEach(child => { child.parentElement = node; });
  return node;
}

function makeDocument(row) {
  const hasPassword = row.typ_dom === 'haslo';
  if (!hasPassword && row.typ_dom !== 'oauth_only') {
    throw new Error(`${row.id}: unsupported DOM profile ${row.typ_dom}`);
  }
  const brand = row.marka_w_dom;
  const title = hasPassword && brand ? `${brand} — logowanie` : 'Panel logowania';
  const headingText = hasPassword && brand ? `Zaloguj się do ${brand}` : 'Zaloguj się';
  const formChildren = [
    element('h2', { text: headingText }),
    element('input', { attrs: { type: 'email', name: hasPassword ? 'email' : 'username' } }),
    ...(hasPassword ? [element('input', { attrs: { type: 'password', name: 'password' } })] : []),
    ...(hasPassword ? [element('button', { text: 'Zaloguj' })] : []),
  ];
  const attrs = { method: 'post' };
  if (row.cel_formularza) attrs.action = row.cel_formularza;
  const children = [element('form', { attrs, children: formChildren })];
  if (!hasPassword && row.przycisk_oauth) {
    children.push(element('button', { text: row.przycisk_oauth }));
  }
  const body = element('body', { children });
  return {
    title,
    querySelectorAll(selector) { return body.querySelectorAll(selector); },
    createTreeWalker(start, show) {
      if (show !== 4) throw new Error('Unsupported TreeWalker mode');
      const fragments = [];
      function visit(node) {
        if (node.directText) fragments.push({ textContent: node.directText });
        node.children.forEach(visit);
      }
      visit(start);
      let index = 0;
      return { nextNode: () => fragments[index++] ?? null };
    },
  };
}

function run(row) {
  if (row.zbior !== 'rozwoj' || row.profil_dom !== 'SPEC_40' ||
      row.tryb !== 'planowany_przypadek') {
    throw new Error(`${row.id}: only planned development cases with SPEC_40 are allowed`);
  }
  const url = new URL(row.wejscie);
  const window = { location: { href: url.href, hostname: url.hostname } };
  runInNewContext(detectorScript, {
    window, document: makeDocument(row), URL, NodeFilter: { SHOW_TEXT: 4 },
  });
  const dom = window.DomDetector.scan();
  const urlIndicators = UrlHeuristicsEngine.analyze(url);
  const result = RiskCalculator.calculate(urlIndicators, dom, url.hostname);
  return {
    id: row.id, referenceLabel: row.referencja, modelUrl: row.wejscie,
    domProfile: row.profil_dom, domType: row.typ_dom,
    urlIndicatorIds: urlIndicators.map(x => x.id),
    urlPoints: urlIndicators.reduce((sum, x) => sum + x.riskWeight, 0),
    domTelemetry: {
      passwordFieldCount: dom.passwordFieldCount, formCount: dom.formCount,
      insecureFormActions: dom.insecureFormActions,
      externalFormActions: dom.externalFormActions,
      detectedBrandKeywords: dom.detectedBrandKeywords,
    },
    indicatorIds: result.indicators.map(x => x.id),
    score: result.score, status: result.status, confidence: result.confidence,
    analysisComplete: result.analysisComplete,
  };
}

function sha256(relativePath) {
  return createHash('sha256').update(readFileSync(new URL(relativePath, import.meta.url))).digest('hex');
}

const sourceFiles = [
  '../src/detectors/domDetector.js', '../src/detectors/urlDetector.js',
  '../src/scoring/riskScoring.js', '../src/constants/brands.js',
  '../src/utils/urlUtils.js', '../docs/przypadki-testowe.csv',
];
if (new Set(ids).size !== ids.length) throw new Error('Duplicate scenario ID');
const results = ids.map(id => {
  const row = rows.get(id);
  if (!row) throw new Error(`Unknown scenario ID: ${id}`);
  return run(row);
});
console.log(JSON.stringify({
  method: 'controlled-dom-model',
  browser: 'not-used',
  generatedAt: new Date().toISOString(),
  node: process.version,
  sourcesSha256: Object.fromEntries(sourceFiles.map(path => [path.slice(3), sha256(path)])),
  results,
}, null, 2));
