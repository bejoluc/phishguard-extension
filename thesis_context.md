# KOMPENDIUM PROJEKTU INŻYNIERSKIEGO: PHISHGUARD
**Uwaga (25.09.2026): poniższe kopie kodu są historyczną migawką i nie opisują już w całości aktualnego rozszerzenia. Stan bieżący należy sprawdzać w plikach źródłowych repozytorium; wykaz reguł i wymagań znajduje się w [docs/stan-regul-i-wymagania.md](docs/stan-regul-i-wymagania.md).**

**Plik transferu kontekstu technicznego dla modeli AI**

Niniejszy dokument stanowi kompletne podsumowanie prac projektowych i implementacyjnych nad rozszerzeniem przeglądarki **PhishGuard**. Został przygotowany jako skumulowany plik kontekstu, który można bezpośrednio załadować do dowolnego modelu AI w celu kontynuacji prac programistycznych lub pisania rozdziałów teoretycznych pracy dyplomowej.

---

## 1. METADANE PRACY DYPLOMOWEJ

Dane wyodrębnione z oficjalnej karty pracy dyplomowej zatwierdzonej na uczelni:

- **Imię i nazwisko studenta**: Błażej Łuc
- **Nr albumu studenta**: 59218
- **Kierunek studiów**: Informatyka (studia niestacjonarne I stopnia – inżynierskie)
- **Specjalność**: Bezpieczeństwo danych i informatyka śledcza
- **Promotor**: dr inż. Jarosław Homa
- **Temat pracy dyplomowej**: 
  *Projekt i implementacja rozszerzenia przeglądarki wspomagającego wykrywanie podejrzanych stron logowania na podstawie analizy adresów URL oraz struktury DOM*

### Wstępny Spis Treści Pracy:
- **Wstęp**
- **Rozdział 1. Cyberbezpieczeństwo i zagrożenia phishingowe**
  - 1.1 Pojęcie cyberbezpieczeństwa
  - 1.2 Charakterystyka ataków phishingowych
  - 1.3 Metody wyłudzania danych logowania
  - 1.4 Zagrożenia dla użytkowników aplikacji webowych
- **Rozdział 2. Technologie rozszerzeń przeglądarkowych i analiza stron internetowych**
  - 2.1 Budowa rozszerzeń przeglądarkowych
  - 2.2 Manifest V3
  - 2.3 Analiza adresów URL
  - 2.4 Analiza struktury DOM
- **Rozdział 3. Projekt i implementacja systemu**
  - 3.1 Założenia projektowe
  - 3.2 Architektura rozszerzenia
  - 3.3 Implementacja analizy ryzyka
  - 3.4 Interfejs użytkownika
- **Rozdział 4. Testy i analiza działania systemu**
  - 4.1 Scenariusze testowe
  - 4.2 Analiza wykrywania zagrożeń
  - 4.3 Ograniczenia systemu
- **Literatura podstawowa** (Stallings W., Grimes R., Kim D., Dokumentacja Google Chrome Extensions, Materiały OWASP)

---

## 2. ARCHITEKTURA SYSTEMOWA I PRZEPŁYW DANYCH

Projekt rozszerzenia **PhishGuard** został w pełni zaimplementowany zgodnie z paradygmatem **Separation of Concerns (Podział Odpowiedzialności)** w standardzie **Manifest V3**. Kod został podzielony na lekkie, wysoce wyspecjalizowane podmoduły w katalogu `src/` oraz pliki kontrolne w katalogu głównym:

```
c:\Users\blaze\StudioProjects\phishguard-extension/
├── manifest.json            # Metadane, konfiguracja Chrome API i uprawnienia
├── popup.html               # Semantyczna struktura interfejsu panelu (Widok)
├── styles.css               # Warstwa stylizacji Flat Dark Design o wysokim kontraście
├── content.js               # Listener żądań skanowania DOM witryny w jej piaskownicy
├── popup.js                 # Główny koordynator cyklu życia skanowania (AppController)
└── src/
    ├── constants/
    │   └── brands.js        # Konfiguracja bazowa znanych marek i domen oficjalnych
    ├── detectors/
    │   ├── urlDetector.js   # Silnik heurystycznej analizy adresów URL
    │   └── domDetector.js   # Silnik analizy struktury kodu DOM witryny
    ├── scoring/
    │   └── riskScoring.js   # Matematyczny kalkulator poziomu ryzyka (0-100)
    ├── ui/
    │   └── renderResults.js # Moduł prezentacji i aktualizacji widoku HTML (Renderer)
    └── utils/
        └── urlUtils.js      # Pomocnicze funkcje narzędziowe dla URL
```

