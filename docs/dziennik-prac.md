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

## 25.09.2026 — pierwsze pięć prób w Chrome na stronach demonstracyjnych

- **Cel:** sprawdzić na lokalnych stronach przepływ analizy URL i DOM, punktacji oraz prezentacji wyniku w panelu rozszerzenia.
- **Dowód:** pięć przesłanych zrzutów ekranu E01–E05, zachowanych w [`docs/dowody/2026-09-25`](dowody/2026-09-25) i opisanych w [raporcie z prób](proby-chrome-2026-09-25.md); obserwacje i przewidywania oddzielono w [CSV](przypadki-testowe.csv).
- **Wynik:** na stronach `suspicious-keywords`, `oauth-false-positive-test`, `external-form`, `fake-paypal-login` i `safe-login` odczytano odpowiednio 25, 70, 75, 100 i 80 pkt. Dla wszystkich pięciu wynik, status i wyświetlana wiarygodność odpowiadają przewidywaniu z kodu dla adresów `http://localhost:8000/test-pages/...`. Cztery zrzuty pokazują całe listy wskaźników; na zrzucie `fake-paypal-login` ostatni przewidywany wskaźnik marki nie jest widoczny.
- **Wersjonowanie:** oczekiwania policzono na commicie `b7e0036`. Wersja kodu rzeczywiście załadowana u użytkownika, wersja Chrome i pełny URL/port nie zostały jeszcze potwierdzone; zrzuty pokazują host `localhost` i brak HTTPS.
- **Ograniczenia:** wszystkie strony podano przez HTTP, co wpływa na punktację. Pięć demonstracji nie jest zbiorem 40 scenariuszy ani pomiarem trafności lub fałszywych alarmów. `safe-login` (80 pkt) sprawdza zachowanie dla własnego formularza na HTTP; `suspicious-keywords` (25 pkt) pokazuje zakres reguł bez formularza logowania.
- **Materiały do pracy:** zachować wszystkie pięć zrzutów, raport, CSV, dokładny commit i wersję Chrome po otrzymaniu tych danych. Wyniki mogą służyć do opisu demonstracji prototypu po wskazaniu ograniczeń, ale nie do obliczenia skuteczności.

## 05.10.2026 — zaległe punkty 01.10, 03.10 i 05.10: DOM, usterki, poprawki

- **Cel:** przetestować analizę DOM, uruchomić kontrolowane przypadki i poprawić potwierdzone błędy zliczania marek. Datą wykonania jest 05.10, bez wstecznego przypisywania wyników do dat w harmonogramie.
- **Ślad:** siedem nowych testów w [`tests/dom-detector.test.mjs`](../tests/dom-detector.test.mjs), zmiana w [`domDetector.js`](../src/detectors/domDetector.js), nowa strona [`oauth-inside-form.html`](../test-pages/oauth-inside-form.html), szczegółowy [rejestr usterek](przeglad-dom-2026-10-05.md).
- **Obserwacja przed zmianą:** trzy testy wykazały niepożądaną niezgodność marki: pojedynczy przycisk OAuth w formularzu i pojedynczy nagłówek były liczone podwójnie, a nazwa marki była rozpoznawana jako fragment dłuższego słowa.
- **Poprawka i weryfikacja:** każdy fragment formularza liczony jest raz; węzły tekstowe są oddzielane, a dopasowanie marki wymaga granic słowa. `node --test --test-isolation=none tests/*.test.mjs` na Node.js 24.19.0: **22 testy zaliczone, 0 niezaliczonych**, w tym testy nieoficjalnej i oficjalnej domeny, formularzy oraz poprzednia regresja URL.
- **Granica dowodu:** są to uruchomienia kodu w Node na kontrolowanym modelu DOM. Lokalna próba w dostępnej przeglądarce została zablokowana przez politykę adresów `file://`, więc na tym etapie nie wykonano nowego testu Chrome. Późniejszy zrzut panelu E06 opisano niżej. Pięć wcześniejszych zrzutów dotyczy wersji sprzed poprawki. Zbiór C01–C40 nadal nie ma obserwacji; nie wyliczono czułości, precyzji ani odsetka fałszywych alarmów.
- **Następny krok:** na komputerze użytkownika przeładować rozszerzenie, sprawdzić nową stronę w Chrome przez lokalny serwer, zapisać pełny URL, wersję Chrome, SHA kodu i wynik panelu; potem przejść do pozostałych prób rozwojowych, przed zamrożeniem kodu na 10.10.

## 05.10.2026 — E06, zrzut panelu po instrukcji ręcznej próby

- **Materiał:** użytkownik przesłał [zrzut panelu E06](dowody/2026-10-05/E06-oauth-inside-form-popup.png) w odpowiedzi na instrukcję otwarcia `oauth-inside-form.html`; zachowano go i opisano w [osobnym raporcie](proba-chrome-2026-10-05.md).
- **Obserwacja:** panel pokazuje `localhost`, 25/100, „Bezpieczny”, „Niska” i jedynie brak HTTPS (+25 pkt), bez alarmu marki. Widoczne wartości zgadzają się z oczekiwaniem dla przygotowanego przypadku.
- **Granica dowodu:** zrzut obejmuje panel, bez strony i paska adresu. Nie potwierdza dokładnej ścieżki, portu, załadowanego SHA ani wersji Chrome. Nie stanowi pomiaru skuteczności; wiersz E06 w CSV oddziela wynik widoczny od oczekiwania wyliczonego dla podanego URL.
- **Następny krok:** uzyskać pełny kadr strony z paskiem adresu i panelem oraz wersje Chrome i kodu, a następnie doprecyzować E06 w protokole.

