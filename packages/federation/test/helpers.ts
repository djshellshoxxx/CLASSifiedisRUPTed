import type { AccountSnapshot, Actor, CommandContext, ListingSnapshot, Operation } from '@classrup/kernel';
import { createTestDeps, ctxFor, systemActor, testActor } from '@classrup/kernel';
import type { SignedEnvelope, SigningKeyPair } from '@classrup/security';
import { generateSigningKeyPair, keyIdOf, PolicyAuthorizer } from '@classrup/security';
import type { FederatedEnvelope, FederatedRecord, FederationBatch, FederationTransportPort, MigrationProof, PeerDto, PeerRef, RecordType, SendResult } from '../src/index';
import { countersign, createFederation, POLICIES, signBatch, signRecord } from '../src/index';
import { signDetached } from '@classrup/security';

export const LOCAL = 'relay.a.example';
export const REMOTE = 'relay.b.example';

export interface Author {
  readonly id: string;
  readonly actor: Actor;
  readonly keys: SigningKeyPair;
  readonly keyId: string;
}

export function author(id: string): Author {
  const keys = generateSigningKeyPair();
  return { id, actor: testActor(id), keys, keyId: keyIdOf(keys.publicKey) };
}

export const admin = testActor('admin1', ['admin']);
export const moderator = testActor('mod1', ['moderator']);
export const relayActor: Actor = { kind: 'relay', id: 'peer-endpoint', roles: [], tenantId: 'tnt_default' };

export const listingPayload = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  title: 'Road bike', category: 'bikes', kind: 'sell', acceptsBarter: false, regionCell: 'u33db', quantityAvailable: 1, ...over,
});

export class FakeTransport implements FederationTransportPort {
  result: SendResult = 'ok';
  readonly sent: { peer: PeerRef; batch: SignedEnvelope<FederationBatch> }[] = [];
  send(peer: PeerRef, batch: SignedEnvelope<FederationBatch>): SendResult {
    this.sent.push({ peer, batch });
    return this.result;
  }
}

export interface Remote {
  readonly relayId: string;
  readonly keys: SigningKeyPair;
  readonly keyId: string;
}

export const makeRemote = (relayId = REMOTE): Remote => {
  const keys = generateSigningKeyPair();
  return { relayId, keys, keyId: keyIdOf(keys.publicKey) };
};

export function fixture(opts: { consent?: boolean; start?: number; relayId?: string } = {}) {
  const deps = createTestDeps({ authz: new PolicyAuthorizer(POLICIES), start: opts.start });
  const relayKeys = generateSigningKeyPair();
  const accounts = new Map<string, AccountSnapshot>();
  const listings = new Map<string, ListingSnapshot>();
  const consented = new Set<string>();
  const transport = new FakeTransport();
  const people = new Map<string, Author>();
  const person = (id: string): Author => {
    let a = people.get(id);
    if (!a) {
      a = author(id);
      people.set(id, a);
      accounts.set(id, { id, tenantId: a.actor.tenantId, pseudonym: id, status: 'active', signingKeyIds: [a.keyId], boxKeyIds: [], createdAt: 0 });
      if (opts.consent !== false) consented.add(id);
    }
    return a;
  };
  let jitter = 0.5;
  const build = () =>
    createFederation(deps, {
      relay: { relayId: opts.relayId ?? LOCAL, keys: relayKeys },
      accounts: { get: (id) => accounts.get(id) },
      listings: { get: (id) => listings.get(id) },
      consent: { hasConsent: (id) => consented.has(id) },
      transport,
      random: () => jitter,
    });
  const fed = build();
  const ops = new Map<string, Operation>(fed.operations.map((o) => [o.name, o]));
  const run = (name: string, ctx: CommandContext, input: unknown): never => {
    const op = ops.get(name);
    if (!op) throw new Error(`no operation ${name}`);
    return op.handler(ctx, input) as never;
  };
  const remote = makeRemote();
  return {
    deps, fed, rebuild: build, accounts, listings, consented, transport, person, remote, relayKeys, relayKeyId: keyIdOf(relayKeys.publicKey),
    setJitter: (v: number) => (jitter = v),
    call: <T = unknown>(name: string, who: Actor | Author, input: unknown = {}, key?: string): T => run(name, ctxFor('keys' in who ? who.actor : who, key), input),
    sys: <T = unknown>(name: string): T => run(name, ctxFor(systemActor('tnt_default')), {}),
    /** Registers the default remote relay and trusts it. */
    trustRemote(r: Remote = remote): PeerDto {
      const peer = run('federation.peer.register', ctxFor(admin), { relayId: r.relayId, publicKeyId: r.keyId }) as PeerDto;
      return run('federation.peer.transition', ctxFor(admin), { peerId: peer.id, status: 'trusted' }) as PeerDto;
    },
    receive: <T = unknown>(batch: unknown): T => run('federation.sync.receive', ctxFor(relayActor), { batch }),
  };
}

export type Fixture = ReturnType<typeof fixture>;

/** A record as the remote relay would send it: author-signed and countersigned with the remote relay key. */
export function remoteEnvelope(
  remote: Remote,
  who: Author,
  type: RecordType,
  recordId: string,
  revision: number,
  payload: Record<string, unknown>,
  over: Partial<FederatedRecord> = {},
): FederatedEnvelope {
  const record: FederatedRecord = { v: 1, type, recordId, revision, authorKeyId: who.keyId, originRelay: remote.relayId, createdAt: 1_700_000_000_000, payload, ...over };
  return countersign(remote.keys, remote.keyId, signRecord(who.keys, record));
}

export function remoteBatch(f: Fixture, remote: Remote, envelopes: readonly unknown[], over: Partial<FederationBatch> = {}): SignedEnvelope<FederationBatch> {
  return signBatch(remote.keys, { v: 1, batchId: f.deps.ids.ulid(), from: remote.relayId, sentAt: f.deps.clock.now(), records: envelopes as FederatedEnvelope[], ...over });
}

export function migrationProof(oldK: SigningKeyPair, newK: SigningKeyPair, fromRelay: string, toRelay: string, at: number): MigrationProof {
  const statement = { fromRelay, toRelay, oldKeyId: keyIdOf(oldK.publicKey), newKeyId: keyIdOf(newK.publicKey), at };
  return { statement, oldSig: signDetached(oldK.secretKey, 'account-migration', statement), newSig: signDetached(newK.secretKey, 'account-migration', statement) };
}

export const RID = (n: number): string => `lst_${String(n).padStart(26, '0').replace(/0/g, 'A')}`;
