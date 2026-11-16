# F05.S02.M01 — Rental handoff

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F05.S02](../SPEC.md). **Process IDs:** PS-042-01…PS-042-10. **Code:** `packages/rentals/src/rental_lifecycle/handoff`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

At pickup the parties record the item's condition as a handoff report - a checklist, optional meter readings, notes and up to 20 photo references with hashes. One party signs a report revision, the other either attests that exact revision or asks for changes (up to 5 rounds). When both signatures cover the same report cid, the handoff is attested and the rental period starts. The attestation evidences that both parties asserted this report at the claimed times; it does not prove the item's real condition, the parties' identities beyond their keys, or that the item changed hands. Times from the other party are claims.

## Responsibilities

- Own RentalHandoff in both vaults and the statements handoff_report, handoff_changes_request and handoff_attestation (classrup.rentals.*/v1), each bound to a reservation cid and a report revision cid.
- Build the report from the item's checklist template and capture photo references re-encoded with metadata stripped (PRV-4) and SHA-256 hashes.
- Attest only an exact report revision cid; any change creates a new revision and clears prior attestations.
- Emit rentals.handoff.attested once, locally in each vault, when both signatures on the same cid are held.

## Not responsible for

- Reservation calendar and rent (F05.S01.M01), deposit terms and funding (F05.S01.M02), return report (F05.S02.M02) and damage claims (F05.S02.M03).
- Meetup scheduling and check-in (F08.S03.M02, F08.S03.M03).
- Identity verification of the parties; keys identify them, not legal persons.
- Future: tamper-evident capture of photos with device attestation, and NFC tag scans.

## User stories

- As an owner at pickup, I go through a checklist with the renter, take photos, sign the report and see when the renter attests it.
- As a renter, I check each item and photo, ask for changes if something is missing, and attest the exact version I agree with.
- As either party, I can see who signed which revision and at which claimed time.

## Edge cases

- Counterparty attests revision 2 after the author already published revision 3; the attestation names the old cid and is refused with RENTALS_REPORT_STALE.
- Photos include GPS metadata; the vault re-encodes to strip it before hashing, and a relay rejects images with GPS tags (PRV-4).
- One party is offline at the meeting; both can sign locally and exchange signatures later; the handoff is attested only when both signatures are held, and the rental period is the reservation interval anyway.
- Renter never attests within 24 h after startsAt; the handoff expires and the reservation is cancelled with no_handoff.
- Reservation is cancelled while a report is in progress; the handoff moves to cancelled and keeps its drafts as history.
- Both parties author different reports at the same time; the owner's report is canonical, the renter's draft is converted to a changes request.
- A signature arrives from a key that is neither owner nor renter; quarantined, never counted.
- Report exceeds 30 checklist items or 20 photos; refused with VALIDATION_FAILED.

## UX and accessibility

- Handoff checklist: items from the template with condition chips (ok, worn, damaged, missing, not applicable), note field (≤ 200 characters), up to 3 photos per item and 20 per report.
- Review and attest sheet: report revision fingerprint, list of changes since the last revision, Attest this revision and Request changes buttons.
- Status card: who signed which revision, claimed times, sync line, and the sentence that this records what both parties said, not proof of condition.

**States:** loading; drafting; awaiting-counterparty; changes-requested; attested; expired; cancelled; pending-offline

**Accessibility:** Condition chips are a radio group per item with text labels; photo thumbnails have alt text fields required before submit.; Attest and Request changes buttons are at least 44x44 px with accessible names that include the revision number.; Status changes are announced in an aria-live polite region.

## Owned data

- `RentalHandoff` (classrup.rentals.handoff/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `rentals.handoff.draft`, `rentals.handoff.submit`, `rentals.handoff.request_changes`, `rentals.handoff.attest`, `rentals.handoff.receive`
- Queries: `rentals.handoff.get`, `rentals.handoff.get_for_reservation`
- Emits: `rentals.handoff.attested`
- Consumes: `rentals.reservation.confirmed`, `rentals.reservation.cancelled`, `rentals.deposit.funded`, `rentals.deposit.agreed`

## Dependencies

F05.S01.M01, F05.S01.M02, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-042-01 | [Domain schema](domain_schema.md) | 3 |
| PS-042-02 | [Validation rules](validation_rules.md) | 3 |
| PS-042-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-042-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-042-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-042-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-042-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-042-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-042-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-042-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/rentals/src/rental_lifecycle/handoff/index.ts`.

## Acceptance criteria

- All tests T01–T15 pass in CI.
- A handoff is attested only when both signatures cover the same report cid, and any edit clears attestations.
- No stored or sent photo contains GPS or other metadata and the UI states that the attestation is not proof of condition.
