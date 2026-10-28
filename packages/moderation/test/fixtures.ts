import type { AccountSnapshot, Actor, DomainEvent, FeatureFlags } from '@classrup/kernel';
import { createTestDeps, ctxFor, RecordingNotifier, systemActor, testActor } from '@classrup/kernel';
import { PolicyAuthorizer } from '@classrup/security';
import type { CaseDto } from '../src/reporting/cases';
import { createModeration, POLICIES, RecordingSubjectActions } from '../src/index';
import type { ReportReason, SubjectType } from '../src/index';

export const TENANT = 'tnt_default';
export const member = (id: string): Actor => testActor(id);
export const moderator = (id: string): Actor => testActor(id, ['moderator']);
export const admin = (id: string): Actor => testActor(id, ['admin']);
export const system = (): Actor => systemActor(TENANT);

export interface SetupOptions {
  readonly flags?: FeatureFlags;
  readonly accounts?: ReadonlyMap<string, AccountSnapshot>;
}

/** Full module graph over an in-memory store with the real PolicyAuthorizer, recording every port call and event. */
export function setup(options: SetupOptions = {}) {
  const deps = createTestDeps({ authz: new PolicyAuthorizer(POLICIES), ...(options.flags ? { flags: options.flags } : {}) });
  const actions = new RecordingSubjectActions();
  const notifier = new RecordingNotifier();
  const owners = new Map<string, string>();
  const events: DomainEvent[] = [];
  deps.bus.subscribe('*', (e) => events.push(e));
  const mod = createModeration(deps, {
    subjectActions: actions,
    notify: notifier,
    subjectOwner: { ownerOf: (type, id) => owners.get(`${type}:${id}`) },
    ...(options.accounts ? { accounts: { get: (id: string) => options.accounts?.get(id) } } : {}),
  });
  let reporterSeq = 0;

  const report = (reporterId: string, over: Partial<{ subjectType: SubjectType; subjectId: string; reason: ReportReason; details: string; excerpt: string }> = {}) =>
    mod.reports.submit(ctxFor(member(reporterId)), { subjectType: 'listing', subjectId: 'lst_1', reason: 'scam_fraud', ...over });

  const queue = (status: 'active' | 'open' | 'claimed' | 'pending_approval' | 'resolved' = 'active'): CaseDto[] =>
    mod.cases.list(ctxFor(moderator('acct_viewer')), { status });

  /** Files a fresh report from a new reporter, claims the resulting case as `modId` and returns it. */
  function claimedCase(over: Parameters<typeof report>[1] = {}, modId = 'acct_mod1'): CaseDto {
    report(`acct_rep${++reporterSeq}`, over);
    const target = queue().find((c) => c.subjectId === (over.subjectId ?? 'lst_1') && c.subjectType === (over.subjectType ?? 'listing'));
    if (!target) throw new Error('case not found');
    return mod.cases.claim(ctxFor(moderator(modId)), { caseId: target.id });
  }

  const decide = (caseId: string, over: Record<string, unknown> = {}, modId = 'acct_mod1') =>
    mod.enforcement.decide(ctxFor(moderator(modId)), { caseId, action: 'warn', policyClause: 'TOS-4.2', reason: 'listing violates the policy', ...over });

  return { deps, mod, actions, notifier, owners, events, report, queue, claimedCase, decide, clock: deps.clock };
}

export type Harness = ReturnType<typeof setup>;
export { ctxFor };
