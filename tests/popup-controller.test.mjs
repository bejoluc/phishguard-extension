import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../popup.js', import.meta.url), 'utf8')
  .replace(/^import .*;$/gm, '') + '\n globalThis.controller = AppController;';
const telemetry = { success: true, analysis: { hasPasswordField: false,
  insecureFormActions: [], externalFormActions: [], detectedBrandKeywords: [] } };
function setup(overrides = {}) {
  const button = { disabled: false };
  const calls = { query: 0, message: 0, reports: [], errors: [] };
  const tab = { id: 7, url: 'https://example.test/', active: true, status: 'complete' };
  const context = { URL, setTimeout, console: { error() {} },
    document: { getElementById: () => button, addEventListener() {} },
    chrome: { tabs: {
      query: async () => { calls.query++; return [tab]; },
      sendMessage: async () => { calls.message++; return telemetry; },
      get: async () => tab, ...overrides }, scripting: { executeScript: async () => {} } },
    UiRenderer: { renderScanning() {}, renderHostname() {}, renderSystemPage() {},
      renderAssessment: report => calls.reports.push(report), renderError: msg => calls.errors.push(msg) },
    UrlHeuristicsEngine: { analyze: () => [] },
    RiskCalculator: { calculate: () => ({ score: 0 }) }, isBrowserInternal: url => url.startsWith('chrome:') };
  runInNewContext(source, context);
  return { controller: context.controller, calls, button, tab };
}
test('overlapping scan requests produce one result and the next scan remains available', async () => {
  let release;
  const h = setup({ sendMessage: () => new Promise(resolve => { release = resolve; }) });
  const first = h.controller.runScanner();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.button.disabled, true);
  await h.controller.runScanner();
  assert.equal(h.calls.query, 1);
  release(telemetry); await first;
  assert.equal(h.calls.reports.length, 1);
  assert.equal(h.button.disabled, false);
  const second = h.controller.runScanner(); await new Promise(resolve => setImmediate(resolve));
  release(telemetry); await second;
  assert.equal(h.calls.reports.length, 2);
});
test('a changed URL is not rendered as the result of the previous page', async () => {
  const h = setup({ get: async () => ({ active: true, url: 'https://other.test/', status: 'complete' }) });
  await h.controller.runScanner();
  assert.equal(h.calls.reports.length, 0);
  assert.match(h.calls.errors[0], /Strona zmieniła/);
  assert.equal(h.button.disabled, false);
});
test('pending navigation, loading and inactive tabs suppress the old assessment', async () => {
  for (const state of [{ pendingUrl: 'https://other.test/' }, { status: 'loading' }, { active: false }]) {
    const h = setup({ get: async () => ({ active: true, url: 'https://example.test/', status: 'complete', ...state }) });
    await h.controller.runScanner();
    assert.equal(h.calls.reports.length, 0);
    assert.equal(h.calls.errors.length, 1);
    assert.equal(h.button.disabled, false);
  }
});
test('a closed tab releases the scan lock and the button', async () => {
  const h = setup({ get: async () => { throw new Error('No tab'); } });
  await h.controller.runScanner();
  assert.equal(h.calls.reports.length, 0);
  assert.equal(h.calls.errors.length, 1);
  assert.equal(h.controller.scanInProgress, false);
  assert.equal(h.button.disabled, false);
});
