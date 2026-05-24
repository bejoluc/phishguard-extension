/**
 * PhishGuard MVP - Moduł Prezentacji Graficznej (UiRenderer)
 * 
 * Odpowiada wyłącznie za aktualizację kontrolek dokumentu popup.html.
 * Całkowicie oddziela warstwę prezentacji od logiki biznesowej/analizy.
 */

export const UiRenderer = {
  // Przechowywanie referencji do elementów HTML w popupie
  elements: {
    domainDisplay: null,
    riskScore: null,
    statusBadge: null,
    confidenceBadge: null,
    indicatorsList: null
  },

  /**
   * Pobiera i inicjalizuje referencje do elementów DOM.
   */
  init() {
    this.elements.domainDisplay = document.getElementById("domain-display");
    this.elements.riskScore = document.getElementById("risk-score");
    this.elements.statusBadge = document.getElementById("status-badge");
    this.elements.confidenceBadge = document.getElementById("confidence-badge");
    this.elements.indicatorsList = document.getElementById("indicators-list");
  },

  /**
   * Prezentuje wyniki skanowania w dokumencie HTML.
   * @param {Object} assessment - Obiekt z wynikami kalkulacji.
   */
  renderAssessment(assessment) {
    this.elements.riskScore.textContent = assessment.score;
    
    // Czyszczenie klas na plakietce statusu
    this.elements.statusBadge.className = "status-badge";
    
    if (assessment.status === "Safe") {
      this.elements.statusBadge.textContent = "Bezpieczny";
      this.elements.statusBadge.classList.add("safe");
    } else if (assessment.status === "Suspicious") {
      this.elements.statusBadge.textContent = "Podejrzany";
      this.elements.statusBadge.classList.add("suspicious");
    } else {
      this.elements.statusBadge.textContent = "Zagrożenie";
      this.elements.statusBadge.classList.add("dangerous");
    }

    // Prezentacja poziomu wiarygodności analizy
    if (this.elements.confidenceBadge) {
      this.elements.confidenceBadge.className = "confidence-badge";
      
      if (assessment.confidence === "Low") {
        this.elements.confidenceBadge.textContent = "Niska";
        this.elements.confidenceBadge.classList.add("low");
      } else if (assessment.confidence === "Medium") {
        this.elements.confidenceBadge.textContent = "Średnia";
        this.elements.confidenceBadge.classList.add("medium");
      } else if (assessment.confidence === "High") {
        this.elements.confidenceBadge.textContent = "Wysoka";
        this.elements.confidenceBadge.classList.add("high");
      }
    }

    // Odświeżenie listy indykatorów wskaźników ryzyka
    this.elements.indicatorsList.innerHTML = "";
    if (assessment.indicators.length === 0) {
      this.elements.indicatorsList.innerHTML = `
        <li class="no-threats">Brak anomalii. Witryna spełnia podstawowe kryteria bezpieczeństwa.</li>`;
    } else {
      assessment.indicators.forEach(indicator => {
        const li = document.createElement("li");
        
        // Renderowanie szczegółów wskaźnika
        if (indicator && typeof indicator === "object") {
          li.innerHTML = `<strong>${indicator.label}</strong> (Waga: ${indicator.riskWeight}%): <span style="color: var(--text-sub);">${indicator.explanation}</span>`;
        } else {
          li.textContent = indicator;
        }
        
        this.elements.indicatorsList.appendChild(li);
      });
    }
  },

  /**
   * Wyświetla interfejs dedykowany dla chronionych zasobów przeglądarki.
   * @param {string} pageUrl - Ścieżka systemowa do wyświetlenia.
   */
  renderSystemPage(pageUrl) {
    this.elements.domainDisplay.textContent = "Zasób przeglądarki";
    this.elements.riskScore.textContent = "0";
    
    this.elements.statusBadge.className = "status-badge safe";
    this.elements.statusBadge.textContent = "Bezpieczny";
    
    if (this.elements.confidenceBadge) {
      this.elements.confidenceBadge.className = "confidence-badge low";
      this.elements.confidenceBadge.textContent = "Niska";
    }

    this.elements.indicatorsList.innerHTML = `
      <li class="no-threats">Wewnętrzna strona przeglądarki (${pageUrl}). Analiza wyłączona ze względów bezpieczeństwa.</li>`;
  },

  /**
   * Renderuje stan błędu w interfejsie.
   * @param {string} message - Treść błędu.
   */
  renderError(message) {
    this.elements.domainDisplay.textContent = "Błąd komunikacji";
    this.elements.riskScore.textContent = "--";
    
    this.elements.statusBadge.className = "status-badge suspicious";
    this.elements.statusBadge.textContent = "Nieznany";
    
    if (this.elements.confidenceBadge) {
      this.elements.confidenceBadge.className = "confidence-badge low";
      this.elements.confidenceBadge.textContent = "Nieznana";
    }

    this.elements.indicatorsList.innerHTML = `<li>Bląd: ${message}</li>`;
  },

  /**
   * Prezentuje etykietę aktualnie skanowanej domeny.
   * @param {string} hostname - Nazwa hosta.
   */
  renderHostname(hostname) {
    this.elements.domainDisplay.textContent = hostname;
  }
};
