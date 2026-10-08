# Para prób przycisku Google wewnątrz formularza HTTP i HTTPS

## Materiał i warunki

8 października 2026 roku otrzymano dwa pełne kadry oauth-inside-form.html, zapisane jako E17 i E18. Adresy odpowiadają procedurze: http://localhost:8000/test-pages/oauth-inside-form.html oraz https://localhost:8443/test-pages/oauth-inside-form.html. Schemat odtworzono z instrukcji, portów, ikon przeglądarki i wskaźników protokołu; pasek Chrome pomija schemat.

Nie przekazano aktualnego SHA checkoutu, wersji Chrome ani osobnego potwierdzenia przeładowania. Pola metadanych pozostają puste; nie przeniesiono danych wcześniejszej sesji. Data oznacza przekazanie dowodów, nie niezależnie ustalony czas wykonania. Oczekiwania zapisano przed próbą według reguł a19bb2c.

## Wyniki i interpretacja

| Próba | Warunek | Punkty | Status | Poziom | Pełna lista wskaźników |
| --- | --- | ---: | --- | --- | --- |
| E17 | HTTP, port 8000 | 25 | Bezpieczny | Niska | insecure-protocol (+25) |
| E18 | HTTPS, port 8443 | 0 | Bezpieczny | Niska | brak wskaźników |

Obie próby odpowiadają przewidywanym punktom, statusom, poziomom i listom. Różnica 25 pkt wynika wyłącznie z protokołu strony. W obu warunkach napis „Zaloguj przez Google” wewnątrz formularza nie uruchamia brand-mismatch. Źródło strony zawiera pole e-mail, bez pola hasła, przycisk type="button" oraz jawny cel https://localhost/session. To atrapa interfejsu, bez wykonania rzeczywistego logowania OAuth. Brak wskaźników i etykieta Bezpieczny nie stanowią gwarancji bezpieczeństwa; Niska jest etykietą heurystyczną, nie zmierzonym prawdopodobieństwem.

To trzecia z pięciu wykonanych par funkcjonalnych HTTP/HTTPS. Nie jest to pomiar skuteczności ani przebieg zbioru C21–C40. Nie zmieniono kodu, wag ani stron. Zrzuty nie potwierdzają niezależnie wersji załadowanego rozszerzenia ani walidacji łańcucha certyfikatów.

## Dowody i następna para

- [E17 — HTTP](dowody/2026-10-08/E17-oauth-inside-form-http.png)
- [E18 — HTTPS](dowody/2026-10-08/E18-oauth-inside-form-https.png)
- [Źródła i SHA-256](dowody/2026-10-08/E17-E18-evidence.json)

Pozostały oauth-false-positive-test i fake-paypal-login. Dla oauth-false-positive-test oczekiwania wynoszą HTTP 70/Podejrzany/Wysoka i HTTPS 15/Bezpieczny/Niska. To oczekiwania, jeszcze nie obserwacje.
