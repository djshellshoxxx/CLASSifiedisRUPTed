/** F16.S03.M03 response playbooks as typed data. A playbook is a checklist; executing one is tracked per incident. */

export type PlaybookKey = 'key_compromise' | 'data_exposure' | 'relay_compromise' | 'fraud_wave';
export type PlaybookPhase = 'contain' | 'eradicate' | 'recover' | 'communicate' | 'learn';
export type ResponderRole = 'operator' | 'security' | 'support' | 'moderator';

export interface PlaybookStep {
  readonly id: string;
  readonly phase: PlaybookPhase;
  readonly title: string;
  readonly detail: string;
  readonly role: ResponderRole;
}

export interface Playbook {
  readonly key: PlaybookKey;
  readonly title: string;
  readonly summary: string;
  readonly steps: readonly PlaybookStep[];
}

const step = (id: string, phase: PlaybookPhase, role: ResponderRole, title: string, detail: string): PlaybookStep => ({ id, phase, role, title, detail });

export const PLAYBOOKS: readonly Playbook[] = Object.freeze([
  {
    key: 'key_compromise',
    title: 'Key compromise',
    summary: 'A relay signing key, operator key or session secret may be in attacker hands.',
    steps: [
      step('freeze-signing', 'contain', 'security', 'Freeze signing and federation', 'Engage runtime kill switches for federation flags and stop issuing capabilities under the suspect key.'),
      step('rotate-relay-key', 'eradicate', 'security', 'Rotate the relay signing key', 'Generate a new Ed25519 key, publish its key id out of band and in the relay descriptor, retire the old key id.'),
      step('revoke-sessions', 'eradicate', 'security', 'Revoke sessions and capabilities', 'Revoke every session and capability token issued before the rotation so stolen tokens stop working.'),
      step('resign-backups', 'recover', 'operator', 'Re-sign backups with the new operator key', 'Take a fresh verified backup under the new key and mark old-key backups untrusted.'),
      step('notify-peers', 'communicate', 'support', 'Notify federation peers', 'Send peers the new key id through the out-of-band channel and ask them to drop the old one.'),
      step('notify-users', 'communicate', 'support', 'Tell users to sign in again', 'Publish a plain-language notice; do not include key material or internal details.'),
      step('audit-signed', 'learn', 'security', 'Audit records signed during the exposure window', 'List everything signed by the old key since the earliest possible compromise time and review it.'),
    ],
  },
  {
    key: 'data_exposure',
    title: 'Data exposure',
    summary: 'Private data (messages, locations, evidence) was or may have been readable by unauthorized parties.',
    steps: [
      step('confirm-scope', 'contain', 'security', 'Confirm what was exposed', 'Identify data classes, time window and the path (API, log, event, federation payload) without copying the data.'),
      step('stop-leak', 'contain', 'operator', 'Stop the leak', 'Kill the affected feature flag, unpublish public records and tombstone federated copies.'),
      step('preserve-evidence', 'contain', 'security', 'Preserve evidence', 'Create a verified backup and hash relevant logs before anything is changed.'),
      step('rotate-secrets', 'eradicate', 'security', 'Rotate exposed secrets', 'Rotate any key, token or credential that was part of the exposure.'),
      step('fix-regression', 'eradicate', 'operator', 'Fix and add a regression test', 'Close the cause and add a privacy test that fails on the exposed field.'),
      step('notify-affected', 'communicate', 'support', 'Notify affected users', 'Tell affected pseudonyms what was exposed and what they can do; follow the jurisdiction notification rules.'),
      step('restore-service', 'recover', 'operator', 'Release the kill switch', 'Re-enable the feature once the fix is verified.'),
    ],
  },
  {
    key: 'relay_compromise',
    title: 'Relay compromise',
    summary: 'An attacker had code execution on the relay host.',
    steps: [
      step('isolate-host', 'contain', 'operator', 'Isolate the host', 'Cut inbound traffic and outbound federation; keep the machine for forensics.'),
      step('rotate-everything', 'eradicate', 'security', 'Rotate all relay secrets', 'Rotate the signing key, session secrets and storage credentials.'),
      step('clean-redeploy', 'eradicate', 'operator', 'Redeploy from a clean build', 'Build from the locked dependency set on a fresh host and verify the artifact hash.'),
      step('restore-state', 'recover', 'operator', 'Restore state from a verified backup', 'Follow the relay loss runbook; only backups that verify against the trusted operator key are used.'),
      step('revoke-sessions', 'recover', 'security', 'Revoke all sessions', 'Force every client to re-authenticate with its device key.'),
      step('review-window', 'learn', 'security', 'Review the exposure window', 'Review records and federation envelopes accepted during the compromise for tampering.'),
      step('notify', 'communicate', 'support', 'Notify peers and users', 'Explain what was exposed (metadata, not message bodies, when end-to-end encryption held) and the recovery point.'),
    ],
  },
  {
    key: 'fraud_wave',
    title: 'Fraud wave',
    summary: 'A coordinated set of accounts is running scams, fake payment proofs or Sybil rings.',
    steps: [
      step('tighten-limits', 'contain', 'operator', 'Tighten rate limits and risk thresholds', 'Lower limits for new accounts and require challenges for high-risk actions.'),
      step('identify-cluster', 'contain', 'moderator', 'Identify the cluster', 'Group accounts by shared devices, timing and counterparties using risk signals; record evidence ids only.'),
      step('suspend-accounts', 'eradicate', 'moderator', 'Suspend the accounts', 'Apply enforcement actions with appeal rights; hold pending trades for review.'),
      step('freeze-claims', 'eradicate', 'operator', 'Keep unverified claims unsettled', 'Do not treat claimed payments from the cluster as paid; leave disputes open for the counterparties.'),
      step('contact-victims', 'communicate', 'support', 'Contact affected users', 'Tell victims what to check and how to open a dispute.'),
      step('update-rules', 'learn', 'security', 'Update detection rules', 'Add the observed pattern to the antifraud signals and record it in the postmortem.'),
    ],
  },
] satisfies Playbook[]);

export const playbookByKey = (key: string): Playbook | undefined => PLAYBOOKS.find((p) => p.key === key);
