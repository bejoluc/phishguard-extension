/**
 * PhishGuard MVP - Silnik Analizy Adresu URL (URL Detector)
 * 
 * Odpowiada wyłącznie za detekcję zagrożeń i wskaźników phishingu bezpośrednio
 * w ciągu tekstowym adresu URL (HTTPS, IP address, subdomeny, słowa kluczowe, typosquatting).
 */

import { brandsMap } from '../constants/brands.js';

export const UrlHeuristicsEngine = {
  /**
   * Dokonuje inspekcji właściwości tekstowych i struktury obiektu URL.
   * 
   * @param {URL} urlObj - Obiekt URL aktywnej karty.
   * @returns {Array<Object>} Lista wykrytych wskaźników ryzyka (każdy ma: id, label, riskWeight, explanation).
   */
  analyze(urlObj) {
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();
    const detectedIndicators = [];

    // --- 1. Sprawdzanie protokołu (Non-HTTPS protocol: +25) ---
    if (urlObj.protocol !== "https:") {
      detectedIndicators.push({
        id: "insecure-protocol",
        label: "Brak szyfrowania HTTPS",
        riskWeight: 25,
        explanation: "Połączenie z tą witryną nie jest szyfrowane (brak protokołu HTTPS)."
      });
    }

    // --- 2. Użycie surowego adresu IP (IP address used as hostname: +30) ---
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Pattern = /^\[[0-9a-fA-F:]+\]$/;
    if (ipv4Pattern.test(hostname) || ipv6Pattern.test(hostname)) {
      detectedIndicators.push({
        id: "ip-hostname",
        label: "Użycie adresu IP jako nazwy hosta",
        riskWeight: 30,
        explanation: "Witryna używa surowego adresu IP zamiast zarejestrowanej nazwy domeny."
      });
    }

    // --- 3. Sprawdzanie nadmiernej liczby subdomen (Excessive subdomains: +15) ---
    const segments = hostname.split(".").filter(s => s !== "www");
    if (segments.length >= 4) {
      detectedIndicators.push({
        id: "excessive-subdomains",
        label: "Nadmierna liczba subdomen",
        riskWeight: 15,
        explanation: "Adres zawiera 4 lub więcej poziomów subdomen, co może służyć do zmylenia użytkownika."
      });
    }

    // --- 4. Detekcja podejrzanych słów kluczowych (Suspicious keyword: +10) ---
    const suspiciousKeywords = ["login", "verify", "secure", "account", "update", "password"];
    const foundKeywords = suspiciousKeywords.filter(keyword => hostname.includes(keyword) || pathname.includes(keyword));
    if (foundKeywords.length > 0) {
      detectedIndicators.push({
        id: "suspicious-keywords",
        label: "Podejrzane słowa kluczowe w URL",
        riskWeight: 10,
        explanation: `W adresie wykryto słowa związane z uwierzytelnianiem i bezpieczeństwem: ${foundKeywords.join(", ")}.`
      });
    }

    // --- 5. Sprawdzanie typosquattingu dla znanych marek (Typosquatting: +40) ---
    let typosquattingFound = false;
    let matchedBrandName = "";

    // Sprawdzenie bezprawnego osadzenia nazwy marki w domenie
    Object.keys(brandsMap).forEach(brand => {
      if (hostname.includes(brand)) {
        const officialDomains = brandsMap[brand];
        const isOfficial = officialDomains.some(domain => hostname.endsWith(domain));
        if (!isOfficial) {
          typosquattingFound = true;
          matchedBrandName = brand;
        }
      }
    });

    // Sprawdzanie typowych modyfikacji pisowni znanych brandów
    const commonTypos = [/g00gle/i, /paypa1/i, /m1crosoft/i, /faceb00k/i, /netfl1x/i, /alegro/i, /0lx/i];
    if (commonTypos.some(regex => regex.test(hostname))) {
      typosquattingFound = true;
    }

    if (typosquattingFound) {
      detectedIndicators.push({
        id: "brand-typosquatting",
        label: "Podobieństwo do znanej marki (Typosquatting)",
        riskWeight: 40,
        explanation: `Domena wykazuje zniekształcenie lub nieoficjalne użycie nazwy monitorowanej marki (${matchedBrandName || "znana marka"}).`
      });
    }

    return detectedIndicators;
  }
};
