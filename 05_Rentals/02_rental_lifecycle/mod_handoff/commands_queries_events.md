# PS-042-04 — Commands, queries and events: Rental handoff

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M01 Rental handoff](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/handoff` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-042-04.R01** Vault commands draft, submit, request_changes and attest build local state; submit, request_changes and attest each produce a named signed statement and a sync outbox entry in the same vault transaction.
- **PS-042-04.R02** One ingestion command applies inbound statements, deduplicates by cid, derives local events with actor.kind federated and quarantines failures.
- **PS-042-04.R03** Events are local (EVT-8); rentals.handoff.attested is derived in each vault only when both signatures on the same cid are held.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `rentals.handoff.draft` | rentals.handoff.edit | [vault-local] { reservationId, checklist, readings?, photos?, notes?, expectedRevision? } | { handoffId, revision, reportRevision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, RENTALS_HANDOFF_WINDOW |  | yes (Idempotency-Key) |
| `rentals.handoff.submit` | rentals.handoff.edit | [statement classrup.rentals.handoff_report/v1 signed by the author, E2E encrypted to the other party] { handoffId, expectedRevision } | { handoffId, revision, reportCid, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, RENTALS_HANDOFF_WINDOW |  | yes (Idempotency-Key) |
| `rentals.handoff.request_changes` | rentals.handoff.attest | [statement classrup.rentals.handoff_changes_request/v1 signed by the counterparty over the report cid] { handoffId, expectedRevision, reportCid, reason } | { handoffId, revision, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, RENTALS_REPORT_STALE, RENTALS_CHANGE_LIMIT, VALIDATION_FAILED |  | yes (Idempotency-Key) |
| `rentals.handoff.attest` | rentals.handoff.attest | [statement classrup.rentals.handoff_attestation/v1 signed by the counterparty over the exact report cid] { handoffId, expectedRevision, reportCid } | { handoffId, revision, attestationCid, state, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, RENTALS_REPORT_STALE, RENTALS_HANDOFF_WINDOW | rentals.handoff.attested | yes (Idempotency-Key) |
| `rentals.handoff.receive` | rentals.handoff.receive | [vault-local ingestion of an inbound envelope per CTR-FED-001] { envelope, via? } | { accepted: boolean, quarantined?: boolean, code?, appliedIds[] } | RENTALS_STATEMENT_INVALID, UNSUPPORTED_SCHEMA_VERSION, RENTALS_REPORT_STALE, CONFLICT_STATE | rentals.handoff.attested | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `rentals.handoff.get` | rentals.handoff.read_own | [vault-local] { handoffId } | { handoff: RentalHandoff, diffFromPrevious?: ChecklistDiff } | NOT_FOUND |
| `rentals.handoff.get_for_reservation` | rentals.handoff.read_own | [vault-local] { reservationId } | { handoff?: RentalHandoff } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `rentals.handoff.attested` | P2 | { handoffId, reservationId, ownerId, renterId, reportCid, reportRevision, attestedAt } |

### Events consumed

| Type | Effect |
|---|---|
| `rentals.reservation.confirmed` | create an empty handoff in drafting for the reservation with the item checklist template |
| `rentals.reservation.cancelled` | cancel an unattested handoff and keep its drafts as history |
| `rentals.deposit.funded` | show deposit funded on the handoff screen |
| `rentals.deposit.agreed` | show deposit agreed but not yet funded warning until funded is received |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| RENTALS_STATEMENT_INVALID | 422 | no | signature, signer role or referenced cid check failed; statement quarantined |
| RENTALS_HANDOFF_WINDOW | 409 | no | outside 2 hours before to 24 hours after the reservation start |
| RENTALS_REPORT_STALE | 409 | no | statement names a report cid that is not the latest or comes from the author |
| RENTALS_CHANGE_LIMIT | 409 | no | five change rounds already used |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
owner vault: rentals.handoff.draft { "reservationId": "0192f500-0002-…", "checklist": [{ "id": "tent-body", "label": "Tent body", "condition": "ok" }], "photos": [{ "attachmentId": "0192f520-00a1-…", "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" }] }
owner: rentals.handoff.submit -> { "reportCid": "sha256-Rp…", "syncState": "prepared" }
renter vault: rentals.handoff.attest { "reportCid": "sha256-Rp…" } -> state attested, rentals.handoff.attested emitted in both vaults once both signatures are held
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-042-09.T05 | integration | PS-042-03.R03, PS-042-04.R03 | both parties sign offline at the meeting and sync later | attested when both signatures held; reservation endsAt unchanged; event emitted once per vault |
| TEST-PS-042-09.T06 | integration | PS-042-04.R01, PS-042-04.R02, PS-042-06.R01, PS-042-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on attested with identical cids; duplicates skipped |
| TEST-PS-042-09.T07 | contract | PS-042-04.R01, PS-042-04.R03, PS-042-09.R02 | each command, statement and event | payloads and signatures validate against registry schemas |
| TEST-PS-042-09.T11 | integration | PS-042-03.R01, PS-042-04.R03 | reservation cancelled mid-report; 24 h after start without attestation | handoff cancelled with drafts kept; handoff expired and reservation cancelled no_handoff |

## Dependencies

Module depends on: F05.S01.M01, F05.S01.M02, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
