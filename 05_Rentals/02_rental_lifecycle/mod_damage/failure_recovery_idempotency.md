# PS-041-06 — Failure recovery and idempotency: Rental damage claims

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M03 Rental damage claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/damage` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-041-06.R01** Commands are idempotent through local command ids and statements through cid, so repeated delivery never adds a second response or acceptance.
- **PS-041-06.R02** Contradictory signed statements (two responses to one claim, a counter acceptance for an unknown response cid, forked devices) freeze the claim with explicit exits - co-signed renegotiation, withdrawal or escalation after 14 days - never last-writer-wins.
- **PS-041-06.R03** Escalation requests the F09 case only on the designated party's explicit action, before the state change, and retries that request on failure, so a claim is never escalated without a case request in flight and a crash never leaves a half-applied escalation.

## Specification

- **idempotency:** Local command id stored 24 h; statements deduplicated by cid in the inbox table; unique (reservation, kind) index returns the existing claim for a repeated claim command; the F09 case request carries the claim id as reference; commerce.deal.open with the deterministic contextRef returns the existing Deal.
- **concurrency:** Web Locks lock rentals-damage-<reservationId> around commands and sweeps; expectedRevision on every command; forked devices of one party are detected through the signed seq/prev chain and freeze the claim; only the designated opener's vault can open a case, so two cases for one claim cannot arise.
- **retries:** Sync outbox retries 1 s, 2 s, 4 s, 8 s up to 8 attempts per destination; a case request the user started retries 10 s, 60 s, 10 minutes; evidence photos are fetched again and re-requested from the author when missing.
- **offline:** Claim, respond, accept, withdraw and escalate work offline and commit locally; deadlines are the absolute values in the signed statements, so a late delivery within 72 h never changes the outcome; the UI shows prepared, transport_acknowledged or peer_accepted and never claims the other party saw a statement before the signed acknowledgement.
- **partial failure:** If the case port fails during the user's escalation the claim stays in its state with the escalation request pending and a visible note; if commerce.deal.open fails for the excess a retry job opens it with the same contextRef; if relay delivery fails the local state stands and the sync state shows the failure.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-041-09.T07 | integration | PS-041-04.R02, PS-041-06.R01, PS-041-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on accepted with identical cids; duplicates skipped |
| TEST-PS-041-09.T10 | integration | PS-041-06.R02, PS-041-06.R03 | two contradictory responses; case port failing once after the opener's explicit escalate; crash injected between the case request and the state change | claim frozen; case request retried; after restart never escalated without a request in flight and no partial state |

## Dependencies

Module depends on: F05.S02.M01, F05.S02.M02, F05.S01.M01, F05.S01.M02, F09.S01.M01, F09.S01.M03, F09.S02.M02, F08.S01.M01, F08.S01.M03, F15.S02.M03, F10.S02.M03, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
