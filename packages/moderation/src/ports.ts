/**
 * Consumer-side ports of the moderation package. The relay wires the owning features
 * (bazaar, identity, comms, notifications) behind them; every default is a safe no-op.
 */
import type { AccountLookup, NotifyPort } from '@classrup/kernel';
import type { SubjectType } from './types';

/** Effects a moderation decision has on content and accounts owned by other features. Calls must be idempotent. */
export interface SubjectActionsPort {
  removeContent(subjectType: SubjectType, subjectId: string, reason: string): void;
  restoreContent(subjectType: SubjectType, subjectId: string, reason: string): void;
  /** `until` is an epoch-ms end of suspension, or null for an indefinite suspension (ban). */
  suspendAccount(accountId: string, until: number | null, reason: string): void;
  reinstateAccount(accountId: string): void;
}

/** Resolves the account that owns a reported subject so strikes and restrictions attach to a person. */
export interface SubjectOwnerPort {
  ownerOf(subjectType: SubjectType, subjectId: string): string | undefined;
}

export interface ModerationPorts {
  readonly subjectActions?: SubjectActionsPort;
  readonly notify?: NotifyPort;
  readonly subjectOwner?: SubjectOwnerPort;
  /** Needed only by `moderation.limits.mine` to learn the caller's account age. */
  readonly accounts?: AccountLookup;
}

export interface ResolvedPorts {
  readonly subjectActions: SubjectActionsPort;
  readonly notify: NotifyPort;
  readonly subjectOwner: SubjectOwnerPort;
  readonly accounts: AccountLookup | undefined;
}

export const noSubjectActions: SubjectActionsPort = {
  removeContent: () => undefined,
  restoreContent: () => undefined,
  suspendAccount: () => undefined,
  reinstateAccount: () => undefined,
};

export type SubjectActionCall =
  | { readonly call: 'removeContent' | 'restoreContent'; readonly subjectType: SubjectType; readonly subjectId: string; readonly reason: string }
  | { readonly call: 'suspendAccount'; readonly accountId: string; readonly until: number | null; readonly reason: string }
  | { readonly call: 'reinstateAccount'; readonly accountId: string };

/** Records every call; useful for relay wiring tests and for running the package standalone. */
export class RecordingSubjectActions implements SubjectActionsPort {
  readonly calls: SubjectActionCall[] = [];
  removeContent(subjectType: SubjectType, subjectId: string, reason: string): void {
    this.calls.push({ call: 'removeContent', subjectType, subjectId, reason });
  }
  restoreContent(subjectType: SubjectType, subjectId: string, reason: string): void {
    this.calls.push({ call: 'restoreContent', subjectType, subjectId, reason });
  }
  suspendAccount(accountId: string, until: number | null, reason: string): void {
    this.calls.push({ call: 'suspendAccount', accountId, until, reason });
  }
  reinstateAccount(accountId: string): void {
    this.calls.push({ call: 'reinstateAccount', accountId });
  }
}

export const noSubjectOwner: SubjectOwnerPort = { ownerOf: () => undefined };

export function resolvePorts(ports: ModerationPorts): ResolvedPorts {
  return {
    subjectActions: ports.subjectActions ?? noSubjectActions,
    notify: ports.notify ?? { notify: () => undefined },
    subjectOwner: ports.subjectOwner ?? noSubjectOwner,
    accounts: ports.accounts,
  };
}
