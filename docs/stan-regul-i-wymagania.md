# PhishGuard — aktualne reguły i wymagania projektu

Stan na 25.09.2026. Dokument roboczy opracowany na podstawie aktualnego kodu repozytorium oraz tytułu z dokumentu pracy. Oznaczenie „zrealizowane” potwierdza obecność funkcji w kodzie, a nie jej skuteczność wykrywania phishingu w rzeczywistym ruchu.

## 1. Zatwierdzony temat i granice projektu

> Projekt i implementacja rozszerzenia przeglądarki wspomagającego wykrywanie podejrzanych stron logowania na podstawie analizy adresów URL oraz struktury DOM

Podstawowym zadaniem PhishGuard jest lokalne wskazanie cech podejrzanej strony i pokazanie użytkownikowi wyniku analizy. Dwie główne grupy danych to **adres URL aktywnej karty** i **elementy DOM strony**, zwłaszcza związane z logowaniem i formularzami. Wynik jest oceną według przyjętych heurystyk, a nie potwierdzeniem, że witryna jest bezpieczna lub złośliwa.

Rozszerzenie jest napisane w JavaScript, używa Manifest V3 i pokazuje raport po otwarciu popupu lub po naciśnięciu „Skanuj ponownie”. W aktualnym kodzie nie ma zapytań do baz reputacyjnych, algorytmu Levenshteina ani ekranu blokującego stronę. Żadna z tych funkcji nie jest potrzebna do opisania podstawowego zakresu zatwierdzonego tematu.

## 2. Jak przebiega analiza

1. `popup.js` pobiera adres aktywnej karty, uruchamia analizę URL, a następnie prosi `content.js` o dane z DOM.
2. `src/detectors/urlDetector.js` zwraca wskaźniki adresu. `src/detectors/domDetector.js` zwraca cechy strony; skrypt nie odczytuje wartości wpisanych w pola formularzy.
3. `src/scoring/riskScoring.js` dodaje wagi wykrytych wskaźników i określa status oraz pomocniczy poziom wiarygodności analizy.
4. `src/ui/renderResults.js` wyświetla nazwę hosta, wynik, status i objaśnienia wskaźników.

W manifeście skrypty zawartości obejmują strony `http://`, `https://` i `file://` (dostęp do plików lokalnych zależy również od ustawień Chrome). Dla stron wewnętrznych przeglądarki popup wyświetla „Nie oceniono”. Jeśli skan DOM się nie powiedzie, wynik nadal uwzględnia URL i pokazuje ostrzeżenie o niepełnej analizie.

## 3. Reguły adresu URL — już zaimplementowane

Każdy rodzaj wskaźnika jest dodawany najwyżej raz dla badanego adresu.

| ID wskaźnika | Warunek w aktualnym kodzie | Punkty | Istotny szczegół |
| --- | --- | ---: | --- |
| `insecure-protocol` | Protokół różni się od `https:`. | 25 | Dotyczy m.in. HTTP i lokalnego `file://`; brak HTTPS sam w sobie nie dowodzi phishingu. |
| `ip-hostname` | Host pasuje do prostego wzorca IPv4 albo adresu IPv6 w nawiasach. | 30 | Wykorzystywane jest dopasowanie wzorca, bez osobnej oceny reputacji IP. |
| `excessive-subdomains` | Host ma co najmniej cztery segmenty rozdzielone kropkami po odrzuceniu segmentu `www`. | 15 | Liczone są segmenty całego hosta, łącznie z domeną końcową. |
| `suspicious-keywords` | Host lub ścieżka zawiera `login`, `verify`, `secure`, `account`, `update` albo `password`. | 10 | Parametry zapytania URL nie są sprawdzane; kilka słów daje łącznie 10 pkt. |
| `brand-typosquatting` | Host zawiera nazwę monitorowanej marki, ale nie jest jej oficjalnym hostem ani subdomeną, **lub** pasuje do jednego z zapisanych wzorców literówek. | 40 | Nazwa wskaźnika jest szersza niż algorytm: kod nie oblicza odległości Levenshteina. |

Nazwy marek badane w URL: Google, PayPal, Microsoft, Facebook, Netflix, Allegro i OLX. Zapisane wzorce literówek to `g00gle`, `paypa1`, `m1crosoft`, `faceb00k`, `netfl1x`, `alegro`, `0lx`. Oficjalna domena jest rozpoznawana tylko jako cały host albo jego subdomena; np. `paypal.com` i `www.paypal.com` są traktowane inaczej niż `fakepaypal.com`. Źródła: [`urlDetector.js`](../src/detectors/urlDetector.js), [`brands.js`](../src/constants/brands.js), [`urlUtils.js`](../src/utils/urlUtils.js).

