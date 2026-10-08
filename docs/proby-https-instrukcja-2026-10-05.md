# Porównanie lokalnych stron HTTP i HTTPS

## Stan i cel

Przygotowano serwer laboratoryjny oraz procedurę porównania tych samych plików HTML przez HTTP i HTTPS. Kod rozszerzenia, wagi i strony testowe pozostają bez zmian. Poniższa tabela zawiera oczekiwania wynikające z kodu, nie obserwacje Chrome. Pierwszą parę safe-login użytkownika zapisano jako E13/E14 w [raporcie wyników](proby-http-https-2026-10-05.md). Drugą parę external-form zapisano 08.10 jako E15/E16 w [raporcie](proby-http-https-2026-10-08.md). Trzecią parę oauth-inside-form zapisano 08.10 jako E17/E18 w [raporcie](proby-oauth-http-https-2026-10-08.md). Czwartą parę oauth-false-positive-test zapisano jako E19/E20 w [raporcie](proby-oauth-obok-http-https-2026-10-08.md). Piątą parę fake-paypal-login zapisano jako E21/E22. Wszystkie pięć par zakończono; [raport zbiorczy](podsumowanie-http-https-2026-10-08.md) zawiera obserwacje i ograniczenia. Nie wchodzą do odłożonego zbioru C21–C40.

Serwer `scripts/serve-test-pages.py` korzysta wyłącznie z biblioteki standardowej Python 3.9+. Nasłuchuje na 127.0.0.1; udostępnia pliki HTML z test-pages pod dotychczasową ścieżką, wyłącza cache i odrzuca POST. Nie służy do wdrożenia aplikacji. Certyfikat i klucz przechowujemy poza repozytorium. Lokalne odrzucenie POST nie blokuje zewnętrznych celów zapisanych w HTML: nie klikamy przycisków wysłania i nie wpisujemy danych.

## Przygotowanie w Windows PowerShell

