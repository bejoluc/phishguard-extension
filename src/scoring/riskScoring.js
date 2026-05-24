/**
 * PhishGuard MVP - Silnik Wyliczania Ryzyka (Risk Scoring)
 * 
 * Odpowiada wyłącznie za obliczanie punktowej oceny ryzyka witryny
 * oraz nadawanie statusów bezpieczeństwa na podstawie zebranych indykatorów.
 */

import { brandDomains } from '../constants/brands.js';

export const RiskCalculator = {
  /**
   * Wylicza zbiorczy wskaźnik ryzyka phishingu na podstawie wskaźników URL oraz analizy DOM.
   * 
   * @param {Array<Object>} urlIndicators - Wskaźniki zagrożeń z analizy adresu URL.
   * @param {Object|null} pageAnalysis - Surowe dane telemetryczne DOM z content.js.
   * @param {string} currentHostname - Nazwa hosta aktywnej strony.
   * @returns {Object} Zwraca raport oceny zawierający: score, status, indicators.
   */
  calculate(urlIndicators, pageAnalysis, currentHostname) {
    let score = 0;
    const indicators = [];

    // --- 1. Agregacja wskaźników z analizy adresu URL ---
    if (urlIndicators && urlIndicators.length > 0) {
      urlIndicators.forEach(indicator => {
        score += indicator.riskWeight;
        indicators.push({
          id: indicator.id,
          label: indicator.label,
          riskWeight: indicator.riskWeight,
          explanation: indicator.explanation
        });
      });
    }

    // --- 2. Agregacja wskaźników ze skanowania DOM strony ---
    if (pageAnalysis) {
      
      // A. Obecność pola wprowadzania hasła (Password field present: +15)
      if (pageAnalysis.hasPasswordField) {
        score += 15;
        indicators.push({
          id: "password-field-present",
          label: "Obecność pola hasła",
          riskWeight: 15,
          explanation: "Strona zawiera pole wprowadzania hasła (input type='password'), co oznacza proces uwierzytelniania."
        });
      }

      // B. Niezabezpieczone cele formularzy (Insecure form action: +30)
      if (pageAnalysis.insecureFormActions && pageAnalysis.insecureFormActions.length > 0) {
        score += 30;
        indicators.push({
          id: "insecure-form-action",
          label: "Niezabezpieczony formularz (HTTP)",
          riskWeight: 30,
          explanation: "Wykryto formularze przesyłające dane nieszyfrowanym kanałem HTTP, co umożliwia przejęcie danych."
        });
      }

      // C. Zewnętrzne cele formularzy (External form action: +35)
      if (pageAnalysis.externalFormActions && pageAnalysis.externalFormActions.length > 0) {
        score += 35;
        indicators.push({
          id: "external-form-action",
          label: "Wysyłanie danych na obcy serwer",
          riskWeight: 35,
          explanation: "Formularz przesyła zebrane dane użytkownika na zewnętrzny serwer poza bieżącą domeną."
        });
      }

      // D. Niezgodność marki w treści (Brand keyword mismatch: +40)
      if (pageAnalysis.detectedBrandKeywords && pageAnalysis.detectedBrandKeywords.length > 0) {
        let mismatchDetected = false;
        let mismatchedBrands = [];

        pageAnalysis.detectedBrandKeywords.forEach(brand => {
          const official = brandDomains[brand];
          if (official && !currentHostname.endsWith(official) && !currentHostname.endsWith(official + ".pl")) {
            mismatchDetected = true;
            mismatchedBrands.push(brand.toUpperCase());
          }
        });

        if (mismatchDetected) {
          score += 40;
          indicators.push({
            id: "brand-mismatch",
            label: "Niezgodność marki w treści strony",
            riskWeight: 40,
            explanation: `Witryna powołuje się na markę (${mismatchedBrands.join(", ")}), lecz jej domena nie jest domeną oficjalną.`
          });
        }
      }

    }

    // Ograniczenie wyniku ryzyka do maksymalnie 100 punktów
    score = Math.min(score, 100);

    // Klasyfikacja poziomu bezpieczeństwa (0-30 Safe, 31-70 Suspicious, 71-100 Dangerous)
    let status = "Safe";
    if (score > 30 && score <= 70) {
      status = "Suspicious";
    } else if (score > 70) {
      status = "Dangerous";
    }

    // --- 3. Ewaluacja Wiarygodności Analizy (Confidence Level Evaluation) ---
    let confidenceScore = 0;
    const triggeredIds = indicators.map(ind => ind.id);

    // Naliczanie punktów wiarygodności na podstawie charakterystyki wskaźników
    triggeredIds.forEach(id => {
      if (id === 'brand-mismatch' || id === 'insecure-form-action' || id === 'external-form-action') {
        confidenceScore += 3.0; // Wskaźniki krytyczne
      } else if (id === 'password-field-present' || id === 'brand-typosquatting' || id === 'ip-hostname' || id === 'insecure-protocol') {
        confidenceScore += 1.5; // Wskaźniki średnie
      } else if (id === 'excessive-subdomains' || id === 'suspicious-keywords') {
        confidenceScore += 1.0; // Wskaźniki słabe
      }
    });

    // Bonus za kombinację uwierzytelniania z anomaliami technicznymi formularzy
    if (triggeredIds.includes('password-field-present')) {
      if (triggeredIds.includes('insecure-form-action') || triggeredIds.includes('external-form-action')) {
        confidenceScore += 1.5; // Silny kontekst uwierzytelniania
      }
    }

    // Klasyfikacja poziomu wiarygodności (Low / Medium / High)
    let confidence = "Low";
    if (confidenceScore >= 2.0 && confidenceScore < 4.5) {
      confidence = "Medium";
    } else if (confidenceScore >= 4.5) {
      confidence = "High";
    }

    return {
      score,
      status,
      confidence,
      indicators
    };
  }
};
