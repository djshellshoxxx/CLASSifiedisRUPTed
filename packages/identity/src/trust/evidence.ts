/**
 * F07.S03.M02 trust evidence. Two honest levels: a self-attested claim (the user says so) and a
 * verified attestation (signed by an attester key an admin registered as a trusted verifier).
 * A signature evidences that the attester asserted the fact; it is revoked or lapses with the
 * attester's trust. Public DTOs expose only kind and a verified flag, never documents or notes.
 */
import type { CommandContext } from '@classrup/kernel';
import { assertVersion, conflict, forbidden, MINUTE, notFound, parse, precondition, runCommand, schemas, validationError, z } from '@classrup/kernel';
import { contentHash, publicKeyFromKeyId, verifyEnvelope } from '@classrup/security';
import type { IdentityEnv } from '../env';
import { authorize, checkFlag, EVENTS, event, FLAGS, ownerRef } from '../env';
import type { AttesterRecord, EvidenceRecord, EvidenceStatus } from '../records';
import { accountIdSchema, envelopeSchema, expectedVersionSchema, toEnvelope } from '../schemas';

export const ATTESTATION_CONTEXT = 'identity-attestation';
const CLOCK_SKEW_MS = 5 * MINUTE;
const kindSchema = z.string().regex(/^[a-z][a-z0-9_]{2,31}$/);

export interface PublicEvidenceDto {
  readonly kind: string;
  readonly verified: boolean;
  readonly issuedAt: number;
  readonly expiresAt?: number;
}

export interface OwnerEvidenceDto extends PublicEvidenceDto {
  readonly id: string;
  readonly level: EvidenceRecord['level'];
  readonly status: EvidenceStatus;
  readonly note?: string;
  readonly revokedAt?: number;
  readonly version: number;
}

export interface AttesterDto {
  readonly keyId: string;
  readonly label: string;
  readonly kinds: readonly string[];
  readonly status: AttesterRecord['status'];
  readonly registeredAt: number;
  readonly revokedAt?: number;
}

const attesterId = (tenantId: string, keyId: string): string => `${tenantId}/${keyId}`;

export const effectiveStatus = (e: EvidenceRecord, now: number): EvidenceStatus =>
  e.status === 'active' && e.expiresAt !== undefined && now >= e.expiresAt ? 'expired' : e.status;

const attestationSchema = z
  .object({ accountId: accountIdSchema, kind: kindSchema, issuedAt: schemas.timestamp(), expiresAt: schemas.timestamp().optional() })
  .strict();

const claimSchema = z
  .object({ kind: kindSchema, note: schemas.text(1, 200).optional(), expiresAt: schemas.timestamp().optional() })
  .strict();
const attestSchema = z.object({ attestation: envelopeSchema }).strict();
const revokeSchema = z.object({ evidenceId: schemas.id('tev'), reason: schemas.text(3, 200), expectedVersion: expectedVersionSchema }).strict();
const listSchema = z.object({ accountId: accountIdSchema }).strict();
const registerAttesterSchema = z.object({ keyId: z.string().max(120), label: schemas.text(2, 60), kinds: z.array(kindSchema).min(1).max(20) }).strict();
const revokeAttesterSchema = z.object({ keyId: z.string().max(120) }).strict();

export interface EvidenceService {
  claim(ctx: CommandContext, input: z.input<typeof claimSchema>): OwnerEvidenceDto;
  attest(ctx: CommandContext, input: z.input<typeof attestSchema>): OwnerEvidenceDto;
  revoke(ctx: CommandContext, input: z.input<typeof revokeSchema>): OwnerEvidenceDto;
  listPublic(ctx: CommandContext, input: z.input<typeof listSchema>): PublicEvidenceDto[];
  listMine(ctx: CommandContext): OwnerEvidenceDto[];
  expireDue(ctx: CommandContext): { expired: number };
  registerAttester(ctx: CommandContext, input: z.input<typeof registerAttesterSchema>): AttesterDto;
  revokeAttester(ctx: CommandContext, input: z.input<typeof revokeAttesterSchema>): AttesterDto;
  listAttesters(ctx: CommandContext): AttesterDto[];
}

