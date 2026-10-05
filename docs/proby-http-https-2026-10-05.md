# Pierwsza para prób Chrome HTTP i HTTPS 5 października 2026 roku

## Materiał i warunki

Użytkownik przekazał dwa kadry strony safe-login.html z paskiem adresu i panelem, zrzut terminala z git rev-parse HEAD oraz informację o Chrome. Zapisano nowe obserwacje E13 i E14; wcześniejszych prób nie zmieniano. SHA lokalnego checkoutu: `a19bb2cb59e50e28bdb9458c39dd4f19bd3161e1`. Chrome na ekranie informacji: 154.0.8037.98, oficjalna wersja 64-bitowa, bez komunikatu o oczekującym restarcie. Terminal pokazuje ścieżkę Windows; wersji systemu nie podano.

Pasek identyfikuje localhost, port 8000 lub 8443 i test-pages/safe-login.html; pomija schemat. Pełne URL odtworzono z procedury, portów i wskaźników protokołu: `http://localhost:8000/test-pages/safe-login.html` i `https://localhost:8443/test-pages/safe-login.html`. W E13 widoczny jest brak HTTPS; w E14 brak tego wskaźnika i brak wskaźnika formularza HTTP. Kadr E14 pokazuje stronę bez ekranu błędu certyfikatu. Nie jest to niezależne badanie łańcucha TLS. Nie podano osobnego potwierdzenia przeładowania w tej wiadomości; SHA lokalnego checkoutu nie dowodzi samodzielnie załadowanego SHA rozszerzenia. Informacja o Chrome nie jest zrzutem chrome://version aktywnego procesu dla każdej próby.

## Wyniki odczytane z panelu

| Próba | Warunek | Punkty | Status | Poziom | Pełna lista widocznych wskaźników |
| --- | --- | ---: | --- | --- | --- |
| E13 | HTTP, port 8000 | 80 | Zagrożenie | Wysoka | brak HTTPS (+25), login w URL (+10), hasło (+15), formularz HTTP (+30) |
| E14 | HTTPS, port 8443 | 25 | Bezpieczny | Średnia | login w URL (+10), hasło (+15) |

Obie obserwacje odpowiadają przewidywaniom zapisanym przed wykonaniem w procedurze. Różnica wynosi 55 punktów: na HTTPS nie występują +25 za protokół strony HTTP i +30 za cel formularza HTTP. W pliku action jest względne (`/auth/login`), więc rozstrzygnięty schemat celu podąża za adresem strony. Pozostałe dwa wskaźniki są takie same. Wnioski odnoszą się do jednej pary lokalnych warunków; port także się różni, choć reguły nie nadają mu punktów. To weryfikacja funkcjonalna, bez miar skuteczności phishingu i bez udziału C21–C40. Etykieta Bezpieczny oznacza wynik przyjętych heurystyk; Średnia nie jest zmierzonym prawdopodobieństwem poprawnej decyzji.

## Dowody i kontynuacja

- [E13 HTTP](dowody/2026-10-05/E13-safe-login-http.png)
- [E14 HTTPS](dowody/2026-10-05/E14-safe-login-https.png)
- [SHA lokalnego checkoutu](dowody/2026-10-05/E13-E14-checkout.png)
- [Informacja Chrome](dowody/2026-10-05/E13-E14-chrome-about.png)
- [Metadane i SHA-256 plików](dowody/2026-10-05/E13-E14-evidence.json)

Próby odpowiadają P01 i P02 ze szablonu planu. Szablon zachowano pusty jako formularz do ponownego użycia; wykonane obserwacje zapisano w głównym CSV jako E13 i E14. Pozostałe cztery pary z procedury nie zostały jeszcze wykonane. Następna para: external-form.html, oczekiwania HTTP 75/Zagrożenie/Wysoka i HTTPS 50/Podejrzany/Wysoka; przez HTTPS powinien pozostać zewnętrzny cel formularza.