## 4. Reguły DOM — już zaimplementowane

Detektor zbiera liczbę formularzy i pól `input[type="password"]`, sprawdza `action` każdego formularza oraz szuka nazw marek w kontekście logowania. Pole `method` jest dołączane do danych formularza, lecz obecnie nie zmienia punktacji.

| ID wskaźnika wyniku | Warunek w aktualnym kodzie | Punkty | Istotny szczegół |
| --- | --- | ---: | --- |
| `password-field-present` | Strona ma co najmniej jedno pole hasła. | 15 | Jest to cecha logowania, nie dowód oszustwa. |
| `insecure-form-action` | Co najmniej jeden niepusty adres `action` formularza po rozwiązaniu względem URL strony wskazuje na HTTP. | 30 | Sprawdzane są **wszystkie** formularze, również bez pola hasła; pusty `action` nie trafia na tę listę. |
| `external-form-action` | Co najmniej jeden formularz ma `action` z nazwą hosta różną od hosta strony. | 35 | Porównanie dotyczy pełnej nazwy hosta: legalna subdomena lub zewnętrzny dostawca logowania również może zostać oznaczony. |
| `brand-mismatch` | Detektor znalazł nazwę monitorowanej marki w kontekście logowania, a aktualny host nie należy do jej oficjalnych domen. | 40 | Sygnał jest naliczany raz, nawet gdy rozpoznano więcej marek. |

Kontekst logowania oznacza formularz z polem hasła lub polem, którego `name`, `id` albo `placeholder` zawiera słowo związane z logowaniem, bądź obecność pola hasła gdziekolwiek na stronie. Jeśli taki kontekst istnieje, detektor bada tytuł strony, nagłówki przy znalezionych formularzach logowania, etykiety, legendy, placeholdery, tekst tych formularzy oraz przyciski uwierzytelniania. Nazwa marki musi wystąpić co najmniej dwa razy w zebranym tekście, a host nie może być oficjalną domeną tej marki. Detektor obejmuje dziewięć marek: siedem wymienionych przy URL oraz Apple i Amazon. Nie analizuje całej treści strony jako jednego bloku.

Źródła: [`domDetector.js`](../src/detectors/domDetector.js), [`riskScoring.js`](../src/scoring/riskScoring.js). Detektor nie zwraca osobnej etykiety „to jest strona logowania”; pole hasła i rozpoznanie formularza logowania służą dziś do wybranych reguł.

## 5. Wynik i komunikaty — już zaimplementowane

Punkty z wykrytych reguł są sumowane i ograniczane do 100. Przy kompletnej analizie wynik 0–30 ma status „Bezpieczny”, 31–70 „Podejrzany”, a 71–100 „Zagrożenie”. Gdy DOM jest niedostępny, URL nadal może dać status „Podejrzany” albo „Zagrożenie”; przy wyniku 0–30 zamiast „Bezpieczny” pojawia się „Niepełna”. Strony wewnętrzne przeglądarki nie dostają punktacji. Przed zakończeniem analizy widoczny jest stan „Skanowanie”.

Osobny poziom „Niska/Średnia/Wysoka” jest wyliczany z liczby i rodzaju wykrytych wskaźników (plus premia za pole hasła połączone z anomalią formularza); gdy brakuje DOM, pokazuje „Niepełna”. To **wewnętrzna miara siły sygnałów**, nie zmierzone prawdopodobieństwo trafności ani statystyczna pewność. Skuteczność klasyfikacji nie została jeszcze wyznaczona na oznaczonym zbiorze przypadków.

## 6. Wymagania funkcjonalne wynikające z tematu

Status określa obecny stan implementacji; „do sprawdzenia” oznacza brak wystarczających wyników testów, a nie brak kodu.

