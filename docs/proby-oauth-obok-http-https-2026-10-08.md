# Para prób przycisku Google obok formularza HTTP i HTTPS

## Materiał i warunki

8 października 2026 otrzymano dwa pełne kadry oauth-false-positive-test.html z paskiem adresu, stroną i panelem. Zapisano je jako E19 i E20. Schematy HTTP (localhost:8000) i HTTPS (localhost:8443) odtworzono z procedury, portów, ikon i wskaźników; Chrome pomija schemat w pasku. Nie podano aktualnego SHA checkoutu, wersji Chrome ani osobnego potwierdzenia przeładowania. Pola pozostają puste; metadanych wcześniejszych prób nie przeniesiono. Data oznacza przekazanie dowodów. Oczekiwania zapisano przed próbą według reguł a19bb2c.

## Wyniki

| Próba | Warunek | Punkty | Status | Poziom | Pełna lista wskaźników |
| --- | --- | ---: | --- | --- | --- |
| E19 | HTTP | 70 | Podejrzany | Wysoka | insecure-protocol (+25), password-field-present (+15), insecure-form-action (+30) |
| E20 | HTTPS | 15 | Bezpieczny | Niska | password-field-present (+15) |

Punkty, statusy, poziomy i pełne listy są zgodne z oczekiwaniami. Różnica 55 pkt wynika z protokołu strony i rozstrzygnięcia względnego action=/login-handler: na HTTPS znikają wskaźniki strony HTTP i celu formularza HTTP. Pozostaje pole hasła. W obu warunkach brand-mismatch nie występuje mimo przycisku Google obok formularza i widocznych marek w stopce. Zgodność nie oznacza gwarancji bezpieczeństwa ani pomiaru prawdopodobieństwa.

Źródło zawiera przycisk Google poza form, marki w footer i komentarzach. Przycisk wyświetla alert; nie implementuje rzeczywistego uwierzytelniania OAuth. Próby nie obejmowały wysyłki formularza. Brak alarmu marki dotyczy tej konfiguracji, nie dowodzi ignorowania wszystkich legalnych wzmianek o markach. Nie ustalono niezależnie wersji załadowanego rozszerzenia ani walidacji łańcucha certyfikatów.

To czwarta z pięciu par funkcjonalnych. Nie zmieniono kodu ani wag. Nie jest to nowy pomiar skuteczności ani wykonanie C21–C40.

## Dowody i dalsza próba

- [E19 — HTTP](dowody/2026-10-08/E19-oauth-beside-form-http.png)
- [E20 — HTTPS](dowody/2026-10-08/E20-oauth-beside-form-https.png)
- [Źródła i SHA-256](dowody/2026-10-08/E19-E20-evidence.json)

Pozostała para fake-paypal-login. Oczekiwania to 100/Zagrożenie/Wysoka w obu warunkach. Surowe sumy 155 (HTTP) i 130 (HTTPS) są ograniczane do 100. Na HTTPS powinien zniknąć tylko insecure-protocol; jawny cel formularza HTTP pozostaje. Należy zapisać pełne listy, także kadrem po przewinięciu. To jeszcze oczekiwania, nie obserwacje tej pary.
