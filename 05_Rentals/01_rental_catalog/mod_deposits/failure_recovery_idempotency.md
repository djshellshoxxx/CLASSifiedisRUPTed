# PS-040-06 — Failure recovery and idempotency: Rental deposits (noncustodial)

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S01.M02 Rental deposits (noncustodial)](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_catalog/deposits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-040-06.R01** Commands are idempotent through local command ids and statements through cid; payment events through the inbox, so replays never double-settle.
- **PS-040-06.R02** Contradictory signed statements (two forfeit claims, responses to different claim cids, two terms with the same reservation) freeze the deposit and require explicit renegotiation or dispute, never last-writer-wins.
- **PS-040-06.R03** Each state change, event and sync outbox entry commit in one IndexedDB transaction.

## Specification

- **idempotency:** Local command id stored 24 h; statements deduplicated by cid; payment events deduplicated by (consumer, eventId); the unique live-terms index makes a second proposal for one reservation a no-op or RENTALS_DEPOSIT_DUPLICATE.
- **concurrency:** Web Locks lock rentals-deposit-<reservationId> around commands and payment handling; expectedRevision on every command; forked devices of one party are detected through the signed seq/prev chain and freeze the deposit.
- **retries:** Sync outbox retries 1 s, 2 s, 4 s, 8 s up to 8 attempts per destination; local event handlers retry per EVT-6; dispute case creation retries 10 s, 60 s, 10 minutes.
- **offline:** Propose, agree, attest release, claim, respond and dispute work offline and commit locally; the UI shows prepared, transport_acknowledged or peer_accepted and never claims the counterparty saw a statement before the signed acknowledgement.
- **partial failure:** If registering a payment context with the Deal fails, the statement is not signed and the state is unchanged; if the dispute case port fails after local commit the deposit stays disputed locally with retry; relay delivery failures change only the sync state.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-040-09.T07 | integration | PS-040-04.R01, PS-040-04.R02, PS-040-06.R01, PS-040-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on released with identical cids; duplicates skipped |
| TEST-PS-040-09.T10 | integration | PS-040-06.R02, PS-040-06.R03 | two contradictory forfeit claims; dispute port failing once | deposit frozen for dispute; claim retried; no partial state |

## Dependencies

Module depends on: F05.S01.M01, F09.S01.M01, F09.S02.M02, F09.S03.M01, F08.S01.M01, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
