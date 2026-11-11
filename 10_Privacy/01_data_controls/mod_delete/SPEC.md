# F10.S01.M04 — Account and data deletion

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F10.S01](../SPEC.md). **Process IDs:** PS-077-01…PS-077-10. **Code:** `packages/privacy/src/data_controls/delete`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The user can delete their identity and data on this device; the PWA's Erase vault action is this deletion flow and shows the export prompt (IOX-6) before any vault data is deleted, while vault lock and principal switch never delete data. A request starts a 14-day grace period that the user can cancel; during grace other modules may only take reversible actions (hide, pause), cancelling emits privacy.deletion.cancelled so they undo them, and publishing and new commitments are refused through the guard privacy.deletion.assert_not_pending. At the end of grace (deferred up to 30 more days while committed trades, deals, bookings, reservations or rentals are still open) the vault executes deletion as an ordered sequence of DeletionPort steps defined here. First every module signs what it must send while the keys still exist - federation tombstones through F11.S01.M02, consent withdrawals, F07.S01.M01 handle releases, identity document tombstone and relay session revocations, F08 message and attachment deletes and mailbox closes, this module's signed deletion statement for each relay and end-to-end encrypted deletion notices for counterparties of open commitments and for every thread counterparty - then F07.S01.M01 signs revocations of every registered device key, modules pseudonymize retained evidence with a per-deletion pseudonym, crypto-shred blobs and purge content, and the final step, owned by F07.S01.M01, destroys the keys. privacy.deletion.completed is then a notification only. What must outlive the erased vault (the deletion ledger, statements still awaiting delivery and, when the user keeps evidence, a pseudonymized evidence-only vault) lives in a small per-origin residue store with its own retention. The guarantee is limited to this device and browser profile, and the UI states plainly that the recovery kit and the principal's other devices can re-create the identity unless the user destroys them, that copies already fetched by other vaults or relays cannot be recalled, that exported files stay with the user, and that evidence is pseudonymized, not anonymized.

## Responsibilities

- Own DeletionRequest with its states, grace and deferral deadlines, per-module step progress, per-relay and per-counterparty delivery state, and its residue form after completion.
- Define the DeletionPort contract (plan, execute, pseudonymize) and orchestrate deletion across modules discovered through the kernel port registry at vault composition (by inverted registration for F07.S01.M01, F15.S01.M01 and F15.S04.M03, which cannot list this module in depends_on without closing a cycle), idempotently and resumably, in a fixed step order that ends with F07.S01.M01 destroying the keys.
- Produce the signed statements classrup.privacy.deletion_statement/v1 for relays and classrup.privacy.deletion_notice/v1, end-to-end encrypted, for counterparties of open commitments and for every thread counterparty listed by the F08 DeletionPort plans, each signed once at execution and valid for the whole 30-day delivery window.
- Orchestrate, not produce, federation tombstones by running the F11.S01.M02 DeletionPort sign step at execution, never during grace.
- Pseudonymize the principal in retained RET-EVIDENCE records with a per-deletion pseudonym, destroy the pseudonymization salt at completion, and never keep the did and the pseudonym in the same retained record.
- Keep a deletion ledger keyed by a salted hash of the did in the per-origin residue store for 180 days so restores into this browser profile never resurrect deleted data.
- Handle relay-side application of a verified deletion statement as the relay command privacy.deletion.relay_apply, which calls privacy.legal_hold.check and the relay purge path of F10.S01.M02.
- Expose the in-process guard privacy.deletion.assert_not_pending that every publishing and commitment module calls, and emit privacy.deletion.cancelled when a request is cancelled.
- Be the deletion flow behind the PWA's Erase vault action - it shows the export prompt (IOX-6) before any IndexedDB vault data is deleted, and vault lock and principal switch (F07.S01.M02, F15.S01.M02) never delete data.

## Not responsible for

- Retention sweeps and legal holds (F10.S01.M02), export (F10.S01.M03) and consent (F10.S01.M01, which withdraws consents in its own DeletionPort step).
- Federation tombstone format, issuance and peer application (F11.S01.M02, run through its DeletionPort step) and relay-to-relay transport (F11.S02.M01); this module's statements leave the device through the sync outbox (F15.S01.M01).
- Device-key revocation statements and key destruction (F07.S01.M01 DeletionPort steps revoke_keys and destroy_keys; revocation type owned by F16.S02.M02).
- Recalling copies held by other vaults, relays, exported files, the recovery kit, the principal's other devices or the user's own backups; the UI states this limit.
- Future: delegated deletion by a recovery contact, automatic deletion after prolonged inactivity, and coordinated deletion across all of the principal's devices.

## User stories

- As a user, I can request deletion, see exactly what will happen and when, export my data first, and cancel during the 14 days.
- As a user with an open swap, I see that deletion is deferred until it is finished or at most 30 more days, and my counterparties are told fairly.
- As a user, I get an honest summary at the end - what was deleted, what was pseudonymized and kept, and what I cannot recall.
- As a relay operator, I receive a signed deletion statement and tombstones and remove what I hold unless a legal hold applies.
- As a user, I am told before I confirm that deletion covers this device only, and that my recovery kit and my other devices can re-create my identity unless I destroy them.

## Edge cases

