/**
 * F07.S02.M01 portable identity. The relay never holds private keys, so export is two steps: the
 * relay builds the unsigned document, the client signs it with a device key (context
 * `portable-identity`). Another relay verifies the signature and, on import, requires key
 * continuity: the signing key must already be an active key of the importing account, proving the
 * same person controls both identities. Documents are versioned and age-limited.
 */
import type { CommandContext } from '@classrup/kernel';
import { CELL_RE, conflict, DAY, forbidden, MINUTE, parse, precondition, PUBLIC_CELL_PRECISION, runCommand, schemas, validationError, z } from '@classrup/kernel';
import { contentHash, verifyEnvelope } from '@classrup/security';
import { activeSigningKeyIds } from '../accounts/model';
import type { IdentityEnv } from '../env';
import { authorize, checkFlag, deriveId, EVENTS, event, FLAGS, ownerRef, requireAccount } from '../env';
import type { ProfileField } from '../records';
import { envelopeSchema, toEnvelope } from '../schemas';
import { DEFAULT_VISIBILITY, emptyProfile, isVisibleTo, languageSchema } from './profiles';

export const PORTABLE_FORMAT = 'classrup.identity';
export const PORTABLE_VERSION = 1;
export const PORTABLE_CONTEXT = 'portable-identity';
export const PORTABLE_MAX_AGE_MS = 30 * DAY;
const CLOCK_SKEW_MS = 5 * MINUTE;
const MAX_IMPORT_HISTORY = 20;
const APPLICABLE_FIELDS = ['displayName', 'bio', 'languages', 'regionCell'] as const;

const documentSchema = z
  .object({
    format: z.literal(PORTABLE_FORMAT),
    version: z.literal(PORTABLE_VERSION),
    pseudonym: z.string().min(3).max(64),
    createdAt: z.number().int().nonnegative(),
    exportedAt: z.number().int().nonnegative(),
    keys: z.object({ signingKeyIds: z.array(z.string().max(120)).min(1).max(20), boxKeyIds: z.array(z.string().max(120)).max(20) }).strict(),
    profile: z
      .object({
        displayName: schemas.text(1, 50).optional(),
        bio: schemas.text(1, 500).optional(),
        languages: z.array(languageSchema).max(8).optional(),
        regionCell: z.string().regex(CELL_RE).max(PUBLIC_CELL_PRECISION).optional(),
      })
      .strict(),
  })
  .strict();
export type PortableDocument = z.infer<typeof documentSchema>;

export interface PortableVerification {
  readonly valid: boolean;
  readonly reason?: 'signature' | 'format' | 'signer_not_listed';
  readonly pseudonym?: string;
  readonly signerKeyId?: string;
  readonly exportedAt?: number;
}

const verifySchema = z.object({ envelope: envelopeSchema }).strict();
const importSchema = z.object({ envelope: envelopeSchema, applyProfile: z.boolean().default(false) }).strict();

export interface PortableService {
  /** Unsigned document the client must sign with a device key. */
  document(ctx: CommandContext): PortableDocument;
  /** Stateless verification: signature, format and that the signer is one of the document's own keys. */
  verify(ctx: CommandContext, input: z.input<typeof verifySchema>): PortableVerification;
  import(ctx: CommandContext, input: z.input<typeof importSchema>): { imported: true; sourcePseudonym: string; applied: ProfileField[] };
}

interface Inspection {
  readonly verification: PortableVerification;
  readonly document?: PortableDocument;
}

export function inspectPortable(raw: z.infer<typeof envelopeSchema>): Inspection {
  const envelope = toEnvelope(raw);
  if (!verifyEnvelope(envelope, PORTABLE_CONTEXT)) return { verification: { valid: false, reason: 'signature' } };
  const parsed = documentSchema.safeParse(envelope.payload);
  if (!parsed.success) return { verification: { valid: false, reason: 'format' } };
  const document = parsed.data;
  if (!document.keys.signingKeyIds.includes(envelope.signer)) return { verification: { valid: false, reason: 'signer_not_listed' } };
  return {
    document,
    verification: { valid: true, pseudonym: document.pseudonym, signerKeyId: envelope.signer, exportedAt: document.exportedAt },
  };
}

