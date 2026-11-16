// Isomorphic base64url for opaque cursors and tokens.
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

export function bytesToBase64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return globalThis.btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64urlToBytes(text: string): Uint8Array | undefined {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) return undefined;
  try {
    const bin = globalThis.atob(text.replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return undefined;
  }
}

export function encodeText(text: string): string {
  return bytesToBase64url(encoder.encode(text));
}

export function decodeText(b64: string): string | undefined {
  const bytes = base64urlToBytes(b64);
  if (!bytes) return undefined;
  try {
    return decoder.decode(bytes);
  } catch {
    return undefined;
  }
}
