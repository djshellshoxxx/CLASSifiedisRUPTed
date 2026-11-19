import { describe, expect, it } from 'vitest';
import { decodeBase64url, encodeBase64url } from './index.ts';

describe('canonical strict base64url codec', () => {
  it('round-trips every length from 0 to 64 bytes without padding', () => {
    for (let length = 0; length <= 64; length++) {
      const bytes = Uint8Array.from({ length }, (_, i) => (i * 37 + length * 11) & 255);
      const text = encodeBase64url(bytes);
      expect(text).not.toMatch(/[=+/]/);
      expect(text.length).toBe(Math.ceil(length * 4 / 3));
      expect(decodeBase64url(text, length)).toEqual(bytes);
    }
  });

  it('uses the URL-safe alphabet for bytes that map to 62 and 63', () => {
    expect(encodeBase64url(new Uint8Array([0xfb, 0xff]))).toBe('-_8');
    expect(decodeBase64url('-_8', 2)).toEqual(new Uint8Array([0xfb, 0xff]));
  });

  it('decodes the empty string to zero bytes', () => {
    expect(decodeBase64url('')).toEqual(new Uint8Array(0));
    expect(encodeBase64url(new Uint8Array(0))).toBe('');
  });

  it('rejects non-canonical and malformed text', () => {
    expect(() => decodeBase64url('AB')).toThrow('Invalid base64url');
    expect(() => decodeBase64url('AA==')).toThrow('Invalid base64url');
    expect(() => decodeBase64url('AA=')).toThrow('Invalid base64url');
    expect(() => decodeBase64url('A+8')).toThrow('Invalid base64url');
    expect(() => decodeBase64url('A/8')).toThrow('Invalid base64url');
    expect(() => decodeBase64url(' AA')).toThrow('Invalid base64url');
    expect(() => decodeBase64url('A')).toThrow();
  });

  it('rejects non-string input before decoding', () => {
    expect(() => decodeBase64url(undefined)).toThrow('Invalid base64url');
    expect(() => decodeBase64url(123)).toThrow('Invalid base64url');
    expect(() => decodeBase64url(new Uint8Array(2))).toThrow('Invalid base64url');
  });

  it('enforces the byte limit before and after decoding', () => {
    expect(decodeBase64url(encodeBase64url(new Uint8Array(4)), 4)).toEqual(new Uint8Array(4));
    expect(() => decodeBase64url(encodeBase64url(new Uint8Array(5)), 4)).toThrow('Invalid base64url');
    expect(() => decodeBase64url('A'.repeat(100), 4)).toThrow('Invalid base64url');
  });
});