- The user cancels on day 13; the request is cancelled, privacy.deletion.cancelled is emitted, modules undo their reversible actions (hidden items reappear, paused processing resumes), consents were never withdrawn during grace, and nothing was sent to relays because every statement is signed only at execution.
- A committed barter cycle is still open at day 14; deletion is deferred, the user is shown the blocking items, and after 30 more days it proceeds and counterparties receive an encrypted deletion notice so they can open recovery or disputes.
- A relay is offline at execution and comes back on day 3; the deletion statement and tombstones signed at execution wait in the residue outbox, the relay accepts them because freshness is replay-based (dedupe on did, requestId and batch hash, signedAt up to 30 days old plus 10 minutes of clock skew), and the summary lists that relay as prepared until it acknowledges.
- The vault is restored into this browser profile from an old export after deletion completed; the restore flow finds the salted did hash in the deletion ledger and refuses without an explicit user override that re-creates a new identity. Restoring the same export on a fresh device or another browser profile is not prevented, and the UI and completion summary say so.
- The PWA is closed mid-execution; execution resumes from the persisted step state at next open and every step is idempotent.
- Another tab tries to publish a listing or open a deal during grace; the publishing module calls privacy.deletion.assert_not_pending and refuses with PRIVACY_DELETION_PENDING.
- A relay holds the user's data under a legal hold; relay_apply keeps that data sealed and out of public serving, returns someRetained true without a count, and the user is told only that some relay copies may be retained under legal obligation.
- The principal has a second device and a recovery kit; before the keys are destroyed every registered device key is revoked by signed revocation statements queued to the user's relays, and the summary warns that the recovery kit can still re-create the identity unless the user destroys it.
- A relay receives the device-key revocation before the deletion statement; it still accepts the statement because the revocation, with reason account_deleted, lists the cids of the final statements signed just before it.
- A replayed batch with changed content, a statement older than 30 days, or one signed by a key revoked for another reason reaches a relay; relay_apply refuses it with PRIVACY_DELETION_STATEMENT_INVALID, while a second delivery of the same valid batch is a no-op.
- The user has 40 threads with 63 distinct counterparties and no open commitment; the sign step signs one departure notice, the F08.S01.M02 plan lists the 63 counterparties with their mailboxes, the notice is sealed to each of them under the same cid, and the account_deleted revocation lists that single cid.
- The user taps Erase vault in the PWA; the export prompt opens first, and nothing in IndexedDB is deleted until the user has seen it and confirmed the deletion request; locking the vault or switching principal instead keeps every record.
- The F15.S01.M01 outbox purge step runs while deletion statements and notices signed in the sign step still await delivery; those entries move to the residue outbox instead of being deleted, and only the principal's other entries are purged.

## UX and accessibility

- Delete account screen, reached from Settings and from the PWA's Erase vault action: the export prompt (IOX-6) with last-export age and an Export now button comes first, then what will be deleted, what will be pseudonymized and kept (evidence for up to 2 years), what cannot be recalled, that thread counterparties are told the account was deleted, the notice 'This deletes your account on this device. Your recovery kit and your other devices can re-create it unless you destroy them', checkbox Also remove my evidence copies on this device, typed confirmation of the pseudonym, fresh unlock required.
- Pending deletion banner on every screen with days left, Cancel deletion button, and blocking commitments list when deferred.
- Completion summary: counts per module, relays by delivery state (prepared, relay received, peer accepted), device keys revoked, pseudonym assigned to retained evidence, what the residue store keeps and for how long, the this-device-only notice, the recovery-kit warning and the cannot-recall notice.

**States:** idle; needs-unlock; pending-grace; deferred; executing; completed; failed-retrying; cancelled

**Accessibility:** The destructive confirmation requires typing text and has a clear cancel path; its warning is text, not only color.; The banner is a labelled region with a polite live update of days left.; Buttons are at least 44 by 44 px with distinct accessible names such as Cancel deletion and Request deletion.

## Owned data

- `DeletionRequest` (classrup.privacy.deletion_request/v1, P3, RET-EVIDENCE)

## Interfaces

- Commands: `privacy.deletion.request`, `privacy.deletion.cancel`, `privacy.deletion.relay_apply`
- Queries: `privacy.deletion.get`, `privacy.deletion.preview`, `privacy.deletion.assert_not_pending`, `privacy.deletion.ledger_check`
- Emits: `privacy.deletion.requested`, `privacy.deletion.completed`, `privacy.deletion.cancelled`
- Consumes: `mutiny.cycle.completed`, `mutiny.cycle.cancelled`, `commerce.deal.completed`, `commerce.deal.cancelled`, `commerce.dispute.resolved`, `rentals.rental.closed`, `rentals.reservation.cancelled`, `services.booking.completed`, `services.booking.cancelled`

## Dependencies

F10.S01.M02, F10.S01.M03, F07.S01.M01, F16.S02.M02, F11.S01.M01, F15.S01.M01, F15.S02.M02, F10.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-077-01 | [Domain schema](domain_schema.md) | 6 |
| PS-077-02 | [Validation rules](validation_rules.md) | 5 |
| PS-077-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-077-04 | [Commands, queries and events](commands_queries_events.md) | 7 |
| PS-077-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-077-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-077-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-077-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-077-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-077-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/privacy/src/data_controls/delete/index.ts`.

## Acceptance criteria

- All tests T01 to T27 pass in CI.
- After completion no module on this device retains content or recoverable keys for the principal, retained evidence carries only the pseudonym, and no record joins the did and the pseudonym.
- The grace period of 14 days cannot be shortened by any API.
- The completion summary always states what cannot be recalled and that the guarantee covers this device only.
