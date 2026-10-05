/**
 * PhishGuard MVP - Moduł Skanowania DOM (DOM Detector)
 * 
 * Odpowiada wyłącznie za wykonywanie bezpiecznych analiz kodu HTML strony
 * i zbieranie surowych metryk (pola hasła, akcje formularzy, brand keywords).
 */

if (!window.DomDetector) {

/**
 * Pomocnicza funkcja heurystyczna sprawdzająca, czy dany formularz jest formularzem logowania.
 * Zapobiega fałszywym alarmom poprzez skupienie analizy tekstu tylko na granicach uwierzytelniania.
 * 
 * @param {HTMLFormElement} form - Formularz DOM.
 * @returns {boolean} Prawda, jeśli formularz reprezentuje formularz logowania.
 */
function isLoginForm(form) {
  // A. Formularz zawiera dedykowane pole hasła
  if (form.querySelector('input[type="password"]')) {
    return true;
  }
  
  // B. Formularz zawiera pola wejściowe o nazwach/placeholderach powiązanych z autoryzacją
  const inputs = form.querySelectorAll('input');
  const authKeywords = ['email', 'username', 'password', 'login', 'user', 'zaloguj', 'haslo'];
  
  for (let input of inputs) {
    const nameAttr = (input.getAttribute('name') || '').toLowerCase();
    const idAttr = (input.getAttribute('id') || '').toLowerCase();
    const placeholderAttr = (input.getAttribute('placeholder') || '').toLowerCase();
    
    const matchesKeyword = authKeywords.some(keyword => 
      nameAttr.includes(keyword) || idAttr.includes(keyword) || placeholderAttr.includes(keyword)
    );
    if (matchesKeyword) {
      return true;
    }
  }
  
  return false;
}

/**
 * Pomocnicza funkcja pobierająca nagłówki h1-h6 powiązane z formularzem logowania.
 * Przeszukuje nagłówki wewnątrz formularza oraz w jego bezpośrednim otoczeniu DOM.
 * 
 * @param {HTMLFormElement} form - Formularz logowania.
 * @returns {Array<HTMLElement>} Lista znalezionych nagłówków.
 */
function getHeadingsNearForm(form) {
  const headings = [];
  
  // 1. Nagłówki wewnątrz formularza
  form.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => headings.push(h));
  
  // 2. Nagłówki w bliskim sąsiedztwie (do 3 poziomów w górę)
  let parent = form.parentElement;
  let depth = 0;
  while (parent && depth < 3) {
    if (parent.tagName === 'BODY' || parent.tagName === 'HTML') {
      break;
    }
    parent.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
      if (!headings.includes(h)) {
        headings.push(h);
      }
    });
    parent = parent.parentElement;
    depth++;
  }
  
  return headings;
}

/**
 * Pomocnicza funkcja sprawdzająca, czy przycisk służy do uwierzytelniania.
 * Zapobiega to fałszywym analizom przycisków koszyka, nawigacji itp.
 * 
 * @param {HTMLElement} btn - Element przycisku.
 * @returns {boolean} Prawda, jeśli przycisk jest związany z autoryzacją/OAuth.
 */
function isAuthButton(btn) {
  const text = (btn.tagName === 'INPUT' ? (btn.getAttribute('value') || '') : (btn.textContent || '')).toLowerCase();
  const idClass = ((btn.getAttribute('id') || '') + ' ' + (btn.getAttribute('class') || '')).toLowerCase();
  
  const authKeywords = ['login', 'sign', 'loguj', 'auth', 'oauth', 'zaloguj', 'sso', 'connect', 'partner'];
  return authKeywords.some(keyword => text.includes(keyword) || idClass.includes(keyword));
}

// Granice węzłów tekstowych zachowujemy jako odstęp: sklejone textContent
// dwóch sąsiednich elementów mogłoby ukryć dwie osobne wzmianki o marce.
function getFormText(form) {
  const walker = document.createTreeWalker(form, NodeFilter.SHOW_TEXT);
  const fragments = [];
  let node;
  while ((node = walker.nextNode())) {
    fragments.push(node.textContent || '');
  }
  return fragments.join(' ');
}

