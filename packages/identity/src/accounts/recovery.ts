/**
 * F07.S01.M03 recovery: ten high-entropy single-use codes (80 bits each, Crockford base32) shown once
 * and stored only as hashes. Using a code with a proven new device key revokes every old key and
 * session. Attempts are rate limited per account through the RateLimitPort.
 */
import type { CommandContext } from '@classrup/kernel';
import { assertVersion, forbidden, parse, runCommand, unauthenticated, validationError, z } from '@classrup/kernel';
import { hashToken, randomBytes, tokenMatches } from '@classrup/security';
import type { IdentityEnv } from '../env';
import { authorize, checkFlag, deriveId, EVENTS, event, FLAGS, ownerRef, requireAccount } from '../env';
import type { AccountRecord } from '../records';
import { deviceInputSchema, envelopeSchema, expectedVersionSchema, toEnvelope } from '../schemas';
import { newDevice, revokeAll, verifyDeviceBinding, verifyRotationAuth } from './devices';
import type { AccountDto } from './model';
import { toAccountDto } from './model';
import { lookupAccountByPseudonym } from './naming';
import { revokeAccountSessions } from './sessions';

export const RECOVERY_CODE_COUNT = 10;
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_LENGTH = 16;
const LOW_CODES_THRESHOLD = 3;

/** 10 random bytes = 80 bits = exactly 16 base32 characters. */
function encodeCrockford(bytes: Uint8Array): string {
  let out = '';
  let acc = 0;
  let bits = 0;
  for (const b of bytes) {
    acc = (acc << 8) | b;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += CROCKFORD[(acc >> bits) & 31];
    }
    acc &= (1 << bits) - 1;
  }
  return out;
}

export const formatRecoveryCode = (canonical: string): string => canonical.match(/.{4}/g)?.join('-') ?? canonical;

export function generateRecoveryCodes(count = RECOVERY_CODE_COUNT): string[] {
  return Array.from({ length: count }, () => formatRecoveryCode(encodeCrockford(randomBytes(10))));
}

/** Accepts user typing variants (case, dashes, spaces, I/L/O look-alikes) and returns the canonical 16 characters. */
export function normalizeRecoveryCode(raw: string): string {
  const canonical = raw.toUpperCase().replace(/[\s-]/g, '').replace(/[IL]/g, '1').replace(/O/g, '0');
  if (canonical.length !== CODE_LENGTH || [...canonical].some((c) => !CROCKFORD.includes(c))) {
    throw validationError('IDENTITY.RECOVERY_CODE_INVALID', 'recovery code malformed');
  }
  return canonical;
}

const hashCode = (accountId: string, canonical: string): string => hashToken(`recovery:${accountId}:${canonical}`);

/** Replaces the account's code set inside the caller's transaction and returns the new codes (shown once). */
export function storeRecoverySet(env: IdentityEnv, account: AccountRecord): string[] {
  const codes = generateRecoveryCodes();
  const id = deriveId('rcv', account.id);
  const existing = env.stores.recovery.get(id);
  env.stores.recovery.put(
    {
      id,
      tenantId: account.tenantId,
      accountId: account.id,
      codes: codes.map((c) => ({ hash: hashCode(account.id, normalizeRecoveryCode(c)) })),
      issuedAt: env.deps.clock.now(),
    },
    existing?.version ?? 0,
  );
  return codes;
}

const issueSchema = z.object({ authorization: envelopeSchema, expectedVersion: expectedVersionSchema }).strict();
const recoverSchema = z
  .object({ pseudonym: z.string().max(64), code: z.string().max(40), device: deviceInputSchema, proof: envelopeSchema })
  .strict();

export interface RecoveryStatusDto {
  readonly remaining: number;
  readonly issuedAt: number | null;
}

export interface RecoveryService {
  issue(ctx: CommandContext, input: z.input<typeof issueSchema>): { codes: string[]; issuedAt: number };
  status(ctx: CommandContext): RecoveryStatusDto;
  recover(ctx: CommandContext, input: z.input<typeof recoverSchema>): { account: AccountDto; remainingCodes: number; lowCodes: boolean };
}

