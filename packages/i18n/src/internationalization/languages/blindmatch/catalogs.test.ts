import { describe, expect, it } from 'vitest';
import { PSEUDO_LOCALES, SHIPPED_LOCALES } from '../catalogs.ts';
import { validateCatalog, validateCatalogSize } from '../validate.ts';
import { blindMatchEnglish, loadBlindMatchCatalog } from './index.ts';

describe('offline BlindMatch catalogs', () => {
  it.each([...SHIPPED_LOCALES, ...PSEUDO_LOCALES])('%s has every message, parameter and plural form within the budget', async locale => {
    const catalog = await loadBlindMatchCatalog(locale);
    expect(Object.keys(catalog).sort()).toEqual(Object.keys(blindMatchEnglish).sort());
    expect(validateCatalog(locale, catalog, blindMatchEnglish)).toEqual([]);
    expect(await validateCatalogSize(locale, catalog)).toEqual([]);
  });
});
