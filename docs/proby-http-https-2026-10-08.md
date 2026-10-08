# Para prób formularza z obcym celem HTTP i HTTPS

## Materiał i warunki

8 października 2026 roku użytkownik przekazał dwa kadry external-form.html z widoczną stroną, paskiem adresu i pełną listą wskaźników PhishGuard. Zapisano je jako E15 i E16. Adresy odpowiadają procedurze: `http://localhost:8000/test-pages/external-form.html` oraz `https://localhost:8443/test-pages/external-form.html`. Chrome pomija schemat w pasku; warunki odtworzono z instrukcji, portów, ikon informacji o stronie i wskaźników protokołu.

W tej wiadomości nie przekazano nowego SHA checkoutu, wersji Chrome ani potwierdzenia przeładowania. Metadanych z 5 października nie przypisano automatycznie do nowych prób. Pole commit w CSV pozostaje puste. Oczekiwania zapisano przed wykonaniem w procedurze według niezmienionych reguł a19bb2c. Data w CSV jest datą przekazania dowodów; dokładnego czasu wykonania nie ustalono.

## Odczytane wyniki

| Próba | Warunek | Punkty | Status | Poziom | Wszystkie widoczne wskaźniki |
| --- | --- | ---: | --- | --- | --- |
| E15 | HTTP, port 8000 | 75 | Zagrożenie | Wysoka | brak HTTPS (+25), hasło (+15), obcy cel formularza (+35) |
| E16 | HTTPS, port 8443 | 50 | Podejrzany | Wysoka | hasło (+15), obcy cel formularza (+35) |

Obie próby zgadzają się z wcześniejszym przewidywaniem punktów, statusu, poziomu i listy wskaźników. Różnica wynosi 25 punktów: przez HTTPS znika insecure-protocol. Cel formularza zapisany w źródle HTML jest jawnie HTTPS na innym hoście, dlatego insecure-form-action nie występuje w żadnym warunku. W obu kadrach utrzymują się password-field-present i external-form-action. Samo HTTPS strony nie usuwa zatem w tym przypadku ostrzeżenia o obcym celu formularza.

Panel wykrywa cechy formularza; jego komunikat o wysyłaniu danych nie jest dowodem wykonanego transferu. Nie wysyłano formularza w ramach procedury, a ze zrzutów nie wnioskujemy o przechwyceniu danych ani o uprawnieniu lub zamiarze właściciela docelowego hosta. Inny host może także występować w legalnej integracji. Wysoka jest etykietą heurystyczną, nie zmierzonym prawdopodobieństwem phishingu.

To druga wykonana para z pięciu planowanych: pierwsza safe-login to E13/E14 z 05.10. Warunki różnią się schematem i portem; port nie ma wagi w obecnych regułach. Nie jest to pomiar skuteczności, nowy przebieg C01–C20 ani wykonanie C21–C40.

## Dowody i dalsza próba

- [E15 — HTTP](dowody/2026-10-08/E15-external-form-http.png)
- [E16 — HTTPS](dowody/2026-10-08/E16-external-form-https.png)
- [Źródła i skróty SHA-256](dowody/2026-10-08/E15-E16-evidence.json)

Pozostały trzy pary: oauth-inside-form, oauth-false-positive-test i fake-paypal-login. Następna para oauth-inside-form ma oczekiwania HTTP 25/Safe/Low (wyłącznie insecure-protocol) i HTTPS 0/Safe/Low (brak wskaźników). Oczekiwania te nie są jeszcze obserwacjami.
