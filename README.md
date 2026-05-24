# PhishGuard – Rozszerzenie Przeglądarki do Detekcji Phishingu (Projekt MVP)

Niniejszy projekt stanowi inżynierskie Minimum Viable Product (MVP) rozszerzenia dla przeglądarki Google Chrome, służącego do real-time'owej analizy bezpieczeństwa witryn i wykrywania zagrożeń phishingowych. Projekt został zaprojektowany z myślą o wysokiej modularności i przejrzystości architektury (Separation of Concerns), stanowiąc doskonały fundament teoretyczny i praktyczny do pracy dyplomowej z zakresu cyberbezpieczeństwa.

---

## 1. Cel Główny Projektu
Głównym celem systemu jest lokalna ocena ryzyka wyłudzenia danych (phishingu) na aktywnej karcie przeglądarki na podstawie zestawu heurystyk adresów URL oraz analizy strukturalnej kodu DOM odwiedzanej witryny. Rozszerzenie działa w 100% lokalnie w przeglądarce, co gwarantuje pełne poszanowanie prywatności użytkownika (brak wysyłania wrażliwych danych czy odwiedzanych adresów URL do zewnętrznych API/serwerów).

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

---

## 6. Uruchomienie Rozszerzenia w Google Chrome
1. Uruchom przeglądarkę Google Chrome i przejdź pod adres `chrome://extensions/`.
2. Włącz suwak **Tryb dewelopera** (Developer mode) w prawym górnym rogu.
3. Kliknij przycisk **Załaduj rozpakowane** (Load unpacked) z lewej strony.
4. Wskaż katalog główny projektu w swoim obszarze roboczym: `c:\Users\blaze\StudioProjects\phishguard-extension`.
5. Rozszerzenie zostanie pomyślnie załadowane i pojawi się na liście Twoich dodatków. Przypnij je do paska zadań za pomocą ikony puzzla.

---

## 7. Ręczne Scenariusze Testowe (Katalog `test-pages`)
W celach demonstracyjnych w projekcie utworzono katalog [test-pages](file:///c:/Users/blaze/StudioProjects/phishguard-extension/test-pages) zawierający gotowe, bezpieczne szablony HTML (wyłącznie tekst, brak logotypów marek) do weryfikacji działania silnika:

1.  **`safe-login.html`**: Formularz logowania przesyłający hasło na tę samą domenę (relatywnie). Wykazuje brak anomalii.
2.  **`fake-paypal-login.html`**: Atrapa strony PayPal. Wykrywa pole hasła, typosquatting/mismatch marki oraz nieszyfrowaną i zewnętrzną wysyłkę formularza. Generuje status **Zagrożenie**.
3.  **`external-form.html`**: Formularz wysyłający hasło na obcą domenę (wyszukiwanie credential harvesting). Generuje status **Podejrzany**.
4.  **`suspicious-keywords.html`**: Strona wywierająca presję bez formularzy, przepełniona podejrzanymi słowami w treści. Generuje odpowiedni wskaźnik zagrożenia.

*Wskazówka badawcza: Aby prawidłowo przetestować dopasowywanie domen (mismatch/external), pliki testowe należy uruchomić w środowisku lokalnym poprzez serwer HTTP (np. uruchamiając `python -m http.server` w katalogu rozszerzenia) i wchodząc pod adres `http://localhost:8000/test-pages/...`.*

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
