/**
 * Client-side end-to-end encryption helpers. Run on devices only: the relay never holds a plaintext
 * message body or a secret key. Recipients are identified by their x25519 box key ids, which embed the
 * public key, so a key id list from `comms.thread.keys` is all a sender needs.
 *
 * Trust limits: the key directory is served by the relay (trust-on-first-use; compare key fingerprints
 * out of band for high-value trades), and sender attribution inside a group is relay-asserted unless the
 * plaintext carries its own signature.
 */
import type { JsonValue } from '@classrup/kernel';
import { canonicalize, validationError } from '@classrup/kernel';
import type { BoxKeyPair, MultiRecipientCiphertext } from '@classrup/security';
import { boxPublicKeyFromId, decryptForRecipient, encryptForRecipients, fromUtf8, randomBytes, sha256B64, utf8 } from '@classrup/security';

/** Associated data binds ciphertext to its thread, independent of sequence numbers assigned later by the relay. */
export const messageAad = (threadId: string): Uint8Array => utf8(`classrup:comms:msg:v1|${threadId}`);
export const placeAad = (threadId: string): Uint8Array => utf8(`classrup:comms:place:v1|${threadId}`);

function recipientMap(keyIds: readonly string[]): Record<string, Uint8Array> {
  const out: Record<string, Uint8Array> = {};
  for (const id of keyIds) out[id] = boxPublicKeyFromId(id);
  return out;
}

export function encryptMessage(plaintextJson: JsonValue, recipientKeyIds: readonly string[], threadId: string): MultiRecipientCiphertext {
  return encryptForRecipients(recipientMap(recipientKeyIds), utf8(canonicalize(plaintextJson)), messageAad(threadId));
}

export function decryptMessage(ciphertext: MultiRecipientCiphertext, recipientKeyId: string, keyPair: BoxKeyPair, threadId: string): JsonValue {
  return parseJson(fromUtf8(decryptForRecipient(recipientKeyId, keyPair, ciphertext, messageAad(threadId))));
}

/** Private meetup place text, sealed to the meetup participants only. */
export function encryptPlace(placeJson: JsonValue, recipientKeyIds: readonly string[], threadId: string): MultiRecipientCiphertext {
  return encryptForRecipients(recipientMap(recipientKeyIds), utf8(canonicalize(placeJson)), placeAad(threadId));
}

export function decryptPlace(ciphertext: MultiRecipientCiphertext, recipientKeyId: string, keyPair: BoxKeyPair, threadId: string): JsonValue {
  return parseJson(fromUtf8(decryptForRecipient(recipientKeyId, keyPair, ciphertext, placeAad(threadId))));
}

function parseJson(text: string): JsonValue {
  try {
    return JSON.parse(text) as JsonValue;
  } catch {
    throw validationError('COMMS.PLAINTEXT_INVALID', 'decrypted content is not JSON');
  }
}

/** Salted hash the relay stores for a handoff code. Binding to the meetup id stops cross-meetup reuse. */
export const handoffCodeHash = (meetupId: string, code: string): string => `sha256:${sha256B64(`classrup:comms:handoff:v1|${meetupId}|${code}`)}`;

/** Uniform 6-digit code via rejection sampling (no modulo bias). */
export function generateHandoffCode(): string {
  const limit = 4_294_000_000; // largest multiple of 10^6 below 2^32
  for (;;) {
    const b = randomBytes(4);
    const n = ((b[0] as number) * 2 ** 24 + (b[1] as number) * 2 ** 16 + (b[2] as number) * 2 ** 8 + (b[3] as number)) >>> 0;
    if (n < limit) return String(n % 1_000_000).padStart(6, '0');
  }
}
