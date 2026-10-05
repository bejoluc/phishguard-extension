# PhishGuard — protokół i wzorzec tabeli przypadków testowych

Stan na 05.10.2026. Uzupełnia [wykaz reguł i wymagań](stan-regul-i-wymagania.md), zwłaszcza RF-08. Punkt odniesienia dla **oczekiwanych wyników pierwszych 13 przykładów**: commit `82c7290`. Zebrano też pięć wstępnych prób Chrome [opisanych osobno](proby-chrome-2026-09-25.md), ograniczony [zrzut panelu E06](proba-chrome-2026-10-05.md) i [pięć prób rozwojowych w kontrolowanym modelu URL + DOM](metodyka-i-pilot-2026-10-05.md). [Tabela CSV](przypadki-testowe.csv) zawiera 13 przykładów reguł, jedenaście wierszy demonstracyjnych i [40 scenariuszy URL + DOM](scenariusze-40.md); pięć wyników modelowych zapisano oddzielnie od wierszy CSV.

## 1. Rozróżnienie trzech rzeczy

1. **Etykieta referencyjna** opisuje kontrolowany scenariusz: legalna symulacja logowania, symulowany phishing albo przypadek diagnostyczny. Nadajemy ją na podstawie konstrukcji scenariusza, **przed** uruchomieniem PhishGuard. Sam wynik rozszerzenia nie może być źródłem etykiety.
2. **Wynik oczekiwany z bieżącego kodu** podaje konkretne ID wskaźników, punkty i status, jakie powinny wynikać z aktualnych reguł. To punkt odniesienia dla testu regresji, nawet jeśli zachowanie okaże się niepożądane.
3. **Wynik zaobserwowany** zapisujemy po wykonaniu próby z dostępnym dowodem. Datę, wersję kodu i środowisko dokumentujemy; jeżeli zrzut ich nie potwierdza, brak danych oznaczamy jawnie w uwagach. Puste komórki wyników w planowanych przypadkach oznaczają „nie wykonano”, a nie zero punktów.

Przypadki `unit_url` sprawdzają sam detektor URL i mają tylko sumę punktów URL; nie przypisujemy im końcowego statusu całej strony. Przypadki `score_fixture` podają kontrolowane cechy DOM bez uruchamiania przeglądarki, więc sprawdzają łączenie sygnałów i punktację, lecz nie dowodzą poprawności zbierania DOM. `planowany_przypadek` oznacza specyfikację strony bez uruchomienia; dopiero `chrome_e2e` bada rozszerzenie jako całość na stronie testowej.

## 2. Format zapisu i zasady oceny

Plik CSV ma kodowanie UTF-8 i separator `;`, wygodny do otwarcia w polskim Excelu. Jeden wiersz to jeden scenariusz. Pola `oczekiwane_*` i `faktyczne_*` pozostają oddzielne. Lista ID wskaźników jest rozdzielana znakiem `|`; pusty wynik wskaźników po wykonaniu zapisujemy jawnie jako `brak`. W polach wyników bieżących niczego nie wpisujemy, dopóki próba nie zostanie wykonana. W wykonanej próbie pole, którego nie widać w dostarczonym dowodzie, także pozostaje puste, z podaniem przyczyny w `warunki_uwagi`.

| Pole | Znaczenie |
| --- | --- |
| `id`, `zbior`, `tryb` | Stały identyfikator, etap (`rozwoj` albo `ocena`) i rodzaj próby (`unit_url`, `score_fixture`, `planowany_przypadek`, później ewentualnie `chrome_e2e` lub opisany model laboratoryjny). |
| `referencja` | Etykieta scenariusza nadana bez znajomości wyniku programu; `nie_dotyczy` dla testów pojedynczych reguł. |
| `wejscie`, `profil_dom` | Dokładny URL lub ścieżka strony i opis kontrolowanych cech DOM. |
| `oczekiwane_id`, `oczekiwane_pkt_url`, `oczekiwany_score`, `oczekiwany_status`, `oczekiwana_wiarygodnosc` | Wynik przewidziany na podstawie kodu; status i wiarygodność dotyczą wyłącznie pełnej punktacji. |
| `faktyczne_*` | Wartości odczytane po przeprowadzeniu próby; nigdy nie kopiować tu wyniku oczekiwanego. |
| `data`, `commit`, `warunki_uwagi` | Czas próby, wersja testowanego kodu oraz przeglądarka, sposób podania strony, protokół i odstępstwa. |
| `typ_dom`, `marka_w_dom`, `cel_formularza`, `przycisk_oauth`, `uzasadnienie_etykiety` | Specyfikacja 40 planowanych stron i zapis podstawy ich niezależnej etykiety. W starszych U/D pola pozostają puste. |

