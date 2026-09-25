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
