# F10.S01.M04 — Account and data deletion

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F10.S01](../SPEC.md). **Process IDs:** PS-077-01…PS-077-10. **Code:** `packages/privacy/src/data_controls/delete`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The user can delete their identity and data. A request starts a 14-day grace period that the user can cancel. At the end of grace (deferred up to 30 more days while committed trades, deals or rentals are still open) the vault executes deletion: it sends signed tombstones to every relay that holds the user's public projections, tells counterparties of open commitments, replaces the user's identifier in retained evidence with a per-deletion pseudonym, crypto-shreds encrypted blobs by deleting their per-object keys, purges content, and finally destroys the device keys. The UI states plainly that copies already fetched by other vaults or relays cannot be recalled, that exported files and the user's own backups stay with the user, and that evidence is pseudonymized, not anonymized.

## Responsibilities

- Own DeletionRequest with its states, grace and deferral deadlines, per-module step progress and per-relay delivery state.
- Orchestrate deletion across modules through the DeletionPort registry (plan, execute, pseudonymize), idempotently and resumably.
- Produce signed statements classrup.privacy.deletion_request/v1 for relays and classrup.privacy.deletion_notice/v1 for counterparties of open commitments, and federation tombstones per CTR-FED-001 FED-4 for published records.
- Pseudonymize the principal in retained RET-EVIDENCE records with a per-deletion pseudonym and destroy the pseudonymization salt at completion.
- Crypto-shred encrypted blobs and keys, keep tombstones (ID, type, deletedAt) for 180 days, and keep a deletion ledger so restores never resurrect deleted data.
- Handle relay-side application of a signed deletion request as a relay command, respecting relay legal holds.

## Not responsible for

- Retention sweeps and legal holds (F10.S01.M02), export (F10.S01.M03) and consent (F10.S01.M01).
- Federation transport and peer tombstone application (F11); this module only produces signed tombstones and tracks delivery.
- Recalling copies held by other vaults, relays, exported files or the user's own backups; the UI states this limit.
- Future: delegated deletion by a recovery contact and automatic deletion after prolonged inactivity.

## User stories

- As a user, I can request deletion, see exactly what will happen and when, export my data first, and cancel during the 14 days.
- As a user with an open swap, I see that deletion is deferred until it is finished or at most 30 more days, and my counterparties are told fairly.
- [object Object]
- As a relay operator, I receive a signed deletion request and tombstones and remove what I hold unless a legal hold applies.

## Edge cases

- The user cancels on day 13; the request is cancelled, consents withdrawn at request time stay withdrawn, and nothing was sent to relays.
- A committed barter cycle is still open at day 14; deletion is deferred, the user is shown the blocking items, and after 30 more days it proceeds and counterparties receive a deletion notice so they can open recovery or disputes.
- A relay is offline at execution; the signed tombstones wait in the sync outbox, completion is reached locally, and the summary lists that relay as prepared, not peer accepted.
- The vault is restored from an old export after deletion completed; the restore flow reads the deletion ledger and refuses to restore deleted principals without an explicit user override that re-creates a new identity.
- The PWA is closed mid-execution; execution resumes from the persisted step state at next open and every step is idempotent.
- Another tab tries to publish a listing during grace; publishing is refused with PRIVACY_DELETION_PENDING.
- A relay holds the user's data under a legal hold; it keeps that data sealed and out of public serving, and the user is told only that some relay copies may be retained under legal obligation.

## UX and accessibility

- Delete account screen: what will be deleted, what will be pseudonymized and kept (evidence for up to 2 years), what cannot be recalled, export-first link, checkbox Also remove my evidence copies in this vault, typed confirmation of the pseudonym, fresh unlock required.
- Pending deletion banner on every screen with days left, Cancel deletion button, and blocking commitments list when deferred.
- Completion summary: counts per module, relays by delivery state (prepared, relay received, peer accepted), pseudonym assigned to retained evidence, and the cannot-recall notice.

**States:** idle; needs-unlock; pending-grace; deferred; executing; completed; failed-retrying; cancelled

**Accessibility:** The destructive confirmation requires typing text and has a clear cancel path; its warning is text, not only color.; The banner is a labelled region with a polite live update of days left.; Buttons are at least 44 by 44 px with distinct accessible names such as Cancel deletion and Request deletion.

## Owned data

- `DeletionRequest` (classrup.privacy.deletion_request/v1, P3, RET-EVIDENCE)

## Interfaces

- Commands: `privacy.deletion.request`, `privacy.deletion.cancel`, `privacy.deletion.relay_apply`
- Queries: `privacy.deletion.get`, `privacy.deletion.preview`
- Emits: `privacy.deletion.requested`, `privacy.deletion.completed`
- Consumes: `mutiny.cycle.completed`, `mutiny.cycle.cancelled`, `commerce.deal.completed`, `commerce.dispute.resolved`, `rentals.rental.closed`

## Dependencies

F10.S01.M01, F10.S01.M02, F10.S01.M03, F07.S01.M01, F16.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-077-01 | [Domain schema](domain_schema.md) | 3 |
| PS-077-02 | [Validation rules](validation_rules.md) | 3 |
| PS-077-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-077-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-077-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-077-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-077-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-077-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-077-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-077-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/privacy/src/data_controls/delete/index.ts`.

## Acceptance criteria

- All tests T01 to T16 pass in CI.
- After completion no module retains content or recoverable keys for the principal, and retained evidence carries only the pseudonym.
- The grace period of 14 days cannot be shortened by any API.
- The completion summary always states what cannot be recalled.
