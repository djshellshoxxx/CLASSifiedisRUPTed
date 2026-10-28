/**
 * F07.S01.M02 sessions: challenge-response login with a device signing key. The server never sees a
 * password; the bearer token is random, shown once and stored only as a hash. Sessions expire
 * absolutely after 30 days and after 7 days without use (sliding).
 */
import type { Actor, CommandContext, EventInput } from '@classrup/kernel';
import { conflict, DAY, forbidden, MINUTE, parse, precondition, runCommand, schemas, unauthenticated, z, isId, notFound } from '@classrup/kernel';
import { hashToken, randomToken, tokenMatches, verifyEnvelope } from '@classrup/security';
import type { IdentityEnv } from '../env';
import { authorize, checkFlag, EVENTS, event, FLAGS, ownerRef, requireAccount } from '../env';
import type { SessionRecord } from '../records';
import { accountIdSchema, envelopeSchema, toEnvelope } from '../schemas';
import { activeDevices } from './model';
import { lookupAccountByPseudonym } from './naming';

export const CHALLENGE_TTL_MS = 5 * MINUTE;
export const SESSION_ABSOLUTE_TTL_MS = 30 * DAY;
export const SESSION_IDLE_TTL_MS = 7 * DAY;
/** Sliding expiry is refreshed at most this often so reads do not turn into a write per request. */
export const TOUCH_GRANULARITY_MS = MINUTE;
export const MAX_ACTIVE_SESSIONS = 20;
const SESSION_RETENTION_MS = 30 * DAY;
const CHALLENGE_RETENTION_MS = 60 * MINUTE;
const AUTH_CONTEXT = 'auth-challenge';

type RevokeReason = NonNullable<SessionRecord['revokedReason']>;

export interface SessionDto {
  readonly id: string;
  readonly deviceId: string;
  readonly signingKeyId: string;
  readonly createdAt: number;
  readonly lastSeenAt: number;
  readonly expiresAt: number;
  readonly idleExpiresAt: number;
  readonly status: 'active' | 'expired' | 'revoked';
  readonly current: boolean;
}

export interface ChallengeDto {
  readonly challengeId: string;
  readonly nonce: string;
  readonly accountId: string;
  readonly expiresAt: number;
}

export interface LoginDto {
  readonly sessionId: string;
  /** Bearer token, returned exactly once. */
  readonly token: string;
  readonly accountId: string;
  readonly expiresAt: number;
  readonly idleExpiresAt: number;
}

export const isSessionLive = (s: SessionRecord, now: number): boolean => s.revokedAt === undefined && now < s.expiresAt && now < s.idleExpiresAt;

function sessionStatus(s: SessionRecord, now: number): SessionDto['status'] {
  if (s.revokedAt !== undefined) return 'revoked';
  return isSessionLive(s, now) ? 'active' : 'expired';
}

const toSessionDto = (s: SessionRecord, now: number, currentId: string | undefined): SessionDto => ({
  id: s.id,
  deviceId: s.deviceId,
  signingKeyId: s.signingKeyId,
  createdAt: s.createdAt,
  lastSeenAt: s.lastSeenAt,
  expiresAt: s.expiresAt,
  idleExpiresAt: s.idleExpiresAt,
  status: sessionStatus(s, now),
  current: s.id === currentId,
});

/** Revokes live sessions of an account inside the caller's transaction and returns the events to emit. */
export function revokeAccountSessions(
  env: IdentityEnv,
  accountId: string,
  reason: RevokeReason,
  filter: { signingKeyId?: string; exceptSessionId?: string } = {},
): EventInput<unknown>[] {
  const now = env.deps.clock.now();
  const targets = env.stores.sessions.list(
    (s) =>
      s.accountId === accountId &&
      isSessionLive(s, now) &&
      s.id !== filter.exceptSessionId &&
      (filter.signingKeyId === undefined || s.signingKeyId === filter.signingKeyId),
  );
  return targets.map((s) => {
    const stored = env.stores.sessions.put({ ...s, revokedAt: now, revokedReason: reason }, s.version);
    return event(EVENTS.sessionRevoked, 'session', s.id, stored.version, { sessionId: s.id, accountId, reason });
  });
}

