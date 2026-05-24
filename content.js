/**
 * PhishGuard Content Script
 * 
 * Odpowiada wyłącznie za nasłuchiwanie komunikatów sieciowych Chrome API
 * i delegowanie żądania skanowania do dedykowanego modułu DomDetector.
 */

if (!window.DomDetectorListenerRegistered) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Obsługa akcji ANALYZE_PAGE
    if (request.action === "ANALYZE_PAGE" || request.action === "analyze_page") {
      try {
        // DomDetector jest zdefiniowany globalnie w pliku src/detectors/domDetector.js
        // i załadowany przez manifest.json w tej samej piaskownicy
        const rawDomData = DomDetector.scan();
        sendResponse({ success: true, analysis: rawDomData });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    }
    return true; // Umożliwia asynchroniczne odsyłanie odpowiedzi
  });
  window.DomDetectorListenerRegistered = true;
}
