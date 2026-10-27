// Integer minor-unit money helpers. No floats touch stored values.

const DECIMAL = /^\d+(\.\d{1,2})?$/;

export function parseMinor(input) {
  const text = String(input ?? '').trim();
  if (!DECIMAL.test(text)) return null;
  const [whole, fraction = ''] = text.split('.');
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  // Stored money must stay exact: values beyond the safe-integer range are rejected, not rounded.
  return Number.isSafeInteger(minor) ? minor : null;
}

export function formatMinor(minor, currency = 'EUR', locale = 'en') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(minor / 100);
}
