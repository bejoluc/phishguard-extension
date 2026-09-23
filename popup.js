/**
 * PhishGuard MVP - Kontroler Panelu Bocznego (Popup Controller)
 * 
 * popup.js jest teraz lekkim koordynatorem (AppController), który odpowiada wyłącznie za:
 * - odczyt adresu URL aktywnej karty
 * - żądanie wykonania analizy DOM od content.js
 * - wywołanie dedykowanego silnika heurystyk adresu URL
 * - wywołanie silnika kalkulacji ryzyka
 * - wywołanie renderera w celu wizualizacji wyników
 * 
 * Wszystkie zależności są importowane jako moduły ES, co czyni strukturę wzorową.
 */

// Importowanie modułów ES6 zgodnie ze specyfikacją podziału odpowiedzialności
import { UrlHeuristicsEngine } from './src/detectors/urlDetector.js';
import { RiskCalculator } from './src/scoring/riskScoring.js';
import { UiRenderer } from './src/ui/renderResults.js';
import { isBrowserInternal } from './src/utils/urlUtils.js';

const AppController = {
  /**
   * Inicjalizuje aplikację po załadowaniu drzewa DOM.
   */
  init() {
    // Inicjalizacja renderera (pobranie referencji do elementów HTML)
    UiRenderer.init();
    
    // Podpięcie zdarzenia kliknięcia przycisku skanowania
    const scanBtn = document.getElementById("scan-btn");
    if (scanBtn) {
      scanBtn.addEventListener("click", () => this.runScanner());
    }

    // Uruchomienie automatycznego skanowania przy starcie
    this.runScanner();
  },

  /**
   * Procedura główna sterująca przepływem i koordynacją skanowania.
   */
  async runScanner() {
    try {
      // 1. Pobranie aktywnej karty przeglądarki z Chrome API
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        UiRenderer.renderError("Brak aktywnej karty przeglądarki.");
        return;
      }

      // 2. Obsługa wykluczeń stron systemowych i wewnętrznych (np. chrome://)
      if (!tab.url || isBrowserInternal(tab.url)) {
        UiRenderer.renderSystemPage(tab.url || "Zasoby systemowe");
        return;
      }

      const urlObj = new URL(tab.url);
      UiRenderer.renderHostname(urlObj.hostname);

      // 3. Wywołanie silnika heurystyk URL
      const urlHeuristics = UrlHeuristicsEngine.analyze(urlObj);

      // 4. Pobranie danych telemetrycznych DOM ze skryptu zawartości strony
      let domAnalysis = null;
      try {
        domAnalysis = await this.fetchDomTelemetry(tab.id);
      } catch (communicationError) {
        // Zabezpieczenie: dynamiczne wstrzyknięcie skryptów w locie
        try {
          // Wstrzykujemy najpierw DomDetector, potem content.js, aby content.js miał dostęp do zmiennej globalnej
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["src/detectors/domDetector.js", "content.js"]
          });
          // Krótkie oczekiwanie na rejestrację listenerów
          await new Promise(resolve => setTimeout(resolve, 150));
          domAnalysis = await this.fetchDomTelemetry(tab.id);
        } catch (injectionError) {
          console.error("Dynamiczne wstrzykiwanie zablokowane.", injectionError);
        }
      }

      // 5. Wywołanie silnika kalkulacji ryzyka
      const assessment = RiskCalculator.calculate(urlHeuristics, domAnalysis, urlObj.hostname);

      // 6. Przekazanie wyników do wizualizacji w rendererze
      UiRenderer.renderAssessment(assessment);

    } catch (err) {
      console.error("Błąd w pętli głównej AppController: ", err);
      UiRenderer.renderError("Wystąpił błąd podczas wykonywania skanowania.");
    }
  },

  /**
   * Realizuje zapytanie komunikacyjne Chrome API do skryptu zawartości aktywnej karty.
   * Korzysta z natywnego mechanizmu Promise ułatwiającego gaszenie wyjątków na zablokowanych kartach.
   */
  async fetchDomTelemetry(tabId) {
    const response = await chrome.tabs.sendMessage(tabId, { action: "ANALYZE_PAGE" });
    if (response && response.success &&
        response.analysis &&
        typeof response.analysis.hasPasswordField === "boolean" &&
        Array.isArray(response.analysis.insecureFormActions) &&
        Array.isArray(response.analysis.externalFormActions) &&
        Array.isArray(response.analysis.detectedBrandKeywords)) {
      return response.analysis;
    }
    throw new Error(response?.error || "Nieprawidłowa odpowiedź ze skryptu DOM.");
  }
};

// Start aplikacji w cyklu życia widoku
document.addEventListener("DOMContentLoaded", () => {
  AppController.init();
});