### Schemat Komunikacyjny ( chrome.runtime API )
1. **`AppController`** (w `popup.js`) odczytuje URL aktywnej karty i uruchamia lokalny moduł **`UrlHeuristicsEngine`** (w `src/detectors/urlDetector.js`) w celu przeprowadzenia pierwszej fazy analizy.
2. Następnie **`AppController`** wysyła asynchroniczny komunikat `chrome.tabs.sendMessage` o akcji **`ANALYZE_PAGE`** do skryptu zawartości **`content.js`**.
3. **`content.js`** odbiera komunikat i wywołuje silnik **`DomDetector.scan()`** (w `src/detectors/domDetector.js`), który bezpiecznie skanuje elementy strony bez odczytywania wartości pól użytkownika, po czym odsyła surowe dane telemetryczne z powrotem.
4. **`AppController`** odbiera dane z DOM i przekazuje komplet (anomalie URL + telemetria DOM) do silnika **`RiskCalculator`** (w `src/scoring/riskScoring.js`), który wylicza wynik ryzyka i przypisuje kategorię.
5. Wynik trafia do **`UiRenderer`** (w `src/ui/renderResults.js`), który aktualizuje semantyczne kontrolki w pliku **`popup.html`**.

---

## 3. ALGORYTM I MATRYCA WAG SCORINGOWYCH

Silnik wyliczania ryzyka zaimplementowany w `RiskCalculator.calculate` sumuje wagi kar punktowych przypisane do poszczególnych kryteriów bezpieczeństwa (wynik jest ograniczony w przedziale `[0, 100]`):

1. **Brak protokołu HTTPS (`+25%`)**: Wykrywa, czy protokół witryny jest nieszyfrowany (`http:`).
2. **Użycie surowego IP (`+30%`)**: Sprawdza, czy nazwa hosta to bezpośredni adres IPv4 lub IPv6.
3. **Zbyt wiele subdomen (`+15%`)**: Wykrywa $\ge 4$ poziomy subdomen (częste przy maskowaniu adresów scamowych).
4. **Podejrzane słowo w URL (`+10%`)**: Wykrywa w nazwie hosta lub ścieżce słowa takie jak: *login, verify, secure, account, update, password*.
5. **Typosquatting (`+40%`)**: Wykrywa obecność zniekształceń pisowni lub nieoficjalnego użycia nazwy monitorowanej marki (*google, paypal, microsoft, facebook, netflix, allegro, olx*).
6. **Obecność pola hasła (`+15%`)**: Detekcja elementu `<input type="password">` informująca o rozpoczęciu transakcji uwierzytelniania.
7. **Nieszyfrowany formularz HTTP (`+30%`)**: Wykrywa formularze, których atrybut docelowy `action` zaczyna się od nieszyfrowanego protokołu `http://`.
8. **Zewnętrzny cel formularza (`+35%`)**: Wykrywa próby przesyłania haseł/danych na domenę inną niż domena bieżącej strony (credential harvesting).
9. **Niezgodność marki w treści (`+40%`)**: Wykrywa sytuacje, gdy w kodzie DOM występują słowa kluczowe znanych marek, ale strona jest serwowana z nieoficjalnej domeny.

### Klasyfikacja Poziomów Ryzyka:
- **0 - 30 pkt**: **Safe (Bezpieczny)** -> Kolorystyka zielona
- **31 - 70 pkt**: **Suspicious (Podejrzany)** -> Kolorystyka pomarańczowa
- **71 - 100 pkt**: **Dangerous (Zagrożenie)** -> Kolorystyka czerwona

---

## 4. PEŁNE KODY ŹRÓDŁOWE SYSTEMU

Poniżej znajdują się **kompletne i nieobcięte** kody źródłowe wszystkich plików rozszerzenia, zorganizowane w logicznej kolejności wdrożeniowej.

### 4.1 manifest.json
```json
{
  "manifest_version": 3,
  "name": "PhishGuard",
  "version": "1.0.0",
  "description": "Przeglądarkowe narzędzie do analizy bezpieczeństwa witryn i wykrywania zagrożeń phishingowych.",
  "permissions": [
    "activeTab",
    "scripting"
  ],
  "action": {
    "default_popup": "popup.html"
  },
  "content_scripts": [
    {
      "matches": ["http://*/*", "https://*/*"],
      "js": ["src/detectors/domDetector.js", "content.js"],
      "run_at": "document_idle"
    }
  ]
}
```

