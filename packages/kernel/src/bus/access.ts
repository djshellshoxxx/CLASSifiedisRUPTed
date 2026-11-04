// Relay access tokens by challenge–response (CTR-CAP-001 sessions, CAP-10): the relay issues a 32-byte
// nonce (TTL 120 s); the client signs `classrup-login:v1:<relayId>:<nonce>` with a device key; the relay
// verifies via an injected verifier and issues an opaque 256-bit token stored only as its SHA-256 hash.
// Nonces are RET-EPHEMERAL and live only in this relay process: a bounded map swept on every challenge,
// consumed on first use before anything is awaited, so neither a failed login nor a rolled-back
// transaction can make a nonce usable again (T06), and unanswered challenges never reach storage.
import * as z from 'zod';
import type { Clock } from '../clock/clock.ts';
import { toIso } from '../clock/clock.ts';
import { appError, type AppError } from '../errors/app-error.ts';
import { err, ok, type Result } from '../errors/result.ts';
import { sha256Hex } from '../hash/canonical.ts';
import { webCryptoRandom, type RandomFill } from '../ids/uuidv7.ts';
import { bytesToBase64url } from '../storage/base64url.ts';
import { defineRepo } from '../storage/repo.ts';
import { writeScope, type ReadScope, type WriteScope } from '../storage/scope.ts';
import { defineCommand } from './define.ts';
import type { Storage } from '../storage/storage.ts';
import type { Tx } from '../storage/tx.ts';
import type { IdGen } from '../ids/uuidv7.ts';
import { ANONYMOUS, type Session, type SessionPort } from './ports.ts';

/**
 * Verifies a device signature for a principal (did:key); implemented by the security package.
 * It runs while the login transaction is open: read relay state (e.g. registered device keys) through
 * `repos`, never through storage.transaction() or storage.read(), which are not re-entrant.
 */
export interface SignatureVerifier {
  verify(principal: string, message: Uint8Array, signature: string, repos: Pick<ReadScope, 'repo'>): boolean | Promise<boolean>;
}

export interface RelayAccessOptions {
  readonly storage: Storage;
  readonly clock: Clock;
  readonly ids: IdGen;
  readonly relayId: string;
  /** Relay tenant that sessions belong to. */
  readonly tenantId: string;
  readonly verifier: SignatureVerifier;
  /** Relay-local roles for a principal, evaluated on every resolve() outside any transaction (CAP-6, CAP-9). */
  readonly rolesFor?: (principal: string) => readonly string[] | Promise<readonly string[]>;
  readonly random?: RandomFill;
  readonly nonceTtlMs?: number;
  /** Outstanding challenges kept in memory; the oldest is dropped when full. Default 10 000. */
  readonly maxPendingChallenges?: number;
  readonly idleTimeoutMs?: number;
  readonly absoluteTimeoutMs?: number;
}

export interface Challenge {
  readonly nonce: string;
  readonly message: string;
  readonly expiresAt: string;
}

export interface LoginInput {
  readonly principal: string;
  readonly nonce: string;
  readonly signature: string;
}

export interface LoginResult {
  readonly token: string;
  readonly expiresAt: string;
}

export interface RelayAccess extends SessionPort {
  /** Issues a single-use nonce held in process memory for nonceTtlMs; nothing is written to storage. */
  challenge(): Promise<Challenge>;
  login(input: LoginInput): Promise<Result<LoginResult, AppError>>;
  revoke(token: string): Promise<void>;
  /** Login inside an existing transaction (relay command handler); the nonce is consumed even if it rolls back. */
  loginIn(repos: Pick<WriteScope, 'repo'>, input: LoginInput): Promise<Result<LoginResult, AppError>>;
  revokeIn(repos: Pick<WriteScope, 'repo'>, token: string): Promise<Result<void, AppError>>;
  /** Unexpired outstanding challenges after sweeping expired ones. */
  pendingChallenges(): number;
  /** Deletes tokens past their absolute or idle expiry (relay maintenance sweep); returns the count. */
  purgeExpired(): Promise<Result<number, AppError>>;
}

