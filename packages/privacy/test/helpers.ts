import type { Actor, CommandContext } from '@classrup/kernel';
import { ANONYMOUS, createTestDeps, ctxFor, RecordingNotifier, systemActor, testActor } from '@classrup/kernel';
import { PolicyAuthorizer } from '@classrup/security';
import type { Privacy } from '../src/index';
import { createPrivacy, POLICIES } from '../src/index';

export const TENANT = 'tnt_default';

export interface World {
  readonly deps: ReturnType<typeof createTestDeps>;
  readonly privacy: Privacy;
  readonly notifier: RecordingNotifier;
}

export function makeWorld(seed = 11): World {
  const deps = createTestDeps({ seed, authz: new PolicyAuthorizer(POLICIES) });
  const notifier = new RecordingNotifier();
  return { deps, privacy: createPrivacy(deps, { notifier }), notifier };
}

export const user = (name: string): Actor => testActor(`acct_${name}`);
export const adminActor = (): Actor => testActor('acct_admin', ['admin']);
export const ctx = (actor: Actor, key?: string): CommandContext => ctxFor(actor, key);
export const sys = (key?: string): CommandContext => ctxFor(systemActor(TENANT), key);
export const anon = (): CommandContext => ctxFor(ANONYMOUS(TENANT));

export const eventsOfType = (w: World, type: string) => w.deps.store.events.read().filter((e) => e.event.type === type).map((e) => e.event);
