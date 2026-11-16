# PS-015-06 — Failure recovery and idempotency: Two-party barter

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M01 Two-party barter](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/two` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-015-06.R01** All commands are idempotent per CTR-IDM-001 and mutating commands carry expectedRevision for the local aggregate.
- **PS-015-06.R02** Each command is one IndexedDB transaction covering the aggregate, reservation, consent record, events and outbox entries, so a crash leaves either the old or the new state.
- **PS-015-06.R03** Forked or conflicting signed promises are detected, frozen and renegotiated explicitly; consent, money and inventory are never resolved by last-writer-wins.
- **PS-015-06.R04** Cross-vault outcomes are never presented as certain; the UI shows the highest sync state reached.

## Specification

- **idempotency:** Idempotency-Key required on create, accept, counter, reject, withdraw; replay within 24 h returns the stored result; ingest dedupes by envelope cid.
- **concurrency:** expectedRevision on the aggregate; Web Locks mutex per proposalId within the vault; cross-party races produce forks that freeze the proposal, not merges.
- **retries:** Outbox retries per IDM-4 (base 500 ms, cap 30 s, max 6 attempts per relay or direct endpoint) with the sync states prepared, transport_acknowledged, peer_accepted; consent is never re-signed on retry, the same envelope is re-sent.
- **offline:** All commands work offline and commit locally; the proposal shows 'saved on this device' until the outbox delivers, and the deadline keeps running on the local clock.
- **partial failure:** If the principal's consent was delivered but the reservation statement was not, the peer's vault does not count the consent toward acceptance until the reservation arrives; if reservation succeeded locally but signing failed, the transaction aborts and the reservation is not kept.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-015-09.T05 | integration | PS-015-03.R03, PS-015-06.R03 | both parties counter revision 3 offline | fork detected in both vaults, proposal frozen, reservations released, no consent counted |
| TEST-PS-015-09.T08 | integration | PS-015-04.R03, PS-015-06.R04 | revision, consent, reservation arrive out of order and duplicated | verdict re-evaluated after each, duplicates skipped, state converges |
| TEST-PS-015-09.T10 | integration | PS-015-06.R01, PS-015-06.R02 | replay commands with same key; crash between reservation and consent signing | stored response replayed; no leaked reservation |
| TEST-PS-015-09.T16 | chaos | PS-015-06.R04, PS-015-03.R01 | relay down for 30 min then up | outbox delivers, no state ever claims peer acknowledgement before it arrives |

## Dependencies

Module depends on: F02.S01.M02, F02.S01.M03, F02.S01.M04, F02.S02.M05, F02.S03.M02, F01.S03.M01, F07.S01.M01, F07.S02.M02, F08.S02.M02, F12.S03.M04, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