export function createPortableService(env: IdentityEnv): PortableService {
  const { deps, stores } = env;

  return {
    document(ctx) {
      authorize(env, ctx, 'identity.portable:export', ownerRef('account', ctx.actor.id, ctx.actor.tenantId, ctx.actor.id));
      checkFlag(env, ctx, FLAGS.portable);
      const account = requireAccount(env, ctx.actor.id, ctx.actor.tenantId);
      const profile = stores.profiles.get(deriveId('prof', account.id));
      const publicField = (field: ProfileField): boolean => profile !== undefined && isVisibleTo(profile.visibility[field], 'public');
      return {
        format: PORTABLE_FORMAT,
        version: PORTABLE_VERSION,
        pseudonym: account.pseudonym,
        createdAt: account.createdAt,
        exportedAt: deps.clock.now(),
        keys: { signingKeyIds: activeSigningKeyIds(account), boxKeyIds: account.devices.filter((d) => d.status === 'active').map((d) => d.boxKeyId) },
        profile: {
          ...(profile?.displayName !== undefined && publicField('displayName') ? { displayName: profile.displayName } : {}),
          ...(profile?.bio !== undefined && publicField('bio') ? { bio: profile.bio } : {}),
          ...(profile !== undefined && profile.languages.length > 0 && publicField('languages') ? { languages: [...profile.languages] } : {}),
          ...(profile?.regionCell !== undefined && publicField('regionCell') ? { regionCell: profile.regionCell } : {}),
        },
      };
    },

    verify(ctx, input) {
      const i = parse(verifySchema, input);
      authorize(env, ctx, 'identity.portable:verify', { type: 'portable', tenantId: ctx.actor.tenantId });
      checkFlag(env, ctx, FLAGS.portable);
      return inspectPortable(i.envelope).verification;
    },

    import(ctx, input) {
      const i = parse(importSchema, input);
      authorize(env, ctx, 'identity.portable:import', ownerRef('account', ctx.actor.id, ctx.actor.tenantId, ctx.actor.id));
      return runCommand(deps, ctx, { name: 'identity.portable.import', flag: FLAGS.portable, request: i }, () => {
        const { verification, document } = inspectPortable(i.envelope);
        if (!verification.valid || !document || !verification.signerKeyId) {
          throw validationError('IDENTITY.PORTABLE_INVALID', 'portable identity document rejected', { reason: verification.reason ?? 'format' });
        }
        const signerKeyId = verification.signerKeyId;
        const account = requireAccount(env, ctx.actor.id, ctx.actor.tenantId);
        if (!activeSigningKeyIds(account).includes(signerKeyId)) {
          throw forbidden('IDENTITY.PORTABLE_KEY_MISMATCH', 'document must be signed by a key active on this account');
        }
        const now = deps.clock.now();
        if (document.exportedAt > now + CLOCK_SKEW_MS || now - document.exportedAt > PORTABLE_MAX_AGE_MS) {
          throw precondition('IDENTITY.PORTABLE_STALE', 'document is outside the accepted age window');
        }
        const documentHash = contentHash(document);
        const existing = stores.profiles.get(deriveId('prof', account.id));
        if (existing?.imports.some((m) => m.documentHash === documentHash)) throw conflict('IDENTITY.PORTABLE_ALREADY_IMPORTED', 'document already imported');

        const base = existing ?? emptyProfile(account.id, account.tenantId, now);
        const applied: ProfileField[] = [];
        const fields: Record<string, unknown> = {};
        if (i.applyProfile) {
          for (const field of APPLICABLE_FIELDS) {
            const value = document.profile[field];
            if (value === undefined) continue;
            fields[field] = value;
            applied.push(field);
          }
        }
        const entry = { documentHash, sourcePseudonym: document.pseudonym, signingKeyId: signerKeyId, importedAt: now };
        const visibility = { ...base.visibility, ...Object.fromEntries(applied.map((f) => [f, DEFAULT_VISIBILITY[f]])) };
        const stored = stores.profiles.put(
          { ...base, ...fields, visibility, imports: [...base.imports, entry].slice(-MAX_IMPORT_HISTORY), updatedAt: now },
          existing?.version ?? 0,
        );
        return {
          result: { imported: true as const, sourcePseudonym: document.pseudonym, applied },
          events: [event(EVENTS.portableImported, 'profile', stored.id, stored.version, { accountId: account.id, documentHash, sourcePseudonym: document.pseudonym })],
        };
      });
    },
  };
}