Na etapie analizy skuteczności alertem jest wynik `Suspicious` albo `Dangerous`; `Safe` jest brakiem alertu. Każdą próbę z niepełnym DOM, także gdy sam URL daje alert, liczymy osobno jako **niekompletną** i nie mieszamy z macierzą pomyłek pełnych analiz. Z oznaczonych pełnych scenariuszy liczymy TP, FP, FN, TN, a następnie precyzję, czułość i odsetek fałszywych alarmów. Podajemy liczniki i mianowniki; nie wyciągamy ogólnego procentu skuteczności z pojedynczych przykładów.

## 3. Profile danych DOM w przykładach punktacji

Te profile to wejście przekazane bezpośrednio do kalkulatora, **nie potwierdzony wynik skanera DOM w Chrome**. W obu listach formularzy każdy wpis ma pole `action` oraz cechy `hasPassword` i `method`.

| Profil | Dane przekazywane do punktacji |
| --- | --- |
| `P1` | `hasPasswordField: true`; brak niebezpiecznych lub zewnętrznych celów formularzy; brak rozpoznanych marek. |
| `P2` | Jak `P1`, lecz `externalFormActions` zawiera `https://auth.example.test/session` (strona ma host `portal.example.test`). |
| `P3` | Pole hasła, `insecureFormActions` i `externalFormActions` zawierają `http://collector.test/submit`; `detectedBrandKeywords: ['paypal']`. |
| `P4` | Brak pola hasła; `insecureFormActions` zawiera `http://example.test/submit` dla zwykłego formularza; brak innych sygnałów. |
| `BRAK_DOM` | Wartość `null`: pobranie danych DOM nie powiodło się. |

### Pierwsze przypadki kontrolne

| ID | Wejście / profil | Oczekiwane wskaźniki obecnego kodu | Oczekiwane punkty / status |
| --- | --- | --- | --- |
| U01 | `https://paypal.com/` | brak | URL: 0 |
| U02 | `https://secure.paypal.com/login` | `suspicious-keywords` | URL: 10 |
| U03 | `https://fakepaypal.test/login` | `suspicious-keywords`, `brand-typosquatting` | URL: 50 |
| U04 | `https://g00gle.test/` | `brand-typosquatting` | URL: 40 |
| U05 | `https://paypal.com.evil.test/` | `excessive-subdomains`, `brand-typosquatting` | URL: 55 |
| U06 | `https://example.test/?next=/login` | brak: ścieżka to `/`, a słowo występuje w zapytaniu | URL: 0 |
| U07 | `https://a.b.example.test/` | `excessive-subdomains` | URL: 15 |
| U08 | `http://example.test/login` | `insecure-protocol`, `suspicious-keywords` | URL: 35 |
| D01 | `https://example.test/login` + `P1` | `suspicious-keywords`, `password-field-present` | 25 / `Safe` |
| D02 | `https://portal.example.test/login` + `P2` | `suspicious-keywords`, `password-field-present`, `external-form-action` | 60 / `Suspicious` |
| D03 | `https://paypal-login.test/` + `P3` | `suspicious-keywords`, `brand-typosquatting`, `password-field-present`, `insecure-form-action`, `external-form-action`, `brand-mismatch` | 100 / `Dangerous` |
| D04 | `https://example.test/` + `P4` | `insecure-form-action` | 30 / `Safe` |
| D05 | `https://example.test/` + `BRAK_DOM` | brak | 0 / `Incomplete` |

Powyższe oczekiwania zostały wstępnie przeliczone przy tworzeniu protokołu przez `UrlHeuristicsEngine` i `RiskCalculator`; nie są wynikami eksperymentu w Chrome. `D02` i `D04` celowo dokumentują możliwe fałszywe alarmy lub nietrafne komunikaty: porównanie hostów jest dosłowne, a formularze HTTP są punktowane także bez kontekstu logowania. Te wiersze pozostają w zbiorze rozwojowym, nawet jeśli poprawimy później reguły.

## 4. Osobna ścieżka prób w Chrome

