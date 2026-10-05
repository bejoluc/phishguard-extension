# Pięć prób w Chrome na stronach demonstracyjnych — 25.09.2026

## Źródło i warunki

Użytkownik przesłał pięć zrzutów ekranu z przeglądarki Chrome przedstawiających lokalne strony HTML oraz panel PhishGuard. Przyporządkowanie zrzutów do plików opiera się na widocznej treści stron i nazwach plików testowych. URL podane w tabeli to adresy **zaplanowane w instrukcji próby**: `http://localhost:8000/test-pages/<plik>`. Zrzuty potwierdzają host `localhost` w panelu i wskaźnik braku HTTPS, ale pokazują tylko końcówkę adresu lub nie pokazują paska adresu. Portu `8000` i pełnych adresów nie da się niezależnie potwierdzić ze zrzutów.

Przewidywania wyliczono z kodu na commicie `b7e0036450a51488e14a60fea427bad00a727a3a`. Użytkownik nie podał jeszcze SHA wersji załadowanej w Chrome ani dokładnej wersji przeglądarki; zgodność interfejsu nie stanowi dowodu identycznego SHA. Data przesłania zrzutów: 25.09.2026, około 13:21 czasu polskiego. Nie obserwowano wysłania formularzy; nie jest to próba działania serwerów docelowych.

## Zapis porównania

| ID | Strona i rola próby | Wynik z kodu przy zaplanowanym URL | Obserwacja na zrzucie | Dowód |
| --- | --- | --- | --- | --- |
| E01 | `suspicious-keywords.html`, treść nakłaniająca do podania danych bez formularza logowania | 25, `Safe`, `Low` | 25, Bezpieczny, Niska | [E01](dowody/2026-09-25/E01-suspicious-keywords.png) |
| E02 | `oauth-false-positive-test.html`, pojedynczy przycisk Google OAuth | 70, `Suspicious`, `High` | 70, Podejrzany, Wysoka | [E02](dowody/2026-09-25/E02-oauth-false-positive.png) |
| E03 | `external-form.html`, hasło i zewnętrzny cel formularza | 75, `Dangerous`, `High` | 75, Zagrożenie, Wysoka | [E03](dowody/2026-09-25/E03-external-form.png) |
| E04 | `fake-paypal-login.html`, symulacja podszycia i niebezpiecznego formularza | 100, `Dangerous`, `High` | 100, Zagrożenie, Wysoka | [E04](dowody/2026-09-25/E04-fake-paypal-login.png) |
| E05 | `safe-login.html`, własny formularz logowania uruchomiony przez HTTP | 80, `Dangerous`, `High` | 80, Zagrożenie, Wysoka | [E05](dowody/2026-09-25/E05-safe-login.png) |

Wynik, status i wyświetlana wiarygodność zgadzają się z przewidywaniami dla wszystkich pięciu stron przy założeniu podanych wyżej adresów. Widoczne wskaźniki:

- **E01:** brak HTTPS (+25). Słowa w treści i odnośniku strony nie są obecnie oceniane jako słowa w URL aktywnej karty; brak formularza logowania stawia tę próbę poza głównym zakresem oceny stron logowania.
- **E02:** brak HTTPS (+25), pole hasła (+15), formularz HTTP (+30). Na zrzucie nie ma wskaźnika niezgodności marki: pojedynczy przycisk Google OAuth nie wygenerował alarmu marki. Status Podejrzany pochodzi od HTTP i pola hasła.
- **E03:** brak HTTPS (+25), pole hasła (+15), zewnętrzny cel formularza (+35).
- **E04:** widoczne są brak HTTPS (+25), słowo `login` w URL (+10), pole hasła (+15), formularz HTTP (+30) i zewnętrzny cel formularza (+35). Panel jest przewinięty tylko częściowo; **wskaźnik `brand-mismatch`, przewidywany z kodu, nie jest widoczny na przekazanym zrzucie**. Lista faktycznych wskaźników pozostaje niepotwierdzona w całości, chociaż wynik i status są czytelne.
- **E05:** brak HTTPS (+25), słowo `login` w URL (+10), pole hasła (+15), formularz HTTP (+30). Wysoki wynik dotyczy warunków lokalnego HTTP; nie jest sam w sobie dowodem fałszywego alarmu dla bezpiecznego formularza przez HTTPS.

Wartości punktów URL w [CSV](przypadki-testowe.csv) zsumowano z widocznych w panelu wag wskaźników URL, ponieważ popup nie wyświetla osobnej sumy URL. Puste `faktyczne_id` dla E04 oznacza brak widoku pełnej listy, **nie** brak wykrytych wskaźników. Wartość „Wysoka” to kategoria wewnętrznej heurystyki PhishGuard, a nie zmierzona skuteczność klasyfikacji.

## Granice wniosków i dalszy krok

Próby potwierdzają działanie przepływu Chrome → URL/DOM → punktacja → popup w pięciu lokalnych przykładach. Wszystkie korzystają z HTTP, które wnosi +25 pkt, a przy formularzach z lokalnym `action` dodatkowo +30 pkt. Nie włączamy E01–E05 do macierzy pomyłek ani nie liczymy na ich podstawie precyzji, czułości czy odsetka fałszywych alarmów. Scenariusze C01–C40 nadal są planem i nie były wykonane.

Do zamknięcia metadanych prób potrzebne są: SHA z `git rev-parse --short HEAD` na komputerze testowym, wersja Chrome, potwierdzenie pełnego URL/portu oraz dodatkowy zrzut E04 po przewinięciu panelu do ostatniego wskaźnika. Następnie warto wykonać porównywalne scenariusze na kontrolowanym HTTPS i dopiero po ustaleniu warunków zbierać wyniki właściwego zestawu 40 scenariuszy.