### 4.2 popup.html
```html
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PhishGuard MVP</title>
  <!-- Korzystamy wyłącznie z lokalnych, systemowych krojów pisma -->
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    
    <!-- Nagłówek aplikacji z tytułem i wymagana podtytułem -->
    <header class="header-container">
      <div class="header-title-row">
        <h1>PhishGuard</h1>
        <span class="badge">MVP</span>
      </div>
      <div class="subtitle">Local phishing risk analysis</div>
    </header>
 
    <!-- Skanowana domena witryny -->
    <section class="section">
      <h2 class="label">Skanowana witryna:</h2>
      <div id="domain-display" class="domain-text">Wykrywanie domeny...</div>
    </section>
 
    <!-- Prezentacja wyniku liczbowego oraz statusu słownego -->
    <section class="section score-box" id="score-container">
      <div class="score-row">
        <div>
          <h2 class="label">Ocena ryzyka:</h2>
          <div class="score-value"><span id="risk-score">0</span> / 100</div>
        </div>
        <div class="status-wrapper">
          <h2 class="label">Status:</h2>
          <div id="status-badge" class="status-badge safe">Bezpieczny</div>
        </div>
      </div>
      <div class="confidence-row" style="margin-top: 10px; border-top: 1px solid var(--border-color); padding-top: 8px; display: flex; justify-content: space-between; align-items: center;">
        <h2 class="label" style="margin: 0;">Wiarygodność analizy:</h2>
        <div id="confidence-badge" class="confidence-badge low">Niska</div>
      </div>
    </section>
 
    <!-- Lista wykrytych wskaźników ryzyka -->
    <section class="section">
      <h2 class="label">Wykryte wskaźniki ryzyka:</h2>
      <ul id="indicators-list" class="indicators-list">
        <li class="no-threats">Brak anomalii. Witryna spełnia podstawowe kryteria bezpieczeństwa.</li>
      </ul>
    </section>
 
    <!-- Sekcja stopki z przyciskiem skanowania -->
    <footer class="footer">
      <button id="scan-btn" class="scan-button">Skanuj ponownie</button>
    </footer>
 
  </div>
  
  <script type="module" src="popup.js"></script>
</body>
</html>
```

### 4.3 styles.css
```css
/* ==========================================================================
   PhishGuard MVP - Czysty Styl Inżynierski (Flat Design)
   ========================================================================== */

/* Definicja stałych zmiennych kolorystycznych */
:root {
  --bg-dark: #0f172a;       /* Głębokie tło aplikacji */
  --bg-card: #1e293b;       /* Tło sekcji/kart */
  --border-color: #334155;  /* Granica elementów */
  
  --text-main: #f8fafc;     /* Główny jasny tekst */
  --text-sub: #94a3b8;      /* Tekst pomocniczy */
  
  /* Kolory statusu bezpieczeństwa (podstawowa paleta o wysokim kontraście) */
  --color-safe: #10b981;
  --color-safe-bg: #064e3b;
  
  --color-suspicious: #f59e0b;
  --color-suspicious-bg: #78350f;
  
  --color-dangerous: #ef4444;
  --color-dangerous-bg: #7f1d1d;
}

/* Reset marginesów i podstawowa definicja ciała strony */
body {
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: var(--bg-dark);
  color: var(--text-main);
  width: 360px;
  font-size: 14px;
}

/* Kontener główny aplikacji */
.container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Sekcja Nagłówka z podtytułem */
.header-container {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 8px;
}

.header-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-container h1 {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.5px;
}

.subtitle {
  font-size: 11px;
  color: var(--text-sub);
  margin-top: 4px;
  font-weight: 500;
}

.badge {
  font-size: 10px;
  font-weight: 700;
  background-color: #475569;
  color: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

/* Definicja powtarzalnych sekcji */
.section {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
}

.label {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-sub);
  letter-spacing: 0.5px;
  margin: 0 0 6px 0;
  font-weight: 600;
}

/* Prezentacja domeny */
.domain-text {
  font-size: 14px;
  font-weight: 700;
  word-break: break-all;
  font-family: monospace; /* Monospace dla dokładnego podglądu znaków domeny */
  color: #38bdf8;
}

/* Układ oceny ryzyka i statusu */
.score-box {
  background-color: var(--bg-card);
}

.score-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.score-value {
  font-size: 24px;
  font-weight: 800;
}

#risk-score {
  color: #38bdf8;
}

/* Odznaka (Badge) Statusu Bezpieczeństwa */
.status-badge {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  text-align: center;
  border-width: 1px;
  border-style: solid;
}

/* Trzy warianty statusu - płaskie kolory bez animacji i poświaty */
.status-badge.safe {
  background-color: var(--color-safe-bg);
  color: var(--color-safe);
  border-color: var(--color-safe);
}

.status-badge.suspicious {
  background-color: var(--color-suspicious-bg);
  color: var(--color-suspicious);
  border-color: var(--color-suspicious);
}

.status-badge.dangerous {
  background-color: var(--color-dangerous-bg);
  color: var(--color-dangerous);
  border-color: var(--color-dangerous);
}

/* Lista wskaźników ryzyka */
.indicators-list {
  margin: 0;
  padding: 0 0 0 16px;
  list-style-type: square;
}

.indicators-list li {
  font-size: 12px;
  color: var(--text-main);
  line-height: 1.4;
  margin-bottom: 6px;
}

.indicators-list li:last-child {
  margin-bottom: 0;
}

.indicators-list li.no-threats {
  list-style-type: none;
  margin-left: -16px;
  color: var(--color-safe);
  font-weight: 500;
}

/* Stopka i przycisk akcji */
.footer {
  margin-top: 4px;
}

.scan-button {
  width: 100%;
  padding: 10px;
  background-color: #0284c7;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.scan-button:hover {
  background-color: #0369a1;
}

.scan-button:active {
  background-color: #075985;
}

/* Odznaka (Badge) Wiarygodności Analizy */
.confidence-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  text-align: center;
  border-width: 1px;
  border-style: solid;
}

.confidence-badge.low {
  background-color: #1e293b;
  color: #94a3b8;
  border-color: #475569;
}

.confidence-badge.medium {
  background-color: #451a03;
  color: #f59e0b;
  border-color: #d97706;
}

.confidence-badge.high {
  background-color: #064e3b;
  color: #10b981;
  border-color: #10b981;
}
```

