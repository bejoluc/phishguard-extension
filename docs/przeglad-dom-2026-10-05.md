# Testy DOM, przegląd usterek i poprawki — 05.10.2026

Ten zapis realizuje zaległe punkty harmonogramu z 01.10 (testy DOM), 03.10 (kontrolowane uruchomienie i lista usterek) oraz 05.10 (poprawki). Wyniki odtwarzania usterek pochodzą z uruchomienia kodu w Node.js z kontrolowanymi obiektami DOM. Późniejszy zrzut panelu E06 opisano osobno i oddzielono od testów Node. Poprzednie pięć zrzutów Chrome z 25.09 dotyczy wcześniejszej wersji kodu.

## Środowisko i metoda

- Środowisko: Node.js 24.19.0, kod repozytorium PhishGuard. Polecenie: `node --test --test-isolation=none tests/*.test.mjs`.
- Siedem nowych testów w [`tests/dom-detector.test.mjs`](../tests/dom-detector.test.mjs) uruchamia rzeczywisty skrypt [`domDetector.js`](../src/detectors/domDetector.js) w kontekście VM z kontrolowanymi obiektami dokumentu, następnie przekazuje telemetrię do rzeczywistych modułów analizy URL i punktacji.
- Sprawdzono pole hasła bez odczytu wpisanej wartości, lokalny formularz, różne cele formularza HTTP/HTTPS, pojedyncze i podwójne wzmianki o marce, stopkę poza obszarem logowania i host oficjalny. Nie wysyłano formularzy ani nie odwiedzano modelowych domen `.test`.
- Przed poprawką **trzy nowe testy nie przechodziły**; po poprawce cały zestaw daje **22 zaliczone, 0 niezaliczonych**. Te testy badają kod detektora i połączenie z punktacją w kontrolowanym modelu DOM. Nie dowodzą działania nowej wersji w Chrome ani skuteczności klasyfikacji na 40 scenariuszach.

## Rejestr potwierdzonych usterek

| ID | Scenariusz i stan przed poprawką | Przyczyna | Zmiana i weryfikacja |
| --- | --- | --- | --- |
| DOM-01 | Jeden przycisk „Zaloguj przez Google” **wewnątrz** formularza był zgłaszany jako marka Google, mimo progu dwóch wzmianek. | Tekst przycisku trafiał do `form.textContent`, a potem był dodawany ponownie z listy przycisków. | Tekst przycisków wewnątrz formularza jest liczony tylko jako tekst formularza. Test pojedynczej wzmianki przechodzi. |
| DOM-02 | Jeden nagłówek „PayPal” **wewnątrz** formularza dawał wskaźnik niezgodności marki. | Nagłówek był dodawany raz jako nagłówek i ponownie w tekście formularza. | Nagłówki wewnętrzne liczone są tylko raz; pobliskie nagłówki zewnętrzne można dołączyć raz na element. Test jednej wzmianki i test dwóch niezależnych wzmianek przechodzą. |
| DOM-03 | Dwie wzmianki „PayPalify” były uznawane za markę PayPal. | Alternatywna gałąź wyrażenia regularnego dopasowywała nazwę marki bez granicy słowa. | Wymagane jest całe słowo. Test dłuższej nazwy przechodzi; test rzeczywistych wzmianek PayPal nadal przechodzi. |

Przy odczycie tekstu formularza kolejne węzły tekstowe są rozdzielane spacją. Dzięki temu dwa sąsiadujące elementy, nawet bez białych znaków w HTML, nie zlewają się w jedno słowo. Zmiana dotyczy tylko analizy marki w DOM; punktacja, progi statusów i heurystyki URL pozostały takie same.

## Nowa strona do próby przeglądarkowej

[`test-pages/oauth-inside-form.html`](../test-pages/oauth-inside-form.html) odtwarza DOM-01 na lokalnej stronie z formularzem e-mail i pojedynczym przyciskiem OAuth. Dla dokładnego adresu `http://localhost:8000/test-pages/oauth-inside-form.html` poprawiony kod **przewiduje** tylko `insecure-protocol`, 25/100, status `Safe` i wiarygodność `Low`. Formularz ma cel `https://localhost/session`, aby jego docelowy protokół HTTP nie wprowadzał dodatkowego wskaźnika. To przewidywanie wyliczone z kodu, **nie wynik zaobserwowany w Chrome**.

Nowej próby Chrome nie wykonano w tym środowisku: dostępna przeglądarka odrzuciła otwarcie lokalnego pliku `file://` ze względu na politykę dozwolonych adresów. Później użytkownik przesłał w odpowiedzi na instrukcję próby [zrzut panelu E06](proba-chrome-2026-10-05.md). Widoczne 25/100, „Bezpieczny”, „Niska” i jedynie brak HTTPS zgadzają się z przewidywaniem. Kadr pokazuje host `localhost`, ale nie pasek adresu i stronę; konkretnego pliku HTML, portu, wersji Chrome i SHA załadowanego rozszerzenia nie potwierdzono. W zapisie próby wartości obserwowane oddzielono od oczekiwanych. Nie wpisywać prawdziwych danych i nie wysyłać formularza.

## Otwarte ograniczenia

- Pięć demonstracji z 25.09 nie zostało ponowione po poprawce; nie przypisujemy im wyników nowej wersji.
- Istniejąca reguła `insecure-form-action` obejmuje każdy formularz, także niezwiązany z logowaniem; `external-form-action` porównuje pełne hosty i może oznaczyć uprawnioną subdomenę lub zewnętrznego dostawcę logowania. W tej sesji tych reguł nie zmieniano.
- Scenariusze C01–C40 nadal mają status planowanych przypadków; nie ma nowych wyników do macierzy pomyłek ani pomiaru czasu skanu.
