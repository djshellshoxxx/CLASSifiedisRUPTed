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
import { writeScope } from '../storage/scope.ts';
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

export interface RelayAccess extends SessionPort {
  challenge(): Promise<Challenge>;
  login(input: { readonly principal: string; readonly nonce: string; readonly signature: string }): Promise<Result<{ readonly token: string; readonly expiresAt: string }, AppError>>;
  revoke(token: string): Promise<void>;
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

export function createRelayAccess(o: RelayAccessOptions): RelayAccess {
  const fill = o.random ?? webCryptoRandom;
  const nonceTtl = o.nonceTtlMs ?? 120_000;
  const idle = o.idleTimeoutMs ?? 7 * DAY;
  const absolute = o.absoluteTimeoutMs ?? 30 * DAY;
  const scope = (tx: Tx) => writeScope({ tx, tenantId: o.tenantId, clock: o.clock, ids: o.ids, deliveryEligible: false });
  const unauthenticated = () => err(appError('UNAUTHENTICATED'));

  async function consumeNonce(nonce: string): Promise<boolean> {
    const r = await o.storage.transaction((tx) => {
      const repo = scope(tx).repo(nonceRepo);
      const rec = repo.get(nonce);
      if (!rec) return err(appError('NOT_FOUND'));
      const removed = repo.remove(nonce, { expectedRevision: rec.revision });
      if (!removed.ok) return removed;
      return rec.data.expiresAt > o.clock.iso() ? ok(true) : ok(false);
    });
    return r.ok && r.value;
  }

  async function issue(principal: string): Promise<{ token: string; expiresAt: string }> {
    const token = randomToken(fill);
    const id = await sha256Hex(token);
    const roles = [...((await o.rolesFor?.(principal)) ?? [])];
    const expiresAt = toIso(o.clock.now() + absolute);
    await o.storage.transaction((tx) => scope(tx).repo(tokenRepo).put(id, { principal, roles, lastUsedAt: o.clock.iso(), absoluteExpiresAt: expiresAt }, { expectedRevision: 0 }));
    return { token, expiresAt };
  }

  async function touch(id: string): Promise<Result<Session, AppError>> {
    return o.storage.transaction((tx) => {
      const repo = scope(tx).repo(tokenRepo);
      const rec = repo.get(id);
      const now = o.clock.now();
      if (!rec || Date.parse(rec.data.absoluteExpiresAt) <= now || Date.parse(rec.data.lastUsedAt) + idle <= now) return unauthenticated();
      if (now - Date.parse(rec.data.lastUsedAt) >= 60_000) {
        const put = repo.put(id, { ...rec.data, lastUsedAt: toIso(now) }, { expectedRevision: rec.revision });
        if (!put.ok) return put;
      }
      return ok({ actor: { kind: 'user' as const, id: rec.data.principal, roles: rec.data.roles }, tenantId: o.tenantId });
    });
  }

  return {
    challenge: async () => {
      const b = new Uint8Array(32);
      fill(b);
      const nonce = bytesToBase64url(b);
      const expiresAt = toIso(o.clock.now() + nonceTtl);
      await o.storage.transaction((tx) => scope(tx).repo(nonceRepo).put(nonce, { expiresAt }, { expectedRevision: 0 }));
      return { nonce, message: loginMessage(o.relayId, nonce), expiresAt };
    },
    login: async (input) => {
      if (!(await consumeNonce(input.nonce))) return unauthenticated();
      const message = new TextEncoder().encode(loginMessage(o.relayId, input.nonce));
      if (!(await o.verifier.verify(input.principal, message, input.signature))) return unauthenticated();
      return ok(await issue(input.principal));
    },
    resolve: async (token) => {
      if (token === undefined) return ok({ actor: ANONYMOUS, tenantId: o.tenantId });
      const session = await touch(await sha256Hex(token));
      if (!session.ok || !o.rolesFor || session.value.actor.kind === 'anonymous') return session;
      const roles = await o.rolesFor(session.value.actor.id);
      return ok({ ...session.value, actor: { ...session.value.actor, roles } });
    },
    revoke: async (token) => {
      const id = await sha256Hex(token);
      await o.storage.transaction((tx) => {
        const repo = scope(tx).repo(tokenRepo);
        const rec = repo.get(id);
        return rec ? repo.remove(id, { expectedRevision: rec.revision }) : ok(undefined);
      });
    },
  };
}
