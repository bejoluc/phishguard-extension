# Metodyka badań PhishGuard i pilot pięciu przypadków rozwojowych

**Data wykonania: 05.10.2026.** Jest to wcześniejsze wykonanie części punktu harmonogramu przewidzianego na 07.10, bez przypisywania prób do przyszłej daty. Badany kod aplikacji odpowiada commitowi `a84635d` (`main` przed dodaniem skryptu pomiarowego); skrypt i surowy zapis przebiegu znajdują się odpowiednio w [`scripts/run-development-model.mjs`](../scripts/run-development-model.mjs) oraz [`C01-C07-C10-C11-C16-model.json`](dowody/2026-10-05/C01-C07-C10-C11-C16-model.json). Plik JSON zawiera datę i godzinę przebiegu, wersję Node oraz skróty SHA-256 plików wejściowych. Wykonano na Node.js v24.19.0, Linux; Chrome nie uczestniczył w tych pięciu próbach.

## Cel i projekt badania

Badanie sprawdza, jaki wynik dają zaimplementowane reguły URL i DOM dla wcześniej opisanych, kontrolowanych scenariuszy logowania. Etykieta referencyjna wynika z konstrukcji scenariusza (autoryzowane albo nieuprawnione podszywanie), a nie z wyniku rozszerzenia. Wynikiem programu są identyfikatory wskaźników, suma punktów 0–100, status i wewnętrzny poziom wiarygodności sygnałów. Poziom ten nie jest statystyczną pewnością rozpoznania.

Zestaw [C01–C40](scenariusze-40.md) ustalono 25.09: 20 legalnych symulacji i 20 symulowanych stron phishingowych. C01–C20 tworzą zbiór rozwojowy (10+10), C21–C40 odłożony zbiór oceny (10+10). Zbioru oceny nie uruchamiamy ani nie wykorzystujemy do zmian reguł przed zamrożeniem kodu. Dla pełnych, wykonanych przypadków *jednego rodzaju* przewidziano macierz TP/FP/FN/TN: alertem jest `Suspicious` lub `Dangerous`, brak alertu to `Safe`; analizę `Incomplete` raportujemy osobno. Z liczników i mianowników można obliczyć precyzję `TP/(TP+FP)`, czułość `TP/(TP+FN)` i odsetek fałszywych alarmów `FP/(FP+TN)`. Nie łączymy wyników modelu DOM z wynikami rozszerzenia w Chrome w jednej macierzy.

## Odwzorowanie scenariuszy w pilocie

Skrypt czyta pięć wierszy `SPEC_40` ze zbioru `rozwoj` bez zmiany ich etykiet ani wejść. Konstruuje kontrolowany obiekt `document`: tytuł, pojedynczy formularz POST, nagłówek, pole e-mail oraz pole hasła albo przycisk OAuth poza formularzem, a także dosłowny atrybut `action` podany w CSV. `window.location` pochodzi z pola `wejscie`. Uruchamiany jest **rzeczywisty skrypt** `src/detectors/domDetector.js` w Node `vm`, a wynik trafia do rzeczywistych modułów `UrlHeuristicsEngine.analyze()` i `RiskCalculator.calculate()`. Model wspiera selektory i węzły tekstowe użyte przez skaner; nie odwzorowuje pełnego DOM przeglądarki.

Adresy oficjalnych serwisów oraz `*.test` są tu wyłącznie wartościami obiektu `URL`: skrypt nie odwiedza tych witryn, nie nadpisuje DNS, nie wysyła formularzy i nie pobiera danych użytkownika. Uruchomienie można powtórzyć poleceniem:

```bash
node scripts/run-development-model.mjs C01 C07 C10 C11 C16
```

Surowy JSON przechowuje także `urlPoints`, telemetrię formularza i listę wskaźników. Główna tabela CSV pozostawia C01–C40 w stanie planowanych przypadków do późniejszego spójnego pomiaru; **poniższy pilot modelowy jest osobnym dowodem**, nie wynikiem `chrome_e2e` i nie jest kopiowany do pól `faktyczne_*` w CSV.

## Pięć wykonanych prób modelowych

Dobór celowy obejmuje oficjalny host, legalny cel na innej subdomenie, OAuth bez hasła, podszywanie w hoście i podszywanie widoczne przede wszystkim w DOM.

