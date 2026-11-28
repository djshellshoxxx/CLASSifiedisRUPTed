import { en as sharedEnglish, shippedCatalogs } from '../catalogs.ts';
import { generatePseudolocale, type Catalog } from '../validate.ts';
import { en } from './en.ts';

export type { BlindMatchMessage } from './en.ts';
export const blindMatchEnglish: Catalog = { ...sharedEnglish, ...en };

/** All dictionaries are bundled offline. Initialize only the selected language. */
export async function loadBlindMatchCatalog(locale: string): Promise<Catalog> {
  if (locale === 'en') return blindMatchEnglish;
  if (locale === 'en-XA' || locale === 'ar-XB') return generatePseudolocale(locale, blindMatchEnglish);
  let messages: Catalog;
  switch (locale) {
    case 'de': messages = (await import('./de.ts')).de; break;
    case 'es': messages = (await import('./es.ts')).es; break;
    case 'fr': messages = (await import('./fr.ts')).fr; break;
    default: throw new Error('Unsupported BlindMatch language');
  }
  return { ...shippedCatalogs[locale], ...messages };
}
