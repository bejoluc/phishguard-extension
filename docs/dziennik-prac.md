# PhishGuard — dziennik prac i dowodów

Ten dziennik łączy decyzje projektowe z wersją kodu, sposobem sprawdzenia i ograniczeniami wyników. Przy następnej zmianie dopisujemy datę, cel, pliki lub commit, rodzaj weryfikacji, faktyczną obserwację oraz to, co nadal pozostaje do sprawdzenia. Wynik oczekiwany z kodu zapisujemy osobno od wyniku zaobserwowanego w Chrome.

Wpisy sprzed 25.09.2026 odtworzono z historii repozytorium i wcześniejszych testów; dzisiejsze wpisy powstały podczas wykonywania pracy. Dokładną wersją dla pomiaru jest commit zapisany przy próbie w [tabeli przypadków](przypadki-testowe.csv).

## 23.09.2026 — podstawowe poprawki i ikona

- **Cel:** dopasowanie pełnych domen marek i poprawna informacja przy niedostępnym DOM; dodanie identyfikacji wizualnej rozszerzenia.
- **Ślad:** commity `e65c921` (poprawki analiz) i `89b9fc4` (ikona, warianty PNG 16/32/48/128). Źródłem stanu kodu są pliki repozytorium; historyczny `thesis_context.md` nie jest jego aktualną kopią.
- **Weryfikacja:** 8 testów automatycznych przeszło po poprawkach i po dodaniu ikony; potwierdzono rozmiary oraz wpisy PNG w manifeście.
- **Granica dowodu:** testy regresji nie określają czułości ani częstości fałszywych alarmów na zbiorze stron.

## 25.09.2026 — audyt reguł i wymagania

- **Cel:** powiązać zatwierdzony temat pracy z faktycznymi regułami URL i DOM oraz oddzielić implementację od pomysłów na rozwój.
- **Ślad:** commit `82c7290`, [stan reguł i wymagania](stan-regul-i-wymagania.md), odnośnik w `README.md` i oznaczenie historycznej migawki w `thesis_context.md`.
- **Weryfikacja:** porównano warunki oraz wagi z modułami detekcji i punktacji; 8 testów automatycznych przeszło. Ustalono, że w kodzie nie ma Levenshteina, bazy reputacyjnej ani ekranu blokującego.
- **Granica dowodu:** występowanie reguły w kodzie nie dowodzi jej przydatności na rzeczywistych stronach logowania.

## 25.09.2026 — sposób zapisu przypadków testowych

- **Cel:** utrwalić etykietę scenariusza, oczekiwany wynik z kodu i przyszłą obserwację jako różne dane.
- **Ślad:** [protokół testów](protokol-testow.md) oraz [tabela CSV](przypadki-testowe.csv). Oczekiwania obliczono na kodzie z commitu `82c7290`.
- **Weryfikacja:** skontrolowano 13 początkowych wierszy względem `UrlHeuristicsEngine` i `RiskCalculator`; wszystkie ID wskaźników, punkty URL, końcowe wyniki, statusy i poziomy wiarygodności zgadzają się z bieżącą implementacją. Pola obserwacji są puste.
- **Granica dowodu:** przypadki te sprawdzają reguły i punktację; skaner DOM oraz interfejs Chrome wymagają odrębnej weryfikacji na stronach testowych. Nie uzyskano jeszcze żadnych wyników do macierzy pomyłek.
- **Następny krok:** dopisać oznaczone scenariusze oraz uruchomić kontrolowane próby w Chrome z zapisem warunków i wersji kodu.

## 25.09.2026 — przyspieszony punkt planu z poniedziałku: zestaw 40 scenariuszy

