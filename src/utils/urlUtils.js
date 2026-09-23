/**
 * PhishGuard MVP - Narzędzia URL (URL Utilities)
 * 
 * Moduł gromadzący reużywalne funkcje pomocnicze do operacji na adresach URL
 * oraz do weryfikacji ich statusów sieciowych.
 */

/**
 * Sprawdza, czy podany adres URL wskazuje na wewnętrzną stronę przeglądarki.
 * Wyklucza to potrzebę uruchamiania silnika analizy na stronach chronionych.
 * Dodatkowo wyklucza sklepy Chrome Web Store, na których wstrzykiwanie skryptów jest zablokowane.
 * 
 * @param {string} url - Pełny adres URL karty.
 * @returns {boolean} Prawda, jeśli strona jest stroną systemową lub chronioną przez Chrome.
 */
export function isBrowserInternal(url) {
  return url.startsWith("chrome://") || 
         url.startsWith("edge://") || 
         url.startsWith("about:") || 
         url.startsWith("chrome-extension://") ||
         url.includes("chrome.google.com/webstore") ||
         url.includes("chromewebstore.google.com");
}

/**
 * Bezpiecznie wyodrębnia nazwę hosta (hostname) z adresu URL.
 * 
 * @param {string} urlStr - Adres URL w postaci ciągu znaków.
 * @returns {string} Nazwa hosta zapisana małymi literami lub pusty ciąg w razie błędu.
 */
export function getCleanHostname(urlStr) {
  try {
    const url = new URL(urlStr);
    return url.hostname.toLowerCase();
  } catch (e) {
    return "";
  }
}

/**
 * Domena oficjalna pasuje tylko jako cały host albo jego subdomena.
 * Porównanie samego sufiksu uznałoby np. fakepaypal.com za paypal.com.
 */
export function isSameOrSubdomain(hostname, officialDomain) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  const domain = officialDomain.toLowerCase().replace(/\.$/, "");
  return host === domain || host.endsWith(`.${domain}`);
}