| ID | Etykieta scenariusza | Wynik modelu: pkt / status / sygnały | Interpretacja |
| --- | --- | --- | --- |
| C01 | legalna symulacja PayPal na oficjalnym hoście | **15 / Safe**; `password-field-present` | Pole hasła daje 15 pkt; brak alarmu marki na oficjalnym hoście. |
| C07 | legalne logowanie z `portal.example.test` do `auth.example.test` | **60 / Suspicious**; `suspicious-keywords`, `password-field-present`, `external-form-action` | Wstępny **fałszywy alarm** dla autoryzowanego przepływu między subdomenami; porównanie `action` opiera się na dosłownej różnicy hostów. |
| C10 | legalne OAuth bez lokalnego hasła, jeden przycisk Google | **0 / Safe**; brak wskaźników | Pojedyncza wzmianka o Google nie powoduje alarmu marki. |
| C11 | symulowane podszycie pod PayPal, obcy cel HTTP | **100 / Dangerous**; słowo URL, nieoficjalna marka w hoście, hasło, HTTP `action`, obcy host, niezgodność marki | Wynik ograniczono do 100 mimo sumy większej od 100; adres nie został odwiedzony. |
| C16 | symulowane podszycie pod Microsoft na obcym hoście | **65 / Suspicious**; słowo URL, hasło, niezgodność marki | Wykryta marka pochodzi z tytułu i nagłówka formularza. |

W C01 i C10 program zwrócił `Low`, w C07, C11 i C16 `High`. We wszystkich pięciu przypadkach model przekazał kompletną telemetrię DOM. Pilot pokazuje zachowanie bieżących reguł i konkretny problem C07; **nie jest estymacją skuteczności** na 40 stronach ani dowodem zachowania interfejsu Chrome. Nie wyliczamy procentów trafności z celowo wybranych pięciu przykładów.

## Następny etap i dowody z Chrome

1. Powtórzyć pięć kontrolowanych prób w Chrome na lokalnych stronach demonstracyjnych po przeładowaniu rozszerzenia. Zapisać pełny URL, wersję Chrome, wersję kodu, wynik panelu i pełny zrzut ekranu dla każdej próby. Taki adres `localhost` stanowi **osobny przypadek** i ma inne cechy URL niż C01/C07/C10/C11/C16. Nie przenosimy punktacji modelowych adresów do wyników z `localhost`.
2. Na pozostałych przypadkach rozwojowych przygotować i wykonać spójny przebieg modelowy, zapisać usterki i uzasadnione zmiany reguł. Każda zmiana po pilocie wymaga ponownego uruchomienia pięciu pierwszych przypadków i nowego zapisu wersji.
3. Po zamrożeniu wersji kodu planowanym na 10.10 wykonać odłożone C21–C40 w tym samym modelu i dopiero wtedy podać liczniki i metryki. Osobno zreferować próby `chrome_e2e` jako sprawdzenie działania rozszerzenia w przeglądarce. Wyniki syntetycznych przypadków odnoszą się do zadanego zestawu; nie opisują częstości phishingu w sieci.

### Instrukcja najbliższej próby Chrome na komputerze użytkownika

1. Pobrać bieżący commit repozytorium i w `chrome://extensions` włączyć tryb programisty, wskazać folder rozszerzenia albo kliknąć **Przeładuj** przy PhishGuard.
2. W terminalu w katalogu repozytorium uruchomić `python -m http.server 8000`. W Chrome otworzyć np. `http://localhost:8000/test-pages/oauth-inside-form.html`; nie wpisywać danych do formularza.
3. Otworzyć panel PhishGuard, wykonać zrzut całego okna z paskiem adresu, stroną i panelem. Zanotować numer Chrome z `chrome://settings/help`, system oraz SHA z `git rev-parse HEAD` na komputerze, z którego pochodzi zrzut.
4. Dla pięciu nowych lub powtórzonych prób zapisać osobne identyfikatory dowodów i porównać ich **rzeczywiste** URL z przewidywaniem kodu przed uzupełnieniem tabeli. Wynik z ekranu należy odróżnić od przewidywania. Strony `http://localhost` otrzymają co najmniej 25 pkt za brak HTTPS.
