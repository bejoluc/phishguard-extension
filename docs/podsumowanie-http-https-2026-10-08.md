# Wyniki pięciu par HTTP i HTTPS w Chrome

## Ostatnia para E21 i E22

8 października 2026 otrzymano dwa kadry fake-paypal-login.html. Po przewinięciu widoczne są wynik, status, poziom i pełne listy wskaźników. Na HTTP (localhost:8000) odczytano 100/Zagrożenie/Wysoka oraz sześć wskaźników: insecure-protocol 25, suspicious-keywords 10, password-field-present 15, insecure-form-action 30, external-form-action 35, brand-mismatch 40. Suma widocznych wag wynosi 155. Na HTTPS (localhost:8443) odczytano ten sam wynik, status i poziom oraz pięć ostatnich wskaźników, o sumie 130. Obie sumy są ograniczane do 100. Nie jest to pomiar surowej telemetrii rozszerzenia; sumy obliczono z widocznych wag.

Znika wyłącznie insecure-protocol. Jawny action=http://malicious-example.com/login pozostaje HTTP i ma obcy host; te dwa ostrzeżenia oraz brand-mismatch utrzymują się na stronie HTTPS. Punkty, statusy, poziomy i listy odpowiadają oczekiwaniom zapisanym wcześniej. HTTPS strony nie potwierdza autentyczności marki ani bezpieczeństwa celu formularza.

- [E21 — HTTP](dowody/2026-10-08/E21-fake-paypal-http.png)
- [E22 — HTTPS](dowody/2026-10-08/E22-fake-paypal-https.png)
- [Źródła i SHA-256](dowody/2026-10-08/E21-E22-evidence.json)

Schematy odtworzono z instrukcji, portów, ikon i wskaźników; Chrome pomija schemat w pasku. Nie podano aktualnego SHA, wersji Chrome ani potwierdzenia przeładowania. Metadanych wcześniejszych prób nie przeniesiono. Data oznacza przekazanie dowodów. Nie wnioskowano o wykonaniu wysyłki formularza ani niezależnej walidacji łańcucha TLS.

## Zestawienie wykonanych par

| Plik strony | Dowody | HTTP: punkty / status / poziom | HTTPS: punkty / status / poziom | Wskaźniki znikające w HTTPS |
| --- | --- | --- | --- | --- |
| safe-login.html | E13/E14, 05.10 | 80 / Zagrożenie / Wysoka | 25 / Bezpieczny / Średnia | strona HTTP i cel HTTP, 55 pkt |
| external-form.html | E15/E16, 08.10 | 75 / Zagrożenie / Wysoka | 50 / Podejrzany / Wysoka | strona HTTP, 25 pkt |
| oauth-inside-form.html | E17/E18, 08.10 | 25 / Bezpieczny / Niska | 0 / Bezpieczny / Niska | strona HTTP, 25 pkt |
| oauth-false-positive-test.html | E19/E20, 08.10 | 70 / Podejrzany / Wysoka | 15 / Bezpieczny / Niska | strona HTTP i cel HTTP, 55 pkt |
| fake-paypal-login.html | E21/E22, 08.10 | 100 / Zagrożenie / Wysoka | 100 / Zagrożenie / Wysoka | strona HTTP, 25 pkt przed limitem |

Wykonano pięć zaplanowanych par, łącznie dziesięć obserwacji funkcjonalnych. Wszystkie widoczne punkty, statusy, poziomy i listy wskaźników są zgodne z wcześniejszymi przewidywaniami. To zgodność tych kontrolowanych prób z regułami, nie 100% skuteczności wykrywania phishingu. Par nie łączono z modelem C01–C20; C21–C40 pozostają niewykonane. Nie zmieniono aplikacji ani wag podczas dokumentowania tego etapu.

Przy względnym action protokół strony wpływa także na protokół celu. Przy jawnym action cel zachowuje protokół zapisany w HTML. Ograniczenie wyniku do 100 maskuje różnicę surowych sum PayPal, dlatego pełna lista jest konieczna do interpretacji. Marka Google w przyciskach badanych konfiguracji nie wywołała brand-mismatch, natomiast podszycie PayPal wywołało ten wskaźnik w obu transportach.

## Następny etap

Porównanie HTTP/HTTPS jest zakończone. Do osobnego sprawdzenia pozostały stan karty wewnętrznej, brak DOM i kompletność metadanych aktualnego środowiska. Nie są one uznane za wykonane na podstawie powyższych kadrów. Przed odłożonym zbiorem oceny należy zakończyć przegląd komunikatów i zamrozić wersję reguł.
