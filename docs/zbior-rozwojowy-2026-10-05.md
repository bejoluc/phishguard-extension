# Zbiór rozwojowy C01–C20 i analiza alarmów 5 października 2026 roku

## Wykonanie

Uruchomiono `scripts/run-development-model.mjs` dla wszystkich 20 przypadków rozwojowych C01–C20. Wykonano kod detektora URL, skanera DOM i punktacji na kontrolowanym profilu SPEC_40. Kod aplikacji odpowiada commitowi `2a569486cb9ff549e7001bf6dc7019d3c6d0f083`; reguł podczas pomiaru nie zmieniano. Lokalny CSV zawierał już uzupełnione metadane checkoutu E07–E11, bez zmian pól C01–C20. Dokładne skróty SHA-256 wejść i czas przebiegu są zapisane w [surowym JSON](dowody/2026-10-05/C01-C20-development-model.json).

Pierwsze pięć przypadków pilota powtórzono w tym przebiegu; C01/C07/C10/C11/C16 nie są dodatkowymi, niezależnymi obserwacjami. Model nie otwiera Chrome i nie odwiedza domen. Wszystkie 20 wyników ma `analysisComplete: true` w ramach dostarczonego modelu; nie określa to kompletności rzeczywistego DOM w przeglądarce. Zbiór C21–C40 pozostaje niewykonany.

## Wyniki modelu

| ID | Etykieta scenariusza | Punkty | Status |
| --- | --- | ---: | --- |
| C01 | legalna | 15 | Safe |
| C02 | legalna | 25 | Safe |
| C03 | legalna | 15 | Safe |
| C04 | legalna | 25 | Safe |
| C05 | legalna | 25 | Safe |
| C06 | legalna | 25 | Safe |
| C07 | legalna | 60 | Suspicious |
| C08 | legalna | 15 | Safe |
| C09 | legalna | 80 | Dangerous |
| C10 | legalna | 0 | Safe |
| C11 | phishing | 100 | Dangerous |
| C12 | phishing | 95 | Dangerous |
| C13 | phishing | 100 | Dangerous |
| C14 | phishing | 95 | Dangerous |
| C15 | phishing | 100 | Dangerous |
| C16 | phishing | 65 | Suspicious |
| C17 | phishing | 90 | Dangerous |
| C18 | phishing | 100 | Dangerous |
| C19 | phishing | 65 | Suspicious |
| C20 | phishing | 100 | Dangerous |

## Liczniki i miary opisowe zbioru rozwojowego

Alarm oznacza `Suspicious` lub `Dangerous`; etykiety nadano w specyfikacji przed uruchomieniem. Każdy przypadek liczono raz.

| Etykieta | Alarm | Brak alarmu | Razem |
| --- | ---: | ---: | ---: |
| Phishing symulowany | TP = 10 | FN = 0 | 10 |
| Legalna symulacja | FP = 2 | TN = 8 | 10 |

Miary dla tego zbioru wynoszą: precyzja 10/12 = 83,33%, czułość 10/10 = 100%, odsetek fałszywych alarmów 2/10 = 20% i trafność 18/20 = 90%. Opisują bieżące dopasowanie na 20 konstrukcyjnie dobranych przypadkach **rozwojowych** w uproszczonym modelu. Nie są oceną na odłożonym zbiorze, wynikiem Chrome ani estymacją skuteczności w rzeczywistym ruchu internetowym. Skład 10/10 jest sztuczny, a próba mała.

## C07 i C09

**C07: 60 punktów.** Słowo login (+10), pole hasła (+15) i inny host celu formularza (+35). Scenariusz deklaruje legalne przekazanie z portal.example.test do auth.example.test. Detektor prawidłowo wykrywa różnicę hostów, lecz jego wejście nie zawiera informacji potwierdzającej upoważnienie celu. Dlatego jest to fałszywy alarm względem etykiety scenariusza, a nie dowód błędnego parsowania adresu. Automatyczne uznanie wszystkich subdomen za zaufane mogłoby ukrywać nieautoryzowany cel. Zmiana wymaga osobnej, uzasadnionej polityki zaufania; nie dodano wyjątku dla konkretnego adresu z testu ani nie obniżono progu pod ten przypadek.

**C09: 80 punktów.** HTTP (+25), login (+10), hasło (+15) i jawny cel HTTP (+30). Etykieta legalna oznacza autoryzowaną konstrukcję strony, lecz nie zapewnia ochrony transmisji. Alarm jest FP przy zadaniu rozpoznawania podszycia, jednocześnie wykrywa rzeczywiste ryzykowne cechy formularza. Usunięcie go przez osłabienie reguł HTTP byłoby nieuzasadnione. W pracy należy opisać różnicę między autoryzacją strony a bezpieczeństwem transportu.

## Decyzja i dalszy etap

Zachowano punktację i reguły. Zapisano pełny przebieg rozwojowy oraz ograniczenia C07/C09. Kolejna próba w Chrome powinna objąć kontrolowany HTTPS, aby osobno zbadać pole hasła i cel formularza bez punktów za HTTP. E07–E11 pozostają odrębnymi obserwacjami ekranowymi; SHA lokalnego checkoutu użytkownika c695cf3 został potwierdzony wynikiem terminala, a nowy pełny kadr PayPal po przeładowaniu zapisano osobno jako E12. Potwierdzenie przeładowania dotyczy E12; wcześniejsze ograniczenia metadanych pozostają jawne. Po uzgodnieniu polityki i zamrożeniu reguł można uruchomić C21–C40 i podać osobne wyniki oceny.