const challengeSchema = z
  .object({ accountId: accountIdSchema.optional(), pseudonym: z.string().max(64).optional(), signingKeyId: z.string().max(120) })
  .strict()
  .refine((v) => (v.accountId === undefined) !== (v.pseudonym === undefined), 'provide exactly one of accountId or pseudonym');
const loginSchema = z.object({ proof: envelopeSchema }).strict();
const challengePayloadSchema = z.object({ challengeId: schemas.id('chl'), nonce: z.string().max(100), accountId: accountIdSchema }).strict();
const revokeSchema = z.object({ sessionId: schemas.id('ses') }).strict();
const revokeAllSchema = z.object({ includeCurrent: z.boolean().default(false) }).strict();

export interface SessionService {
  issueChallenge(ctx: CommandContext, input: z.input<typeof challengeSchema>): ChallengeDto;
  login(ctx: CommandContext, input: z.input<typeof loginSchema>): LoginDto;
  list(ctx: CommandContext): SessionDto[];
  revoke(ctx: CommandContext, input: z.input<typeof revokeSchema>): SessionDto;
  revokeAll(ctx: CommandContext, input?: z.input<typeof revokeAllSchema>): { revoked: number };
  expireDue(ctx: CommandContext): { expiredSessions: number; purgedSessions: number; purgedChallenges: number };
  /** Relay entry point: resolves a bearer token to an Actor, or undefined. Slides the idle window. */
  authenticate(token: string): Actor | undefined;
}

