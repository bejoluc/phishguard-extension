# Instrukcja próby kontrolowanej niedostępności DOM

## Cel i granice

Sprawdzenie, czy popup przy niedostępnej telemetrii DOM zachowa analizę URL i pokaże niepełność oceny. To symulacja błędu komunikacji i nieudanej próby wstrzyknięcia w działającym panelu Chrome, nie obserwacja rzeczywistej blokady przez przeglądarkę. Nie zmienia plików ani punktacji. Próbę przygotowano; nie otrzymano jeszcze wyniku użytkownika.

Nie używamy chrome://settings ani Chrome Web Store: `isBrowserInternal` wyklucza te adresy przed próbą pobrania DOM, więc nie sprawdzają tej ścieżki błędu.

## Wykonanie

1. Na chrome://extensions przeładuj PhishGuard. Zapisz SHA checkoutu i wersję Chrome oraz potwierdzenie przeładowania.
2. Przy działającym serwerze HTTP otwórz dokładnie `http://localhost:8000/test-pages/oauth-inside-form.html`. Otwórz PhishGuard i zachowaj wynik bazowy. Kod przewiduje 25/100, Bezpieczny, Niska, tylko brak HTTPS.
3. Kliknij prawym przyciskiem wewnątrz panelu rozszerzenia i wybierz Zbadaj (Inspect). Otwórz Console w narzędziach **panelu rozszerzenia**, nie strony laboratoryjnej. Sprawdź, że `location.protocol` wynosi `chrome-extension:`.
4. Wprowadź poniższy kod. Jeśli Chrome ogranicza wklejanie, wpisz te krótkie polecenia ręcznie. Oba kanały pobrania DOM muszą być niedostępne, ponieważ popup ma mechanizm awaryjnego wstrzyknięcia.

```js
chrome.tabs.sendMessage = async () => { throw new Error('TEST: brak DOM'); };
chrome.scripting.executeScript = async () => { throw new Error('TEST: brak wstrzykniecia'); };
document.getElementById('scan-btn').click();
```

5. Po zakończeniu skanowania zachowaj zrzut panelu z adresem strony i pełnym komunikatem. Błąd `TEST: brak wstrzykniecia` w konsoli jest zamierzony.
6. Zamknij DevTools i popup. Otwórz popup ponownie na tej samej stronie i zachowaj wynik kontrolny. Nowy dokument popupu powinien korzystać z oryginalnych metod Chrome; oczekujemy powrotu do wyniku bazowego.

## Oczekiwania wyprowadzone z kodu, nie wyniki pomiaru

| Warunek | Punkty | Status | Wiarygodność | Lista |
| --- | --- | --- | --- | --- |
| Bazowy | 25 | Bezpieczny | Niska | Brak HTTPS |
| Obie metody odrzucają żądania | 25 | Niepełna | Niepełna | Ostrzeżenie o braku DOM oraz brak HTTPS |
| Ponowne otwarcie bez symulacji | 25 | Bezpieczny | Niska | Brak HTTPS |

Oczekiwany komunikat: „Nie udało się zbadać struktury strony. Wynik obejmuje tylko adres URL i może być zaniżony.” Kryteria: nie pojawia się Bezpieczny podczas symulacji, wynik URL pozostaje 25, ostrzeżenie jest widoczne, a ponowne otwarcie przywraca pełną analizę. Nie jest to pomiar trafności wykrywania phishingu ani czasu skanowania. W razie nieudanego nadpisania metod próba jest niewykonana, nie zaliczona.
