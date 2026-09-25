# PhishGuard – Rozszerzenie Przeglądarki do Detekcji Phishingu (Projekt MVP)

Niniejszy projekt stanowi prototyp rozszerzenia dla przeglądarki Google Chrome, służącego do oceny ryzyka phishingu po otwarciu panelu rozszerzenia. Kod rozdziela analizę adresu URL, analizę DOM, obliczenie wyniku oraz prezentację raportu.

Aktualny wykaz zaimplementowanych reguł, wymagań i ograniczeń: [Stan reguł i wymagania projektu](docs/stan-regul-i-wymagania.md).
Sposób zapisu i późniejszej oceny scenariuszy: [Protokół testów](docs/protokol-testow.md) oraz [tabela przypadków CSV](docs/przypadki-testowe.csv).
Zakres modelowego zestawu testowego: [40 scenariuszy URL + DOM](docs/scenariusze-40.md).
Dalsze decyzje i wyniki weryfikacji: [Dziennik prac](docs/dziennik-prac.md).

---

## 1. Cel Główny Projektu
Głównym celem systemu jest lokalna ocena ryzyka wyłudzenia danych na aktywnej karcie na podstawie heurystyk adresu URL i struktury DOM. Kod rozszerzenia nie wysyła analizowanych adresów ani danych formularzy do zewnętrznych API; skrypt zawartości zbiera tylko cechy strony, bez odczytywania wartości pól wpisanych przez użytkownika.

---

## 2. Użyte Technologie
- **Google Chrome Extension API (Manifest V3)**: Standard tworzenia bezpiecznych i zoptymalizowanych rozszerzeń przeglądarek.
- **JavaScript (ES6 Modules)**: Zastosowanie natywnych modułów ES w panelu popup bez zewnętrznych bundlerów (Webpack/Vite).
- **HTML5 & CSS3 (Flat Design)**: Semantyczna struktura interfejsu oraz lekki, czytelny motyw ciemny o wysokim kontraście.

---

## 3. Przegląd Architektury Systemu
Projekt realizuje zasadę ścisłego podziału odpowiedzialności (**Separation of Concerns**). Logika biznesowa, prezentacja oraz gromadzenie danych są od siebie całkowicie odseparowane.

### Struktura katalogów i plików:
```
phishguard-extension/
├── manifest.json            # Konfiguracja rozszerzenia (Manifest V3)
├── popup.html               # Struktura prezentacji panelu (HTML5)
├── styles.css               # Warstwa wizualna i pozycjonowanie (Flat CSS)
├── content.js               # Listener żądań skanowania w piaskownicy strony
├── popup.js                 # Główny koordynator cyklu życia skanowania (AppController)
├── icons/                   # Źródło SVG i ikony PNG dla Chrome (16, 32, 48, 128 px)
└── src/
    ├── constants/
    │   └── brands.js        # Konfiguracja bazowa znanych marek i domen oficjalnych
    ├── detectors/
    │   ├── urlDetector.js   # Silnik heurystycznej analizy adresów URL
    │   └── domDetector.js   # Silnik analizy struktury kodu DOM witryny
    ├── scoring/
    │   └── riskScoring.js   # Matematyczny kalkulator oceny poziomu ryzyka (0-100)
    ├── ui/
    │   └── renderResults.js # Moduł aktualizacji widoku (Renderer)
    └── utils/
        └── urlUtils.js      # Reużywalne funkcje narzędziowe dla URL
```

---

## 4. Zasada Działania Rozszerzenia
1. **Wyzwolenie skanowania**: Automatycznie po otwarciu panelu rozszerzenia lub manualnie po kliknięciu przycisku "Skanuj ponownie".
2. **Inspekcja URL**: Koordynator (`popup.js`) przekazuje adres URL aktywnej karty do `UrlHeuristicsEngine`. Moduł ten bada strukturę adresu i zwraca listę ustrukturyzowanych indykatorów ryzyka.
3. **Telemetria DOM**: Koordynator przesyła żądanie do skryptu zawartości (`content.js`). Skrypt wstrzykuje i wywołuje bezpieczną analizę `DomDetector` na odwiedzanej witrynie, zbierając wyłącznie parametry techniczne (formularze, pola haseł, brand keywords) i odsyłając je jako surowe dane telemetryczne.
4. **Obliczenie Ryzyka**: Moduł `RiskCalculator` łączy dane z URL oraz DOM, sumując wagi wykrytych anomalii, a następnie dokonuje klasyfikacji bezpieczeństwa.
5. **Renderowanie Wyników**: Obiekt oceny trafia do `UiRenderer`, który bez zbędnych efektów wizualnych prezentuje wynik punktowy, status słowny oraz listę wykrytych zagrożeń w pliku `popup.html`.

---

## 5. Reguły Wyliczania Ryzyka (Scoring)
Wynik końcowy jest sumą wag wykrytych indykatorów bezpieczeństwa i jest ograniczony do maksymalnie **100 punktów**:

| Kategoria | Indykator Zagrożenia | Waga (Kara) | Warunek Aktywacji |
| :--- | :--- | :---: | :--- |
| **URL** | Brak protokołu HTTPS | **+25** | Protokół witryny jest inny niż `https:` (np. `http:`). |
| **URL** | Adres IP jako nazwa hosta | **+30** | Hostname pasuje do wzorca adresu IPv4 lub IPv6. |
| **URL** | Nadmierna liczba subdomen | **+15** | Hostname zawiera 4 lub więcej dot-segmentów (bez www). |
| **URL** | Podejrzane słowo w URL | **+10** | URL zawiera słowa: *login, verify, secure, account, update, password*. |
| **URL** | Typosquatting | **+40** | Domena zniekształca pisownię monitorowanej marki (np. g00gle, alegro). |
| **DOM** | Obecność pola hasła | **+15** | Drzewo DOM zawiera przynajmniej jeden element `input[type="password"]`. |
| **DOM** | Nieszyfrowany formularz | **+30** | Atrybut `action` formularza zaczyna się od nieszyfrowanego protokołu `http://`. |
| **DOM** | Zewnętrzny cel formularza | **+35** | Atrybut `action` formularza wskazuje na host inny niż domena strony. |
| **DOM** | Niezgodność marki | **+40** | Strona zawiera nazwę marki, ale domena nie jest powiązana z tą marką. |

