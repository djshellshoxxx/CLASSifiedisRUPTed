import { canonicalJson, sha256Hex, timestamp, uuidv7, z } from '@classrup/kernel';
import { decodeBase64url, encodeBase64url, publicKeyFromDid, type StatementSigner } from '@classrup/security';

export const SUBJECT_TYPES = ['bazaar_offer', 'bazaar_negotiation', 'mutiny_proposal', 'mutiny_cycle', 'services_booking', 'rentals_reservation', 'rentals_deposit', 'comms_meetup'] as const;
export type SubjectType = (typeof SUBJECT_TYPES)[number];
export const hashSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const cidSchema = z.string().regex(/^sha256-[a-f0-9]{64}$/);
export const statementKeySchema = z.string().regex(/^[a-z][a-z0-9]*(?:\.[a-z0-9]+)+$/).max(80);
const did = z.string().startsWith('did:key:').max(128);
export const payloadSchema = z.strictObject({
  signerDid: did, signerKeyId: did, subjectType: z.enum(SUBJECT_TYPES), subjectRef: uuidv7(), subjectRevision: z.int().min(1),
  subjectRevisionHash: hashSchema, statementKey: statementKeySchema, statementTextHash: hashSchema,
  signedAtClaim: timestamp(), kind: z.enum(['consent', 'decline', 'revocation']), revokes: cidSchema.optional(),
}).refine(p => (p.kind === 'revocation') === (p.revokes !== undefined));
export type ConsentPayload = z.output<typeof payloadSchema>;
export const statementSchema = z.strictObject({ payload: payloadSchema, signature: z.string().regex(/^[A-Za-z0-9_-]{86}$/), cid: cidSchema });
export type ConsentStatement = z.output<typeof statementSchema>;

/** Exact consent domain separation, independent of the alpha federation envelope. */
export function consentSigningBytes(payload: ConsentPayload): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(`classrup.consent.v1\0${canonicalJson(payloadSchema.parse(payload))}`);
}
export async function signConsentStatement(signer: StatementSigner, payload: ConsentPayload): Promise<ConsentStatement> {
  const detached = payloadSchema.parse(payload);
  if (signer.principal !== detached.signerDid) throw new Error('Consent signer mismatch');
  const signature = encodeBase64url(await signer.sign(consentSigningBytes(detached)));
  return statementSchema.parse({ payload: detached, signature, cid: `sha256-${await sha256Hex(canonicalJson({ payload: detached, signature }))}` });
}

/** Root-key verification by default. Device delegation must be established by an explicit key resolver. */
export async function verifyConsentStatement(input: unknown, keyFor: (payload: ConsentPayload) => Promise<Uint8Array | undefined> = async p => p.signerKeyId === p.signerDid ? publicKeyFromDid(p.signerDid) : undefined): Promise<ConsentStatement> {
  const statement = statementSchema.parse(input);
  const bytes = await keyFor(statement.payload);
  if (!bytes || bytes.length !== 32) throw new Error('Consent key is not authorized');
  const expected = `sha256-${await sha256Hex(canonicalJson({ payload: statement.payload, signature: statement.signature }))}`;
  if (statement.cid !== expected) throw new Error('Consent CID mismatch');
  const key = await crypto.subtle.importKey('raw', new Uint8Array(bytes), 'Ed25519', false, ['verify']);
  if (!await crypto.subtle.verify('Ed25519', key, decodeBase64url(statement.signature, 64), consentSigningBytes(statement.payload))) throw new Error('Consent signature invalid');
  return statement;
}
