/**
 * F07.S01.M01 accounts and pseudonyms: registration with a user-chosen pseudonym and a proven device
 * key pair, status lifecycle, role grants (admin only), erasure hook for F10, and AccountLookup.
 * No email or phone is ever collected.
 */
import type { AccountLookup, AccountStatus, CommandContext, JsonValue, Role } from '@classrup/kernel';
import { assertTransition, assertVersion, conflict, notFound, parse, precondition, runCommand, schemas, z } from '@classrup/kernel';
import type { IdentityEnv } from '../env';
import { authorize, checkFlag, deriveId, EVENTS, event, FLAGS, ownerRef, requireAccount } from '../env';
import type { AccountRecord } from '../records';
import { accountIdSchema, deviceInputSchema, envelopeSchema, expectedVersionSchema, toEnvelope } from '../schemas';
import { newDevice, revokeAll, verifyDeviceBinding } from './devices';
import type { AccountDto, PublicAccountDto } from './model';
import { toAccountDto, toPublicAccountDto, toSnapshot } from './model';
import { lookupAccountByPseudonym, normalizePseudonym, pseudonymIndexId } from './naming';
import { storeRecoverySet } from './recovery';
import { revokeAccountSessions } from './sessions';

const STATUS_TRANSITIONS: Readonly<Record<AccountStatus, readonly AccountStatus[]>> = {
  active: ['suspended', 'deactivated', 'deleted'],
  suspended: ['active', 'deactivated', 'deleted'],
  deactivated: ['active', 'deleted'],
  deleted: [],
};

/** Roles an admin may grant. `member` is implicit and permanent; `system` is never grantable. */
const GRANTABLE_ROLES = ['merchant', 'moderator', 'support', 'admin'] as const;

const registerSchema = z
  .object({ pseudonym: z.string().max(80), device: deviceInputSchema, proof: envelopeSchema, issueRecoveryCodes: z.boolean().default(true) })
  .strict();
const lookupSchema = z.object({ accountId: accountIdSchema.optional(), pseudonym: z.string().max(80).optional() }).strict()
  .refine((v) => (v.accountId === undefined) !== (v.pseudonym === undefined), 'provide exactly one of accountId or pseudonym');
const statusSchema = z
  .object({
    accountId: accountIdSchema,
    status: z.enum(['active', 'suspended', 'deactivated']),
    reason: schemas.text(3, 200),
    expectedVersion: expectedVersionSchema,
  })
  .strict();
const roleSchema = z.object({ accountId: accountIdSchema, role: z.enum(GRANTABLE_ROLES), expectedVersion: expectedVersionSchema }).strict();
const deactivateSchema = z.object({ expectedVersion: expectedVersionSchema }).strict();
const eraseSchema = z.object({ accountId: accountIdSchema }).strict();

export interface RegisterResult {
  readonly account: AccountDto;
  /** Shown exactly once; empty when issuance was declined. */
  readonly recoveryCodes: string[];
}

export interface EraseResult {
  readonly erased: number;
  readonly retained: string[];
}

export interface AccountService {
  register(ctx: CommandContext, input: z.input<typeof registerSchema>): RegisterResult;
  me(ctx: CommandContext): AccountDto;
  lookup(ctx: CommandContext, input: z.input<typeof lookupSchema>): PublicAccountDto;
  setStatus(ctx: CommandContext, input: z.input<typeof statusSchema>): AccountDto;
  deactivate(ctx: CommandContext, input?: z.input<typeof deactivateSchema>): AccountDto;
  grantRole(ctx: CommandContext, input: z.input<typeof roleSchema>): AccountDto;
  revokeRole(ctx: CommandContext, input: z.input<typeof roleSchema>): AccountDto;
  /** Pseudonymises the account, revokes keys and sessions, deletes profile/recovery/evidence. Wired as the F10 eraser. */
  erase(ctx: CommandContext, input: z.input<typeof eraseSchema>): EraseResult;
  /** Everything identity holds about the account, for the F10 export registry. Excludes secrets and hashes. */
  exportData(accountId: string): JsonValue;
  readonly accountLookup: AccountLookup;
}

