# PS-010-06 — Failure recovery and idempotency: Price negotiation

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M02 Price negotiation](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/negotiation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-010-06.R01** Commands are idempotent per CTR-IDM-001; inbound statements are idempotent by statementCid.
- **PS-010-06.R02** In the seller vault, the hold, the Deal handoff, the Negotiation update and the signed confirmation commit in one transaction; if the hold or the handoff fails, nothing is confirmed and a signed close is sent instead.
- **PS-010-06.R03** Conflicting signed promises are detected and frozen; no last-writer-wins for consent, money or inventory.

## Specification

- **idempotency:** Idempotency-Key required on every command, kept 24 h in the vault; inbound statements deduplicated by cid; replayed accept returns the stored confirmation or accept_sent state.
- **concurrency:** expectedRevision on every command; turn check by awaiting; unique live-chain index; the hold is serialized by the inventory module; simultaneous counters from both sides produce two signed rounds with the same number and freeze the chain in both vaults on exchange.
- **retries:** Transport retries follow IDM-4: base 500 ms, cap 30 s, 6 attempts per burst; quarantined statements and signed closes are not retried against a closed chain.
- **offline:** Counter and withdraw can be prepared offline; accept can be signed offline but the UI keeps it at accept_sent and states that the seller has not confirmed; expiry keeps running by each vault's own clock.
- **partial failure:** If the confirmation cannot be delivered after the seller committed, the seller vault retries and the buyer sees accept_sent until a verified confirmation or the round expiry; the seller's hold expires on its own lease if the buyer never completes the Deal.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-010-09.T05 | integration | PS-010-03.R02, PS-010-06.R02 | B accepts S's round 1; S vault holds and confirms | B shows accept_sent then accepted only after verified confirmation; S has hold and Deal handoff |
| TEST-PS-010-09.T06 | integration | PS-010-03.R03, PS-010-06.R03 | S and B counter simultaneously | both vaults freeze on exchange, no hold taken, discard needed to continue |
| TEST-PS-010-09.T09 | integration | PS-010-04.R02, PS-010-06.R03 | statements sent with relay down then up | states move prepared to transport_acknowledged to peer_accepted only on receipts; UI never shows more |
| TEST-PS-010-09.T12 | chaos | PS-010-06.R01, PS-010-06.R03 | replay accept with same key; crash after hold before confirmation | one confirmation; hold and Negotiation consistent after restart |

## Dependencies

Module depends on: F01.S04.M01, F01.S03.M01, F01.S01.M01, F01.S02.M01, F09.S01.M01, F09.S03.M03, F07.S02.M02, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