## 05.10.2026 — wykonanie z wyprzedzeniem części punktu 07.10: metodyka i pilot

- **Cel:** ustalić powtarzalną metodę dla syntetycznych adresów i stron `SPEC_40`, a następnie zbadać pięć wcześniej oznaczonych przypadków rozwojowych bez uruchamiania odłożonego zbioru oceny.
- **Ślad:** [metodyka i raport C01/C07/C10/C11/C16](metodyka-i-pilot-2026-10-05.md), [skrypt modelowy](../scripts/run-development-model.mjs) i [surowy JSON](dowody/2026-10-05/C01-C07-C10-C11-C16-model.json). Aplikacja odpowiadała commitowi `a84635d`; JSON zawiera także hashe plików użytych przez skrypt. Node.js v24.19.0, Linux.
- **Metoda:** kontrolowany model `document` według pól `SPEC_40` i `window.location` według `wejscie`; wykonano rzeczywisty kod detektora DOM, silnika URL i punktacji. Nie łączono z Chrome ani z prawdziwymi domenami.
- **Obserwacja:** C01: 15/Safe, C07: 60/Suspicious, C10: 0/Safe, C11: 100/Dangerous, C16: 65/Suspicious. C07 jest fałszywym alarmem w modelu legalnego przepływu między subdomenami. Nie liczono procentów skuteczności z celowego pilota pięciu przypadków.
- **Granica dowodu:** to wyniki kodu na uproszczonym DOM, a nie pięć prób Chrome ani wyniki C21–C40. Planowane wiersze CSV zachowano bez pól `faktyczne_*`; oddzielny JSON przechowuje obserwacje modelowe. Nie zmieniano reguł aplikacji.
- **Następny krok:** przeładować rozszerzenie na komputerze użytkownika i powtórzyć kontrolowane próby Chrome z pełnymi kadrami oraz wersjami; dokończyć przypadki rozwojowe przed zamrożeniem kodu 10.10.

## 05.10.2026 — powtórzenie pięciu prób Chrome z pełnymi kadrami

- **Dowody:** E07–E11, zrzut informacji Chrome i hashe plików w [raporcie](proby-chrome-powtorzenie-2026-10-05.md); obserwacje dodano do CSV.
- **Odczyt:** OAuth wewnątrz formularza 25/Safe/Low, OAuth obok 70/Suspicious/High, własny formularz HTTP 80/Dangerous/High, zewnętrzny cel 75/Dangerous/High, atrapa PayPal 100/Dangerous/High.
- **Wniosek:** punkty i statusy odpowiadają oczekiwaniom dla pokazanych adresów. E07 i E08 nie pokazują alarmu marki; E11 nie potwierdza go osobno, ponieważ dolna lista znajduje się poza kadrem.
- **Metadane:** pełne kadry identyfikują ścieżki i port 8000. Zrzut informacji Chrome pokazuje 154.0.8037.95, 64-bit i aktualizację oczekującą restartu. Wersja aktywnego procesu oraz załadowany SHA niepotwierdzone; c695cf3 był zadany w instrukcji.
- **Materiały do pracy:** dodano tabelę powtórzonych obserwacji i omówienie warunków HTTP; jest to dokumentacja prób funkcjonalnych, bez metryk skuteczności.
- **Dalszy krok:** uzyskać SHA z komputera testowego i dolny kadr E11; potem kontynuować przypadki rozwojowe i analizę ograniczenia C07.

## 05.10.2026 — potwierdzenie lokalnego SHA dla E07–E11

- Użytkownik przekazał wynik `git rev-parse HEAD`: `c695cf337769d77edfd3839776edc9bb132154bb`, po zrzutach i przed kolejnym pobraniem zmian.
- Uzupełniono pole `commit` w pięciu wierszach CSV jako wersję lokalnego checkoutu, raport, protokół i metadane dowodów. Nie przypisano temu wynikowi potwierdzenia przeładowania rozszerzenia ani aktywnej wersji procesu Chrome.
- Odczyty panelu pozostają takie same; dodatkowy dolny kadr E11 i potwierdzenie przeładowania uzupełnią opis prób.

## 05.10.2026 — pełny zbiór rozwojowy C01–C20

- **Wykonanie:** rzeczywiste moduły URL, DOM i punktacji na kontrolowanym SPEC_40; [raport i dane](zbior-rozwojowy-2026-10-05.md). Kod aplikacji: 2a56948, reguły bez zmian.
- **Wyniki:** TP=10, FP=2, FN=0, TN=8. Wszystkie 10 symulacji phishingu daje alarm; 8 z 10 legalnych nie daje alarmu. C07 i C09 opisano osobno. Jest to wynik zbioru rozwojowego, bez uruchomienia C21–C40 i bez nowych prób Chrome.
- **Decyzja C07:** różnica hostów jest wykrywana prawidłowo; autoryzacja docelowej subdomeny nie wynika z wejścia URL/DOM. Zachowano regułę, opisano ograniczenie.
- **Decyzja C09:** legalna konstrukcja i ryzykowny HTTP współistnieją; nie usunięto alarmu dla transmisji hasła przez HTTP.
- **Materiał do pracy:** podano liczniki i miary opisowe z mianownikami oraz ograniczenia uproszczonego modelu. Pilot pięciu przypadków i pełny przebieg mają wspólne scenariusze, więc nie sumujemy ich jako 25 niezależnych obserwacji.
