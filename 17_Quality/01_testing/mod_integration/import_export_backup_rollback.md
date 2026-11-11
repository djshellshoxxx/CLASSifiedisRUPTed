# PS-135-10 — Import, export, backup and rollback: Integration testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M03 Integration testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/integration` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-135-10.R01** The flow report reports/integration.json is the only export; it contains no user data.
- **PS-135-10.R02** The federation_io flow proves two different things in two steps: federation (a vault publishes P0/L2 envelopes to relay R1, R1 federates signed batches of at most 100 to R2, and R2 holds read-only mirrors with provenance, CTR-FED-001) and vault portability (a classrup-export/v1 bundle exported from memory vault A is imported into a fresh memory vault A' on another simulated device under the IOX-2 dry-run and collision rules, CTR-IOX-001); no relay ever receives an IOX-1 bundle.
- **PS-135-10.R03** Rollback is a git revert; harness changes never alter production code.

## Specification

- **export:** reports/integration.json (flows, steps, event types, requirement IDs) and JUnit XML; no user data.
- **import:** The portability step of federation_io imports a CTR-IOX-001 classrup-export/v1 bundle into a fresh memory vault A' (dry-run report, then commit; identical records skipped, conflicting IDs rejected, another user's private data never imported). Relays receive only signed P0 envelopes through federation and never an export bundle. The harness itself imports no external data.
- **backup:** Harness code is in git; reports kept 14 days.
- **migration rollback:** Revert the harness commit; flows are versioned with the modules they test and updated in the same pull request as behavior changes.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-135-09.T15 | integration | PS-135-10.R01, PS-135-10.R02 | federation_io - (a) federation step: vault Alice publishes P0/L2 envelopes to R1, R1 federates signed batches of at most 100 to R2, then a duplicate cid, an author tombstone and a forged envelope are sent; (b) portability step: export classrup-export/v1 from memory vault Alice and import into the fresh vault Alice' | (a) R2 holds read-only mirrors with provenance, the duplicate is deduped by cid, the tombstone is applied within 24 h of FakeClock, the forged envelope is rejected with FED_SIGNATURE_INVALID; (b) IOX-2 dry-run report before commit, identical records skipped, conflicting IDs rejected, records and signatures intact in Alice'; no relay ever received the IOX-1 bundle; report contains no user data |
| TEST-PS-135-09.T16 | integration | PS-135-10.R03 | revert harness commit in a branch | production tests unaffected |
| TEST-PS-135-09.T30 | integration | PS-135-10.R02 | run every flow in both modes and scan relay storage and every request body the relays received | no classrup-export/v1 bundle and no P2+ plaintext reached any relay; a planted upload fails with QUALITY_IT_RELAY_PRIVATE_DATA |

## Dependencies

Module depends on: CTR-TST-001, CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-IDM-001, CTR-COM-001, CTR-FED-001, CTR-ID-001, CTR-PRV-001, CTR-CAP-001, CTR-IOX-001, F17.S01.M01, F15.S02.M02, F15.S02.M03, F15.S01.M01, F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S02.M03, F09.S01.M01, F09.S01.M03, F16.S02.M02, F07.S02.M01, F10.S01.M03, F06.S02.M01. Predecessor: [domain_schema.md](domain_schema.md).
