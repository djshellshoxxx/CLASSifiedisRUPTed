import type { AccountSnapshot, Actor, CommandContext, Operation } from '@classrup/kernel';
import { createTestDeps, ctxFor, RecordingNotifier, systemActor, testActor } from '@classrup/kernel';
import type { BoxKeyPair, SigningKeyPair } from '@classrup/security';
import { boxKeyId, generateBoxKeyPair, generateSigningKeyPair, keyIdOf, PolicyAuthorizer } from '@classrup/security';
import type { BlockPort, RateLimitPort } from '@classrup/kernel';
import { createComms, POLICIES } from '../src/index';

export interface Person {
  readonly id: string;
  readonly actor: Actor;
  readonly box: BoxKeyPair;
  readonly boxId: string;
  readonly sign: SigningKeyPair;
  readonly signId: string;
}

export function makePerson(id: string, roles: Actor['roles'] = ['member']): Person {
  const box = generateBoxKeyPair();
  const sign = generateSigningKeyPair();
  return { id, actor: testActor(id, [...roles]), box, boxId: boxKeyId(box.publicKey), sign, signId: keyIdOf(sign.publicKey) };
}

export interface Fixture {
  readonly deps: ReturnType<typeof createTestDeps>;
  readonly comms: ReturnType<typeof createComms>;
  readonly accounts: Map<string, AccountSnapshot>;
  readonly notifier: RecordingNotifier;
  readonly blocked: Set<string>;
  readonly people: Record<string, Person>;
  readonly system: Actor;
  call<T = unknown>(name: string, who: Person | Actor, input?: unknown, key?: string): T;
  /** Runs an operation with a system actor. */
  sys<T = unknown>(name: string): T;
}

export function fixture(names: readonly string[], opts: { rateLimit?: RateLimitPort; strict?: boolean; start?: number } = {}): Fixture {
  const authz = new PolicyAuthorizer(POLICIES);
  const deps = createTestDeps({ authz, start: opts.start });
  const people: Record<string, Person> = {};
  const accounts = new Map<string, AccountSnapshot>();
  for (const n of names) {
    const p = makePerson(n);
    people[n] = p;
    accounts.set(n, { id: n, tenantId: p.actor.tenantId, pseudonym: n, status: 'active', signingKeyIds: [p.signId], boxKeyIds: [p.boxId], createdAt: 0 });
  }
  const blocked = new Set<string>();
  const blocks: BlockPort = { isBlocked: (a, b) => blocked.has(`${a}|${b}`) || blocked.has(`${b}|${a}`) };
  const notifier = new RecordingNotifier();
  const comms = createComms(deps, { accounts: { get: (id) => accounts.get(id) }, blocks, notify: notifier, ...(opts.rateLimit ? { rateLimit: opts.rateLimit } : {}) });
  const ops = new Map<string, Operation>(comms.operations.map((o) => [o.name, o]));
  const run = (name: string, ctx: CommandContext, input: unknown): never => {
    const op = ops.get(name);
    if (!op) throw new Error(`no operation ${name}`);
    return op.handler(ctx, input) as never;
  };
  const system = systemActor('tnt_default');
  return {
    deps, comms, accounts, notifier, blocked, people, system,
    call: (name, who, input = {}, key) => run(name, ctxFor('actor' in who ? who.actor : who, key), input),
    sys: (name) => run(name, ctxFor(system), {}),
  };
}

/** Thread with the first name as creator; everyone else invited and accepted. */
export function openThread(f: Fixture, creator: string, others: readonly string[], extra: Record<string, unknown> = {}): string {
  const created = f.call<{ id: string }>('comms.thread.create', f.people[creator] as Person, { invitees: others, ...extra });
  for (const o of others) f.call('comms.thread.respond', f.people[o] as Person, { threadId: created.id, accept: true });
  return created.id;
}
