/** F15.S03.M03 disaster-recovery runbooks as typed data. Steps reference platform capabilities that exist in this repo. */

export type RunbookKey = 'relay_loss' | 'data_corruption' | 'key_compromise';
export type RunbookRole = 'operator' | 'security' | 'support';

export interface RunbookStep {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly role: RunbookRole;
  /** Observable evidence that the step worked. */
  readonly verify: string;
}

export interface Runbook {
  readonly key: RunbookKey;
  readonly title: string;
  readonly trigger: string;
  readonly severity: 'SEV1' | 'SEV2';
  /** Recovery time objective: maximum tolerated time to restore service. */
  readonly rtoMinutes: number;
  /** Recovery point objective: maximum tolerated data-loss window. */
  readonly rpoMinutes: number;
  readonly prerequisites: readonly string[];
  readonly steps: readonly RunbookStep[];
  readonly rollback: readonly string[];
}

const step = (id: string, role: RunbookRole, title: string, detail: string, verify: string): RunbookStep => ({ id, role, title, detail, verify });

export const RUNBOOKS: readonly Runbook[] = Object.freeze([
  {
    key: 'relay_loss',
    title: 'Relay host lost or unrecoverable',
    trigger: 'Relay process and its storage are unavailable and cannot be repaired in place.',
    severity: 'SEV1',
    rtoMinutes: 240,
    rpoMinutes: 1440,
    prerequisites: ['Latest backup file and its signature are reachable', 'Operator public key id is available out of band (not from the lost host)'],
    steps: [
      step('declare', 'operator', 'Declare the incident', 'Open a SEV1 incident and announce degraded service on the static PWA host banner.', 'Incident record exists with status detected'),
      step('provision', 'operator', 'Provision a replacement relay', 'Deploy the same relay build to a fresh host with an empty data store and new transport credentials.', 'Health readiness reports pass except storage content'),
      step('select', 'operator', 'Select the newest valid backup', 'Verify candidates newest first against the operator public key; discard any that fail verification.', 'verifyBackup returns ok with the trusted signer'),
      step('restore', 'operator', 'Restore into the empty store', 'Run restoreBackup against the empty store; it refuses non-empty targets and preserves record versions.', 'Restore summary record and event counts equal the manifest'),
      step('rebuild', 'operator', 'Rebuild projections and resume the outbox', 'Rebuild derived projections from the event log and resume outbox delivery from the stored checkpoints.', 'Projection checkpoints equal the event log last position'),
      step('rotate', 'security', 'Rotate keys if the old host may be compromised', 'Run the key compromise runbook when loss was not a plain outage.', 'New relay signing key id published'),
      step('clients', 'support', 'Let clients resubmit pending work', 'Offline queues resend with their original idempotency keys; conflicts surface to users for review.', 'Pending queue counts fall; no duplicate trades created'),
      step('notify', 'support', 'Tell users what was lost', 'Publish the recovery point: writes after the backup time must be re-entered or re-acknowledged.', 'Public status note with the recovery timestamp'),
    ],
    rollback: ['Keep the lost host isolated for forensics', 'If the restore is bad, repeat from select with the next older backup'],
  },
  {
    key: 'data_corruption',
    title: 'Data corruption or bad migration',
    trigger: 'Integrity checks, user reports or failed invariants show wrong or missing records.',
    severity: 'SEV2',
    rtoMinutes: 480,
    rpoMinutes: 1440,
    prerequisites: ['Write path can be paused with a runtime kill switch', 'A backup older than the corruption exists'],
    steps: [
      step('contain', 'operator', 'Stop further damage', 'Engage runtime kill switches for the affected feature flags; reads stay available.', 'Affected flags report runtime_kill'),
      step('scope', 'operator', 'Establish the blast radius', 'Compare current collection counts and hashes with the last verified backup manifest.', 'List of affected collections and time window'),
      step('restore-side', 'operator', 'Restore the last good backup into a fresh store', 'Never restore over the live store; restoreBackup refuses non-empty targets.', 'Fresh store passes manifest verification'),
      step('reconcile', 'operator', 'Replay events after the backup', 'Replay the surviving event log from the backup last position, skipping events proven corrupt.', 'Replay result caughtUp true with no failure'),
      step('cutover', 'operator', 'Cut over and rebuild projections', 'Point the relay at the restored store, rebuild projections and release the kill switches one flag at a time.', 'Health readiness pass; flags released'),
      step('review', 'security', 'Review for tampering', 'Treat unexplained corruption as a possible attack; run the data exposure playbook when integrity cannot be explained.', 'Incident timeline records the conclusion'),
    ],
    rollback: ['Keep the corrupted store read-only until the postmortem is done'],
  },
  {
    key: 'key_compromise',
    title: 'Relay or operator key compromise',
    trigger: 'A relay signing key, operator backup key or session secret may be known to an attacker.',
    severity: 'SEV1',
    rtoMinutes: 120,
    rpoMinutes: 0,
    prerequisites: ['A second operator can approve key operations', 'Peer relay contacts are known'],
    steps: [
      step('freeze', 'security', 'Freeze signing', 'Disable federation flags and stop issuing capabilities signed by the suspect key.', 'Federation flags report runtime_kill'),
      step('rotate', 'security', 'Generate and publish a new signing key', 'Create a fresh Ed25519 key, publish its key id out of band and in the relay descriptor.', 'New key id verifies a test envelope'),
      step('revoke', 'security', 'Revoke sessions and capabilities', 'Revoke all sessions and capability ids issued under the suspect key.', 'Old tokens fail verification'),
      step('resign', 'operator', 'Re-sign backups and manifests', 'Create a new signed backup with the new operator key and archive the old signer as untrusted.', 'verifyBackup ok with the new signer'),
      step('notify', 'support', 'Notify peers and users', 'Tell federation peers to drop the old key id and tell users to re-authenticate.', 'Peers acknowledge the new key id'),
      step('audit', 'security', 'Audit what the old key signed', 'List records signed since the suspected compromise time and flag them for review.', 'Review list attached to the incident'),
    ],
    rollback: ['The old key is never re-trusted; recover only forward with new keys'],
  },
] satisfies Runbook[]);

export const runbookByKey = (key: string): Runbook | undefined => RUNBOOKS.find((r) => r.key === key);
