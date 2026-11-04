// Relay access tokens by challenge–response (CTR-CAP-001 sessions, CAP-10): the relay issues a 32-byte
// nonce (TTL 120 s); the client signs `classrup-login:v1:<relayId>:<nonce>` with a device key; the relay
// verifies via an injected verifier and issues an opaque 256-bit token stored only as its SHA-256 hash.
import * as z from 'zod';
import type { Clock } from '../clock/clock.ts';
import { toIso } from '../clock/clock.ts';
import { appError, type AppError } from '../errors/app-error.ts';
import { err, ok, type Result } from '../errors/result.ts';
import { sha256Hex } from '../hash/canonical.ts';
import { webCryptoRandom, type RandomFill } from '../ids/uuidv7.ts';
import { bytesToBase64url } from '../storage/base64url.ts';
import { defineRepo } from '../storage/repo.ts';
import { writeScope, type WriteScope } from '../storage/scope.ts';
import { defineCommand } from './define.ts';
import type { Storage } from '../storage/storage.ts';
import type { Tx } from '../storage/tx.ts';
import type { IdGen } from '../ids/uuidv7.ts';
import { ANONYMOUS, type Session, type SessionPort } from './ports.ts';

/** Verifies a device signature for a principal (did:key); implemented by the security package. */
export interface SignatureVerifier {
  verify(principal: string, message: Uint8Array, signature: string): boolean | Promise<boolean>;
}

export interface RelayAccessOptions {
  readonly storage: Storage;
  readonly clock: Clock;
  readonly ids: IdGen;
  readonly relayId: string;
  /** Relay tenant that sessions belong to. */
  readonly tenantId: string;
  readonly verifier: SignatureVerifier;
  /** Relay-local roles for a principal, evaluated on every request (CAP-6, CAP-9). */
  readonly rolesFor?: (principal: string) => readonly string[] | Promise<readonly string[]>;
  readonly random?: RandomFill;
  readonly nonceTtlMs?: number;
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
  challenge(): Promise<Challenge>;
  login(input: LoginInput): Promise<Result<LoginResult, AppError>>;
  revoke(token: string): Promise<void>;
  /** Same operations inside an existing transaction (used by the relay command handlers). */
  challengeIn(repos: Pick<WriteScope, 'repo'>): Result<Challenge, AppError>;
  loginIn(repos: Pick<WriteScope, 'repo'>, input: LoginInput): Promise<Result<LoginResult, AppError>>;
  revokeIn(repos: Pick<WriteScope, 'repo'>, token: string): Promise<Result<void, AppError>>;
}

const DAY = 24 * 60 * 60 * 1000;
const nonceRepo = defineRepo({ type: 'platform.access_nonce', schema: z.strictObject({ expiresAt: z.string() }) });
const tokenRepo = defineRepo({
  type: 'platform.access_token',
  schema: z.strictObject({ principal: z.string(), roles: z.array(z.string()), lastUsedAt: z.string(), absoluteExpiresAt: z.string() }),
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

export function createRelayAccess(o: RelayAccessOptions): RelayAccess {
  const fill = o.random ?? webCryptoRandom;
  const nonceTtl = o.nonceTtlMs ?? 120_000;
  const idle = o.idleTimeoutMs ?? 7 * DAY;
  const absolute = o.absoluteTimeoutMs ?? 30 * DAY;
  const scope = (tx: Tx): Repos => writeScope({ tx, tenantId: o.tenantId, clock: o.clock, ids: o.ids, deliveryEligible: false });
  const unauthenticated = (): Result<never, AppError> => err(appError('UNAUTHENTICATED'));

  function challengeIn(r: Repos): Result<Challenge, AppError> {
    const b = new Uint8Array(32);
    fill(b);
    const nonce = bytesToBase64url(b);
    const expiresAt = toIso(o.clock.now() + nonceTtl);
    const put = r.repo(nonceRepo).put(nonce, { expiresAt }, { expectedRevision: 0 });
    return put.ok ? ok({ nonce, message: loginMessage(o.relayId, nonce), expiresAt }) : put;
  }

  /** Single use: the nonce is deleted whether or not it is still valid. */
  function consumeNonce(r: Repos, nonce: string): boolean {
    const repo = r.repo(nonceRepo);
    const rec = repo.get(nonce);
    if (!rec || !repo.remove(nonce, { expectedRevision: rec.revision }).ok) return false;
    return rec.data.expiresAt > o.clock.iso();
  }

  async function loginIn(r: Repos, input: LoginInput): Promise<Result<LoginResult, AppError>> {
    if (!consumeNonce(r, input.nonce)) return unauthenticated();
    const message = new TextEncoder().encode(loginMessage(o.relayId, input.nonce));
    if (!(await o.verifier.verify(input.principal, message, input.signature))) return unauthenticated();
    const token = randomToken(fill);
    const roles = [...((await o.rolesFor?.(input.principal)) ?? [])];
    const expiresAt = toIso(o.clock.now() + absolute);
    const put = r.repo(tokenRepo).put(await sha256Hex(token), { principal: input.principal, roles, lastUsedAt: o.clock.iso(), absoluteExpiresAt: expiresAt }, { expectedRevision: 0 });
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

  return {
    challengeIn,
    loginIn,
    revokeIn,
    challenge: async () => {
      const r = await o.storage.transaction((tx) => challengeIn(scope(tx)));
      if (!r.ok) throw new Error(r.error.code);
      return r.value;
    },
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
    handler: (ctx) => access.challengeIn(ctx.tx),
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
