# PS-041-06 — Failure recovery and idempotency: Rental damage claims

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M03 Rental damage claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/damage` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-041-06.R01** Commands are idempotent through local command ids and statements through cid, so repeated delivery never adds a second response or acceptance.
- **PS-041-06.R02** Contradictory signed statements (two responses to one claim, a counter acceptance for an unknown response cid) freeze the claim and require escalation, never last-writer-wins.
- **PS-041-06.R03** Escalation requests the F09 case before the state change and retries on failure, so a claim is never escalated without a case request in flight.

## Specification

- **idempotency:** Local command id stored 24 h; statements deduplicated by cid in the inbox table; unique (reservation, kind) index returns the existing claim for a repeated claim command; the F09 case request carries the claim id as reference.
- **concurrency:** Web Locks lock rentals-damage-<reservationId> around commands and sweeps; expectedRevision on every command; forked devices of one party are detected through the signed seq/prev chain and freeze the claim.
- **retries:** Sync outbox retries 1 s, 2 s, 4 s, 8 s up to 8 attempts per destination; the F09 case request retries 10 s, 60 s, 10 minutes.
- **offline:** Claim, respond, accept, withdraw and escalate work offline and commit locally; deadlines use the local clock when the statement is received; the UI shows prepared, transport_acknowledged or peer_accepted and never claims the other party saw a statement before the signed acknowledgement.
- **partial failure:** If the case port fails during escalation the claim stays in its state with an escalation retry pending and a visible note; if relay delivery fails the local state stands and the sync state shows the failure.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-041-09.T07 | integration | PS-041-04.R02, PS-041-06.R01, PS-041-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on accepted with identical cids; duplicates skipped |
| TEST-PS-041-09.T10 | integration | PS-041-06.R02, PS-041-06.R03 | two contradictory responses; case port failing once | claim frozen for escalation; case retried; escalation never without a request in flight |

## Dependencies

Module depends on: F05.S02.M01, F05.S02.M02, F05.S01.M01, F05.S01.M02, F09.S01.M01, F09.S02.M02, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
