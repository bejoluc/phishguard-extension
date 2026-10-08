# E24 — kontrolowana niedostępność DOM w Chrome

8 października 2026 otrzymano zrzut Chrome z adresem `localhost:8000/test-pages/oauth-inside-form.html`, konsolą popup.html i pełnym panelem PhishGuard. Schemat HTTP wynika z procedury, portu i widocznego wskaźnika braku HTTPS; pasek adresu pomija schemat.

Konsola pokazuje nadpisanie `chrome.tabs.sendMessage` funkcją odrzucającą żądanie błędem `TEST: brak DOM` i `chrome.scripting.executeScript` funkcją odrzucającą próbę wstrzyknięcia błędem `TEST: brak wstrzykniecia`, po czym kliknięcie scan-btn. Widoczny stos błędu wstrzyknięcia wskazuje runScanner w popup.js. Jest to zamierzona symulacja awarii obu ścieżek pozyskania DOM, nie rzeczywista blokada Chrome.

| Element | Oczekiwanie przed próbą | Odczyt |
| --- | --- | --- |
| Host | localhost | localhost |
| Punkty | 25 | 25/100 |
| Status | Niepełna | Niepełna |
| Wiarygodność | Niepełna | Niepełna |
| Wskaźniki | insecure-protocol | Brak szyfrowania HTTPS, 25 pkt |
| Ostrzeżenie | Analiza tylko URL | Nie udało się zbadać struktury strony. Wynik obejmuje tylko adres URL i może być zaniżony. |

Warunek awarii odpowiada wszystkim tym oczekiwaniom: niski wynik URL nie otrzymał etykiety Bezpieczny, a brak DOM został ujawniony. Nie otrzymano jeszcze nowej obserwacji bazowej ani kontroli po zamknięciu DevTools i ponownym otwarciu popupu. Próba powrotu do pełnej analizy pozostaje niewykonana; nie oznaczono całego scenariusza jako zakończonego.

Metadane podane bezpośrednio przed próbą: Chrome 154.0.8037.98, oficjalny 64-bit, checkout a19bb2cb59e50e28bdb9458c39dd4f19bd3161e1. Nie potwierdzono niezależnie załadowanego SHA ani przeładowania. Kod aplikacji w checkout jest identyczny z main 9400751; różnice dotyczą dokumentacji. Zrzut potwierdza właściwy kontekst popup.html. Zapis obserwacji: [E24](dowody/2026-10-08/E24-missing-dom-evidence.json). Opublikowano transkrypcję, bez całego kadru, identyfikatorów rozszerzenia i prywatnych plików. Nie zmieniono plików aplikacji, wag ani zbioru C21–C40. Wynik nie mierzy trafności phishingu.