Istniejące strony demonstracyjne są materiałem startowym dla `chrome_e2e`. Wstępne wyniki z pięciu zrzutów Chrome zapisano jako E01–E05 i [opisano z ograniczeniami dowodu](proby-chrome-2026-09-25.md). Pełny URL i wersja testowana na komputerze użytkownika czekają na potwierdzenie.

| Strona | Co sprawdzamy | Ograniczenie przed podaniem oczekiwanego wyniku |
| --- | --- | --- |
| [`safe-login.html`](../test-pages/safe-login.html) | Pole hasła i formularz na własnym hoście. | HTTP lokalnego serwera dodaje 25 pkt; ścieżka z `login` kolejne 10. |
| [`fake-paypal-login.html`](../test-pages/fake-paypal-login.html) | Nieoficjalna marka, hasło oraz formularz HTTP na obcym hoście. | `localhost` nie sprawdza podszywania się w **nazwie hosta**; to osobny przypadek URL. |
| [`external-form.html`](../test-pages/external-form.html) | Cel formularza na obcym hoście. | Wynik zależy od protokołu strony, a potencjalnie też od ścieżki. |
| [`oauth-false-positive-test.html`](../test-pages/oauth-false-positive-test.html) | Pojedynczy przycisk OAuth nie powinien powodować niezgodności marki. | Ocena pozostałych wskaźników zależy od URL uruchomienia. |
| [`suspicious-keywords.html`](../test-pages/suspicious-keywords.html) | Słowa w treści strony bez formularza. | Detektor słów URL nie sprawdza tekstu zwykłego artykułu. |

Do prób nie wprowadzamy prawdziwych haseł i nie wysyłamy formularzy. Zapisujemy pełny adres uruchomienia (w tym `http:` lub `https:`), wersję Chrome, system, commit, datę i wynik popupu. Zrzut ekranu oznaczamy ID scenariusza i datą. Stronę lokalną podaną przez HTTP i tę samą stronę przez HTTPS traktujemy jako dwa różne warunki testowe.

## 5. Przygotowanie pomiaru właściwego

Zapisano 40 oznaczonych scenariuszy: 20 legalnych i 20 symulujących phishing. W każdej klasie 10 trafiło do `rozwoj`, a 10 do `ocena`. Wiersze w CSV nadal mają `planowany_przypadek` oraz puste pola oczekiwanego i zaobserwowanego wyniku. **Pięć obserwacji z 05.10** pochodzi z osobnego, powtarzalnego pilota `model_url_dom` dla C01/C07/C10/C11/C16 i nie jest wykonaniem próby Chrome; [metoda i zapis wyników](metodyka-i-pilot-2026-10-05.md). Oddzielne przypadki `ocena` ustalono **przed** zamrożeniem wersji kodu i uruchomimy je po pracy na zbiorze rozwojowym. Warunki wykonania i ewentualne zmiany trzeba zapisać w tym protokole. Scenariusze `unit_url` i `score_fixture` są testami reguł, nie wchodzą do późniejszego pomiaru skuteczności rozszerzenia jako całości.

Wyniki na kontrolowanych stronach pozwolą opisać ograniczenia prototypu. Ich próba i sposób doboru muszą zostać podane w pracy; nie będziemy przedstawiać ich jako pomiaru wszystkich rzeczywistych kampanii phishingowych.

## 6. Uzupełnienie 05.10.2026 — testy DOM i kolejna próba Chrome

Zaległe testy DOM i poprawki zapisano w [rejestrze z 05.10](przeglad-dom-2026-10-05.md). Siedem nowych automatycznych przypadków w [`tests/dom-detector.test.mjs`](../tests/dom-detector.test.mjs) bada rzeczywisty skrypt detektora, lecz dostarcza kontrolowany model dokumentu zamiast przeglądarki. Pełny przebieg `node --test --test-isolation=none tests/*.test.mjs` na Node.js 24.19.0 daje 22/22 testy. Trzech błędów wykrytych przed poprawką nie przedstawiamy jako zaobserwowanych fałszywych alarmów w Chrome.