export function createEvidenceService(env: IdentityEnv): EvidenceService {
  const { deps, stores } = env;

  const attesterFor = (e: EvidenceRecord): AttesterRecord | undefined =>
    e.attesterKeyId === undefined ? undefined : stores.attesters.get(attesterId(e.tenantId, e.attesterKeyId));

  const isVerified = (e: EvidenceRecord, now: number): boolean =>
    e.level === 'verified' && effectiveStatus(e, now) === 'active' && attesterFor(e)?.status === 'active';

  const toPublic = (e: EvidenceRecord, now: number): PublicEvidenceDto => ({
    kind: e.kind,
    verified: isVerified(e, now),
    issuedAt: e.issuedAt,
    ...(e.expiresAt !== undefined ? { expiresAt: e.expiresAt } : {}),
  });

  const toOwner = (e: EvidenceRecord, now: number): OwnerEvidenceDto => ({
    ...toPublic(e, now),
    id: e.id,
    level: e.level,
    status: effectiveStatus(e, now),
    ...(e.note !== undefined ? { note: e.note } : {}),
    ...(e.revokedAt !== undefined ? { revokedAt: e.revokedAt } : {}),
    version: e.version,
  });

  const toAttesterDto = (a: AttesterRecord): AttesterDto => ({
    keyId: a.keyId,
    label: a.label,
    kinds: a.kinds,
    status: a.status,
    registeredAt: a.registeredAt,
    ...(a.revokedAt !== undefined ? { revokedAt: a.revokedAt } : {}),
  });

  const isLive = (e: EvidenceRecord, now: number): boolean => effectiveStatus(e, now) === 'active';

  return {
    claim(ctx, input) {
      const i = parse(claimSchema, input);
      authorize(env, ctx, 'identity.evidence:claim', ownerRef('evidence', ctx.actor.id, ctx.actor.tenantId));
      return runCommand(deps, ctx, { name: 'identity.evidence.claim', flag: FLAGS.evidence, request: i }, () => {
        const now = deps.clock.now();
        if (i.expiresAt !== undefined && i.expiresAt <= now) throw validationError('IDENTITY.EVIDENCE_EXPIRY_PAST', 'expiry must be in the future');
        const duplicate = stores.evidence.count(
          (e) => e.accountId === ctx.actor.id && e.kind === i.kind && e.level === 'self_attested' && isLive(e, now),
        );
        if (duplicate > 0) throw conflict('IDENTITY.EVIDENCE_EXISTS', 'an active claim of this kind already exists');
        const id = deps.ids.next('tev');
        const stored = stores.evidence.put(
          {
            id,
            tenantId: ctx.actor.tenantId,
            accountId: ctx.actor.id,
            kind: i.kind,
            level: 'self_attested',
            status: 'active',
            issuedAt: now,
            ...(i.note !== undefined ? { note: i.note } : {}),
            ...(i.expiresAt !== undefined ? { expiresAt: i.expiresAt } : {}),
          },
          0,
        );
        return {
          result: toOwner(stored, now),
          events: [event(EVENTS.evidenceClaimed, 'evidence', id, stored.version, { evidenceId: id, accountId: ctx.actor.id, kind: i.kind })],
        };
      });
    },

    attest(ctx, input) {
      const i = parse(attestSchema, input);
      authorize(env, ctx, 'identity.evidence:attest', ownerRef('evidence', ctx.actor.id, ctx.actor.tenantId));
      return runCommand(deps, ctx, { name: 'identity.evidence.attest', flag: FLAGS.evidence, request: i }, () => {
        const envelope = toEnvelope(i.attestation);
        if (!verifyEnvelope(envelope, ATTESTATION_CONTEXT)) throw validationError('IDENTITY.ATTESTATION_INVALID', 'attestation signature rejected');
        const claims = parse(attestationSchema, envelope.payload, 'IDENTITY.ATTESTATION_INVALID');
        const attester = stores.attesters.get(attesterId(ctx.actor.tenantId, envelope.signer));
        if (!attester || attester.status !== 'active' || !attester.kinds.includes(claims.kind)) {
          throw forbidden('IDENTITY.ATTESTER_UNTRUSTED', 'signer is not a trusted attester for this kind');
        }
        if (claims.accountId !== ctx.actor.id) throw forbidden('IDENTITY.ATTESTATION_SUBJECT', 'attestation was issued for another account');
        const now = deps.clock.now();
        if (claims.issuedAt > now + CLOCK_SKEW_MS) throw validationError('IDENTITY.ATTESTATION_INVALID', 'attestation issued in the future');
        if (claims.expiresAt !== undefined && claims.expiresAt <= now) throw precondition('IDENTITY.ATTESTATION_EXPIRED', 'attestation already expired');
        const attestationHash = contentHash({ signer: envelope.signer, payload: envelope.payload, sig: envelope.sig });
        if (stores.evidence.count((e) => e.accountId === ctx.actor.id && e.attestationHash === attestationHash) > 0) {
          throw conflict('IDENTITY.ATTESTATION_DUPLICATE', 'attestation already submitted');
        }
        const id = deps.ids.next('tev');
        const stored = stores.evidence.put(
          {
            id,
            tenantId: ctx.actor.tenantId,
            accountId: ctx.actor.id,
            kind: claims.kind,
            level: 'verified',
            status: 'active',
            attesterKeyId: envelope.signer,
            attestationHash,
            issuedAt: claims.issuedAt,
            ...(claims.expiresAt !== undefined ? { expiresAt: claims.expiresAt } : {}),
          },
          0,
        );
        return {
          result: toOwner(stored, now),
          events: [
            event(EVENTS.evidenceAttested, 'evidence', id, stored.version, {
              evidenceId: id,
              accountId: ctx.actor.id,
              kind: claims.kind,
              attesterKeyId: envelope.signer,
            }),
          ],
        };
      });
    },

    revoke(ctx, input) {
      const i = parse(revokeSchema, input);
      const existing = stores.evidence.get(i.evidenceId);
      if (!existing || existing.tenantId !== ctx.actor.tenantId) throw notFound('IDENTITY.EVIDENCE_NOT_FOUND', 'evidence not found');
      authorize(env, ctx, 'identity.evidence:revoke', ownerRef('evidence', existing.accountId, existing.tenantId, existing.id));
      return runCommand(deps, ctx, { name: 'identity.evidence.revoke', flag: FLAGS.evidence, request: i }, () => {
        const e = stores.evidence.require(i.evidenceId);
        assertVersion('evidence', e.version, i.expectedVersion);
        if (e.status === 'revoked') return { result: toOwner(e, deps.clock.now()) };
        const now = deps.clock.now();
        const stored = stores.evidence.put({ ...e, status: 'revoked', revokedAt: now, revokedReason: i.reason }, e.version);
        return {
          result: toOwner(stored, now),
          events: [event(EVENTS.evidenceRevoked, 'evidence', e.id, stored.version, { evidenceId: e.id, accountId: e.accountId, kind: e.kind, reason: i.reason })],
        };
      });
    },

    listPublic(ctx, input) {
      const i = parse(listSchema, input);
      authorize(env, ctx, 'identity.evidence:read', { type: 'evidence', tenantId: ctx.actor.tenantId });
      checkFlag(env, ctx, FLAGS.evidence);
      const now = deps.clock.now();
      return stores.evidence
        .list((e) => e.accountId === i.accountId && e.tenantId === ctx.actor.tenantId && isLive(e, now))
        .sort((a, b) => a.issuedAt - b.issuedAt)
        .map((e) => toPublic(e, now));
    },

    listMine(ctx) {
      authorize(env, ctx, 'identity.evidence:read_own', ownerRef('evidence', ctx.actor.id, ctx.actor.tenantId));
      checkFlag(env, ctx, FLAGS.evidence);
      const now = deps.clock.now();
      return stores.evidence
        .list((e) => e.accountId === ctx.actor.id)
        .sort((a, b) => a.issuedAt - b.issuedAt)
        .map((e) => toOwner(e, now));
    },

    expireDue(ctx) {
      authorize(env, ctx, 'identity.evidence:expire', { type: 'evidence', tenantId: ctx.actor.tenantId });
      return runCommand(deps, ctx, { name: 'identity.evidence.expire_due', flag: FLAGS.evidence }, () => {
        const now = deps.clock.now();
        const due = stores.evidence.list((e) => e.tenantId === ctx.actor.tenantId && e.status === 'active' && e.expiresAt !== undefined && e.expiresAt <= now);
        const events = due.map((e) => {
          const stored = stores.evidence.put({ ...e, status: 'expired' }, e.version);
          return event(EVENTS.evidenceExpired, 'evidence', e.id, stored.version, { evidenceId: e.id, accountId: e.accountId, kind: e.kind });
        });
        return { result: { expired: due.length }, events };
      });
    },

    registerAttester(ctx, input) {
      const i = parse(registerAttesterSchema, input);
      authorize(env, ctx, 'identity.attester:manage', { type: 'attester', tenantId: ctx.actor.tenantId });
      publicKeyFromKeyId(i.keyId);
      return runCommand(deps, ctx, { name: 'identity.attester.register', flag: FLAGS.evidence, request: i }, () => {
        const id = attesterId(ctx.actor.tenantId, i.keyId);
        const existing = stores.attesters.get(id);
        if (existing?.status === 'active') throw conflict('IDENTITY.ATTESTER_EXISTS', 'attester already registered');
        const now = deps.clock.now();
        const stored = stores.attesters.put(
          { id, tenantId: ctx.actor.tenantId, keyId: i.keyId, label: i.label, kinds: [...new Set(i.kinds)], status: 'active', registeredBy: ctx.actor.id, registeredAt: now },
          existing?.version ?? 0,
        );
        return {
          result: toAttesterDto(stored),
          events: [event(EVENTS.attesterRegistered, 'attester', id, stored.version, { keyId: i.keyId, kinds: stored.kinds })],
        };
      });
    },

    revokeAttester(ctx, input) {
      const i = parse(revokeAttesterSchema, input);
      authorize(env, ctx, 'identity.attester:manage', { type: 'attester', tenantId: ctx.actor.tenantId });
      return runCommand(deps, ctx, { name: 'identity.attester.revoke', flag: FLAGS.evidence, request: i }, () => {
        const a = stores.attesters.get(attesterId(ctx.actor.tenantId, i.keyId));
        if (!a) throw notFound('IDENTITY.ATTESTER_NOT_FOUND', 'attester not found');
        if (a.status === 'revoked') return { result: toAttesterDto(a) };
        const stored = stores.attesters.put({ ...a, status: 'revoked', revokedAt: deps.clock.now() }, a.version);
        return {
          result: toAttesterDto(stored),
          events: [event(EVENTS.attesterRevoked, 'attester', a.id, stored.version, { keyId: a.keyId })],
        };
      });
    },

    listAttesters(ctx) {
      authorize(env, ctx, 'identity.attester:manage', { type: 'attester', tenantId: ctx.actor.tenantId });
      checkFlag(env, ctx, FLAGS.evidence);
      return stores.attesters.list((a) => a.tenantId === ctx.actor.tenantId).map(toAttesterDto);
    },
  };
}
