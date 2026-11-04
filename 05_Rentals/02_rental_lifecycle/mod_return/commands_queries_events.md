# PS-043-04 — Commands, queries and events: Rental return

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M02 Rental return](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/return` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-043-04.R01** Vault commands report, attest, record_received, adjust_late_fee and waive_damage each produce a named signed statement and a sync outbox entry in the same vault transaction.
- **PS-043-04.R02** One ingestion command applies inbound statements, deduplicates by cid, derives local events with actor.kind federated and quarantines failures.
- **PS-043-04.R03** Overdue, attested and closed events are local (EVT-8); each vault derives them from its own data and clock and from the signed statements it holds.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `rentals.return.report` | rentals.return.report | [statement classrup.rentals.return_report/v1 signed by renter, E2E encrypted to owner] { reservationId, checklist, photos?, notes?, returnedAtClaim } | { returnId, reportCid, lateMinutes, lateFee: Money, syncState } | NOT_FOUND, CONFLICT_STATE, VALIDATION_FAILED |  | yes (Idempotency-Key) |
| `rentals.return.attest` | rentals.return.attest | [statement classrup.rentals.return_attestation/v1 signed by owner over the exact report cid] { returnId, expectedRevision, reportCid, conditionVerdict } | { returnId, revision, attestationCid, state, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, RENTALS_REPORT_STALE | rentals.return.attested | yes (Idempotency-Key) |
| `rentals.return.record_received` | rentals.return.attest | [statement classrup.rentals.owner_receipt/v1 signed by owner] { returnId, expectedRevision, receivedAtClaim, checklist?, photos?, notes?, conditionVerdict } | { returnId, revision, receiptCid, lateMinutes, lateFee: Money, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED | rentals.return.attested | yes (Idempotency-Key) |
| `rentals.return.adjust_late_fee` | rentals.return.adjust_fee | [statement classrup.rentals.late_fee_adjustment/v1 signed by owner] { returnId, expectedRevision, newLateFee: Money, reason } | { returnId, revision, lateFee: Money, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, RENTALS_FEE_ADJUST_INVALID |  | yes (Idempotency-Key) |
| `rentals.return.waive_damage` | rentals.return.adjust_fee | [statement classrup.rentals.return_waiver/v1 signed by owner] { returnId, expectedRevision } | { returnId, revision, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | rentals.rental.closed | yes (Idempotency-Key) |
| `rentals.return.receive` | rentals.return.receive | [vault-local ingestion of an inbound envelope per CTR-FED-001] { envelope, via? } | { accepted: boolean, quarantined?: boolean, code?, appliedIds[] } | RENTALS_STATEMENT_INVALID, UNSUPPORTED_SCHEMA_VERSION, RENTALS_REPORT_STALE, CONFLICT_STATE | rentals.return.attested, rentals.rental.overdue, rentals.rental.closed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `rentals.return.get` | rentals.return.read_own | [vault-local] { returnId } | { return: RentalReturn, diffFromHandoff: ChecklistDiff, closureChecks } | NOT_FOUND |
| `rentals.return.get_for_reservation` | rentals.return.read_own | [vault-local] { reservationId } | { return?: RentalReturn } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `rentals.return.attested` | P2 | { returnId, reservationId, ownerId, renterId, reportCid?, effectiveReturnedAt, attestedBy, conditionVerdict, lateMinutes, lateFee } |
| `rentals.rental.overdue` | P2 | { reservationId, returnId, dueAt, graceUntil, detectedAt } |
| `rentals.rental.closed` | P2 | { reservationId, returnId, closedAt, reason } |

### Events consumed

| Type | Effect |
|---|---|
| `rentals.handoff.attested` | create the RentalReturn in state due with dueAt from the reservation and the handoff report cid |
| `rentals.damage.claimed` | mark an open damage claim so closure waits |
| `rentals.damage.resolved` | clear the open damage claim and re-evaluate closure |
| `rentals.deposit.agreed` | mark a deposit pending for the closure check |
| `rentals.deposit.funded` | keep the deposit pending until it is released or forfeited |
| `rentals.deposit.released` | mark the deposit settled and re-evaluate closure |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| RENTALS_STATEMENT_INVALID | 422 | no | signature, signer role or referenced cid check failed; statement quarantined |
| RENTALS_REPORT_STALE | 409 | no | attestation names a return report cid that is not the latest |
| RENTALS_FEE_ADJUST_INVALID | 422 | no | a late fee can only be lowered or waived |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
renter vault: rentals.return.report { "reservationId": "0192f500-0002-…", "checklist": [{ "id": "tent-body", "label": "Tent body", "condition": "ok" }],
  "returnedAtClaim": "2026-12-07T12:10:00.000Z" } -> { "returnId": "0192f530-0001-…", "lateMinutes": 130, "lateFee": { "amount": "1500", "currency": "EUR" } }
(reservation end 09:00 UTC, grace 60 min, rate EUR 5.00 per hour: lateMinutes 130, ceil(130/60) = 3 hours, fee EUR 15.00)
owner vault: rentals.return.attest { "reportCid": "sha256-Rt…", "conditionVerdict": "matches_handoff" } -> rentals.return.attested; later rentals.rental.closed
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-043-09.T07 | integration | PS-043-04.R03, PS-043-01.R02 | closure with open damage claim, funded deposit, damage window, owner waiver | closed only when all four checks pass; waiver ends the window early |
| TEST-PS-043-09.T08 | integration | PS-043-04.R01, PS-043-04.R02, PS-043-06.R03, PS-043-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on attested and closed with identical cids; duplicates skipped |
| TEST-PS-043-09.T09 | contract | PS-043-04.R01, PS-043-04.R03, PS-043-09.R02 | each command, statement and event | payloads and signatures validate against registry schemas |

## Dependencies

Module depends on: F05.S02.M01, F05.S01.M01, F05.S01.M02, F09.S01.M01, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