Nową stronę [`oauth-inside-form.html`](../test-pages/oauth-inside-form.html) przygotowano do powtórnej próby. Dla `http://localhost:8000/test-pages/oauth-inside-form.html` oczekiwany wynik kodu wynosi 25/100, `Safe`, `Low` i wyłącznie `insecure-protocol`. Po instrukcji uruchomienia użytkownik przesłał zrzut panelu pokazujący `localhost`, 25/100, status „Bezpieczny”, poziom „Niska” oraz wyłącznie brak HTTPS. Obserwację wpisano jako E06 do CSV i [opisano osobno](proba-chrome-2026-10-05.md). Kadr nie zawiera paska adresu ani strony, dlatego pełny URL, port, wersja Chrome i SHA załadowanego rozszerzenia pozostają **niepotwierdzone**. E06 nie należy do C01–C40 i nie dowodzi samodzielnie, że skan dotyczył dokładnie przygotowanego pliku HTML.

## 7. Powtórzenie 05.10.2026 — pełne kadry E07–E11

Pięć nowych obserwacji Chrome zapisano jako E07–E11 w CSV i [raporcie z powtórzenia](proby-chrome-powtorzenie-2026-10-05.md). Pełne kadry identyfikują strony i port 8000; wyniki to 25, 70, 80, 75 i 100 pkt. Nie zastępują historycznych E01–E06. Zrzut informacji Chrome pokazuje 154.0.8037.95 i restart oczekujący po aktualizacji. Użytkownik następnie przekazał wynik `git rev-parse HEAD`: `c695cf337769d77edfd3839776edc9bb132154bb`. Pole `commit` w CSV uzupełniono jako SHA lokalnego checkoutu; przeładowanie rozszerzenia przed próbami pozostaje niepotwierdzone. W E11 lista wskaźników jest ucięta, dlatego kompletne `faktyczne_id` pozostaje puste. Próby nie wchodzą do pomiaru C21–C40.

## 8. Pełny przebieg rozwojowy C01–C20

Wykonano wszystkie 20 modeli rozwojowych i zapisano [raport](zbior-rozwojowy-2026-10-05.md) oraz [surowy JSON](dowody/2026-10-05/C01-C20-development-model.json). TP=10, FP=2, FN=0, TN=8; alarm oznacza Suspicious lub Dangerous. Miary raportu odnoszą się wyłącznie do zbioru rozwojowego w modelu. Pierwsze pięć przypadków jest powtórzeniem pilota, nie dodatkową próbą. CSV zachowuje specyfikację C01–C40; wykonane wyniki modelowe przechowuje JSON. C21–C40 nie wykonano. C07 i C09 omówiono bez osłabiania reguł pod etykiety testów.

## 9. E12 — PayPal po przeładowaniu

Nowa obserwacja z 05.10 ma potwierdzenie przeładowania od użytkownika i pełną listę sześciu wskaźników, w tym brand-mismatch (+40). Suma 155 daje wynik 100/Dangerous/High po ograniczeniu. Zapisano osobny wiersz E12, zrzut i metadane w [raporcie](proby-chrome-powtorzenie-2026-10-05.md#e12--pełna-lista-paypal-po-przeładowaniu). Nie uzupełniano wstecz listy E11 ani potwierdzenia przeładowania E07–E11. Aktualny SHA i aktywna wersja Chrome niepodane. Kolejny warunek do zbadania to HTTPS.

## 10. Przygotowanie prób HTTP/HTTPS

[Procedura Windows](proby-https-instrukcja-2026-10-05.md) opisuje pary tych samych pięciu stron, metadane, oczekiwaną punktację i zapis dowodów. [Szablon CSV](https-observations-template.csv) zawiera 10 planowanych warunków P01–P10 z pustymi obserwacjami. Sprawdzenie serwera HTTPS w Linux jest osobnym sprawdzeniem infrastruktury, nie próbą Chrome. Aktualnie nie ma wyników HTTPS użytkownika; reguły i C21–C40 pozostają bez zmian.

## 11. E13 i E14 — wykonana para safe-login HTTP/HTTPS

Odczytano 80/Dangerous/High na HTTP i 25/Safe/Medium na HTTPS. Pełne listy odpowiadają oczekiwaniom; różnica 55 pkt wynika z braku dwóch wskaźników HTTP. Zapisano [raport, dowody i ograniczenia metadanych](proby-http-https-2026-10-05.md). Checkout użytkownika a19bb2c potwierdza terminal; informacja Chrome pokazuje 154.0.8037.98 64-bit bez oczekującego restartu. To jedna para prób funkcjonalnych, nie ocena C21–C40. Cztery pozostałe pary nadal do wykonania.
