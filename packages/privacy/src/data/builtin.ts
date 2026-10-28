/** Exporter and eraser for the data privacy itself holds (consents, exports), registered like any other area. */
import type { JsonValue } from '@classrup/kernel';
import type { PrivacyEnv } from '../env';

export const PRIVACY_AREA = 'privacy';

export function exportOwnData(env: PrivacyEnv, accountId: string): JsonValue {
  const { stores } = env;
  return {
    consents: stores.consentState
      .list((s) => s.accountId === accountId)
      .map((s) => ({ purpose: s.purpose, decision: s.decision, policyVersion: s.policyVersion, since: s.since })),
    consentHistory: stores.consentLog
      .list((e) => e.accountId === accountId)
      .sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : 1))
      .map((e) => ({ purpose: e.purpose, decision: e.decision, policyVersion: e.policyVersion, at: e.at })),
    deletionRequests: stores.deletions
      .list((d) => d.accountId === accountId)
      .map((d) => ({ id: d.id, status: d.status, requestedAt: d.requestedAt, graceEndsAt: d.graceEndsAt })),
  };
}

export function eraseOwnData(env: PrivacyEnv, accountId: string): { erased: number; retained: string[] } {
  const { stores } = env;
  const exports = stores.exports.list((r) => r.accountId === accountId);
  const states = stores.consentState.list((s) => s.accountId === accountId);
  for (const r of exports) stores.exports.delete(r.id, r.version);
  for (const s of states) stores.consentState.delete(s.id, s.version);
  return {
    erased: exports.length + states.length,
    retained: [
      'audit:consent decision history (proof of what the person agreed to and when)',
      'audit:this deletion request record, without its erased content',
    ],
  };
}
