# Przegląd komunikatów panelu PhishGuard

8 października wykonano przegląd tekstów względem implementacji URL i DOM. Przed zmianami użytkownik przekazał checkout 93c640f4a7a4f2236ea250e227002ea4f2ac2488. Nie opublikowano kadru terminala; poniżej opisano zmiany kodu, nie nowe obserwacje Chrome.

| Dotychczasowy komunikat | Obecny komunikat lub zmiana | Uzasadnienie |
| --- | --- | --- |
| Bezpieczny | Niskie ryzyko | Niska suma reguł nie dowodzi bezpieczeństwa strony. Wewnętrzna kategoria nadal Safe. |
| Wiarygodność analizy | Siła wskaźników | Poziom zależy od wag sygnałów, nie od zmierzonej trafności. |
| Brak wyjaśnienia przy wyniku | Stała nota o heurystyce, braku gwarancji i znaczeniu siły wskaźników | Użytkownik otrzymuje kontekst także przy zerowym wyniku. |
| Wysyłanie danych na obcy serwer | Zewnętrzny cel formularza | Skaner porównuje hosty action; nie obserwuje wysłania danych ani autoryzacji celu. |
| Niezabezpieczony formularz (HTTP) | Cel formularza przez HTTP | Odczyt dotyczy deklarowanego celu, nie wykonanej transmisji. |
| Pole hasła oznacza uwierzytelnianie | Pole może służyć do logowania; samo nie potwierdza phishingu | Struktura DOM nie dowodzi wykonania procesu logowania. |
| Cztery poziomy subdomen | Co najmniej cztery segmenty hosta bez www | Opis odpowiada faktycznemu liczeniu segmentów, bez parsowania domeny rejestrowalnej. |
| Słowa w adresie jako podejrzenie | Jawnie host lub ścieżka i informacja, że słowa występują także legalnie | Detektor nie bada treści, query ani fragmentu. |

Poprawiono też literówkę „Bląd”. Wagi, warunki aktywacji, identyfikatory wskaźników, progi, poziomy i stany niepełności pozostały takie same. E01–E25 zachowują historyczne etykiety widoczne w przekazanych kadrach; nie zmieniono ich zapisów.

## Weryfikacja wykonana

`node --test --test-isolation=none tests/*.test.mjs`: 22 zaliczone, 0 niezaliczonych. Zaktualizowano istniejące oczekiwanie etykiety Safe w teście prezentacji. `git diff --check` zakończył się bez błędów. To weryfikacja automatyczna i przegląd kodu. Nie otrzymano nowych zrzutów po przeładowaniu rozszerzenia. Lokalna próba podglądu przez Playwright nie uruchomiła się z powodu braku pliku wykonywalnego Chromium; nie uznano układu za zweryfikowany w przeglądarce.

## Kontrola użytkownika po pobraniu zmian

1. `git pull --ff-only`, `git rev-parse HEAD`; przeładuj PhishGuard w chrome://extensions i odśwież stronę laboratoryjną.
2. `http://localhost:8000/test-pages/oauth-inside-form.html`: oczekiwane 25/Niskie ryzyko/Niska. Widoczne Siła wskaźników i nota heurystyczna; brak alarmu marki.
3. `http://localhost:8000/test-pages/external-form.html`: oczekiwane 75/Zagrożenie/Wysoka. Zewnętrzny cel formularza ma opisywać action, bez twierdzenia o wykonanej wysyłce.
4. `https://localhost:8443/test-pages/fake-paypal-login.html`: oczekiwane 100/Zagrożenie/Wysoka, z opisami celu HTTP i zewnętrznego hosta. Zachowaj zrzuty pełnych list; sprawdź zawijanie tekstów i brak poziomego ucięcia panelu.

Te wartości są oczekiwaniami z niezmienionej punktacji, nie nowymi wynikami Chrome. Nie uruchamiano C21–C40. Zamrożenie wersji do ich oceny nastąpi po kontroli interfejsu.

## Otrzymana kontrola E26

Po instrukcji pobrania zmian i przeładowania otrzymano kadr oauth-inside-form na localhost:8000. Panel pokazuje 25/100, Niskie ryzyko i Niska. Widoczne są nagłówek Siła wskaźników, pełna nota heurystyczna, zmienione wyjaśnienie braku HTTPS i przycisk ponownego skanowania. Występuje tylko insecure-protocol; nie ma alarmu marki ani ostrzeżenia o niedostępności DOM. Odczyt odpowiada przewidywaniom z c717d8e.

W tym kadrze tekst zawija się w granicach kart, panel jest widoczny w całości, bez widocznego nakładania i poziomego ucięcia. Potwierdzono prezentację jednego warunku niskiej punktacji. Nie otrzymano nowego odczytu SHA po zmianie, niezależnego załadowanego SHA ani wyraźnego potwierdzenia czynności przeładowania; nowe etykiety potwierdzają wyświetlenie zaktualizowanego interfejsu. Nie przeniesiono tego wyniku na inne strony, skalowania i stany panelu. Kolejne kontrole: external-form HTTP i fake-paypal-login HTTPS.

[Transkrypcja E26](dowody/2026-10-08/E26-low-risk-copy-evidence.json) zawiera odczyt bez całego kadru i prywatnych identyfikatorów. Historyczny E25 zachowuje etykietę Bezpieczny. Kod aplikacji w tej kontroli dokumentacyjnej nie został zmieniony.

## Otrzymana kontrola E27

Zrzut external-form na localhost:8000 pokazuje 75/100, Zagrożenie i siłę Wysoka. Pełna lista zawiera brak HTTPS (25), pole hasła (15) i zewnętrzny cel formularza (35). Opis celu odnosi się do action i innego hosta oraz zaznacza możliwość legalnej integracji i brak potwierdzenia wysłania danych. Nowy opis pola hasła również jest widoczny. Wynik odpowiada oczekiwaniom; nie występuje wskaźnik celu HTTP.

Panel jest przewinięty: nagłówek aplikacji znajduje się powyżej widocznego obszaru, lecz wynik, nota, wszystkie trzy wskaźniki i przycisk są czytelne. Nie widać poziomego ucięcia. Nie jest to dowód rzeczywistej transmisji. Nowego SHA i wersji Chrome nie przekazano. [Transkrypcja E27](dowody/2026-10-08/E27-external-form-copy-evidence.json). Pozostała kontrola celu HTTP na atrapie PayPal przez HTTPS.

Sposób zapisywania plików i nazwa tego zrzutu: [organizacja materiałów](organizacja-materialow-pracy.md).

## Otrzymana kontrola E28 i zamknięcie przeglądu

Dwa kadry fake-paypal-login na localhost:8443 pokazują 100/100, Zagrożenie i siłę Wysoka. Lista zawiera suspicious-keywords (10), password-field-present (15), insecure-form-action (30), external-form-action (35) i brand-mismatch (40). Suma 130 jest ograniczona do 100. Stronę otwarto według procedury HTTPS; cel action pozostaje HTTP. Nie występuje insecure-protocol. Widoczne nowe opisy, nota heurystyczna oraz pełna lista po przewinięciu nie mają widocznego poziomego ucięcia. Nie obserwowano wysłania danych.

[Transkrypcja E28](dowody/2026-10-08/E28-paypal-https-copy-evidence.json). Po próbie użytkownik przekazał checkout eae3011d596cb74100d4eb39dc834cca751d9614; nie jest to dowód SHA załadowanego rozszerzenia. E26–E28 zamykają trzy zaplanowane kontrole prezentacji. Nie obejmują wszystkich rozdzielczości ani stanów interfejsu. C21–C40 pozostają niewykonane.