| ID | Wymaganie i kryterium sprawdzenia | Stan na 25.09.2026 |
| --- | --- | --- |
| RF-01 | Odczyt aktywnej karty i przedstawienie jej hosta w popupie. | Zrealizowane w `popup.js` i rendererze. |
| RF-02 | Wykrycie i objaśnienie cech ryzyka w URL zgodnie z jawnie określonymi regułami. | Zrealizowane; zakres reguł w sekcji 3. |
| RF-03 | Odczyt cech DOM istotnych dla logowania i formularzy bez pobierania wartości pól. | Zrealizowane w kodzie; potrzebne szersze testy zachowania w Chrome. |
| RF-04 | Połączenie wskaźników URL i DOM w powtarzalną punktację 0–100 i status. | Zrealizowane; wagi i progi w sekcjach 3–5. |
| RF-05 | Pokazanie użytkownikowi wyniku, statusu, wykrytych cech i ich objaśnień. | Zrealizowane w popupie. |
| RF-06 | Pokazanie stanu skanowania oraz jawne oznaczenie braku danych DOM lub strony niedostępnej do analizy. | Zrealizowane; część zachowań ma testy automatyczne. |
| RF-07 | Ponowienie skanu przyciskiem bez przeładowywania rozszerzenia. | Zrealizowane w `popup.js`. |
| RF-08 | Ocena na oznaczonych scenariuszach legalnych i podejrzanych stron logowania, z zapisem błędnych alarmów i przeoczeń. | Do wykonania; obecne 8 testów automatycznych i 5 stron demonstracyjnych nie mierzą jeszcze skuteczności. |

## 7. Wymagania niefunkcjonalne i weryfikacja

| ID | Wymaganie | Stan i sposób weryfikacji |
| --- | --- | --- |
| RNF-01 | Prywatność: brak przesyłania analizowanych adresów i danych formularzy do usługi zewnętrznej; bez odczytu wartości wpisywanych przez użytkownika. | Zgodne z aktualnym kodem: brak integracji sieciowej, analiza lokalna, zbierane są cechy DOM. Warto powtórzyć przegląd kodu przed końcową wersją pracy. |
| RNF-02 | Odporność na ograniczenia przeglądarki: gdy DOM nie da się zbadać, aplikacja nie sugeruje kompletnej oceny. | Zrealizowane; potrzebny również ręczny test kart, na których skrypt nie działa. |
| RNF-03 | Powtarzalność: dla tego samego URL i tych samych danych DOM wynik oraz lista reguł mają być identyczne. | Wynika ze stałych reguł; do sprawdzenia na szerszym zestawie przypadków. |
| RNF-04 | Czytelność: wynik ma odróżniać obserwację heurystyczną od gwarancji bezpieczeństwa. | Częściowo: interfejs pokazuje wskaźniki i stan niepełny, lecz etykieta „Bezpieczny” wymaga sprawdzenia na scenariuszach oraz objaśnienia w pracy. |
| RNF-05 | Mierzalny czas odpowiedzi na stronach testowych. | Nie zmierzono. Przed badaniem ustalić warunki Chrome i liczbę prób; zapisać medianę i 95. percentyl czasu od rozpoczęcia skanu do wyniku. |
| RNF-06 | Kod z rozdzieleniem detekcji URL, detekcji DOM, punktacji i interfejsu. | Zrealizowane strukturalnie; 8 obecnych testów nie stanowi pełnego pokrycia przypadków. |

## 8. Ustalenia do następnego etapu

Format przypadków i sposób oddzielenia danych rozwojowych od pomiaru opisuje [protokół testów](protokol-testow.md). Przygotowano również [40 scenariuszy modelowych](scenariusze-40.md); nadal wymagają stron testowych i pomiaru.

- Przygotować oznaczone scenariusze i przed pomiarem oddzielić przypadki używane do poprawek od przypadków oceny końcowej. Przypadek testowy może łączyć adres i zestaw cech DOM; nie musi oznaczać osobnego pliku HTML.
- Sprawdzić fałszywe alarmy dla legalnych formularzy spoza logowania, zewnętrznych dostawców uwierzytelniania i różnych subdomen tej samej organizacji.
- Sprawdzić, czy dwa zliczone wystąpienia marki rzeczywiście pochodzą z różnych fragmentów strony: ten sam nagłówek może trafić do tekstu analizy osobno oraz jako część tekstu formularza.
- Dodać testy graniczne słów w URL, marek, niedostępnego DOM i protokołu stron demonstracyjnych. Uruchomienie strony przez `http://localhost` samo dodaje 25 pkt za HTTP.
- Ustalić, jak w pracy nazwać wynik „Bezpieczny”, by jasno opisać, że jest to brak wykrytych cech w badanym zakresie.
- Traktować testy na stronach symulowanych jako ocenę prototypu w kontrolowanych warunkach; nie wyciągać z nich wniosków o skuteczności wobec wszystkich prawdziwych kampanii phishingowych.