### 4.4 content.js
```javascript
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
```

### 4.5 popup.js
```javascript
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
    if (response && response.success) {
      return response.analysis;
    }
    throw new Error(response ? response.error : "Nieprawidłowa odpowiedź ze skryptu DOM.");
  }
};

// Start aplikacji w cyklu życia widoku
document.addEventListener("DOMContentLoaded", () => {
  AppController.init();
});
```

### 4.6 src/constants/brands.js
```javascript
/**
 * PhishGuard MVP - Stałe marek (Brands Configuration)
 * 
 * Zawiera konfigurację znanych i popularnych marek, ich oficjalnych domen docelowych
 * oraz wzorców pisowni używanych do detekcji brand spoofingu oraz typosquattingu.
 */

// Słownik zniekształceń i literówek znanych marek (typosquatting)
export const brandsMap = {
  "google": ["google.com", "google.pl"],
  "paypal": ["paypal.com", "paypal.pl"],
  "microsoft": ["microsoft.com"],
  "facebook": ["facebook.com", "facebook.pl"],
  "netflix": ["netflix.com"],
  "allegro": ["allegro.pl"],
  "olx": ["olx.pl"]
};

// Mapowanie identyfikatora marki na jej główną, oficjalną domenę
export const brandDomains = {
  "paypal": "paypal.com",
  "google": "google.com",
  "microsoft": "microsoft.com",
  "netflix": "netflix.com",
  "apple": "apple.com",
  "amazon": "amazon.com",
  "facebook": "facebook.com",
  "allegro": "allegro.pl",
  "olx": "olx.pl"
};
```

### 4.7 src/utils/urlUtils.js
```javascript
/**
 * PhishGuard MVP - Narzędzia URL (URL Utilities)
 * 
 * Moduł gromadzący reużywalne funkcje pomocnicze do operacji na adresach URL
 * oraz do weryfikacji ich statusów sieciowych.
 */

/**
 * Sprawdza, czy podany adres URL wskazuje na wewnętrzną stronę przeglądarki.
 * Wyklucza to potrzebę uruchamiania silnika analizy na stronach chronionych.
 * 
 * @param {string} url - Pełny adres URL karty.
 * @returns {boolean} Prawda, jeśli strona jest stroną systemową.
 */
export function isBrowserInternal(url) {
  return url.startsWith("chrome://") || 
         url.startsWith("edge://") || 
         url.startsWith("about:") || 
         url.startsWith("chrome-extension://");
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
```

### 4.8 src/detectors/urlDetector.js
```javascript
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
```