const DomDetector = {
  /**
   * Skanuje strukturę dokumentu DOM aktywnej strony.
   * Zwraca wyłącznie surowe dane telemetryczne.
   * 
   * @returns {Object} Surowy obiekt analizy DOM.
   */
  scan() {
    const currentHostname = window.location.hostname;
    
    // 1. Wykrywanie i liczenie pól wprowadzania haseł
    const passwordFields = document.querySelectorAll('input[type="password"]');
    const passwordFieldCount = passwordFields.length;
    const hasPasswordField = passwordFieldCount > 0;

    // 2. Liczenie formularzy wejściowych
    const forms = Array.from(document.querySelectorAll('form'));
    const formCount = forms.length;
    const hasForms = formCount > 0;

    const insecureFormActions = [];
    const externalFormActions = [];

    // 3. Analiza celów przesyłania formularzy
    forms.forEach(form => {
      const actionAttr = form.getAttribute('action') || '';
      const method = form.getAttribute('method') || 'get';
      const hasPassword = form.querySelector('input[type="password"]') !== null;
      
      let absoluteAction = '';
      let isExternal = false;
      let isInsecure = false;

      if (actionAttr) {
        try {
          const resolvedUrl = new URL(actionAttr, window.location.href);
          absoluteAction = resolvedUrl.href;
          
          if (resolvedUrl.protocol === 'http:') {
            isInsecure = true;
          }
          
          if (resolvedUrl.hostname && resolvedUrl.hostname !== currentHostname) {
            isExternal = true;
          }
        } catch (e) {
          absoluteAction = actionAttr;
          if (actionAttr.startsWith('http://')) {
            isInsecure = true;
          } else if (actionAttr.startsWith('https://')) {
            const host = actionAttr.split('/')[2];
            if (host && host !== currentHostname) {
              isExternal = true;
            }
          }
        }
      } else {
        absoluteAction = window.location.href;
      }

      const formDetails = {
        action: absoluteAction,
        hasPassword: hasPassword,
        method: method
      };

      if (isInsecure) {
        insecureFormActions.push(formDetails);
      }
      
      if (isExternal) {
        externalFormActions.push(formDetails);
      }
    });

    // 4. Detekcja nazw chronionych marek w treści dokumentu (Zogniskowany Skan DOM z Progiem Ufności)
    // ZAPOBIEGANIE FAŁSZYWYM ALARMOM (np. na github.com/login przy przyciskach logowania przez Google):
    // - Wykonujemy analizę tylko w przypadku obecności interfejsu logowania.
    // - Przeszukujemy wyłącznie obszary powiązane z uwierzytelnianiem (tytuł, formularze logowania, etykiety, placeholdery, przyciski logowania, nagłówki blisko formularza).
    // - Zupełnie ignorujemy sekcje generyczne (stopki, menu nawigacji, artykuły).
    // - Wymagamy wyraźnego progu ufności (minimum 2 dopasowania nazwy marki w tych obszarach).
    const brandsList = ['paypal', 'google', 'microsoft', 'facebook', 'netflix', 'allegro', 'olx', 'apple', 'amazon'];
    const detectedBrandKeywords = [];

    const loginForms = forms.filter(isLoginForm);
    const hasLoginForm = loginForms.length > 0 || hasPasswordField;

    if (hasLoginForm) {
      let authRelatedText = (document.title || '').toLowerCase();
      const countedHeadings = new Set();

      // Tekst wewnątrz formularza jest dodawany raz w całości. Nagłówki
      // poza formularzem dodajemy osobno, bez ponownego liczenia tego samego węzła.
      loginForms.forEach(form => {
        const headings = getHeadingsNearForm(form);
        headings.forEach(h => {
          if (!form.contains(h) && !countedHeadings.has(h)) {
            authRelatedText += ' ' + (h.textContent || '').toLowerCase();
            countedHeadings.add(h);
          }
        });

        // Placeholdery nie są częścią textContent formularza.
        form.querySelectorAll('input').forEach(input => {
          const placeholder = (input.getAttribute('placeholder') || '').toLowerCase();
          authRelatedText += ' ' + placeholder;
        });

        // Obejmuje nagłówki, etykiety, legendy i przyciski wewnątrz formularza.
        authRelatedText += ' ' + getFormText(form).toLowerCase();
      });

      // Przyciski wewnętrzne są już uwzględnione w textContent formularza.
      const allButtons = document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]');
      allButtons.forEach(btn => {
        const isInside = loginForms.some(form => form.contains(btn));
        if (!isInside && isAuthButton(btn)) {
          const text = btn.tagName === 'INPUT' ? (btn.getAttribute('value') || '') : (btn.textContent || '');
          authRelatedText += ' ' + text.toLowerCase();
        }
      });

      // Mapowanie domen oficjalnych do weryfikacji domeny hostującej
      const brandDomains = {
        "paypal": ["paypal.com", "paypal.pl"],
        "google": ["google.com", "google.pl"],
        "microsoft": ["microsoft.com"],
        "netflix": ["netflix.com"],
        "apple": ["apple.com"],
        "amazon": ["amazon.com"],
        "facebook": ["facebook.com", "facebook.pl"],
        "allegro": ["allegro.pl"],
        "olx": ["olx.pl"]
      };

      // Pomocnicza funkcja zliczająca dopasowania słowa kluczowego
      const countOccurrences = (text, word) => {
        const regex = new RegExp('\\b' + word + '\\b', 'gi');
        const matches = text.match(regex);
        return matches ? matches.length : 0;
      };

      brandsList.forEach(brand => {
        const officialDomains = brandDomains[brand] || [];
        const host = currentHostname.toLowerCase().replace(/\.$/, '');
        const isOfficialSite = officialDomains.some(domain => host === domain || host.endsWith('.' + domain));
        
        // Wykonujemy analizę tylko gdy domena NIE należy do oficjalnej marki
        if (!isOfficialSite) {
          const count = countOccurrences(authRelatedText, brand);
          // Próg ufności (confidence threshold): słowo kluczowe marki musi pojawić się minimum 2 razy
          // w elementach uwierzytelniania strony (zapobiega to fałszywym alarmom przy np. pojedynczym przycisku OAuth "Zaloguj przez Google" na GitHubie)
          if (count >= 2) {
            detectedBrandKeywords.push(brand);
          }
        }
      });
    }

    return {
      hasPasswordField,
      passwordFieldCount,
      formCount,
      hasForms,
      insecureFormActions,
      externalFormActions,
      detectedBrandKeywords
    };
  }
};

// Eksport obiektu do przestrzeni globalnej w celu umożliwienia dostępu dla content.js w piaskownicy
window.DomDetector = DomDetector;

}
