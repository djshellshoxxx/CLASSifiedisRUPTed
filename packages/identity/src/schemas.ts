import { schemas, z } from '@classrup/kernel';
import type { SignedEnvelope } from '@classrup/security';

/** 32-byte public key as unpadded base64url. */
export const publicKeyB64 = z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'expected 32-byte base64url key');

export const deviceInputSchema = z
  .object({
    signingPublicKey: publicKeyB64,
    boxPublicKey: publicKeyB64,
    label: schemas.text(1, 40).optional(),
  })
  .strict();
export type DeviceInput = z.infer<typeof deviceInputSchema>;

export const envelopeSchema = z
  .object({
    v: z.literal(1),
    ctx: z.string().max(64),
    signer: z.string().max(120),
    payload: z.unknown(),
    sig: z.string().max(120),
  })
  .strict();

export const toEnvelope = (e: z.infer<typeof envelopeSchema>): SignedEnvelope<unknown> => ({
  v: e.v,
  ctx: e.ctx,
  signer: e.signer,
  payload: e.payload,
  sig: e.sig,
});

export const accountIdSchema = schemas.id('acct');
export const expectedVersionSchema = z.number().int().nonnegative().optional();
export const pageSchema = {
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).max(10_000).default(0),
};
