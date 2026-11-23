# PhishGuard — próby uzupełniające z 27 października 2026

## Środowisko i zakres dowodów

- Chrome: 156.0.8078.48, oficjalna wersja 64-bit, Stable — informacja przekazana przez wykonującego próby.
- System: Windows 11 Version 26H2, Build 26300.9711 — informacja przekazana przez wykonującego próby.
- Ścieżka rozszerzenia widoczna na zrzucie: ~\StudioProjects\phishguard-extension.
- Wersja manifestu widoczna na karcie: 1.0.0. Nie identyfikuje jednoznacznie wersji kodu.
- Ostatni przekazany lokalny HEAD: 71f16e76f68499d02215be3df8ef8006f3a69b79. Status Git nie wykazywał zmian śledzonych plików; były nieśledzone materiały dokumentacyjne.
- Przeładowanie rozszerzenia przed E29: wykonujący potwierdził w rozmowie („tak, możemy lecieć dalej”) w odpowiedzi na bezpośrednie pytanie o przeładowanie przed skanem. Nie utożsamiać lokalnego HEAD z niezależnie potwierdzoną wersją załadowaną w Chrome.
- Daty dotyczą otrzymania materiałów; dokładnego czasu wykonania nie ustalono.

## E29 — stan przed kontrolowaną symulacją niedostępności DOM

Adres procedury: http://localhost:8000/test-pages/oauth-inside-form.html.
Zrzut pokazuje localhost:8000/test-pages/oauth-inside-form.html; przeglądarka ukrywa schemat. HTTP wynika z procedury i widocznego wskaźnika braku HTTPS.

| Element | Oczekiwane | Odczytane ze zrzutu |
| --- | --- | --- |
| Punkty | 25/100 | 25/100 |
| Status | Niskie ryzyko | Niskie ryzyko |
| Siła wskaźników | Niska | Niska |
| Wskaźniki | Brak szyfrowania HTTPS, +25 | Brak szyfrowania HTTPS, +25 |
| Ostrzeżenie o braku DOM | Nieobecne | Nieobecne |

Widoczne są strona laboratoryjna, przycisk „Zaloguj przez Google”, cały panel, nota o heurystyce i przycisk „Skanuj ponownie”. Brak widocznego alarmu niezgodności marki. Obserwacja panelu odpowiada przewidywaniu; nie jest pomiarem skuteczności wykrywania phishingu ani dowodem poprawności wszystkich ścieżek analizy DOM.

Dowód główny: image(20261027-132305).png, załącznik libfile_d9cbf7449e3c8191bfe5f240b2d93d66. Oryginał pozostaje załącznikiem rozmowy. Wcześniejszy kadr image(20261027-132118).png nie obejmuje paska adresu i ma charakter pomocniczy. Nie są to dwie niezależne próby.

## Dalszy etap

E30: wykonana kontrolowana symulacja niedostępności DOM — wynik opisany poniżej.
E31: otrzymano zrzut przywróconego stanu — wynik opisany poniżej.
Nowe próby nie zastępują historycznych E24–E27. Dokument nie zmienia repozytorium ani pracy dyplomowej; stanowi osobny zapis dowodowy do późniejszego włączenia.

## E30 — kontrolowana niedostępność DOM

Dowód: image(20261027-132920).png, załącznik libfile_f72ef361ff888191811e0f8e884932de.
Na kadrze widoczny jest adres localhost:8000/test-pages/oauth-inside-form.html, panel i konsola popup.html. Wynik location.protocol to chrome-extension:. Konsola pokazuje zastąpienie chrome.tabs.sendMessage i chrome.scripting.executeScript funkcjami odrzucającymi żądania oraz wywołanie przycisku scan-btn.

Odczyt: 25/100, status „Niepełna”, siła wskaźników „Niepełna”. Widoczny komunikat: „Nie udało się zbadać struktury strony. Wynik obejmuje tylko adres URL i może być zaniżony.” Jedyny punktowany wskaźnik: brak szyfrowania HTTPS (+25). Konsola pokazuje zamierzony błąd „TEST: brak wstrzykniecia”.

Ocena: zachowanie w tym warunku odpowiada przewidywaniu. Zachowano punktację URL i jawnie oznaczono niepełność; nie pokazano statusu „Niskie ryzyko”. To kontrolowana symulacja błędu w kontekście panelu, nie rzeczywista blokada Chrome. Nie zmieniano plików aplikacji w ramach podanej procedury. W chwili zapisu E30 oczekiwano na dowód przywrócenia działania; późniejszą obserwację zapisano jako E31.

