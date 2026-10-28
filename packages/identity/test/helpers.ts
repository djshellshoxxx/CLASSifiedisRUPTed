import type { Actor, BlockPort, CommandContext } from '@classrup/kernel';
import { ANONYMOUS, createTestDeps, ctxFor, rateLimited, systemActor } from '@classrup/kernel';
import type { RateLimitPort } from '@classrup/kernel';
import type { BoxKeyPair, SigningKeyPair } from '@classrup/security';
import { boxKeyId, generateBoxKeyPair, generateSigningKeyPair, keyIdOf, PolicyAuthorizer, signEnvelope, toBase64Url } from '@classrup/security';
import type { Identity, IdentityPorts } from '../src/index';
import { createIdentity, POLICIES } from '../src/index';

export const TENANT = 'tnt_default';

export interface World {
  readonly deps: ReturnType<typeof createTestDeps>;
  readonly identity: Identity;
}

export function makeWorld(ports: IdentityPorts = {}, seed = 7): World {
  const deps = createTestDeps({ seed, authz: new PolicyAuthorizer(POLICIES) });
  return { deps, identity: createIdentity(deps, ports) };
}

export interface User {
  readonly id: string;
  readonly pseudonym: string;
  readonly keys: SigningKeyPair;
  readonly box: BoxKeyPair;
  readonly recoveryCodes: string[];
}

export const anon = (key?: string): CommandContext => ctxFor(ANONYMOUS(TENANT), key);
export const system = (key?: string): CommandContext => ctxFor(systemActor(TENANT), key);
export const asActor = (actor: Actor, key?: string): CommandContext => ctxFor(actor, key);

export function newKeys(): { keys: SigningKeyPair; box: BoxKeyPair } {
  return { keys: generateSigningKeyPair(), box: generateBoxKeyPair() };
}

export const deviceInput = (keys: SigningKeyPair, box: BoxKeyPair, label?: string) => ({
  signingPublicKey: toBase64Url(keys.publicKey),
  boxPublicKey: toBase64Url(box.publicKey),
  ...(label ? { label } : {}),
});

export function bindingProof(keys: SigningKeyPair, box: BoxKeyPair, purpose: 'register' | 'recover' | 'add_device', subject: string) {
  return signEnvelope(keys, 'device-binding', { purpose, subject, signingKeyId: keyIdOf(keys.publicKey), boxKeyId: boxKeyId(box.publicKey) });
}

export function register(w: World, pseudonym: string, extra: { issueRecoveryCodes?: boolean } = {}): User {
  const { keys, box } = newKeys();
  const out = w.identity.accounts.register(anon(), {
    pseudonym,
    device: deviceInput(keys, box),
    proof: bindingProof(keys, box, 'register', pseudonym.normalize('NFKC').toLowerCase()),
    ...extra,
  });
  return { id: out.account.id, pseudonym: out.account.pseudonym, keys, box, recoveryCodes: out.recoveryCodes };
}

export interface Session {
  readonly token: string;
  readonly sessionId: string;
  readonly actor: Actor;
}

export function login(w: World, user: User, keys: SigningKeyPair = user.keys): Session {
  const challenge = w.identity.sessions.issueChallenge(anon(), { accountId: user.id, signingKeyId: keyIdOf(keys.publicKey) });
  const proof = signEnvelope(keys, 'auth-challenge', { challengeId: challenge.challengeId, nonce: challenge.nonce, accountId: user.id });
  const session = w.identity.sessions.login(anon(), { proof });
  const actor = w.identity.authenticate(session.token);
  if (!actor) throw new Error('freshly created session failed to authenticate');
  return { token: session.token, sessionId: session.sessionId, actor };
}

export function rotationAuth(w: World, user: User, action: 'add_device' | 'revoke_device' | 'issue_recovery', target: string, signer: SigningKeyPair = user.keys) {
  const account = w.identity.accountLookup.get(user.id);
  if (!account) throw new Error('account missing');
  const epoch = w.deps.store.collection<{ id: string; version: number; keyEpoch: number }>('identity_accounts').require(user.id).keyEpoch;
  return signEnvelope(signer, 'device-rotation', { action, accountId: user.id, target, keyEpoch: epoch });
}

export function admin(w: World, name = 'boss'): Session & { user: User } {
  const user = register(w, name);
  w.identity.accounts.grantRole(system(), { accountId: user.id, role: 'admin' });
  return { ...login(w, user), user };
}

export const countingRateLimit = (max: number): RateLimitPort => {
  const used = new Map<string, number>();
  return {
    consume(key, cost = 1) {
      const n = (used.get(key) ?? 0) + cost;
      used.set(key, n);
      if (n > max) throw rateLimited('RATE.LIMITED', 'too many attempts');
    },
  };
};

export const blockedPairs = (pairs: [string, string][]): BlockPort => ({
  isBlocked: (a, b) => pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a)),
});

export function eventsOfType(w: World, type: string) {
  return w.deps.store.events.read().filter((e) => e.event.type === type).map((e) => e.event);
}
