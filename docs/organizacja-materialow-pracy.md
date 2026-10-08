# Organizacja materiałów pracy PhishGuard

## Foldery na komputerze autora

Proponowany katalog główny poza repozytorium: `Dokumenty/PhishGuard-praca/`.

| Podfolder | Zawartość |
| --- | --- |
| 01-praca | Bieżący DOCX, np. Praca_inzynierska_PhishGuard_AKTUALNA.docx |
| 01-praca/archiwum | Poprzednie wersje DOCX; przed zastąpieniem kopia z datą i godziną |
| 02-dowody/2026-10-08 | Oryginalne zrzuty prób z danego dnia |
| 03-literatura | Pobrane publikacje i materiały źródłowe |
| 04-prezentacje | Prezentacje na zajęcia i obronę |

Kod i dokumentację techniczną pobiera się przez Git. Prywatnych pełnych kadrów przeglądarki ani roboczych kopii Worda nie trzeba umieszczać w publicznym repozytorium. Raporty w docs zawierają powiązane identyfikatory obserwacji.

## Nazwy nowych dowodów

Format: `E##_RRRR-MM-DD_scenariusz_warunek_01.png`. Kolejne kadry tej samej próby mają końcówki 02, 03; nie tworzą nowych prób. Data oznacza datę wykonania znaną autorowi. Przy niepewnej dacie nie należy jej zgadywać na podstawie daty wysłania do czatu.

| Dowód | Nazwa pliku |
| --- | --- |
| E24 symulowany brak DOM | E24_2026-10-08_oauth-inside-form_HTTP_brak-DOM_01.png |
| E25 kontrola powrotu | E25_2026-10-08_oauth-inside-form_HTTP_powrot-DOM_01.png |
| E26 nowe etykiety niskiego ryzyka | E26_2026-10-08_oauth-inside-form_HTTP_nowe-komunikaty_01.png |
| E27 zewnętrzny cel, nowe komunikaty | E27_2026-10-08_external-form_HTTP_nowe-komunikaty_01.png |
| Następna planowana próba E28, jeśli wykonana 08.10 | E28_2026-10-08_fake-paypal-login_HTTPS_nowe-komunikaty_01.png |

E28 jest nazwą zarezerwowaną dla następnej próby, nie wynikiem wykonanego badania. Przy wykonaniu innego dnia należy użyć rzeczywistej daty.

## Materiały już zapisane

Na przekazanym widoku folderu są zrzuty safe-login HTTP/HTTPS, external-form HTTP/HTTPS, atrapy PayPal HTTP/HTTPS, dwóch wariantów przycisku Google, strony wewnętrznej i braku DOM. Ich dotychczasowe nazwy można zachować. Nie należy na podstawie samej miniatury przypisywać im nowych numerów E: ta sama strona była badana kilka razy.

Nazwy external-form mają datę 05.10, a porównanie E15/E16 udokumentowano 08.10 jako datę otrzymania dowodów. Sam widok folderu nie rozstrzyga daty wykonania ani tożsamości plików; przed zmianą dat sprawdzić oryginały. Stronę chrome://settings warto oznaczać warunkiem `chrome-settings`, nie HTTP. Dwa warianty Google opisują pliki `oauth-inside-form` i `oauth-false-positive-test`; stosować ich nazwy po sprawdzeniu paska adresu.

Nowe wersje Worda: bieżący plik w 01-praca, poprzednia kopia w archiwum, np. `Praca_inzynierska_PhishGuard_2026-10-08_1612.docx`. Data i godzina w archiwum odnoszą się do zapisania kopii, nie do daty testu. Zachować oryginalne kadry; ewentualne wersje przycięte do pracy oznaczać osobnym sufiksem `_do-pracy`.