1. W katalogu projektu pobrać zmiany: `git switch main`, następnie `git pull --ff-only`. Zanotować `git rev-parse HEAD`.
2. Sprawdzić `py --version` (minimum 3.9).
3. Pobrać binarium Windows amd64 z oficjalnego wydania [mkcert](https://github.com/FiloSottile/mkcert/releases/tag/v1.4.4), plik `mkcert-v1.4.4-windows-amd64.exe`. Nazwać go `mkcert.exe` i zapisać w `$env:LOCALAPPDATA\PhishGuard\tools`. Dla komputera ARM wybrać odpowiedni plik zamiast amd64. Nie trzeba instalować dodatkowego menedżera pakietów.
4. W PowerShell wykonać:

```powershell
$pgTools = Join-Path $env:LOCALAPPDATA 'PhishGuard\tools'
$pgCerts = Join-Path $env:LOCALAPPDATA 'PhishGuard\certs'
New-Item -ItemType Directory -Force -Path $pgCerts | Out-Null
& "$pgTools\mkcert.exe" -install
& "$pgTools\mkcert.exe" -cert-file "$pgCerts\localhost.pem" -key-file "$pgCerts\localhost-key.pem" localhost 127.0.0.1
```

`-install` dodaje lokalny urząd certyfikacji do zaufanych certyfikatów systemu; Windows może pokazać potwierdzenie. Kluczy PEM, w szczególności rootCA-key.pem, nie przesyłamy ani nie dodajemy do Git. Do usunięcia zaufania po zakończeniu badań służy `mkcert.exe -uninstall`. Zamknąć i ponownie uruchomić Chrome po instalacji CA, zapisując wersję z `chrome://version` (nie z ekranu oczekującej aktualizacji).

5. Uruchomić dwa serwery w dwóch terminalach, oba z katalogu repozytorium. Jeśli stary HTTP zajmuje 8000, zatrzymać go Ctrl+C.

Terminal HTTP:

```powershell
py scripts/serve-test-pages.py --port 8000
```

Terminal HTTPS (zmienna zadeklarowana również w tym terminalu):

```powershell
$pgCerts = Join-Path $env:LOCALAPPDATA 'PhishGuard\certs'
py scripts/serve-test-pages.py --port 8443 --cert "$pgCerts\localhost.pem" --key "$pgCerts\localhost-key.pem"
```

6. W `chrome://extensions` przeładować PhishGuard z tego checkoutu. Zapisać potwierdzenie przeładowania, SHA, wersję Chrome, system i datę. Otworzyć stronę HTTPS. W razie błędu certyfikatu zatrzymać próbę i naprawić zaufanie/nazwę hosta; nie omijać ostrzeżenia.

## Oczekiwania dla niezmienionych stron

Prefiksy: `http://localhost:8000/test-pages/` oraz `https://localhost:8443/test-pages/`. Zawsze używać hosta localhost, nie adresu IP. Port nie jest punktowany przez detektor, ale to osobna różnica konfiguracji, którą zapisujemy. To porównanie warunków transportu, nie pomiar przyczynowy zmieniający wyłącznie jedną składową URL.

| Plik | HTTP: punkty / status / poziom | HTTPS: punkty / status / poziom | Wskaźniki oczekiwane przez HTTPS |
| --- | --- | --- | --- |
| safe-login.html | 80 / Zagrożenie / Wysoka | 25 / Bezpieczny / Średnia | suspicious-keywords, password-field-present |
| oauth-false-positive-test.html | 70 / Podejrzany / Wysoka | 15 / Bezpieczny / Niska | password-field-present |
| oauth-inside-form.html | 25 / Bezpieczny / Niska | 0 / Bezpieczny / Niska | brak |
| external-form.html | 75 / Zagrożenie / Wysoka | 50 / Podejrzany / Wysoka | password-field-present, external-form-action |
| fake-paypal-login.html | 100 / Zagrożenie / Wysoka | 100 / Zagrożenie / Wysoka | suspicious-keywords, password-field-present, insecure-form-action, external-form-action, brand-mismatch |

Dla dwóch formularzy z względnym action (`safe-login`, `oauth-false-positive`) zmiana protokołu strony zmienia także rozstrzygnięty adres celu formularza: znikają +25 za stronę HTTP i +30 za cel HTTP. Cel atrapy PayPal jest jawnie HTTP i pozostaje taki po przejściu strony na HTTPS. Suma spada ze 155 do 130, lecz oba wyniki mają limit 100. Dlatego porównujemy listę wskaźników, nie tylko końcową liczbę. Reguła HTTP bada schemat URL; nie weryfikuje poprawności łańcucha certyfikatów TLS.

## Wykonanie i zapis

Zacząć od pary safe-login. Otworzyć pełny adres HTTP, otworzyć panel, kliknąć „Skanuj ponownie”, poczekać na wynik i wykonać kadr z paskiem adresu, stroną i panelem. Powtórzyć dla HTTPS. Jeśli lista nie mieści się w kadrze, wykonać drugi kadr po przewinięciu. Następnie wykonać pozostałe cztery pary w tej samej sesji i na tym samym checkoutcie. Nie wysyłać formularzy.

Zapisać oryginalne zrzuty jako `YYYY-MM-DD-nazwa-http.png` i `YYYY-MM-DD-nazwa-https.png`. W [szablonie CSV](https-observations-template.csv) uzupełnić zaobserwowane punkty, status, poziom, pełną listę wskaźników i metadane. Nazwy P01–P10 oznaczają planowane pary, nie wykonane E13–E22; numery dowodów nadamy po otrzymaniu obserwacji. Puste pola nie oznaczają wyniku zero. Każdą rozbieżność zachować i opisać przed ewentualną zmianą kodu. Bezpieczny i Wysoka pozostają etykietami heurystycznymi.

## Źródła metody uruchomienia

- [mkcert — dokumentacja autora](https://github.com/FiloSottile/mkcert), instalacja lokalnego CA i certyfikaty rozwojowe, dostęp 05.10.2026.
- [Python ssl](https://docs.python.org/3/library/ssl.html), SSLContext i load_cert_chain, dostęp 05.10.2026.

## Wykonana weryfikacja narzędzia

05.10 sprawdzono serwer w Linux i Python 3.12.14: pięć stron przez HTTP i HTTPS miało odpowiedź 200 i identyczne bajty jak pliki repozytorium, nagłówek no-store, HEAD 200, POST 405 i odrzucenie dostępu do innych ścieżek. Klient HTTPS zweryfikował tymczasowy certyfikat OpenSSL i nazwę localhost, bez instalacji CA w systemie. Błędny certyfikat i brak pary certyfikat/klucz zatrzymują uruchomienie. [Zapis sprawdzenia](dowody/2026-10-05/https-server-smoke.json). Nie jest to próba rozszerzenia w Chrome ani potwierdzenie instalacji mkcert w Windows.

Oczekiwaną punktację tabeli przeliczono rzeczywistymi modułami URL i RiskCalculator, dostarczając jawne cechy formularzy z istniejącego HTML (hasło, rozstrzygnięty action i marka dla atrapy PayPal). Nie wykonywano przy tym pełnego skanera DOM ani Chrome. Otrzymano wartości zgodne z tabelą; są one nadal przewidywaniami do porównania z panelem.