- **Cel:** określić przed pomiarem zrównoważony zestaw stron logowania na podstawie URL i DOM.
- **Ślad:** [opis zestawu i konstrukcji stron](scenariusze-40.md) oraz wiersze C01–C40 w [CSV](przypadki-testowe.csv). Dla każdej pozycji zapisano URL, typ formularza, markę w DOM, adres `action`, niezależną etykietę i jej uzasadnienie.
- **Podział:** 10 legalnych i 10 symulujących phishing w `rozwoj`; taki sam podział w odłożonym `ocena`. Wcześniejsze U/D pozostają poza tym bilansem.
- **Weryfikacja:** sprawdzono liczby, unikalność ID, składnię URL i kompletność specyfikacji. Pola oczekiwanych punktów i faktycznych obserwacji dla C01–C40 są puste.
- **Granica dowodu:** modelowe URL i profile DOM nie są jeszcze stronami w Chrome. Do badania skuteczności potrzeba uruchamialnych stron lub jawnie opisanego laboratorium oraz zapisu metody wykonania każdej próby.
- **Materiały do pracy:** zachować CSV, opis scenariuszy, protokół i ten dziennik; na tym etapie nie ma zrzutów ekranu ani wyników do rozdziału badawczego.

## 25.09.2026 — przyspieszony punkt planu ze środy 30.09: testy URL

- **Cel:** automatycznie sprawdzić oficjalne domeny i ich subdomeny, hosty podszywające się pod marki, zapisane wzorce literówek, słowa w adresie, liczbę segmentów domeny oraz adresy IP.
- **Metoda:** siedem nowych testów w [`tests/url-detector.test.mjs`](../tests/url-detector.test.mjs) wywołuje `UrlHeuristicsEngine` dla kontrolowanych obiektów `URL`. Dla różnych adresów porównuje ID wykrytych wskaźników i, tam gdzie istotne, sumę punktów URL. Przykłady używają m.in. domen syntetycznych `.test` oraz dokumentacyjnego IP `192.0.2.10`; nie wymagają odwiedzania stron.
- **Odkryty i poprawiony błąd:** przed poprawką test `http://192.0.2.10/login` nie przechodził: obok `ip-hostname` detektor błędnie zgłaszał `excessive-subdomains`, bo cztery części IPv4 traktował jak segmenty domeny. Dawało to 80 pkt URL zamiast 65. Po zmianie w [`urlDetector.js`](../src/detectors/urlDetector.js) host rozpoznany jako IP nie podlega regule subdomen; `insecure-protocol` (+25), `ip-hostname` (+30) i `suspicious-keywords` (+10) dają łącznie 65 pkt URL.
- **Przypadki kontrolne:** oficjalne hosty siedmiu marek i ich subdomeny bez fałszywego wskaźnika marki; hosty `fakepaypal.test`, `paypal.com.evil.test`, `login-google.test`, `secure-allegro.test`, `olx.pl.login.test` ze wskaźnikiem marki; siedem zapisanych wzorców literówek z pojedynczym naliczeniem +40; słowa w hoście/ścieżce naliczone raz +10 i brak naliczenia dla samego zapytania lub fragmentu; próg czterech segmentów domeny z pominięciem `www`; osobno IPv4 i IPv6 bez punktów za subdomeny.
- **Weryfikacja:** Node.js 24.19.0, `node --test tests/*.test.mjs`: 15 testów zaliczonych, 0 niezaliczonych, w tym siedem nowych testów URL; sprawdzono też `git diff --check`. Oryginalną porażkę testu IPv4 odtworzono przed zmianą, a następnie wykonano ponowny przebieg po poprawce.
- **Granica dowodu:** to testy jednostkowe detektora, bez DOM i bez Chrome. Nie są pomiarem skuteczności na 40 zaplanowanych scenariuszach; pól `faktyczne_*` w [CSV](przypadki-testowe.csv) nie uzupełniano. Wzorce IP i literówek pozostają uproszczonymi heurystykami.
- **Materiały do pracy:** zachować kod testów, zmieniony detektor URL, [stan reguł](stan-regul-i-wymagania.md), ten dziennik oraz identyfikator commitu w historii Git. Nie powstały nowe zrzuty ekranu z Chrome ani wyniki pomiaru skuteczności.
