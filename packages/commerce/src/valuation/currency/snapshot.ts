import { appError, canonicalJson, err, ok, sha256Hex, z, type Result } from '@classrup/kernel';
import { decodeBase64url, publicKeyFromDid } from '@classrup/security';
import { keccak_256 } from '@noble/hashes/sha3.js';

export const currencyCodeSchema = z.string().regex(/^[A-Z0-9]{2,10}$/);
export const currencyNameSchema = z.string().max(120).refine(s => [...s].length >= 1 && [...s].length <= 60 && s === s.trim() && !/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u.test(s));
export const currencyStatusSchema = z.enum(['active', 'disabled', 'retired']);
export const chainSchema = z.enum(['bitcoin-mainnet', 'ethereum-mainnet']);
export type CurrencyChain = z.output<typeof chainSchema>;
const assetFields = { code: currencyCodeSchema, name: currencyNameSchema, decimals: z.int().min(0).max(36), chainId: chainSchema.optional(), contract: z.string().max(42).optional() };
export const assetSchema = z.strictObject({ ...assetFields, kind: z.enum(['fiat', 'crypto']) }).superRefine((v, ctx) => {
  if (v.kind === 'fiat' && (!/^[A-Z]{3}$/.test(v.code) || v.decimals > 18 || v.chainId !== undefined || v.contract !== undefined)) ctx.addIssue({ code: 'custom', message: 'Invalid fiat definition' });
  if (v.kind === 'crypto' && (v.chainId === undefined || (v.chainId === 'bitcoin-mainnet' && v.contract !== undefined))) ctx.addIssue({ code: 'custom', message: 'Invalid crypto binding' });
});
export type CurrencyAsset = z.output<typeof assetSchema>;
export const snapshotPayloadSchema = z.strictObject({
  schema: z.literal('classrup.commerce.currency_snapshot/v1'), version: z.iso.date(),
  sourceUrl: z.url({ protocol: /^https$/ }).max(512),
  assets: z.array(assetSchema).min(1).max(500),
});
export type CurrencySnapshotPayload = z.output<typeof snapshotPayloadSchema>;
const envelopeSchema = z.strictObject({ payload: snapshotPayloadSchema, signerDid: z.string().max(128), signature: z.string().regex(/^[A-Za-z0-9_-]{86}$/) });
export interface VerifiedCurrencySnapshot { readonly payload: CurrencySnapshotPayload; readonly signerDid: string; readonly digest: string }
const verified = new WeakSet<VerifiedCurrencySnapshot>();
export const isVerifiedCurrencySnapshot = (snapshot: VerifiedCurrencySnapshot): boolean => verified.has(snapshot);

/** EIP-55 hashes lowercase hexadecimal ASCII, not binary bytes or FIPS SHA3-256. */
export function checksumEthereumContract(address: string): string | undefined {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address) || /^0x0{40}$/.test(address)) return undefined;
  const body = address.slice(2), lower = body.toLowerCase();
  const digest = [...keccak_256(new TextEncoder().encode(lower))].map(b => b.toString(16).padStart(2, '0')).join('');
  const canonical = `0x${[...lower].map((c, i) => parseInt(digest[i]!, 16) >= 8 ? c.toUpperCase() : c).join('')}`;
  return body !== lower && body !== body.toUpperCase() && address !== canonical ? undefined : canonical;
}

export function normalizeCurrencyAsset(asset: CurrencyAsset, configured: readonly CurrencyChain[]): CurrencyAsset | undefined {
  const parsed = assetSchema.safeParse(asset);
  if (!parsed.success) return undefined;
  const value = parsed.data;
  if (value.kind === 'fiat') return value;
  if (!value.chainId || !configured.includes(value.chainId)) return undefined;
  if (value.contract !== undefined) {
    if (value.chainId !== 'ethereum-mainnet') return undefined;
    const contract = checksumEthereumContract(value.contract);
    if (contract === undefined) return undefined;
    return { ...value, contract };
  }
  return value;
}

export function currencySnapshotSigningBytes(payload: CurrencySnapshotPayload): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(`classrup.commerce.currency_snapshot/v1\0${canonicalJson(snapshotPayloadSchema.parse(payload))}`);
}

/** The trust root is release configuration, never a signer supplied by the imported snapshot itself. */
export async function verifyCurrencySnapshot(input: unknown, trustedSignerDid: string): Promise<Result<VerifiedCurrencySnapshot>> {
  try {
    const parsed = envelopeSchema.safeParse(input);
    if (!parsed.success || parsed.data.signerDid !== trustedSignerDid) return err(appError('PRECONDITION_FAILED'));
    const envelope = parsed.data;
    const codes = new Set<string>();
    for (const asset of envelope.payload.assets) {
      const canonical = normalizeCurrencyAsset(asset, ['bitcoin-mainnet', 'ethereum-mainnet']);
      if (!canonical || canonicalJson(canonical) !== canonicalJson(asset) || codes.has(asset.code)) return err(appError('VALIDATION_FAILED'));
      codes.add(asset.code);
    }
    const key = await crypto.subtle.importKey('raw', publicKeyFromDid(trustedSignerDid), 'Ed25519', false, ['verify']);
    const bytes = currencySnapshotSigningBytes(envelope.payload);
    if (!await crypto.subtle.verify('Ed25519', key, decodeBase64url(envelope.signature, 64), bytes)) return err(appError('PRECONDITION_FAILED'));
    const snapshot: VerifiedCurrencySnapshot = { payload: envelope.payload, signerDid: trustedSignerDid, digest: await sha256Hex(new TextDecoder().decode(bytes)) };
    for (const asset of snapshot.payload.assets) Object.freeze(asset);
    Object.freeze(snapshot.payload.assets); Object.freeze(snapshot.payload); Object.freeze(snapshot);
    verified.add(snapshot);
    return ok(snapshot);
  } catch { return err(appError('PRECONDITION_FAILED')); }
}
