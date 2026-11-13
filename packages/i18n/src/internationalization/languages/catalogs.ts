// Seed catalogs shipped inside the module. The JSON files packages/i18n/messages/<locale>.json named by the spec
// are outside this module's code directory; these objects carry the keys the two i18n modules themselves need.
import { generatePseudolocale, type Catalog } from './validate.ts';

export const en: Catalog = {
  'language.automatic': 'Automatic',
  'language.changed': 'Language changed to {language}',
  'listing.saved_local': 'Saved on this device',
  'offers.count': { one: '{count} offer', other: '{count} offers' },
  'money.approx': '≈ {amount}, quote from {source} at {time}',
  'money.approx_old': '≈ {amount}, quote from {source} at {time} (old quote)',
  'money.approx_unavailable': '≈ {amount}, quote details unavailable',
};
export const de: Catalog = {
  'language.automatic': 'Automatisch',
  'language.changed': 'Sprache geändert auf {language}',
  'listing.saved_local': 'Auf diesem Gerät gespeichert',
  'offers.count': { one: '{count} Angebot', other: '{count} Angebote' },
  'money.approx': '≈ {amount}, Kurs von {source} um {time}',
  'money.approx_old': '≈ {amount}, Kurs von {source} um {time} (alter Kurs)',
  'money.approx_unavailable': '≈ {amount}, Kursdetails nicht verfügbar',
};
export const fr: Catalog = {
  'language.automatic': 'Automatique',
  'language.changed': 'Langue changée en {language}',
  'listing.saved_local': 'Enregistré sur cet appareil',
  'offers.count': { one: '{count} offre', many: '{count} d’offres', other: '{count} offres' },
  'money.approx': '≈ {amount}, cours de {source} à {time}',
  'money.approx_old': '≈ {amount}, cours de {source} à {time} (ancien cours)',
  'money.approx_unavailable': '≈ {amount}, détails du cours indisponibles',
};
export const es: Catalog = {
  'language.automatic': 'Automático',
  'language.changed': 'Idioma cambiado a {language}',
  'listing.saved_local': 'Guardado en este dispositivo',
  'offers.count': { one: '{count} oferta', many: '{count} de ofertas', other: '{count} ofertas' },
  'money.approx': '≈ {amount}, cotización de {source} a las {time}',
  'money.approx_old': '≈ {amount}, cotización de {source} a las {time} (cotización antigua)',
  'money.approx_unavailable': '≈ {amount}, detalles de la cotización no disponibles',
};
export const SHIPPED_LOCALES = ['en', 'de', 'fr', 'es'] as const;
export const PSEUDO_LOCALES = ['en-XA', 'ar-XB'] as const;
export const shippedCatalogs: Readonly<Record<string, Catalog>> = {
  en, de, fr, es,
  'en-XA': generatePseudolocale('en-XA', en),
  'ar-XB': generatePseudolocale('ar-XB', en),
};
/** Language names in their own language, for the language settings screen. */
export const LANGUAGE_NAMES: Readonly<Record<string, string>> = { en: 'English', de: 'Deutsch', fr: 'Français', es: 'Español' };
