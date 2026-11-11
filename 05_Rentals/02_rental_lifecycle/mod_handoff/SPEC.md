# F05.S02.M01 — Rental handoff

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F05.S02](../SPEC.md). **Process IDs:** PS-042-01…PS-042-10. **Code:** `packages/rentals/src/rental_lifecycle/handoff`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

At pickup the parties record the item's condition as a handoff report - a checklist built from the reservation's checklist template, optional meter readings, notes and up to 20 photos sent as end-to-end encrypted F08 attachments referenced by MediaBlob id. One party signs a report revision, the other either attests that exact revision or asks for changes (up to 5 rounds). When both signatures cover the same report cid, the handoff is attested and the rental period starts. Each statement is judged by its signed creation time with a 72 hour receipt bound, so signing at the meeting and syncing later works, and a reservation is never cancelled automatically while either party holds a signed report. The attestation evidences that both parties asserted this report at the claimed times; it does not prove the item's real condition, the parties' identities beyond their keys, or that the item changed hands.

## Responsibilities

- Own RentalHandoff in both vaults and the statements handoff_report, handoff_changes_request and handoff_attestation (classrup.rentals.*/v1), each bound to a reservation cid and a report revision cid and registered with its signer role in F11.S01.M01.
- Build the report from the checklistTemplate carried in rentals.reservation.confirmed and capture photos as F08.S01.M03 attachments of at most 5 MiB whose metadata the sender strips through F10.S02.M03 before encryption, referenced by MediaBlob id (F15.S02.M03).
- Attest only an exact report revision cid after every referenced photo is fetched, decrypted, hash-verified and stored locally; any change creates a new revision and clears prior attestations.
- Emit rentals.handoff.attested once, locally in each vault, when both signatures on the same cid are held.
- Judge the pickup window on each statement's signed createdAt with a 72 hour receipt bound, and request the no_handoff cancellation from F05.S01.M01 only when neither party holds a signed report at startsAt plus 96 hours.

## Not responsible for

- Reservation calendar and rent (F05.S01.M01), deposit terms and funding (F05.S01.M02), return report (F05.S02.M02) and damage claims (F05.S02.M03).
- Meetup scheduling and check-in (F08.S03.M02, F08.S03.M03).
- Identity verification of the parties; keys identify them, not legal persons.
- Content checks by relays; relays carry ciphertext only and cannot inspect photos.
- Future: tamper-evident capture of photos with device attestation, and NFC tag scans.

## User stories

- As an owner at pickup, I go through a checklist with the renter, take photos, sign the report and see when the renter attests it.
- As a renter, I check each item and photo, ask for changes if something is missing, and attest the exact version I agree with.
- As either party, I can see who signed which revision and at which claimed time, and sign offline at the meeting knowing it still counts when it syncs later.

## Edge cases

- Counterparty attests revision 2 after the author already published revision 3; the attestation names the old cid and is refused with RENTALS_REPORT_STALE.
- A modified client sends a photo that still carries EXIF, XMP or GPS metadata; the relay only sees ciphertext, and the receiving vault checks the decrypted bytes, quarantines the photo with RENTALS_PHOTO_METADATA and never stores, displays or attests it.
- Both parties sign at the meeting at startsAt plus 1 h while offline and the signatures arrive at startsAt plus 30 h; the statements are accepted because their signed createdAt is inside the window and they arrived within 72 h, and the handoff is attested in both vaults.
- An attestation signed at startsAt plus 23 h is delivered at startsAt plus 25 h; it is accepted in both vaults and neither vault expires the handoff.
- Neither party signed any report by startsAt plus 96 h; the handoff expires and F05.S01.M01 cancels the reservation with no_handoff through a signed cancellation.
- One party signed a report but the other never attested; no automatic cancellation happens, the reservation stays handoff_pending and only an explicit signed cancellation or a dispute ends it.
- Reservation is cancelled while a report is in progress; the handoff moves to cancelled and keeps its drafts as history.
- Owner and renter author different reports at the same time; the owner's report is canonical and the renter's report is converted to a changes request. Forked devices of one party sign two different reports for the same revision; the handoff is frozen.
- A signature arrives from a key that is neither owner nor renter; quarantined with RENTALS_STATEMENT_INVALID, never counted.
- Report exceeds 30 checklist items or 20 photos; refused with VALIDATION_FAILED; a photo above 5 MiB after processing is refused with COMMS_ATTACHMENT_TOO_LARGE.
- The relay blob of a photo is gone before the counterparty fetched it (expired, or the author deleted the message); comms.attachment.download returns NOT_FOUND, the photo is listed in missingPhotos[], attest is refused with RENTALS_EVIDENCE_MISSING until the author re-sends it, and photos already stored stay as evidence even if the author later deletes the message.

## UX and accessibility

- Handoff checklist: items from the reservation's template with condition chips (ok, worn, damaged, missing, not applicable), note field (≤ 200 characters), up to 3 photos per item and 20 per report.
- Review and attest sheet: report revision fingerprint, list of changes since the last revision, per-photo download and verification status, Attest this revision and Request changes buttons (Attest disabled until every photo is held and verified).
- Status card: who signed which revision, claimed times, sync line, window-closed notice after the pickup window, and the sentence that this records what both parties said, not proof of condition.

**States:** loading; drafting; awaiting-counterparty; changes-requested; evidence-downloading; attested; frozen; window-closed; expired; cancelled; pending-offline

**Accessibility:** Condition chips are a radio group per item with text labels; photo thumbnails have alt text fields required before submit.; Attest and Request changes buttons are at least 44x44 px with accessible names that include the revision number.; Status changes are announced in an aria-live polite region.

## Owned data

- `RentalHandoff` (classrup.rentals.handoff/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `rentals.handoff.draft`, `rentals.handoff.submit`, `rentals.handoff.request_changes`, `rentals.handoff.attest`, `rentals.handoff.receive`
- Queries: `rentals.handoff.get`, `rentals.handoff.get_for_reservation`
- Emits: `rentals.handoff.attested`
- Consumes: `rentals.reservation.confirmed`, `rentals.reservation.cancelled`, `rentals.deposit.funded`, `rentals.deposit.agreed`, `identity.block.added`, `privacy.deletion.completed`

## Dependencies

F05.S01.M01, F05.S01.M02, F08.S01.M01, F08.S01.M03, F15.S02.M03, F10.S02.M03, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-042-01 | [Domain schema](domain_schema.md) | 3 |
| PS-042-02 | [Validation rules](validation_rules.md) | 4 |
| PS-042-03 | [Workflow state machine](workflow_state_machine.md) | 5 |
| PS-042-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-042-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-042-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-042-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 6 |
| PS-042-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-042-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-042-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/rentals/src/rental_lifecycle/handoff/index.ts`.

## Acceptance criteria

- All tests T01–T21 pass in CI.
- A handoff is attested only when both signatures cover the same report cid with every photo held and verified, and any edit clears attestations.
- No stored or displayed photo contains EXIF, XMP or GPS metadata, no relay check is claimed, and the UI states that the attestation is not proof of condition.
