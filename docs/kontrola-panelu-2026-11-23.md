# Kontrola panelu i pakiet do konsultacji

Data: 23.11.2026. Baza: a4af92045a5e004e56494c6310c29f1c8bdba8e0.

## Zmiana

Kontroler blokuje równoległe runScanner, wyłącza przycisk do zakończenia przebiegu i przywraca go także po błędzie. Przed obliczeniem i prezentacją raportu odczytuje kartę ponownie przez tabs.get. Zmiana URL, utrata aktywności, pendingUrl lub stan loading powodują odrzucenie wyniku i prośbę o ponowienie skanu. Zamknięcie karty trafia do obsługi błędu. Reguły, wagi, progi i pliki objęte zamrożeniem oceny pozostają bez zmian.

## Weryfikacja

Node.js 24.22.3: `node --test --test-isolation=none tests/*.test.mjs` — 26/26 PASS. Cztery nowe testy kontrolera uruchamiają rzeczywisty popup.js w node:vm z atrapami Chrome API: nakładanie skanowań i ponowienie, zmiana URL, nawigacja/ładowanie/nieaktywna karta oraz zamknięcie karty. To testy logiki, nie wykonanie w Chrome.

`node scripts/run-development-model.mjs --evaluation` — kontrola zamrożonych plików zakończona powodzeniem, 20 modeli, TP=8, TN=8, FP=2, FN=2. Jest to kontrola odtwarzalności, a nie nowy zbiór oceny. Surowe wyniki: docs/dowody/2026-11-23.

## Granice poprawki i próba przed prezentacją

Sprawdzenie adresu i stanu karty nie jest identyfikacją dokumentu. Nie gwarantuje wykrycia zakończonego przeładowania pod identycznym URL ani zmiany samego DOM. Brak potwierdzonej nowej próby Chrome dla tej poprawki.

Na docelowym laptopie należy przeładować rozszerzenie, wykonać pokazy 25 i 75 punktów, sprawdzić stronę wewnętrzną, szybkie ponawianie skanu oraz nawigację. Zapisać wersję Chrome, commit kodu, wynik i zrzuty. Wyników tych czynności nie wpisano jako wykonanych.

## Materiały

README zawiera uniwersalną instalację, instrukcję pokazu i precyzyjniejsze warunki reguł. Osobny protokół E29–E32 oraz cztery oryginalne kadry dołączono bez zmiany historycznych obserwacji.