### 4.9 src/detectors/domDetector.js
```javascript
/**
 * PhishGuard MVP - Moduł Skanowania DOM (DOM Detector)
 * 
 * Odpowiada wyłącznie za wykonywanie bezpiecznych analiz kodu HTML strony
 * i zbieranie surowych metryk (pola hasła, akcje formularzy, brand keywords).
 */

/**
 * Pomocnicza funkcja heurystyczna sprawdzająca, czy dany formularz jest formularzem logowania.
 * Zapobiega fałszywym alarmom poprzez skupienie analizy tekstu tylko na granicach uwierzytelniania.
 * 
 * @param {HTMLFormElement} form - Formularz DOM.
 * @returns {boolean} Prawda, jeśli formularz reprezentuje formularz logowania.
 */
function isLoginForm(form) {
  // A. Formularz zawiera dedykowane pole hasła
  if (form.querySelector('input[type="password"]')) {
    return true;
  }
  
  // B. Formularz zawiera pola wejściowe o nazwach/placeholderach powiązanych z autoryzacją
  const inputs = form.querySelectorAll('input');
  const authKeywords = ['email', 'username', 'password', 'login', 'user', 'zaloguj', 'haslo'];
  
  for (let input of inputs) {
    const nameAttr = (input.getAttribute('name') || '').toLowerCase();
    const idAttr = (input.getAttribute('id') || '').toLowerCase();
    const placeholderAttr = (input.getAttribute('placeholder') || '').toLowerCase();
    
    const matchesKeyword = authKeywords.some(keyword => 
      nameAttr.includes(keyword) || idAttr.includes(keyword) || placeholderAttr.includes(keyword)
    );
    if (matchesKeyword) {
      return true;
    }
  }
  
  return false;
}

/**
 * Pomocnicza funkcja pobierająca nagłówki h1-h6 powiązane z formularzem logowania.
 * Przeszukuje nagłówki wewnątrz formularza oraz w jego bezpośrednim otoczeniu DOM.
 * 
 * @param {HTMLFormElement} form - Formularz logowania.
 * @returns {Array<HTMLElement>} Lista znalezionych nagłówków.
 */
function getHeadingsNearForm(form) {
  const headings = [];
  
  // 1. Nagłówki wewnątrz formularza
  form.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => headings.push(h));
  
  // 2. Nagłówki w bliskim sąsiedztwie (do 3 poziomów w górę)
  let parent = form.parentElement;
  let depth = 0;
  while (parent && depth < 3) {
    if (parent.tagName === 'BODY' || parent.tagName === 'HTML') {
      break;
    }
    parent.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
      if (!headings.includes(h)) {
        headings.push(h);
      }
    });
    parent = parent.parentElement;
    depth++;
  }
  
  return headings;
}

/**
 * Pomocnicza funkcja sprawdzająca, czy przycisk służy do uwierzytelniania.
 * Zapobiega to fałszywym analizom przycisków koszyka, nawigacji itp.
 * 
 * @param {HTMLElement} btn - Element przycisku.
 * @param {boolean} isInsideLoginForm - Czy przycisk znajduje się wewnątrz formularza logowania.
 * @returns {boolean} Prawda, jeśli przycisk jest związany z autoryzacją/OAuth.
 */
function isAuthButton(btn, isInsideLoginForm) {
  if (isInsideLoginForm) return true;
  
  const text = (btn.tagName === 'INPUT' ? (btn.getAttribute('value') || '') : (btn.textContent || '')).toLowerCase();
  const idClass = ((btn.getAttribute('id') || '') + ' ' + (btn.getAttribute('class') || '')).toLowerCase();
  
  const authKeywords = ['login', 'sign', 'loguj', 'auth', 'oauth', 'zaloguj', 'sso', 'connect', 'partner'];
  return authKeywords.some(keyword => text.includes(keyword) || idClass.includes(keyword));
}

const DomDetector = {
  /**
   * Skanuje strukturę dokumentu DOM aktywnej strony.
   * Zwraca wyłącznie surowe dane telemetryczne.
   * 
   * @returns {Object} Surowy obiekt analizy DOM.
   */
  scan() {
    const currentHostname = window.location.hostname;
    
    // 1. Wykrywanie i liczenie pól wprowadzania haseł
    const passwordFields = document.querySelectorAll('input[type="password"]');
    const passwordFieldCount = passwordFields.length;
    const hasPasswordField = passwordFieldCount > 0;
 
    // 2. Liczenie formularzy wejściowych
    const forms = Array.from(document.querySelectorAll('form'));
    const formCount = forms.length;
    const hasForms = formCount > 0;
 
    const insecureFormActions = [];
    const externalFormActions = [];
 
    // 3. Analiza celów przesyłania formularzy
    forms.forEach(form => {
      const actionAttr = form.getAttribute('action') || '';
      const method = form.getAttribute('method') || 'get';
      const hasPassword = form.querySelector('input[type="password"]') !== null;
      
      let absoluteAction = '';
      let isExternal = false;
      let isInsecure = false;
 
      if (actionAttr) {
        try {
          const resolvedUrl = new URL(actionAttr, window.location.href);
          absoluteAction = resolvedUrl.href;
          
          if (resolvedUrl.protocol === 'http:') {
            isInsecure = true;
          }
          
          if (resolvedUrl.hostname && resolvedUrl.hostname !== currentHostname) {
            isExternal = true;
          }
        } catch (e) {
          absoluteAction = actionAttr;
          if (actionAttr.startsWith('http://')) {
            isInsecure = true;
          } else if (actionAttr.startsWith('https://')) {
            const host = actionAttr.split('/')[2];
            if (host && host !== currentHostname) {
              isExternal = true;
            }
          }
        }
      } else {
        absoluteAction = window.location.href;
      }
 
      const formDetails = {
        action: absoluteAction,
        hasPassword: hasPassword,
        method: method
      };
 
      if (isInsecure) {
        insecureFormActions.push(formDetails);
      }
      
      if (isExternal) {
        externalFormActions.push(formDetails);
      }
    });
 
    // 4. Detekcja nazw chronionych marek w treści dokumentu (Zogniskowany Skan DOM z Progiem Ufności)
    // ZAPOBIEGANIE FAŁSZYWYM ALARMOM (np. na github.com/login przy przyciskach logowania przez Google):
    // - Wykonujemy analizę tylko w przypadku obecności interfejsu logowania.
    // - Przeszukujemy wyłącznie obszary powiązane z uwierzytelnianiem (tytuł, formularze logowania, etykiety, placeholdery, przyciski logowania, nagłówki blisko formularza).
    // - Zupełnie ignorujemy sekcje generyczne (stopki, menu nawigacji, artykuły).
    // - Wymagamy wyraźnego progu ufności (minimum 2 dopasowania nazwy marki w tych obszarach).
    const brandsList = ['paypal', 'google', 'microsoft', 'facebook', 'netflix', 'allegro', 'olx', 'apple', 'amazon'];
    const detectedBrandKeywords = [];
 
    const loginForms = forms.filter(isLoginForm);
    const hasLoginForm = loginForms.length > 0 || hasPasswordField;
 
    if (hasLoginForm) {
      let authRelatedText = (document.title || '').toLowerCase();
 
      // Dodanie nagłówków w pobliżu formularzy logowania
      loginForms.forEach(form => {
        const headings = getHeadingsNearForm(form);
        headings.forEach(h => {
          authRelatedText += ' ' + (h.textContent || '').toLowerCase();
        });
 
        // Dodanie etykiet i legend wewnątrz formularza logowania
        form.querySelectorAll('label, legend').forEach(el => {
          authRelatedText += ' ' + (el.textContent || '').toLowerCase();
        });
 
        // Dodanie wartości placeholderów pól wejściowych wewnątrz formularza logowania
        form.querySelectorAll('input').forEach(input => {
          const placeholder = (input.getAttribute('placeholder') || '').toLowerCase();
          authRelatedText += ' ' + placeholder;
        });
 
        // Dodanie pełnego tekstu samego formularza logowania
        authRelatedText += ' ' + (form.textContent || '').toLowerCase();
      });
 
      // Dodanie przycisków uwierzytelniania (zarówno wewnątrz formularzy logowania, jak i zewnętrzne OAuth)
      const allButtons = document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]');
      allButtons.forEach(btn => {
        const isInside = loginForms.some(form => form.contains(btn));
        if (isInside || isAuthButton(btn, false)) {
          const text = btn.tagName === 'INPUT' ? (btn.getAttribute('value') || '') : (btn.textContent || '');
          authRelatedText += ' ' + text.toLowerCase();
        }
      });
 
      // Mapowanie domen oficjalnych do weryfikacji domeny hostującej
      const brandDomains = {
        "paypal": "paypal.com",
        "google": "google.com",
        "microsoft": "microsoft.com",
        "netflix": "netflix.com",
        "apple": "apple.com",
        "amazon": "amazon.com",
        "facebook": "facebook.com",
        "allegro": "allegro.pl",
        "olx": "olx.pl"
      };
 
      // Pomocnicza funkcja zliczająca dopasowania słowa kluczowego
      const countOccurrences = (text, word) => {
        const regex = new RegExp('\\b' + word + '\\b|' + word, 'gi');
        const matches = text.match(regex);
        return matches ? matches.length : 0;
      };
 
      brandsList.forEach(brand => {
        const officialDomain = brandDomains[brand];
        const isOfficialSite = officialDomain && (currentHostname.endsWith(officialDomain) || currentHostname.endsWith(officialDomain + ".pl"));
        
        // Wykonujemy analizę tylko gdy domena NIE należy do oficjalnej marki
        if (!isOfficialSite) {
          const count = countOccurrences(authRelatedText, brand);
          // Próg ufności (confidence threshold): słowo kluczowe marki musi pojawić się minimum 2 razy
          // w elementach uwierzytelniania strony (zapobiega to fałszywym alarmom przy np. pojedynczym przycisku OAuth "Zaloguj przez Google" na GitHubie)
          if (count >= 2) {
            detectedBrandKeywords.push(brand);
          }
        }
      });
    }
 
    return {
      hasPasswordField,
      passwordFieldCount,
      formCount,
      hasForms,
      insecureFormActions,
      externalFormActions,
      detectedBrandKeywords
    };
  }
};
 
// Eksport obiektu do przestrzeni globalnej w celu umożliwienia dostępu dla content.js w piaskownicy
window.DomDetector = DomDetector;
```


