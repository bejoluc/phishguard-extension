# Ocena C21–C40 w kontrolowanym modelu DOM

## Metoda i zamrożenie

Przed uruchomieniem zapisano [zamrożenie wejść i reguł](dowody/2026-10-08/C21-C40-freeze.json): kod aplikacji z commitu 71f16e76f68499d02215be3df8ef8006f3a69b79, identyfikatory C21–C40, SHA-256 plików i definicję alarmu (Suspicious lub Dangerous, czyli ponad 30 punktów przy pełnej analizie). Etykiety i profile SPEC_40 pochodzą z wcześniejszego CSV. Wagi, reguły i etykiety pozostały niezmienione.

Runner otrzymał jawny tryb `--evaluation`, który dopuszcza cały zbiór ocena i sprawdza skróty plików przed wykonaniem. Wynik zapisano jako [surowy JSON](dowody/2026-10-08/C21-C40-evaluation-model.json). Obejmuje rzeczywisty kod detektora URL, skanera DOM i kalkulatora, ale uproszczony model interfejsu dokumentu. Nie uruchamia Chrome, nie odwiedza domen ani nie wysyła formularzy. Każdy przypadek ma analysisComplete=true w modelu; nie dowodzi to kompletności skanu w Chrome.

To zbiór odłożony od przebiegów rozwojowych, lecz jego specyfikacja była wcześniej znana. Nie jest ślepą, niezależną zewnętrzną walidacją. Część konstrukcji jest podobna do rozwojowych.

## Wyniki

| ID | Etykieta | Punkty | Status | Klasyfikacja |
| --- | --- | ---: | --- | --- |
| C21 | legalna symulacja | 15 | Safe | TN |
| C22 | legalna symulacja | 15 | Safe | TN |
| C23 | legalna symulacja | 25 | Safe | TN |
| C24 | legalna symulacja | 25 | Safe | TN |
| C25 | legalna symulacja | 15 | Safe | TN |
| C26 | legalna symulacja | 25 | Safe | TN |
| C27 | legalna symulacja | 60 | Suspicious | FP |
| C28 | legalna symulacja | 25 | Safe | TN |
| C29 | legalna symulacja | 0 | Safe | TN |
| C30 | legalna symulacja | 40 | Suspicious | FP |
| C31 | phishing symulowany | 100 | Dangerous | TP |
| C32 | phishing symulowany | 100 | Dangerous | TP |
| C33 | phishing symulowany | 100 | Dangerous | TP |
| C34 | phishing symulowany | 100 | Dangerous | TP |
| C35 | phishing symulowany | 95 | Dangerous | TP |
| C36 | phishing symulowany | 100 | Dangerous | TP |
| C37 | phishing symulowany | 55 | Suspicious | TP |
| C38 | phishing symulowany | 25 | Safe | FN |
| C39 | phishing symulowany | 60 | Suspicious | TP |
| C40 | phishing symulowany | 25 | Safe | FN |

TP=8, FP=2, FN=2, TN=8, n=20, niepełne=0. Precyzja 8/10=80%, czułość 8/10=80%, FPR 2/10=20%, trafność 16/20=80%, F1=0,80. [Liczniki i miary](dowody/2026-10-08/C21-C40-metrics.json). Jeden przypadek zmienia trafność o 5 punktów procentowych, a czułość lub FPR o 10 punktów. Nie należy uogólniać tych wartości na rzeczywisty ruch.

## Analiza błędów

- **C27, FP, 60 pkt:** autoryzowany cel na innym hoście. login (+10), hasło (+15), inny host (+35). Algorytm widzi różnicę hostów, ale nie ma wiedzy o upoważnieniu odbiorcy.
- **C30, FP, 40 pkt:** legalna wielopoziomowa subdomena. Segmenty hosta (+15), login (+10), hasło (+15). Suma zwykłych cech przekracza próg alarmu.
- **C38, FN, 25 pkt:** nieuprawnione zbieranie haseł na HTTPS, bez znanej marki i z lokalnym celem. Słowo secure (+10) i hasło (+15) nie wystarczają do alarmu. Intencja z konstrukcji scenariusza nie jest bezpośrednio obserwowalna w analizowanych cechach.
- **C40, FN, 25 pkt:** podszycie pod mBank nieobecny w słowniku. login (+10) i hasło (+15); brak wskaźników marki. To ograniczenie pokrycia słownika, nie dowód działania ogólnego wykrywania literówek.

## Weryfikacja i interpretacja

22/22 testy automatyczne zaliczono po rozszerzeniu runnera. Powtórne C01–C20 zwróciły identyczne wyniki i telemetrię jak archiwalny przebieg rozwojowy. Sprawdza to zachowanie dotychczasowej ścieżki runnera; nie dodaje 20 nowych niezależnych obserwacji.

Wyniki rozwojowe (90% trafności) i oceny (80%) przedstawia się osobno. Nie dostrajano reguł do C21–C40 po odczycie. Ewentualne późniejsze poprawki wymagają nowej wersji oraz nowego zbioru do niezależniejszej oceny. Przypadki z CSV zachowują opis planowanego wykonania Chrome i puste pola tych obserwacji; wykonanie modelowe jest udokumentowane w osobnym JSON.

## Odtworzenie

Na wersji repozytorium zawierającej ten raport: `node scripts/run-development-model.mjs --evaluation`. Otrzymany JSON można zapisać poza repozytorium; zmiana źródeł lub CSV powoduje jawne przerwanie przez kontrolę zamrożenia. Nie usuwać tej kontroli, aby wymusić wynik na innej wersji. Wyniki deterministyczne powinny być zgodne, czas i wersja Node mogą się różnić.
