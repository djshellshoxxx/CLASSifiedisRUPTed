# PS-004-09 — Contract and acceptance tests: Listing publication

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M03 Listing publication](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/publish` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-004-09.R01** Every requirement is covered by at least one automated test.
- **PS-004-09.R02** Contract tests validate the signed projection, tombstone and event payloads against the schema registry and verify signatures.
- **PS-004-09.R03** Honesty tests assert that the UI and API never report relay receipt or peer acceptance without a signed receipt.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault with principal P1 and key K1, complete sell listing L (EUR 50.00, region u33db), two relays R1 (accepting) and R2 (rejecting under its policy), policy pack with block rule b1 and review rule r1, clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-004-09.T01 | unit | PS-004-01.R01, PS-004-01.R03, PS-004-06.R03 | publish L offline | PublicationRecord active, delivery prepared, no receiptAt, no peer_accepted claim |
| TEST-PS-004-09.T02 | contract | PS-004-01.R02, PS-004-04.R02, PS-004-09.R02 | publish and unpublish | projection validates against classrup.bazaar.listing/v1, only P0 allowlisted fields, region <= 5 chars, signature verifies, tombstone validates |
| TEST-PS-004-09.T03 | unit | PS-004-02.R01, PS-004-02.R02, PS-004-02.R03 | violate each rule V01-V11 | documented error code returned, no statement signed |
| TEST-PS-004-09.T04 | property | PS-004-03.R01, PS-004-03.R02 | random command sequences | only declared transitions succeed; active implies Listing published in same transaction |
| TEST-PS-004-09.T05 | integration | PS-004-03.R03, PS-004-06.R02 | R1 accepts, R2 rejects | R1 peer_accepted after signed receipt, R2 relay_rejected, record stays active |
| TEST-PS-004-09.T06 | integration | PS-004-04.R01, PS-004-04.R03 | publish with review verdict then confirm | held_for_confirmation first, active after confirm with ownerConfirmedAt |
| TEST-PS-004-09.T07 | contract | PS-004-04.R02 | each command runs | outputs and events validate against registry schemas |
| TEST-PS-004-09.T08 | abuse | PS-004-05.R01, PS-004-05.R02 | another principal's key or revoked key signs publish | FORBIDDEN; no statement produced |
| TEST-PS-004-09.T09 | abuse | PS-004-05.R03, PS-004-07.R03 | relay moderator removal for R2 and a foreign-author statement at a receiving vault | delivery relay_removed only for R2; foreign statement quarantined; wording says pseudonymous not anonymous |
| TEST-PS-004-09.T10 | integration | PS-004-06.R01, PS-004-06.R02 | replay publish with same key; fork chain from second device | one statement; fork detected, publication frozen, user prompt shown |
| TEST-PS-004-09.T11 | chaos | PS-004-06.R03 | R1 unreachable for 2 h then returns | backoff schedule honoured, state moves prepared to transport_acknowledged without duplicate statements |
| TEST-PS-004-09.T12 | integration | PS-004-07.R01, PS-004-07.R02 | unpublish after publish | tombstone queued to every relay with a received delivery; UI copy states fetched copies may persist |
| TEST-PS-004-09.T13 | integration | PS-004-03.R01 | governance.prohibited_rule.changed adds a block rule matching L | publication ends with policy_changed and tombstone queued |
| TEST-PS-004-09.T14 | integration | PS-004-04.R03 | moderation.action.applied then reverted for R2 | relay_removed set then cleared; local status unchanged |
| TEST-PS-004-09.T15 | integration | PS-004-04.R01 | promotion claim acknowledged by relay operator vs by a random key | active only for the operator signature |
| TEST-PS-004-09.T16 | load | PS-004-08.R01, PS-004-08.R02, PS-004-08.R03 | 200 publications re-evaluated on Moto G profile; relay at 50 req/s | publish p95 <= 150 ms, batch <= 2 s, relay p95 <= 300 ms, no telemetry requests |
| TEST-PS-004-09.T17 | unit | PS-004-09.R01, PS-004-09.R03 | traceability and honesty test | every PS-004 requirement maps to a passing test; UI never shows accepted without receipt |
| TEST-PS-004-09.T18 | integration | PS-004-10.R01, PS-004-10.R02, PS-004-10.R03 | export, import to fresh vault, import with wrong owner | records round-trip; active publications import as unpublished-pending-resign; foreign owner read-only |

## Acceptance criteria

- All tests T01-T18 pass in CI.
- No projection contains data beyond the P0 allowlist or a region finer than L2.
- No UI or API reports transport_acknowledged or peer_accepted without a verified signed receipt, and no text claims global removal.

## Dependencies

Module depends on: F01.S01.M01, F01.S02.M01, F01.S02.M02, F01.S02.M03, F01.S03.M01, F18.S01.M01, F18.S01.M02, F18.S01.M03, F12.S02.M02, F09.S01.M01, F16.S02.M03, F11.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