### 4.10 src/scoring/riskScoring.js
```javascript
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
```

### 4.11 src/ui/renderResults.js
```javascript
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
```

---

## 5. SCENARIUSZE TESTOWE (Katalog `test-pages`)

W celu weryfikacji działania heurystyk w projekcie zaimplementowano cztery lokalne scenariusze testowe w formacie HTML (bez zewnętrznych grafik i logotypów). Można je załadować bezpośrednio z dysku lub serwować lokalnie.

### 5.1 test-pages/safe-login.html
```html
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bezpieczny Portal Logowania</title>
  <!-- 
    OPIS SCENARIUSZA TESTOWEGO (SAFE):
    1. Brak prób podszywania się pod znane marki (brak typosquattingu).
    2. Formularz logowania wskazuje na ten sam host/ścieżkę relatywną (akcja lokalna, brak wycieku danych).
    3. Normalne pole wprowadzania hasła.
  -->
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }
    .card {
      background: #ffffff;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      width: 320px;
    }
    h2 {
      margin-top: 0;
      font-size: 20px;
    }
    .form-group {
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    input {
      padding: 8px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
    }
    button {
      padding: 10px;
      background-color: #0284c7;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      width: 100%;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2>Zaloguj się do konta</h2>
    <form action="/auth/login" method="POST">
      <div class="form-group">
        <label for="username">Nazwa użytkownika</label>
        <input type="text" id="username" name="username" placeholder="Twoja nazwa..." required>
      </div>
      <div class="form-group">
        <label for="password">Hasło</label>
        <input type="password" id="password" name="password" placeholder="••••••••" required>
      </div>
      <button type="submit">Zaloguj się</button>
    </form>
  </div>
</body>
</html>
```

