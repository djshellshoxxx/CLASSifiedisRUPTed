import { canonicalJson, sha256Hex } from '@classrup/kernel';
import { decodeBase64url, encodeBase64url, publicKeyFromDid, type StatementSigner } from '@classrup/security';

export const MAX_ENVELOPE_BYTES = 1024 * 1024;
const encoder = new TextEncoder();
const CID = /^sha256-[a-f0-9]{64}$/;
declare const verified: unique symbol;
export interface Envelope {
  readonly v: 1;
  readonly type: string;
  readonly cid: string;
  readonly author: string;
  readonly createdAt: string;
  readonly seq: number;
  readonly prev: string | null;
  readonly payload: unknown;
  readonly ext: Readonly<Record<string, unknown>>;
  readonly sig: string;
}
export type VerifiedEnvelope = Envelope & { readonly [verified]: true };
export interface EnvelopeInput {
  readonly type: string;
  readonly createdAt: string;
  readonly seq: number;
  readonly prev: string | null;
  readonly payload: unknown;
  readonly ext?: Readonly<Record<string, unknown>>;
}
export interface VerificationOptions {
  readonly expectedType?: string;
  readonly expectedAuthor?: string;
  readonly now?: number;
  readonly maxAgeMs?: number;
}

/** Reject values outside RFC 8785's JSON domain, not just values JSON.stringify happens to accept. */
export function strictCanonicalJson(input: unknown): string {
  let nodes = 0;
  let size = 0;
  const seen = new Set<object>();
  const string = (s: string): void => {
    if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(s)) throw new Error('Invalid Unicode');
    size += s.length;
    if (size > MAX_ENVELOPE_BYTES) throw new Error('Envelope too large');
  };
  const visit = (v: unknown, depth: number): void => {
    if (++nodes > 50000 || depth > 32) throw new Error('JSON complexity exceeded');
    if (typeof v === 'string') { string(v); return; }
    if (v === null || typeof v === 'boolean') return;
    if (typeof v === 'number' && Number.isFinite(v)) return;
    if (typeof v !== 'object' || v === null) throw new Error('Not a JSON value');
    if (seen.has(v)) throw new Error('Cyclic JSON');
    seen.add(v);
    if (Object.getOwnPropertySymbols(v).length > 0) throw new Error('Not a JSON value');
    if (Array.isArray(v)) {
      if (v.length > 50000 || Object.getPrototypeOf(v) !== Array.prototype || Object.getOwnPropertyNames(v).length !== v.length + 1 || Object.keys(v).length !== v.length) throw new Error('Sparse or decorated array');
      for (let i = 0; i < v.length; i++) {
        const d = Object.getOwnPropertyDescriptor(v, String(i));
        if (!d || !('value' in d) || !d.enumerable) throw new Error('Invalid array element');
        visit(d.value, depth + 1);
      }
    } else {
      if (Object.getPrototypeOf(v) !== Object.prototype && Object.getPrototypeOf(v) !== null) throw new Error('Not a JSON object');
      for (const k of Object.getOwnPropertyNames(v)) {
        string(k);
        const d = Object.getOwnPropertyDescriptor(v, k);
        if (!d || !('value' in d) || !d.enumerable) throw new Error('Invalid object property');
        visit(d.value, depth + 1);
      }
    }
    seen.delete(v);
  };
  visit(input, 0);
  const text = canonicalJson(input);
  if (encoder.encode(text).length > MAX_ENVELOPE_BYTES) throw new Error('Envelope too large');
  return text;
}

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const v of Object.values(value)) freeze(v);
    Object.freeze(value);
  }
  return value;
}

function parse(input: unknown): Envelope {
  // Detach before asynchronous hashing and verification, preventing caller mutation races.
  const value = JSON.parse(strictCanonicalJson(input)) as Record<string, unknown>;
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join(',') !== 'author,cid,createdAt,ext,payload,prev,seq,sig,type,v') throw new Error('Invalid envelope fields');
  if (value.v !== 1 || typeof value.type !== 'string' || !/^classrup\.[a-z][a-z0-9_.]{0,100}\/v1$/.test(value.type)) throw new Error('Unsupported envelope type/version');
  if (typeof value.cid !== 'string' || !CID.test(value.cid) || typeof value.author !== 'string') throw new Error('Invalid envelope identity');
  publicKeyFromDid(value.author);
  if (typeof value.createdAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.createdAt) || !Number.isFinite(Date.parse(value.createdAt)) || new Date(value.createdAt).toISOString() !== value.createdAt) throw new Error('Invalid timestamp');
  if (!Number.isSafeInteger(value.seq) || (value.seq as number) < 1) throw new Error('Invalid sequence');
  if (value.seq === 1 ? value.prev !== null : typeof value.prev !== 'string' || !CID.test(value.prev)) throw new Error('Invalid previous CID');
  if (!value.ext || typeof value.ext !== 'object' || Array.isArray(value.ext)) throw new Error('Invalid extensions');
  if (decodeBase64url(value.sig, 64).length !== 64) throw new Error('Invalid signature encoding');
  return value as unknown as Envelope;
}

function content(envelope: Envelope): Omit<Envelope, 'cid' | 'sig'> {
  const { cid: _cid, sig: _sig, ...body } = envelope;
  return body;
}

/** CID hashes JCS(content excluding cid and sig); signature covers JCS(envelope excluding sig). */
export async function verifyEnvelope(input: unknown, options: VerificationOptions = {}): Promise<VerifiedEnvelope> {
  const envelope = parse(input);
  if (options.expectedType !== undefined && envelope.type !== options.expectedType) throw new Error('Wrong statement type');
  if (options.expectedAuthor !== undefined && envelope.author !== options.expectedAuthor) throw new Error('Unauthorized author');
  const now = options.now ?? Date.now();
  if (!Number.isFinite(now) || options.maxAgeMs !== undefined && (!Number.isFinite(options.maxAgeMs) || options.maxAgeMs < 0)) throw new Error('Invalid verification clock');
  const issued = Date.parse(envelope.createdAt);
  if (issued > now + 5 * 60 * 1000 || options.maxAgeMs !== undefined && now - issued > options.maxAgeMs) throw new Error('Statement outside validity window');
  const cid = `sha256-${await sha256Hex(strictCanonicalJson(content(envelope)))}`;
  if (cid !== envelope.cid) throw new Error('CID mismatch');
  const { sig, ...unsigned } = envelope;
  const key = await crypto.subtle.importKey('raw', publicKeyFromDid(envelope.author), 'Ed25519', false, ['verify']);
  if (!await crypto.subtle.verify('Ed25519', key, decodeBase64url(sig, 64), encoder.encode(strictCanonicalJson(unsigned)))) throw new Error('Invalid signature');
  return freeze(envelope) as VerifiedEnvelope;
}

export async function signEnvelope(identity: StatementSigner, input: EnvelopeInput): Promise<VerifiedEnvelope> {
  const body = JSON.parse(strictCanonicalJson({ v: 1, author: identity.principal, ...input, ext: input.ext ?? {} })) as Omit<Envelope, 'cid' | 'sig'>;
  const cid = `sha256-${await sha256Hex(strictCanonicalJson(body))}`;
  const unsigned = { ...body, cid };
  const sig = encodeBase64url(await identity.sign(encoder.encode(strictCanonicalJson(unsigned))));
  return verifyEnvelope({ ...unsigned, sig }, { now: Date.parse(body.createdAt) });
}
