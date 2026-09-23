import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

import { UrlHeuristicsEngine } from '../src/detectors/urlDetector.js';
import { RiskCalculator } from '../src/scoring/riskScoring.js';

const urlIndicators = hostname =>
  UrlHeuristicsEngine.analyze(new URL(`https://${hostname}/`)).map(indicator => indicator.id);

const brandMismatch = hostname =>
  RiskCalculator.calculate([], { detectedBrandKeywords: ['paypal'] }, hostname)
    .indicators.some(indicator => indicator.id === 'brand-mismatch');

test('lookalike hosts cannot borrow the suffix of an official domain', () => {
  for (const hostname of ['fakepaypal.com', 'secure-paypal.com', 'paypal.com.pl']) {
    assert.ok(urlIndicators(hostname).includes('brand-typosquatting'), hostname);
    assert.equal(brandMismatch(hostname), true, hostname);
  }
});

test('the exact official host and its subdomains remain recognized', () => {
  for (const hostname of ['paypal.com', 'www.paypal.com', 'secure.paypal.com', 'paypal.pl']) {
    assert.ok(!urlIndicators(hostname).includes('brand-typosquatting'), hostname);
    assert.equal(brandMismatch(hostname), false, hostname);
  }
});

test('the DOM scanner does not suppress a PayPal mention on fakepaypal.com', () => {
  const script = readFileSync(new URL('../src/detectors/domDetector.js', import.meta.url), 'utf8');
  const passwordInput = { getAttribute: () => '' };
  const form = {
    getAttribute: () => '',
    querySelector: selector => selector === 'input[type="password"]' ? passwordInput : null,
    querySelectorAll: selector => selector === 'input' ? [passwordInput] : [],
    parentElement: null,
    textContent: 'PayPal',
  };

  for (const [hostname, expected] of [['fakepaypal.com', true], ['paypal.com', false]]) {
    const window = { location: { hostname, href: `https://${hostname}/login` } };
    const document = {
      title: 'PayPal Secure Login',
      querySelectorAll(selector) {
        if (selector === 'input[type="password"]') return [passwordInput];
        if (selector === 'form') return [form];
        return [];
      },
    };
    runInNewContext(script, { window, document, URL });
    const brands = window.DomDetector.scan().detectedBrandKeywords;
    assert.equal(brands.includes('paypal'), expected, hostname);
  }
});