SHA-256 oryginalnego zrzutu E30: `7c679b5b97ecb34ad725f26241896be6ade38a6bb03687eb030a7c65fb536e6a`.

## E31 — stan po zakończeniu symulacji

Dowód: image(20261027-133102).png, załącznik libfile_8e48abd09e9c81918f6ef7bc4e1e18dd. Otrzymany po instrukcji zamknięcia DevTools i panelu oraz ponownego otwarcia i skanowania, wraz z odpowiedzią wykonującego „jest git”. Kadr potwierdza stan końcowy, nie rejestruje samej sekwencji zamykania i otwierania.

Widoczny adres: localhost:8000/test-pages/oauth-inside-form.html. Odczyt: 25/100, „Niskie ryzyko”, siła „Niska”, wyłącznie brak szyfrowania HTTPS (+25). Pełny panel nie pokazuje ostrzeżenia o braku DOM. DevTools nie są widoczne. Wynik odpowiada stanowi bazowemu E29.

Sekwencja obserwacji: E29 — 25/Niskie ryzyko/Niska; E30 — 25/Niepełna/Niepełna z ostrzeżeniem; E31 — 25/Niskie ryzyko/Niska bez ostrzeżenia. Potwierdza to oczekiwane stany panelu w jednej kontrolowanej próbie awarii i powrotu. Nie jest pomiarem trafności phishingu, wydajności ani ogólnej niezawodności.

SHA-256 oryginalnego zrzutu E31: `c408b91cd8fe1da105864a7db702980d3315f15a379461e4c4311a51f3dfc2a6`.


## E32 — zewnętrzny cel formularza, kontrola poprawionych komunikatów

Dowód: image(20261027-134514).png, załącznik libfile_de0eb6f135b48191860cf179b0968ef1. Data otrzymania: 27 października 2026.
Adres widoczny: localhost:8000/test-pages/external-form.html; schemat HTTP wynika z procedury oraz wskaźnika braku HTTPS.

Odczyt: 75/100, status „Zagrożenie”, siła wskaźników „Wysoka”. Widoczne trzy wskaźniki: brak szyfrowania HTTPS (+25), obecność pola hasła (+15), zewnętrzny cel formularza (+35). Suma wynosi 75 i odpowiada oczekiwaniu.

Panel zawiera notę o heurystycznym charakterze oceny. Opis zewnętrznego celu mówi o atrybucie action wskazującym inny host, dopuszcza legalną integrację i stwierdza, że nie potwierdzono wysłania danych. Opis pola hasła nie utożsamia jego obecności z phishingiem. Widoczna jest cała treść trzech wskaźników; przycisk ponownego skanowania jest poza kadrem. Kadr wystarcza do potwierdzenia wyniku i komunikatów, ale nie rejestruje kliknięcia przycisku ani ruchu sieciowego.

Ocena: wynik i widoczne komunikaty zgodne z oczekiwaniem. E32 powtarza scenariusz punktowy E15, lecz dokumentuje poprawione opisy interfejsu. Jest nową obserwacją uzupełniającą historyczny zapis E27, nie zastępuje jego daty ani dowodu. Nie zwiększa liczebności zbioru ewaluacyjnego C21–C40.

SHA-256 oryginalnego zrzutu E32: `94466e79f97e99b2c9e78a3faeef56a311e2a3426344af128717f84c7b45c324`.

## Wniosek z przeglądu zrzutów

E15–E22 zachować jako historyczne pary HTTP/HTTPS. Dwa kadry E28 są uzupełniającymi widokami jednej próby. Zrzut git-HEAD jest metadanymi repozytorium, nie dowodem wersji kodu załadowanej w przeglądarce. E29–E31 dokumentują jedną sekwencję stanu bazowego, wymuszonej awarii i powrotu. E32 zamyka bieżące uzupełnianie zrzutów dotyczących poprawionych komunikatów zewnętrznego celu formularza. Nie oznacza to zakończenia wszystkich prac nad dokumentacją dyplomową.


## Dostęp do załączników w repozytorium

Kopia protokołu wersji 4 dołączona 23.11.2026. Oryginalny opis prób pozostawiono bez zmian. Pliki E29.png–E32.png w docs/dowody/2026-10-27 zawierają oryginalne kadry, bez edycji obrazu. Dołączenie materiałów nie oznacza ponownego wykonania prób.
