/**
 * PhishGuard MVP - Stałe marek (Brands Configuration)
 * 
 * Zawiera konfigurację znanych i popularnych marek, ich oficjalnych domen docelowych
 * oraz wzorców pisowni używanych do detekcji brand spoofingu oraz typosquattingu.
 */

// Słownik zniekształceń i literówek znanych marek (typosquatting)
export const brandsMap = {
  "google": ["google.com", "google.pl"],
  "paypal": ["paypal.com", "paypal.pl"],
  "microsoft": ["microsoft.com"],
  "facebook": ["facebook.com", "facebook.pl"],
  "netflix": ["netflix.com"],
  "allegro": ["allegro.pl"],
  "olx": ["olx.pl"]
};

// Mapowanie identyfikatora marki na jej główną, oficjalną domenę
export const brandDomains = {
  "paypal": "paypal.com",
  "google": "google.com",
  "microsoft": "microsoft.com",
  "netflix": "netflix.com",
  "apple": "apple.com",
  "amazon": "amazon.com",
  "facebook": "facebook.com",
  "allegro": "allegro.pl",
  "olx": "olx.pl"
};
