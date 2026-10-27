// Integer minor-unit money helpers. No floats touch stored values.

const DECIMAL = /^\d+(\.\d{1,2})?$/;

export function parseMinor(input) {
  const text = String(input ?? '').trim();
  if (!DECIMAL.test(text)) return null;
  const [whole, fraction = ''] = text.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

export function formatMinor(minor, currency = 'EUR', locale = 'en') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(minor / 100);
}