const DAY = 24 * 60 * 60 * 1000;
const PURGE_PAGE = 500;
const tokenRepo = defineRepo({
  type: 'platform.access_token',
  schema: z.strictObject({ principal: z.string(), roles: z.array(z.string()), lastUsedAt: z.string(), absoluteExpiresAt: z.string() }),
  indexes: { absoluteExpiresAt: (d) => d.absoluteExpiresAt, lastUsedAt: (d) => d.lastUsedAt },
});

function randomToken(fill: RandomFill): string {
  const b = new Uint8Array(32);
  fill(b);
  return bytesToBase64url(b);
}

export function loginMessage(relayId: string, nonce: string): string {
  return `classrup-login:v1:${relayId}:${nonce}`;
}

type Repos = Pick<WriteScope, 'repo'>;

/** Outstanding nonces → expiry (ms) in issue order; every entry has the same TTL, so the oldest expire first. */
function createNonceStore(clock: Clock, ttl: number, capacity: number) {
  const nonces = new Map<string, number>();
  const sweep = (now: number): void => {
    for (const [nonce, expiresAt] of nonces) {
      if (expiresAt > now) break;
      nonces.delete(nonce);
    }
  };
  return {
    issue(nonce: string): number {
      const now = clock.now();
      sweep(now);
      for (const oldest of nonces.keys()) {
        if (nonces.size < capacity) break;
        nonces.delete(oldest);
      }
      nonces.set(nonce, now + ttl);
      return now + ttl;
    },
    /** Single use: removed on lookup whether or not it is still valid. */
    consume(nonce: string): boolean {
      const expiresAt = nonces.get(nonce);
      if (expiresAt === undefined) return false;
      nonces.delete(nonce);
      return expiresAt > clock.now();
    },
    size(): number {
      sweep(clock.now());
      return nonces.size;
    },
  };
}

