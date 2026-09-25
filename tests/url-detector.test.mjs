import test from 'node:test';
import assert from 'node:assert/strict';

import { UrlHeuristicsEngine } from '../src/detectors/urlDetector.js';

const indicatorsFor = address => UrlHeuristicsEngine.analyze(new URL(address));
const idsFor = address => indicatorsFor(address).map(indicator => indicator.id);
const pointsFor = address => indicatorsFor(address)
  .reduce((sum, indicator) => sum + indicator.riskWeight, 0);

test('official domains and their real subdomains do not trigger brand impersonation', () => {
  for (const host of [
    'paypal.com', 'www.paypal.pl', 'accounts.google.com', 'google.pl',
    'microsoft.com', 'facebook.pl', 'netflix.com', 'allegro.pl', 'www.olx.pl',
  ]) {
    assert.ok(!idsFor(`https://${host}/`).includes('brand-typosquatting'), host);
  }
  assert.deepEqual(idsFor('https://secure.paypal.com/login'), ['suspicious-keywords']);
});

test('brand names on a different host or behind an official-looking prefix are flagged', () => {
  for (const host of [
    'fakepaypal.test', 'paypal.com.evil.test', 'login-google.test',
    'secure-allegro.test', 'olx.pl.login.test',
  ]) {
    assert.equal(idsFor(`https://${host}/`).filter(id => id === 'brand-typosquatting').length, 1, host);
  }
  assert.ok(!idsFor('https://example.test/paypal-help').includes('brand-typosquatting'));
});

test('configured typo patterns trigger one brand indicator with 40 points', () => {
  for (const host of [
    'g00gle.test', 'paypa1.test', 'm1crosoft.test', 'faceb00k.test',
    'netfl1x.test', 'alegro.test', '0lx.test',
  ]) {
    assert.deepEqual(idsFor(`https://${host}/`), ['brand-typosquatting'], host);
    assert.equal(pointsFor(`https://${host}/`), 40, host);
  }
});

test('keywords are counted once in host or path, not in query or fragment', () => {
  assert.deepEqual(idsFor('https://example.test/LOGIN/verify/password'), ['suspicious-keywords']);
  assert.equal(pointsFor('https://example.test/LOGIN/verify/password'), 10);
  assert.deepEqual(idsFor('https://secure.example.test/'), ['suspicious-keywords']);
  assert.deepEqual(idsFor('https://example.test/?next=/login#verify'), []);
});

test('the subdomain threshold counts domain segments and skips www', () => {
  assert.deepEqual(idsFor('https://a.b.example.test/'), ['excessive-subdomains']);
  assert.deepEqual(idsFor('https://www.a.b.example.test/'), ['excessive-subdomains']);
  assert.deepEqual(idsFor('https://www.b.example.test/'), []);
});

test('an IPv4 address gets IP points, never artificial subdomain points', () => {
  const address = 'http://192.0.2.10/login';
  assert.deepEqual(idsFor(address), [
    'insecure-protocol', 'ip-hostname', 'suspicious-keywords',
  ]);
  assert.equal(pointsFor(address), 65);
});

test('an IPv6 address is detected without subdomain points', () => {
  assert.deepEqual(idsFor('https://[2001:db8::1]/'), ['ip-hostname']);
  assert.equal(pointsFor('https://[2001:db8::1]/'), 30);
});