export function createRecoveryService(env: IdentityEnv): RecoveryService {
  const { deps, stores, ports } = env;

  return {
    issue(ctx, input) {
      const i = parse(issueSchema, input);
      authorize(env, ctx, 'identity.recovery:issue', ownerRef('account', ctx.actor.id, ctx.actor.tenantId, ctx.actor.id));
      return runCommand(deps, ctx, { name: 'identity.recovery.issue', flag: FLAGS.recovery, request: i }, () => {
        const account = requireAccount(env, ctx.actor.id, ctx.actor.tenantId);
        if (account.status !== 'active') throw forbidden('IDENTITY.ACCOUNT_INACTIVE', 'account is not active');
        assertVersion('account', account.version, i.expectedVersion);
        verifyRotationAuth(account, toEnvelope(i.authorization), 'issue_recovery', 'recovery');
        const codes = storeRecoverySet(env, account);
        const now = deps.clock.now();
        const stored = stores.accounts.put({ ...account, keyEpoch: account.keyEpoch + 1, updatedAt: now }, account.version);
        return {
          result: { codes, issuedAt: now },
          events: [event(EVENTS.recoveryCodesIssued, 'account', account.id, stored.version, { accountId: account.id, count: codes.length })],
        };
      });
    },

    status(ctx) {
      authorize(env, ctx, 'identity.recovery:read', ownerRef('account', ctx.actor.id, ctx.actor.tenantId, ctx.actor.id));
      checkFlag(env, ctx, FLAGS.recovery);
      const set = stores.recovery.get(deriveId('rcv', ctx.actor.id));
      return { remaining: set ? set.codes.filter((c) => c.usedAt === undefined).length : 0, issuedAt: set?.issuedAt ?? null };
    },

    recover(ctx, input) {
      const i = parse(recoverSchema, input);
      authorize(env, ctx, 'identity.recovery:recover', { type: 'account', tenantId: ctx.actor.tenantId });
      const found = lookupAccountByPseudonym(env, ctx.actor.tenantId, i.pseudonym);
      if (!found || found.tenantId !== ctx.actor.tenantId) throw unauthenticated('IDENTITY.RECOVERY_FAILED', 'recovery rejected');
      // Consumed before the transaction so failed attempts still count (a rolled-back write would not).
      ports.rateLimit.consume(`identity.recover:${found.id}`);
      const canonical = normalizeRecoveryCode(i.code);
      const spec = {
        name: 'identity.recovery.recover',
        flag: FLAGS.recovery,
        // The code itself must never reach the idempotency store.
        request: { pseudonym: i.pseudonym, codeHash: hashCode(found.id, canonical), device: i.device, proof: i.proof },
      };
      try {
        return runCommand(deps, ctx, spec, () => {
          const account = requireAccount(env, found.id, ctx.actor.tenantId);
          if (account.status !== 'active') throw forbidden('IDENTITY.ACCOUNT_INACTIVE', 'account is not active');
          const set = stores.recovery.get(deriveId('rcv', account.id));
          const token = `recovery:${account.id}:${canonical}`;
          const matches = (set?.codes ?? []).map((c) => c.usedAt === undefined && tokenMatches(token, c.hash));
          const index = matches.indexOf(true);
          if (!set || index < 0) throw unauthenticated('IDENTITY.RECOVERY_FAILED', 'recovery rejected');
          const bound = verifyDeviceBinding(i.device, toEnvelope(i.proof), 'recover', account.id);

          const now = deps.clock.now();
          const revoked = account.devices.filter((d) => d.status === 'active');
          const device = newDevice(env, bound, now);
          const stored = stores.accounts.put(
            { ...account, devices: [...revokeAll(account.devices, now), device], keyEpoch: account.keyEpoch + 1, updatedAt: now },
            account.version,
          );
          const codes = set.codes.map((c, n) => (n === index ? { ...c, usedAt: now } : c));
          stores.recovery.put({ ...set, codes }, set.version);
          const remaining = codes.filter((c) => c.usedAt === undefined).length;
          const sessionEvents = revokeAccountSessions(env, account.id, 'recovery');
          deps.store.afterCommit(() =>
            ports.notifier.notify({
              tenantId: account.tenantId,
              recipientId: account.id,
              topic: 'security.account',
              template: 'identity.recovery_completed',
              data: {},
              priority: 'high',
            }),
          );
          return {
            result: { account: toAccountDto(stored), remainingCodes: remaining, lowCodes: remaining < LOW_CODES_THRESHOLD },
            events: [
              event(EVENTS.recoveryCompleted, 'account', account.id, stored.version, {
                accountId: account.id,
                newSigningKeyId: device.signingKeyId,
                revokedKeyIds: revoked.map((d) => d.signingKeyId),
                remainingCodes: remaining,
              }),
              ...sessionEvents,
            ],
          };
        });
      } catch (e) {
        deps.metrics.increment('identity.recovery.rejected', 1);
        throw e;
      }
    },
  };
}