### 5.2 test-pages/fake-paypal-login.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PayPal Secure Login</title>
  <!-- 
    OPIS SCENARIUSZA TESTOWEGO (DANGEROUS PHISHING):
    1. Tytuł strony zawiera słowo kluczowe znanej marki: "PayPal".
    2. Witryna nie jest hostowana w domenie paypal.com (mismatch marki: +40% kary).
    3. Formularz zawiera pole wprowadzania hasła (+15% kary).
    4. Formularz wysyła dane nieszyfrowanym kanałem http:// (insecure action: +30% kary).
    5. Formularz wysyła hasło na obcy serwer (external action: +35% kary).
  -->
  <style>
    body {
      font-family: system-ui, sans-serif;
      background-color: #f4f6f8;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }
    .login-container {
      background: #ffffff;
      padding: 30px;
      border-radius: 6px;
      border: 1px solid #dcdcdc;
      width: 300px;
      text-align: center;
    }
    h1 {
      font-size: 24px;
      color: #003087;
      margin-bottom: 20px;
    }
    .input-field {
      width: 100%;
      padding: 10px;
      margin-bottom: 12px;
      border: 1px solid #999;
      border-radius: 4px;
      box-sizing: border-box;
    }
    .btn {
      width: 100%;
      padding: 10px;
      background-color: #0070ba;
      color: #fff;
      border: none;
      border-radius: 20px;
      font-weight: bold;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <h1>PayPal</h1>
    <form action="http://malicious-example.com/login" method="POST">
      <input type="email" class="input-field" placeholder="Email address" required>
      <input type="password" class="input-field" placeholder="Password" required>
      <button type="submit" class="btn">Log In</button>
    </form>
  </div>
</body>
</html>
```

### 5.3 test-pages/external-form.html
```html
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analiza Celu Formularza</title>
  <!-- 
    OPIS SCENARIUSZA TESTOWEGO (EXTERNAL FORM ACTION):
    1. Formularz zawiera pole wprowadzania hasła (+15% kary).
    2. Cel formularza wskazuje na zupełnie inną domenę niż domena bieżąca strony (external form action: +35% kary).
  -->
  <style>
    body {
      font-family: system-ui, sans-serif;
      background-color: #f1f5f9;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }
    .box {
      background: #ffffff;
      padding: 24px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      width: 320px;
    }
    .info {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 16px;
    }
    input {
      width: 100%;
      padding: 8px;
      margin-bottom: 10px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      box-sizing: border-box;
    }
    input[type="submit"] {
      background-color: #475569;
      color: white;
      border: none;
      cursor: pointer;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="box">
    <h3>Zewnętrzny Cel Logowania</h3>
    <p class="info">Ten formularz przesyła dane autoryzacyjne na odrębny serwer zewnętrzny.</p>
    <form action="https://external-target-database.com/receive/credentials" method="POST">
      <input type="text" placeholder="Identyfikator sieciowy" required>
      <input type="password" placeholder="Klucz dostępu (hasło)" required>
      <input type="submit" value="Autoryzuj połączenie">
    </form>
  </div>
</body>
</html>
```

### 5.4 test-pages/suspicious-keywords.html
```html
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weryfikacja Konta Użytkownika</title>
  <!-- 
    OPIS SCENARIUSZA TESTOWEGO (SUSPICIOUS KEYWORDS):
    1. Brak pól haseł i celów formularzy.
    2. Strona zawiera nagromadzenie podejrzanych słów i zdań wywierających presję na użytkowniku.
  -->
  <style>
    body {
      font-family: system-ui, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      padding: 40px 20px;
      line-height: 1.6;
    }
    .alert-box {
      max-width: 500px;
      margin: 0 auto;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .title {
      color: #b91c1c;
      font-weight: bold;
      font-size: 22px;
      margin-bottom: 12px;
    }
    .btn-action {
      display: inline-block;
      padding: 10px 20px;
      background-color: #b91c1c;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="alert-box">
    <div class="title">Secure Account Verification Alert</div>
    <p>We detected an unauthorized attempt to access your account. To maintain account security, you must immediately <strong>verify</strong> your credentials and identity.</p>
    <p>Please update your current <strong>password</strong> as soon as possible. Failure to complete this <strong>update</strong> secure process within 24 hours will result in permanent account suspension.</p>
    <a href="http://scam-link-example.com/verify-account" class="btn-action">Zaloguj się i zaktualizuj hasło</a>
  </div>
</body>
</html>
```

---

## 6. JAK DALEJ ROZWIJAĆ PROJEKT? (Pomysły na kodowanie z innym AI)

Gdy załadujesz ten plik do swojego drugiego modelu AI, możesz podać mu następujące przykładowe zapytania w celu dynamicznego poszerzenia funkcjonalności systemu:

1. **Wdrożenie dynamicznej bazy reputacyjnej w pamięci lokalnej (Local Cache API)**:
   *„Zaproponuj modyfikację src/scoring/riskScoring.js oraz popup.js, aby przed uruchomieniem heurystyk system odpytywał lokalną pamięć cache Chrome (chrome.storage.local) w celu natychmiastowego blokowania znanych witryn phishingowych zgłoszonych przez użytkownika.”*
2. **Dodanie mechanizmu zgłaszania podejrzanych stron (User Reporting Mode)**:
   *„Dodaj do popup.html oraz popup.js przycisk 'Zgłoś jako phishing', który pozwoli użytkownikowi zapisać aktualną domenę do czarnej listy w pamięci lokalnej rozszerzenia.”*
3. **Detekcja ukrywania kodu (JavaScript Obfuscation Detector)**:
   *„Napisz funkcję do wdrożenia w src/detectors/domDetector.js, która skanuje skrypty osadzone na stronie i szuka anomalii takich jak nadmierne użycie unescape(), eval() lub zakodowanych ciągów Base64 w celu detekcji prób ukrywania kodu phishingu.”*
4. **Wizualne ostrzeżenie nakładkowe (In-page Overlay/Banner Alert)**:
   *„Napisz kod w content.js, który w przypadku wykrycia wyniku ryzyka powyżej 75% dynamicznie wstrzykuje na samej górze badanej strony czerwony pasek ostrzegawczy: 'Ostrzeżenie: PhishGuard wykrył wysokie ryzyko wyłudzenia danych na tej stronie!'.”*
