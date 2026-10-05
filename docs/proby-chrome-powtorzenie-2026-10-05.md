# Powtórzenie pięciu prób w Chrome 5 października 2026 roku

## Materiał i warunki

Użytkownik przekazał pięć pełnych kadrów stron z panelem PhishGuard oraz zrzut ekranu informacji o Chrome. Materiał zapisano jako E07–E11; wcześniejszy E06 zachowuje własne ograniczenia. Nowe kadry pokazują host `localhost`, port `8000`, ścieżki plików oraz strony i panel. Wskaźnik braku HTTPS potwierdza warunek HTTP; pasek Chrome pomija zapis schematu.

Próby wykonano po instrukcji pobrania commitu `c695cf3`. Po przekazaniu zrzutów, przed kolejnym pobraniem zmian, użytkownik przesłał wynik `git rev-parse HEAD`: **`c695cf337769d77edfd3839776edc9bb132154bb`**. Potwierdza to SHA lokalnego checkoutu zgodny z instrukcją; nie potwierdza samodzielnie przeładowania rozszerzenia w Chrome. W CSV pole `commit` oznacza ten checkout. Oczekiwania odnoszą się do kodu tej wersji. Zrzut informacji Chrome pokazuje **154.0.8037.95, wersja 64-bitowa**, i komunikat o aktualizacji oczekującej na ponowne uruchomienie. Wersję zapisujemy jako widoczną na zrzucie informacji; aktywnej wersji procesu podczas każdej próby nie da się na tej podstawie jednoznacznie ustalić.

## Zaobserwowane wyniki

Wszystkie adresy w tabeli mają prefiks `http://localhost:8000/test-pages/`. Wyniki poniżej odczytano z kadrów, niezależnie od przewidywań kodu.

| ID | Plik strony | Wynik panelu | Poziom w panelu | Wskaźniki widoczne na zrzucie |
| --- | --- | --- | --- | --- |
| E07 | `oauth-inside-form.html` | 25 / Bezpieczny | Niska | Brak HTTPS (+25); brak alarmu marki. |
| E08 | `oauth-false-positive-test.html` | 70 / Podejrzany | Wysoka | Brak HTTPS (+25), pole hasła (+15), formularz HTTP (+30); brak alarmu marki. |
| E09 | `safe-login.html` | 80 / Zagrożenie | Wysoka | Brak HTTPS (+25), słowo `login` w URL (+10), pole hasła (+15), formularz HTTP (+30). |
| E10 | `external-form.html` | 75 / Zagrożenie | Wysoka | Brak HTTPS (+25), pole hasła (+15), zewnętrzny cel formularza (+35). |
| E11 | `fake-paypal-login.html` | 100 / Zagrożenie | Wysoka | Brak HTTPS (+25), słowo `login` w URL (+10), pole hasła (+15), formularz HTTP (+30), początek wskaźnika zewnętrznego celu (+35). Dolna część listy poza kadrem. |

Punkty, status i poziom we wszystkich pięciu próbach odpowiadają przewidywaniu kodu dla pokazanych adresów HTTP. W E07 i E08 pełny panel nie zawiera alarmu marki, co jest zgodne z obsługą pojedynczego przycisku Google OAuth. E09 ma nazwę pliku `safe-login`, ale warunek HTTP i lokalny cel formularza HTTP wywołują alarm: nie jest to próba legalnego formularza przez HTTPS. E10 pokazuje osobny sygnał zewnętrznego celu formularza. W E11 wynik osiąga limit 100 już przy widocznych sygnałach; nie dowodzi on osobno wykrycia marki PayPal. Przewidywany `brand-mismatch` znajduje się w niewidocznej części panelu i nie został wpisany jako obserwacja.

## Dowody

- [E07 — OAuth wewnątrz formularza](dowody/2026-10-05/E07-oauth-inside-form-full.png)
- [E08 — przycisk OAuth obok formularza](dowody/2026-10-05/E08-oauth-false-positive-full.png)
- [E09 — formularz własny na HTTP](dowody/2026-10-05/E09-safe-login-full.png)
- [E10 — zewnętrzny cel formularza](dowody/2026-10-05/E10-external-form-full.png)
- [E11 — atrapa PayPal](dowody/2026-10-05/E11-fake-paypal-login-full.png)
- [Informacja Chrome z komunikatem o restarcie](dowody/2026-10-05/chrome-version-restart-pending.png)
- [Mapa plików źródłowych i skróty SHA-256](dowody/2026-10-05/E07-E11-evidence.json)

## Zakres wniosków i brakujące metadane

Kadry dokumentują działanie panelu na pięciu lokalnych stronach i zgodność obserwowanych wartości z regułami dla tych adresów. Są to próby funkcjonalne `chrome_e2e`, odrębne od modelowego pilota C01/C07/C10/C11/C16. Nie stanowią odłożonego zbioru C21–C40 ani pomiaru czułości, precyzji czy odsetka fałszywych alarmów.

SHA lokalnego checkoutu został potwierdzony wynikiem terminala przekazanym przez użytkownika. Do powiązania go z rozszerzeniem w Chrome pozostaje potwierdzenie przeładowania rozszerzenia przed próbami. Dodatkowy zrzut E11 po przewinięciu do końca listy pozwoli sprawdzić alarm marki. Po restarcie Chrome można zanotować aktywną wersję, lecz nie przypisywać jej wstecz tym kadrom. Data 05.10.2026 jest datą przekazania dowodów; godziny wykonania poszczególnych prób nie są dostępne.