### Klasyfikacja Poziomów Bezpieczeństwa:
- **0 - 30**: **Safe (Bezpieczny)**
- **31 - 70**: **Suspicious (Podejrzany)**
- **71 - 100**: **Dangerous (Zagrożenie)**

Klasyfikacja „Bezpieczny” dotyczy wyłącznie stron, dla których udało się zebrać dane URL i DOM. Przed zakończeniem skanu oraz po kliknięciu „Skanuj ponownie” popup pokazuje status „Skanowanie”. Gdy skanowanie DOM jest niedostępne, popup wyświetla ostrzeżenie o analizie niepełnej. Jeżeli sam URL wskazuje podejrzenie lub zagrożenie, kategoria pozostaje ostrzegawcza, ale nadal widać informację o niepełnym skanie. Strony wewnętrzne przeglądarki mają status „Nie oceniono”, bez punktacji. Wynik 0/100 oznacza brak wykrytych sygnałów w badanych cechach, a nie gwarancję bezpieczeństwa strony.

---

## 6. Uruchomienie Rozszerzenia w Google Chrome
1. Uruchom przeglądarkę Google Chrome i przejdź pod adres `chrome://extensions/`.
2. Włącz suwak **Tryb dewelopera** (Developer mode) w prawym górnym rogu.
3. Kliknij przycisk **Załaduj rozpakowane** (Load unpacked) z lewej strony.
4. Wskaż katalog główny projektu w swoim obszarze roboczym: `c:\Users\blaze\StudioProjects\phishguard-extension`.
5. Rozszerzenie zostanie pomyślnie załadowane i pojawi się na liście Twoich dodatków. Przypnij je do paska zadań za pomocą ikony puzzla.

---

## 7. Ręczne Scenariusze Testowe (Katalog `test-pages`)
W celach demonstracyjnych w projekcie utworzono katalog `test-pages` zawierający szablony HTML (bez prawdziwych danych logowania i logotypów) do weryfikacji działania silnika:

1.  **`safe-login.html`**: Formularz logowania wysyłający dane na tę samą domenę. Samo pole hasła jest punktowane (+15); na serwerze HTTP dodatkowe punkty pochodzą od protokołu i słowa „login” w ścieżce.
2.  **`fake-paypal-login.html`**: Atrapa strony PayPal. Wykrywa pole hasła, typosquatting/mismatch marki oraz nieszyfrowaną i zewnętrzną wysyłkę formularza. Generuje status **Zagrożenie**.
3.  **`external-form.html`**: Formularz wysyłający dane na obcą domenę. Na lokalnym serwerze HTTP otrzymuje 75 pkt i status **Zagrożenie**; na HTTPS bez innych wskaźników 50 pkt i status **Podejrzany**.
4.  **`oauth-false-positive-test.html`**: Formularz z pojedynczym przyciskiem „Zaloguj przez Google” pozwala sprawdzić brak fałszywego wskaźnika niezgodności marki.
5.  **`suspicious-keywords.html`**: Materiał do sprawdzenia ograniczenia prototypu: słowa ostrzegawcze występują w treści, ale bieżący detektor słów kluczowych sprawdza wyłącznie host i ścieżkę URL.

*Wskazówka badawcza: Testy domen i celów formularzy wymagają podania stron przez serwer (np. `python -m http.server` i `http://localhost:8000/test-pages/...`). Serwer HTTP dodaje 25 punktów za brak HTTPS i może zmieniać kategorię wyniku. Do porównania skuteczności należy oddzielić wpływ protokołu od badanej cechy lub użyć serwera HTTPS. Nie wpisuj prawdziwych danych do formularzy testowych.*

Regresję dopasowywania domen można uruchomić przez `node --test tests/*.test.mjs` (Node.js 24). Testy obejmują podszywające się hosty, domeny oficjalne i próbkę analizy DOM; nie zastępują sprawdzenia rozszerzenia w Chrome.

---

## 8. Ograniczenia Projektu
- **Analiza wyłącznie statyczna/heurystyczna**: Rozszerzenie nie korzysta z dynamicznych analiz zachowań skryptów JS na stronie (brak sandboxa behawioralnego).
- **Zależność od bazy marek**: Detekcja typosquattingu oraz niezgodności marek w treści opiera się na statycznie zdefiniowanym słowniku w `brands.js`.
- **Weryfikacja lokalna**: Brak integracji z globalnymi, stale aktualizowanymi bazami reputacyjnymi (np. Google Safe Browsing, PhishTank).

---

## 9. Kierunki Przyszłego Rozwoju
1. **Dynamiczne aktualizacje baz**: Wdrożenie bezpiecznego mechanizmu pobierania zaktualizowanych baz sygnatur i domen marek w tle (np. poprzez serwer CDN).
2. **Analiza reputacyjna domen**: Integracja z zewnętrznymi API reputacyjnymi (z zachowaniem anonimizacji zapytań poprzez serwery proxy w celu ochrony prywatności).
3. **Analiza behawioralna skryptów**: Wykrywanie prób maskowania kodu źródłowego (obfuscation) lub prób blokowania otwierania konsoli deweloperskiej przez witrynę.