export function createAccountService(env: IdentityEnv): AccountService {
  const { deps, stores } = env;

  function changeStatus(account: AccountRecord, status: AccountStatus, reason: string, expected: number | undefined) {
    assertVersion('account', account.version, expected);
    assertTransition('IDENTITY', account.status, status, STATUS_TRANSITIONS);
    const stored = stores.accounts.put({ ...account, status, updatedAt: deps.clock.now() }, account.version);
    const sessionEvents = status === 'active' ? [] : revokeAccountSessions(env, account.id, 'account_status');
    return {
      result: toAccountDto(stored),
      events: [
        event(EVENTS.accountStatusChanged, 'account', account.id, stored.version, { accountId: account.id, from: account.status, to: status, reason }),
        ...sessionEvents,
      ],
    };
  }

  function changeRole(ctx: CommandContext, i: z.output<typeof roleSchema>, grant: boolean) {
    authorize(env, ctx, 'identity.account:grant_role', ownerRef('account', i.accountId, ctx.actor.tenantId, i.accountId));
    const name = grant ? 'identity.account.grant_role' : 'identity.account.revoke_role';
    return runCommand(deps, ctx, { name, flag: FLAGS.pseudonyms, request: i }, () => {
      const account = requireAccount(env, i.accountId, ctx.actor.tenantId);
      assertVersion('account', account.version, i.expectedVersion);
      const has = account.roles.includes(i.role);
      if (has === grant) return { result: toAccountDto(account) };
      if (!grant && i.role === 'admin' && account.id === ctx.actor.id) {
        throw precondition('IDENTITY.SELF_LOCKOUT', 'an admin cannot remove their own admin role');
      }
      const roles: Role[] = grant ? [...account.roles, i.role] : account.roles.filter((r) => r !== i.role);
      const stored = stores.accounts.put({ ...account, roles, updatedAt: deps.clock.now() }, account.version);
      const type = grant ? EVENTS.accountRoleGranted : EVENTS.accountRoleRevoked;
      return { result: toAccountDto(stored), events: [event(type, 'account', account.id, stored.version, { accountId: account.id, role: i.role })] };
    });
  }

  return {
    accountLookup: {
      get(accountId) {
        const account = stores.accounts.get(accountId);
        return account ? toSnapshot(account) : undefined;
      },
    },

    register(ctx, input) {
      const i = parse(registerSchema, input);
      authorize(env, ctx, 'identity.account:register', { type: 'account', tenantId: ctx.actor.tenantId });
      const name = normalizePseudonym(i.pseudonym);
      const bound = verifyDeviceBinding(i.device, toEnvelope(i.proof), 'register', name.key);
      return runCommand(deps, ctx, { name: 'identity.account.register', flag: FLAGS.pseudonyms, request: i }, () => {
        const tenantId = ctx.actor.tenantId;
        const indexId = pseudonymIndexId(tenantId, name.key);
        if (stores.pseudonyms.get(indexId)) throw conflict('IDENTITY.PSEUDONYM_TAKEN', 'pseudonym already in use');
        const now = deps.clock.now();
        const id = deps.ids.next('acct');
        const device = newDevice(env, bound, now);
        const stored = stores.accounts.put(
          { id, tenantId, pseudonym: name.display, pseudonymKey: name.key, status: 'active', roles: ['member'], devices: [device], keyEpoch: 0, createdAt: now, updatedAt: now },
          0,
        );
        stores.pseudonyms.put({ id: indexId, accountId: id }, 0);
        const recoveryCodes = i.issueRecoveryCodes ? storeRecoverySet(env, stored) : [];
        const events = [
          event(EVENTS.accountRegistered, 'account', id, stored.version, {
            accountId: id,
            pseudonym: stored.pseudonym,
            signingKeyId: device.signingKeyId,
            boxKeyId: device.boxKeyId,
          }),
          ...(i.issueRecoveryCodes ? [event(EVENTS.recoveryCodesIssued, 'account', id, stored.version, { accountId: id, count: recoveryCodes.length })] : []),
        ];
        return { result: { account: toAccountDto(stored), recoveryCodes }, events };
      });
    },

    me(ctx) {
      authorize(env, ctx, 'identity.account:read', ownerRef('account', ctx.actor.id, ctx.actor.tenantId, ctx.actor.id));
      checkFlag(env, ctx, FLAGS.pseudonyms);
      return toAccountDto(requireAccount(env, ctx.actor.id, ctx.actor.tenantId));
    },

    lookup(ctx, input) {
      const i = parse(lookupSchema, input);
      authorize(env, ctx, 'identity.account:lookup', { type: 'account', tenantId: ctx.actor.tenantId });
      checkFlag(env, ctx, FLAGS.pseudonyms);
      const account = i.accountId !== undefined ? stores.accounts.get(i.accountId) : lookupAccountByPseudonym(env, ctx.actor.tenantId, i.pseudonym ?? '');
      if (!account || account.tenantId !== ctx.actor.tenantId) throw notFound('IDENTITY.ACCOUNT_NOT_FOUND', 'account not found');
      return toPublicAccountDto(account);
    },

    setStatus(ctx, input) {
      const i = parse(statusSchema, input);
      authorize(env, ctx, 'identity.account:set_status', ownerRef('account', i.accountId, ctx.actor.tenantId, i.accountId));
      return runCommand(deps, ctx, { name: 'identity.account.set_status', flag: FLAGS.pseudonyms, request: i }, () =>
        changeStatus(requireAccount(env, i.accountId, ctx.actor.tenantId), i.status, i.reason, i.expectedVersion),
      );
    },

    deactivate(ctx, input = {}) {
      const i = parse(deactivateSchema, input);
      authorize(env, ctx, 'identity.account:deactivate', ownerRef('account', ctx.actor.id, ctx.actor.tenantId, ctx.actor.id));
      return runCommand(deps, ctx, { name: 'identity.account.deactivate', flag: FLAGS.pseudonyms, request: i }, () =>
        changeStatus(requireAccount(env, ctx.actor.id, ctx.actor.tenantId), 'deactivated', 'owner_request', i.expectedVersion),
      );
    },

    grantRole: (ctx, input) => changeRole(ctx, parse(roleSchema, input), true),
    revokeRole: (ctx, input) => changeRole(ctx, parse(roleSchema, input), false),

    erase(ctx, input) {
      const i = parse(eraseSchema, input);
      authorize(env, ctx, 'identity.account:erase', ownerRef('account', i.accountId, ctx.actor.tenantId, i.accountId));
      return runCommand(deps, ctx, { name: 'identity.account.erase', flag: FLAGS.pseudonyms, request: i }, () => {
        const account = requireAccount(env, i.accountId, ctx.actor.tenantId);
        if (account.status === 'deleted') return { result: { erased: 0, retained: retainedNotes() } };
        const now = deps.clock.now();
        const owned = [
          ...[stores.profiles.get(deriveId('prof', account.id))].flatMap((r) => (r ? [() => stores.profiles.delete(r.id, r.version)] : [])),
          ...[stores.recovery.get(deriveId('rcv', account.id))].flatMap((r) => (r ? [() => stores.recovery.delete(r.id, r.version)] : [])),
          ...stores.evidence.list((r) => r.accountId === account.id).map((r) => () => stores.evidence.delete(r.id, r.version)),
          ...stores.challenges.list((r) => r.accountId === account.id).map((r) => () => stores.challenges.delete(r.id, r.version)),
        ];
        for (const remove of owned) remove();
        const index = stores.pseudonyms.get(pseudonymIndexId(account.tenantId, account.pseudonymKey));
        if (index) stores.pseudonyms.delete(index.id, index.version);
        const pseudonym = `deleted_${account.id.slice(-10).toLowerCase()}`;
        const stored = stores.accounts.put(
          { ...account, pseudonym, pseudonymKey: pseudonym, status: 'deleted', roles: ['member'], devices: revokeAll(account.devices, now), updatedAt: now },
          account.version,
        );
        const sessionEvents = revokeAccountSessions(env, account.id, 'erased');
        return {
          result: { erased: owned.length + 1, retained: retainedNotes() },
          events: [event(EVENTS.accountErased, 'account', account.id, stored.version, { accountId: account.id }), ...sessionEvents],
        };
      });
    },

    exportData(accountId) {
      const account = stores.accounts.get(accountId);
      if (!account) return null;
      const profile = stores.profiles.get(deriveId('prof', accountId));
      return {
        account: { id: account.id, pseudonym: account.pseudonym, status: account.status, roles: [...account.roles], createdAt: account.createdAt },
        devices: account.devices.map((d) => ({ id: d.id, signingKeyId: d.signingKeyId, boxKeyId: d.boxKeyId, status: d.status, addedAt: d.addedAt })),
        profile: profile
          ? {
              displayName: profile.displayName ?? null,
              bio: profile.bio ?? null,
              languages: [...profile.languages],
              regionCell: profile.regionCell ?? null,
              visibility: { ...profile.visibility },
            }
          : null,
        sessions: stores.sessions
          .list((s) => s.accountId === accountId)
          .map((s) => ({ id: s.id, createdAt: s.createdAt, lastSeenAt: s.lastSeenAt, expiresAt: s.expiresAt, revokedAt: s.revokedAt ?? null })),
        feedbackGiven: stores.feedback.list((f) => f.raterId === accountId).map(feedbackExport),
        feedbackReceived: stores.feedback.list((f) => f.rateeId === accountId && f.status === 'active').map(feedbackExport),
        evidence: stores.evidence
          .list((e) => e.accountId === accountId)
          .map((e) => ({ id: e.id, kind: e.kind, level: e.level, status: e.status, issuedAt: e.issuedAt, expiresAt: e.expiresAt ?? null })),
      };
    },
  };
}

const retainedNotes = (): string[] => ['content:feedback authored by this account is kept under its erased pseudonym so counterparties keep their reputation history'];

const feedbackExport = (f: {
  id: string;
  raterId: string;
  rateeId: string;
  subjectType: string;
  rating: number;
  comment?: string;
  createdAt: number;
}): JsonValue => ({
  id: f.id,
  raterId: f.raterId,
  rateeId: f.rateeId,
  subjectType: f.subjectType,
  rating: f.rating,
  comment: f.comment ?? null,
  createdAt: f.createdAt,
});
