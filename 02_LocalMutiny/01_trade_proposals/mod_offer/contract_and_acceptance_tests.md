# PS-013-09 — Contract and acceptance tests: Barter offer items

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M03 Barter offer items](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/offer` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-013-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-013-09.R02** Contract tests verify leg shape inside revision snapshots and event payloads against the registry.
- **PS-013-09.R03** Fixtures include 2-, 3-, 4- and 6-party leg sets.

## Specification

See the module test table below (all processes).

**Fixtures:** Alice inventory items I1 (qty 1), I2 (qty 3), I3 reserved; Bob listing projection P1 signed; 3-party ring legs L0..L2; 6-party ring; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-013-09.T01 | unit | PS-013-01.R01, PS-013-01.R02, PS-013-02.R01 | define 2-party legs with 2 and 1 lines | legs stored with listing revision hash, legValue computed, immutable fields unchanged afterwards |
| TEST-PS-013-09.T02 | unit | PS-013-02.R01, PS-013-02.R02, PS-013-02.R03 | each rule V01..V08 violated in turn | documented error code returned and nothing stored |
| TEST-PS-013-09.T03 | property | PS-013-01.R02, PS-013-03.R01 | random define and void sequences | status only moves defined to referenced or voided, never back; referenced never voided |
| TEST-PS-013-09.T04 | unit | PS-013-02.R02 | peer item without projection, with tombstoned projection, with valid projection | MUTINY_ITEM_NOT_OWNED, MUTINY_ITEM_NOT_OWNED, accepted with basis signed_listing |
| TEST-PS-013-09.T05 | integration | PS-013-03.R01, PS-013-03.R02 | unreferenced leg after 24 h with injected clock | voided by garbage collection |
| TEST-PS-013-09.T06 | integration | PS-013-03.R03, PS-013-04.R02 | peer revision ingested | peer legs materialized as referenced with provenance and leg.defined emitted with actor.kind federated |
| TEST-PS-013-09.T07 | contract | PS-013-04.R01, PS-013-04.R03, PS-013-09.R02, PS-013-09.R03 | define and queries | outputs and event payload validate against registry; no statement produced |
| TEST-PS-013-09.T08 | integration | PS-013-04.R03, PS-013-06.R03 | listing edited after drafting | leg flagged listingChanged, recorded listing revision hash unchanged |
| TEST-PS-013-09.T09 | abuse | PS-013-05.R01, PS-013-05.R02, PS-013-05.R03, PS-013-07.R01 | other principal defines or reads; leg for someone else's unlisted item | FORBIDDEN or NOT_FOUND; MUTINY_ITEM_NOT_OWNED |
| TEST-PS-013-09.T10 | integration | PS-013-06.R01, PS-013-06.R02 | replay define with same key and with identical body new key | single leg |
| TEST-PS-013-09.T11 | abuse | PS-013-07.R03 | 201st defined leg; 61st define in an hour | limit error and RATE_LIMITED |
| TEST-PS-013-09.T12 | unit | PS-013-07.R02, PS-013-07.R01 | account erased locally with closed subject | leg pseudonymized and retained, no address fields ever present |
| TEST-PS-013-09.T13 | load | PS-013-08.R02, PS-013-08.R03 | define 5-item legs and GC of 200 legs | within budgets on emulated Moto G |
| TEST-PS-013-09.T14 | unit | PS-013-08.R01, PS-013-09.R01 | traceability tool run and diagnostics | every PS-013 requirement maps to a passing test; no identifiers in diagnostics |
| TEST-PS-013-09.T15 | integration | PS-013-10.R01, PS-013-10.R02, PS-013-10.R03 | export, import, rollback | referenced legs round-trip; voided legs not exported; conflicting IDs rejected |
| TEST-PS-013-09.T16 | e2e | PS-013-01.R03, PS-013-02.R03 | mobile user builds a 3-party ring leg set | each leg card readable, axe zero serious issues |
| TEST-PS-013-09.T17 | integration | PS-013-07.R04 | F10 export, deletion of a counterparty and retention sweep | section mutiny.legs exported; erased DID pseudonymized in referenced legs; voided legs purged after 7 days |

## Acceptance criteria

- All tests T01–T17 pass in CI.
- A leg never presents a peer's availability claim as locally verified.
- Items occur at most once per subject and cycle legs carry exactly one item with quantity 1.

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F02.S04.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
