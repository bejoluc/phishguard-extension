# PhishGuard — zestaw 40 zaplanowanych scenariuszy URL + DOM

Zestaw opracowano 25.09.2026 jako materiał do następnego etapu pracy. **Pełna lista C01–C40 i podstawa każdej etykiety są zapisane w [tabeli przypadków CSV](przypadki-testowe.csv).** To modele stron, a nie wyniki pomiaru: pola oczekiwane i zaobserwowane dla tych 40 wierszy pozostają puste, a `tryb` ma wartość `planowany_przypadek`. Poprzednie U01–U08 oraz D01–D05 są odrębnymi testami rozwojowymi reguł i nie wchodzą do liczby 40.

## 1. Podział ustalony przed uruchomieniem przypadków

| Zbiór | Legalne symulacje logowania | Symulowany phishing | Razem | IDs |
| --- | ---: | ---: | ---: | --- |
| `rozwoj` | 10 | 10 | 20 | C01–C10, C11–C20 |
| `ocena` | 10 | 10 | 20 | C21–C30, C31–C40 |
| **Razem** | **20** | **20** | **40** | C01–C40 |

Etykieta `legalna_symulacja` oznacza w modelu stronę prowadzoną za zgodą właściciela kont lub usługi. Etykieta `phishing_symulowany` oznacza stronę bez takiej zgody, zaprojektowaną do wyłudzenia danych. To założenie konstrukcyjne scenariusza, ustalone niezależnie od tego, jaki wynik zwróci PhishGuard. Dla każdej pozycji zapisano powód w `uzasadnienie_etykiety`.

Etykieta opisuje **podszywanie się**, a nie ogólny stan zabezpieczeń. Przykładowo C09 jest modelowo autoryzowaną stroną HTTP, ale nadal przesyłałaby dane bez HTTPS; alert z tego powodu trzeba omówić osobno przy interpretacji fałszywych alarmów dotyczących phishingu.

## 2. Jednoznaczna specyfikacja DOM

Wiersze C01–C40 mają profil `SPEC_40`. Po przygotowaniu stron testowych ich kod HTML ma powstać według tych samych reguł; pojedyncza zmiana musi zostać odnotowana w CSV i dzienniku.

- `typ_dom=haslo`: dokument zawiera tytuł „{marka} — logowanie” lub, gdy `marka_w_dom` jest pusta, „Panel logowania”. Wewnątrz jednego formularza `method="post"` znajduje się nagłówek „Zaloguj się do {marka}” lub „Zaloguj się”, pole `input type="email" name="email"`, pole `input type="password" name="password"` i przycisk „Zaloguj”. Wartość `cel_formularza` staje się dosłownie atrybutem `action`; puste pole oznacza brak atrybutu.
- `typ_dom=oauth_only`: dokument ma tytuł „Panel logowania”, formularz POST z nagłówkiem „Zaloguj się” i polem `input type="email" name="username"`, bez pola hasła. Tekst z `przycisk_oauth` umieszczamy na przycisku **poza** formularzem, aby marka OAuth miała jedno wystąpienie w analizowanym obszarze. `cel_formularza` jest atrybutem `action` formularza.
- Strony nie zawierają innych marek, formularzy, pól haseł ani żądań do sieci. Formularzy nie wysyłamy i nie wprowadzamy prawdziwych danych. Nazwa marki to wyłącznie tekst: nie dodajemy prawdziwych znaków graficznych serwisów.

Zmienność **URL** wynika z pola `wejscie`: protokół, host, głębokość subdomen i ścieżka są częścią scenariusza. Zmienność **DOM** wynika z marki, rodzaju formularza i adresu `action`. Pole `wejscie` nie oznacza, że istnieje publiczna strona pod tym adresem: `*.test` i dokumentacyjny adres IP są adresami modelowymi, a strony opisane na prawdziwych domenach marek także są tylko symulacją wejścia dla algorytmu. Nie publikujemy tych szablonów pod cudzymi domenami.

## 3. Pokrycie ważnych wariantów

| Wariant | Przykładowe IDs | Powód uwzględnienia |
| --- | --- | --- |
| Oficjalny host lub jego subdomena | C01–C05, C21–C26 | Sprawdzenie, czy nazwa znanej marki nie wystarczy do podniesienia alarmu. |
| Autoryzowany formularz kierujący na inną subdomenę | C07, C27 | Wykrycie potencjalnego fałszywego alarmu przy zewnętrznym `action`. |
| Zwykła strona na HTTP lub wiele subdomen | C09, C30 | Oddzielenie sygnału technicznego od etykiety phishingu. |
| Logowanie OAuth bez lokalnego hasła | C10, C29 | Sprawdzenie kontekstu logowania z pojedynczą wzmianką o Google. |
| Podszywanie się przez nazwę hosta lub znaną literówkę | C11–C15, C20, C31–C36 | Analiza URL oraz niezgodności marki z hostem. |
| Podszywanie się widoczne głównie w DOM | C16, C19, C37 | Sprawdzenie znaczenia tekstu formularza i nagłówka. |
| Brak rozpoznanej marki, IP albo marka spoza słownika | C17–C18, C38–C40 | Sprawdzenie ograniczeń obecnych heurystyk. |

## 4. Jak użyć zestawu bez zawyżania wyników

1. Najpierw przygotować powtarzalny sposób wygenerowania i uruchomienia stron zgodnych z `SPEC_40`. Dla modelowych adresów trzeba zapewnić kontrolowany kontekst hosta i protokołu albo wykonać analizę URL + DOM w jawnie opisanym środowisku laboratoryjnym. Samo otwarcie pliku HTML z `localhost` **nie testuje** domeny podanej w `wejscie`.
2. Na przypadkach `rozwoj` uruchamiać testy, zapisywać rzeczywiste wyniki i poprawiać kod. Zbiór `ocena` pozostawić bez wyników i bez dostrajania reguł pod konkretne przypadki do chwili zamrożenia wersji.
3. Przed pomiarem zdecydować, które przypadki da się zbadać jako rzeczywiste `chrome_e2e`. Jeśli zamiast Chrome użyto kontrolowanego modelu DOM, oznaczyć inny `tryb` i raportować takie wyniki oddzielnie. Nie nazywać ich skutecznością całego rozszerzenia w przeglądarce.
4. Zarejestrować wersję kodu, warunki badania oraz ewentualne zmiany zestawu. Dla scenariuszy pełnych, rzeczywiście wykonanych i z kompletnym DOM policzyć macierz pomyłek zgodnie z [protokołem](protokol-testow.md). Ograniczenie: etykiety i strony są syntetyczne, dlatego wyniku nie uogólniamy na internetowe kampanie phishingowe.

## Materiały do zachowania po tej sesji

Zachować repozytorium po `git pull` z aktualną [tabelą CSV](przypadki-testowe.csv), tym opisem, [protokołem](protokol-testow.md) i [dziennikiem prac](dziennik-prac.md). Dziś nie powstały zrzuty ekranu ani wyniki eksperymentu do wklejenia do pracy; zestaw jest podstawą przyszłego rozdziału o metodyce testów.