export function createSessionService(env: IdentityEnv): SessionService {
  const { deps, stores, ports } = env;

  function resolveChallengeAccount(ctx: CommandContext, i: z.output<typeof challengeSchema>) {
    const tenantId = ctx.actor.tenantId;
    const account = i.accountId !== undefined ? stores.accounts.get(i.accountId) : lookupAccountByPseudonym(env, tenantId, i.pseudonym ?? '');
    if (!account || account.tenantId !== tenantId) throw notFound('IDENTITY.ACCOUNT_NOT_FOUND', 'account not found');
    return account;
  }

  function enforceSessionCap(accountId: string, now: number): EventInput<unknown>[] {
    const live = stores.sessions.list((s) => s.accountId === accountId && isSessionLive(s, now)).sort((a, b) => a.createdAt - b.createdAt);
    const overflow = live.slice(0, Math.max(0, live.length - MAX_ACTIVE_SESSIONS + 1));
    return overflow.map((s) => {
      const stored = stores.sessions.put({ ...s, revokedAt: now, revokedReason: 'revoked' }, s.version);
      return event(EVENTS.sessionRevoked, 'session', s.id, stored.version, { sessionId: s.id, accountId, reason: 'revoked' });
    });
  }

  return {
    issueChallenge(ctx, input) {
      const i = parse(challengeSchema, input);
      authorize(env, ctx, 'identity.session:challenge', { type: 'session', tenantId: ctx.actor.tenantId });
      checkFlag(env, ctx, FLAGS.sessions);
      const account = resolveChallengeAccount(ctx, i);
      ports.rateLimit.consume(`identity.challenge:${account.id}`);
      if (account.status !== 'active') throw forbidden('IDENTITY.ACCOUNT_INACTIVE', 'account is not active');
      if (!activeDevices(account).some((d) => d.signingKeyId === i.signingKeyId)) {
        throw unauthenticated('IDENTITY.LOGIN_FAILED', 'unknown device key');
      }
      return runCommand(deps, ctx, { name: 'identity.session.challenge', flag: FLAGS.sessions, request: i }, () => {
        const now = deps.clock.now();
        const id = deps.ids.next('chl');
        const nonce = randomToken(24);
        stores.challenges.put(
          { id, tenantId: account.tenantId, accountId: account.id, signingKeyId: i.signingKeyId, nonce, issuedAt: now, expiresAt: now + CHALLENGE_TTL_MS },
          0,
        );
        return { result: { challengeId: id, nonce, accountId: account.id, expiresAt: now + CHALLENGE_TTL_MS } };
      });
    },

    login(ctx, input) {
      const i = parse(loginSchema, input);
      authorize(env, ctx, 'identity.session:login', { type: 'session', tenantId: ctx.actor.tenantId });
      const proof = toEnvelope(i.proof);
      const claims = parse(challengePayloadSchema, proof.payload, 'IDENTITY.LOGIN_FAILED');
      return runCommand(deps, ctx, { name: 'identity.session.login', flag: FLAGS.sessions, request: i }, () => {
        const now = deps.clock.now();
        const challenge = stores.challenges.get(claims.challengeId);
        const valid =
          challenge !== undefined &&
          challenge.tenantId === ctx.actor.tenantId &&
          challenge.accountId === claims.accountId &&
          challenge.nonce === claims.nonce &&
          challenge.signingKeyId === proof.signer &&
          verifyEnvelope(proof, AUTH_CONTEXT, challenge.signingKeyId);
        if (!valid) throw unauthenticated('IDENTITY.LOGIN_FAILED', 'challenge response rejected');
        if (challenge.usedAt !== undefined) throw conflict('IDENTITY.CHALLENGE_USED', 'challenge already used');
        if (now >= challenge.expiresAt) throw precondition('IDENTITY.CHALLENGE_EXPIRED', 'challenge expired');
        const account = requireAccount(env, challenge.accountId, ctx.actor.tenantId);
        if (account.status !== 'active') throw forbidden('IDENTITY.ACCOUNT_INACTIVE', 'account is not active');
        const device = activeDevices(account).find((d) => d.signingKeyId === challenge.signingKeyId);
        if (!device) throw unauthenticated('IDENTITY.LOGIN_FAILED', 'device key is no longer active');

        stores.challenges.put({ ...challenge, usedAt: now }, challenge.version);
        const capEvents = enforceSessionCap(account.id, now);
        const id = deps.ids.next('ses');
        const token = `${id}.${randomToken(32)}`;
        const expiresAt = now + SESSION_ABSOLUTE_TTL_MS;
        const idleExpiresAt = Math.min(expiresAt, now + SESSION_IDLE_TTL_MS);
        const stored = stores.sessions.put(
          {
            id,
            tenantId: account.tenantId,
            accountId: account.id,
            deviceId: device.id,
            signingKeyId: device.signingKeyId,
            tokenHash: hashToken(token),
            createdAt: now,
            expiresAt,
            idleExpiresAt,
            lastSeenAt: now,
          },
          0,
        );
        return {
          result: { sessionId: id, token, accountId: account.id, expiresAt, idleExpiresAt },
          events: [...capEvents, event(EVENTS.sessionCreated, 'session', id, stored.version, { sessionId: id, accountId: account.id, signingKeyId: device.signingKeyId })],
        };
      });
    },

    list(ctx) {
      authorize(env, ctx, 'identity.session:read', ownerRef('session', ctx.actor.id, ctx.actor.tenantId));
      checkFlag(env, ctx, FLAGS.sessions);
      const now = deps.clock.now();
      return stores.sessions
        .list((s) => s.accountId === ctx.actor.id)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 50)
        .map((s) => toSessionDto(s, now, ctx.actor.sessionId));
    },

    revoke(ctx, input) {
      const i = parse(revokeSchema, input);
      const session = stores.sessions.get(i.sessionId);
      if (!session || session.tenantId !== ctx.actor.tenantId) throw notFound('IDENTITY.SESSION_NOT_FOUND', 'session not found');
      authorize(env, ctx, 'identity.session:revoke', ownerRef('session', session.accountId, session.tenantId, session.id));
      return runCommand(deps, ctx, { name: 'identity.session.revoke', flag: FLAGS.sessions, request: i }, () => {
        const now = deps.clock.now();
        const current = stores.sessions.require(session.id);
        if (current.revokedAt !== undefined) return { result: toSessionDto(current, now, ctx.actor.sessionId) };
        const reason: RevokeReason = current.id === ctx.actor.sessionId ? 'logout' : 'revoked';
        const stored = stores.sessions.put({ ...current, revokedAt: now, revokedReason: reason }, current.version);
        return {
          result: toSessionDto(stored, now, ctx.actor.sessionId),
          events: [event(EVENTS.sessionRevoked, 'session', stored.id, stored.version, { sessionId: stored.id, accountId: stored.accountId, reason })],
        };
      });
    },

    revokeAll(ctx, input = {}) {
      const i = parse(revokeAllSchema, input);
      authorize(env, ctx, 'identity.session:revoke', ownerRef('session', ctx.actor.id, ctx.actor.tenantId));
      return runCommand(deps, ctx, { name: 'identity.session.revoke_all', flag: FLAGS.sessions, request: i }, () => {
        const except = i.includeCurrent ? undefined : ctx.actor.sessionId;
        const events = revokeAccountSessions(env, ctx.actor.id, 'revoked', except !== undefined ? { exceptSessionId: except } : {});
        return { result: { revoked: events.length }, events };
      });
    },

    expireDue(ctx) {
      authorize(env, ctx, 'identity.session:expire', { type: 'session', tenantId: ctx.actor.tenantId });
      return runCommand(deps, ctx, { name: 'identity.session.expire_due', flag: FLAGS.sessions }, () => {
        const now = deps.clock.now();
        const lapsed = stores.sessions.list((s) => s.tenantId === ctx.actor.tenantId && s.revokedAt === undefined && !isSessionLive(s, now));
        const events = lapsed.map((s) => {
          const stored = stores.sessions.put({ ...s, revokedAt: now, revokedReason: 'expired' }, s.version);
          return event(EVENTS.sessionExpired, 'session', s.id, stored.version, { sessionId: s.id, accountId: s.accountId });
        });
        const stale = stores.sessions.list((s) => s.tenantId === ctx.actor.tenantId && s.revokedAt !== undefined && s.revokedAt + SESSION_RETENTION_MS <= now);
        for (const s of stale) stores.sessions.delete(s.id, s.version);
        const oldChallenges = stores.challenges.list((c) => c.tenantId === ctx.actor.tenantId && c.expiresAt + CHALLENGE_RETENTION_MS <= now);
        for (const c of oldChallenges) stores.challenges.delete(c.id, c.version);
        return {
          result: { expiredSessions: lapsed.length, purgedSessions: stale.length, purgedChallenges: oldChallenges.length },
          events,
        };
      });
    },

    authenticate(token) {
      const sessionId = token.slice(0, token.indexOf('.'));
      if (!isId(sessionId, 'ses')) return undefined;
      const session = stores.sessions.get(sessionId);
      if (!session || !tokenMatches(token, session.tokenHash)) return undefined;
      const now = deps.clock.now();
      if (!isSessionLive(session, now) || !deps.flags.isEnabled(FLAGS.sessions, session.tenantId)) return undefined;
      const account = stores.accounts.get(session.accountId);
      const deviceActive = account !== undefined && activeDevices(account).some((d) => d.id === session.deviceId);
      if (!account || account.status !== 'active' || !deviceActive) return undefined;
      if (now - session.lastSeenAt >= TOUCH_GRANULARITY_MS) {
        stores.sessions.put({ ...session, lastSeenAt: now, idleExpiresAt: Math.min(session.expiresAt, now + SESSION_IDLE_TTL_MS) }, session.version);
      }
      return { kind: 'user', id: account.id, roles: account.roles, tenantId: account.tenantId, sessionId: session.id };
    },
  };
}
