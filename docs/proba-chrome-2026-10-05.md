# E06 — zrzut panelu po próbie strony z przyciskiem OAuth, 05.10.2026

## Cel i materiał

Po poprawce DOM przygotowano [`oauth-inside-form.html`](../test-pages/oauth-inside-form.html) z jednym przyciskiem „Zaloguj przez Google” wewnątrz formularza. Dla założonego adresu `http://localhost:8000/test-pages/oauth-inside-form.html` kod na `main` przewiduje `insecure-protocol`, 25/100, status `Safe` i poziom `Low`, bez `brand-mismatch`. To są wartości **oczekiwane**, wyliczone z kodu dla określonego URL.

Użytkownik przesłał w odpowiedzi na instrukcję przeprowadzenia tej próby [zrzut panelu E06](dowody/2026-10-05/E06-oauth-inside-form-popup.png). Kadr obejmuje cały panel rozszerzenia, lecz nie zawiera paska adresu ani samej strony.

## Obserwacja ze zrzutu

| Pole | Wartość widoczna |
| --- | --- |
| Skanowany host | `localhost` |
| Ocena | 25/100 |
| Status | `Bezpieczny` |
| Wiarygodność analizy | `Niska` |
| Lista wskaźników | Jeden: „Brak szyfrowania HTTPS” (25 pkt) |
| Wskaźnik niezgodności marki | Nie jest wyświetlany |

Wszystkie widoczne pola panelu odpowiadają oczekiwaniu dla E06. Zrzut potwierdza **stan panelu na `localhost`**, ale nie pozwala niezależnie potwierdzić, która dokładnie ścieżka była otwarta, jaki port i protokół widniały w pasku adresu, jaka wersja rozszerzenia była załadowana ani jaka była wersja Chrome. Protokół HTTP wynika z komunikatu wskaźnika, nie z widoku paska adresu. Nie przypisujemy temu dowodowi potwierdzenia konkretnego DOM strony lub samej poprawki z commitu.

Do pełnej identyfikacji próby potrzebny jest zrzut pokazujący równocześnie stronę, cały URL w pasku i panel oraz zapis wersji Chrome i SHA kodu załadowanego jako rozszerzenie. Z samego kadru nie można ustalić, czy do formularza wpisywano dane lub czy go wysłano. E06 jest próbą rozwojową, poza planowanym zbiorem C01–C40; nie używamy go do wyliczania skuteczności.
