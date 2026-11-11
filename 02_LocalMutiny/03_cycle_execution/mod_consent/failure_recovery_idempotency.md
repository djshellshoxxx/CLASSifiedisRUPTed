# PS-021-06 — Failure recovery and idempotency: Cycle consent

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M01 Cycle consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/consent` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-021-06.R01** All commands are idempotent per CTR-IDM-001 and mutating commands carry expectedRevision for the local aggregate.
- **PS-021-06.R02** Each command and each evaluation is one IndexedDB transaction covering the cycle, consents, reservation release, events and outbox entries, and the commit verdict is evaluated inside that same transaction.
- **PS-021-06.R03** Forked or conflicting signed promises are detected, frozen and renegotiated explicitly; consent, money and inventory commitments are never resolved by last-writer-wins.
- **PS-021-06.R04** Delivery is at-least-once and out of order; duplicates are skipped by their owners by cid and the verdict converges once the same evidence is present.

## Specification

- **idempotency:** Idempotency-Key required on propose, consent and decline, replay 24 h; evaluate is idempotent per (cycleId, trigger evidence id); consent is bound to (cycleId, participantId, revisionHash) and cannot be created twice.
- **concurrency:** expectedRevision on the aggregate; a Web Locks mutex per cycleId inside the vault; cross-vault races surface as forks, equivocation or late consents, never as merges.
- **retries:** Outbox retries with IDM-4 backoff (base 500 ms, cap 30 s, max 6 attempts per destination); the same signed envelope is re-sent, a consent is never re-signed.
- **offline:** Propose, consent and decline commit locally while offline and show pending; the deadline continues on the local clock, and a consent signed offline that is delivered after the deadline is late at peers.
- **partial failure:** If a consent was delivered but the reservation statement was not, peers do not count the consent toward commit; if a participant's statements reach only some vaults, vaults may disagree on the verdict, and the UI states that each device decides for itself.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-021-09.T08 | integration | PS-021-03.R03, PS-021-06.R03, PS-021-07.R06 | equivocation: coordinator sends revision 2 with digest H2a to Bob and H2b to Carol; Carol's correctly signed consent on revision 2 with H2b reaches Bob's vault whose head is H2a | V14: both hashes stored, mutiny.revision.report_fork called, mutiny.revision.forked emitted, cycle frozen, no consent counted |
| TEST-PS-021-09.T09 | integration | PS-021-03.R03, PS-021-06.R03 | conflicting reservation for one item in two cycles seen by one vault | mutiny.lock.conflict_detected, both cycles frozen, renegotiation requires new cycle |
| TEST-PS-021-09.T12 | integration | PS-021-06.R01, PS-021-06.R02, PS-021-06.R04 | replay commands; crash mid-transaction; out-of-order and duplicate delivery | one consent per participant; no partial record; verdict converges |
| TEST-PS-021-09.T13 | chaos | PS-021-06.R04, PS-021-06.R03 | relay down 30 min during consent window | statements delivered afterwards, UI never shows peer_accepted before acknowledgement |

## Dependencies

Module depends on: F02.S03.M02, F02.S02.M03, F02.S02.M05, F02.S01.M02, F02.S01.M03, F02.S01.M04, F02.S04.M02, F08.S02.M02, F07.S01.M01, F07.S02.M02, F07.S03.M01, F12.S03.M04, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