export function createRelayAccess(o: RelayAccessOptions): RelayAccess {
  const fill = o.random ?? webCryptoRandom;
  const idle = o.idleTimeoutMs ?? 7 * DAY;
  const absolute = o.absoluteTimeoutMs ?? 30 * DAY;
  const nonces = createNonceStore(o.clock, o.nonceTtlMs ?? 120_000, Math.max(1, o.maxPendingChallenges ?? 10_000));
  const scope = (tx: Tx): Repos => writeScope({ tx, tenantId: o.tenantId, clock: o.clock, ids: o.ids, deliveryEligible: false });
  const unauthenticated = (): Result<never, AppError> => err(appError('UNAUTHENTICATED'));

  function challenge(): Challenge {
    const nonce = randomToken(fill);
    const expiresAt = toIso(nonces.issue(nonce));
    return { nonce, message: loginMessage(o.relayId, nonce), expiresAt };
  }

  async function loginIn(r: Repos, input: LoginInput): Promise<Result<LoginResult, AppError>> {
    if (!nonces.consume(input.nonce)) return unauthenticated();
    const message = new TextEncoder().encode(loginMessage(o.relayId, input.nonce));
    if (!(await o.verifier.verify(input.principal, message, input.signature, r))) return unauthenticated();
    const token = randomToken(fill);
    const now = o.clock.now();
    const expiresAt = toIso(now + absolute);
    // Roles are resolved per request by resolve() (CAP-6); login never calls back into relay state mid-transaction.
    const put = r.repo(tokenRepo).put(await sha256Hex(token), { principal: input.principal, roles: [], lastUsedAt: toIso(now), absoluteExpiresAt: expiresAt }, { expectedRevision: 0 });
    return put.ok ? ok({ token, expiresAt }) : put;
  }

  function touch(r: Repos, id: string): Result<Session, AppError> {
    const repo = r.repo(tokenRepo);
    const rec = repo.get(id);
    const now = o.clock.now();
    if (!rec || Date.parse(rec.data.absoluteExpiresAt) <= now || Date.parse(rec.data.lastUsedAt) + idle <= now) return unauthenticated();
    if (now - Date.parse(rec.data.lastUsedAt) >= 60_000) {
      const put = repo.put(id, { ...rec.data, lastUsedAt: toIso(now) }, { expectedRevision: rec.revision });
      if (!put.ok) return put;
    }
    return ok({ actor: { kind: 'user' as const, id: rec.data.principal, roles: rec.data.roles }, tenantId: o.tenantId });
  }

  async function revokeIn(r: Repos, token: string): Promise<Result<void, AppError>> {
    const repo = r.repo(tokenRepo);
    const id = await sha256Hex(token);
    const rec = repo.get(id);
    return rec ? repo.remove(id, { expectedRevision: rec.revision }) : ok(undefined);
  }

  /** One page per expiry rule; the same comparisons as touch(): absolute ≤ now, lastUsedAt + idle ≤ now. */
  function purgePage(r: Repos): Result<number, AppError> {
    const repo = r.repo(tokenRepo);
    const now = o.clock.now();
    const absoluteDue = repo.query({ where: { absoluteExpiresAt: { lte: toIso(now) } }, limit: PURGE_PAGE });
    if (!absoluteDue.ok) return absoluteDue;
    const idleDue = repo.query({ where: { lastUsedAt: { lte: toIso(now - idle) } }, limit: PURGE_PAGE });
    if (!idleDue.ok) return idleDue;
    const due = new Map([...absoluteDue.value.items, ...idleDue.value.items].map((rec) => [rec.id, rec.revision]));
    for (const [id, revision] of due) {
      const removed = repo.remove(id, { expectedRevision: revision });
      if (!removed.ok) return removed;
    }
    return ok(due.size);
  }

  return {
    loginIn,
    revokeIn,
    challenge: async () => challenge(),
    login: (input) => o.storage.transaction((tx) => loginIn(scope(tx), input)),
    resolve: async (token) => {
      if (token === undefined) return ok({ actor: ANONYMOUS, tenantId: o.tenantId });
      const id = await sha256Hex(token);
      const session = await o.storage.transaction((tx) => touch(scope(tx), id));
      if (!session.ok || !o.rolesFor || session.value.actor.kind === 'anonymous') return session;
      const roles = await o.rolesFor(session.value.actor.id);
      return ok({ ...session.value, actor: { ...session.value.actor, roles } });
    },
    revoke: async (token) => {
      await o.storage.transaction((tx) => revokeIn(scope(tx), token));
    },
    pendingChallenges: () => nonces.size(),
    purgeExpired: async () => {
      let total = 0;
      for (;;) {
        const page = await o.storage.transaction((tx) => purgePage(scope(tx)));
        if (!page.ok) return page;
        total += page.value;
        if (page.value === 0) return ok(total);
      }
    },
  };
}

const ACCESS_MODULE = 'F15.S02.M02';

/** Relay commands wrapping the access service (surface relay; login and challenge are public). */
export function relayAccessDefinitions(access: RelayAccess) {
  const challenge = defineCommand({
    name: 'platform.access_token.challenge',
    module: ACCESS_MODULE,
    capability: 'platform.access_token.challenge',
    input: z.strictObject({}),
    idempotent: false,
    surface: 'relay',
    auth: 'public',
    handler: async () => ok(await access.challenge()),
  });
  const login = defineCommand({
    name: 'platform.access_token.login',
    module: ACCESS_MODULE,
    capability: 'platform.access_token.login',
    input: z.strictObject({ principal: z.string().min(8).max(200), nonce: z.string().regex(/^[A-Za-z0-9_-]{43}$/), signature: z.string().min(16).max(200) }),
    idempotent: false,
    surface: 'relay',
    auth: 'public',
    handler: (ctx, input) => access.loginIn(ctx.tx, input),
  });
  const revoke = defineCommand({
    name: 'platform.access_token.revoke',
    module: ACCESS_MODULE,
    capability: 'platform.access_token.revoke',
    input: z.strictObject({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }),
    idempotent: true,
    surface: 'relay',
    auth: 'public',
    handler: async (ctx, input) => {
      const r = await access.revokeIn(ctx.tx, input.token);
      return r.ok ? ok({ revoked: true }) : r;
    },
  });
  return { challenge, login, revoke, all: [challenge, login, revoke] as const };
}
