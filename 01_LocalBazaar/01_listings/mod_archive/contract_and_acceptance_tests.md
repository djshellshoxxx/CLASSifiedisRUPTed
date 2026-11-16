# PS-001-09 — Contract and acceptance tests: Listing archive and expiry

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M04 Listing archive and expiry](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/archive` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-001-09.R01** Every requirement is covered by at least one automated test.
- **PS-001-09.R02** Contract tests validate events against the schema registry; payloads must match what F01.S04.M01 and F06.S01.M01 consume.
- **PS-001-09.R03** Sweeps are tested with an injected clock.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault with listings: A published expiring in 1 min, B published with active hold, C archived 89 days ago, D closed 31 days ago; clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-001-09.T01 | unit | PS-001-01.R01, PS-001-01.R02, PS-001-02.R01, PS-001-02.R02 | close A with reason sold and a deal ref | ArchiveRecord closed, closedWithRef.verified false, Listing closed |
| TEST-PS-001-09.T02 | unit | PS-001-01.R03, PS-001-07.R02 | read stored records and events | no content beyond P1 fields; event carries reason enum only |
| TEST-PS-001-09.T03 | unit | PS-001-02.R03 | violate each rule V01-V07 | documented error code returned and nothing changes |
| TEST-PS-001-09.T04 | property | PS-001-03.R01, PS-001-03.R02 | random command and clock sequences | only declared transitions; at most one open record per listing |
| TEST-PS-001-09.T05 | integration | PS-001-03.R02, PS-001-03.R03, PS-001-06.R02 | close A with active publication | publication ended and tombstone queued in the same transaction; restore of C gives unpublished, never published |
| TEST-PS-001-09.T06 | contract | PS-001-04.R01, PS-001-04.R02, PS-001-09.R02 | each command runs | events expired, archived, restored, closed validate; consumers in F01.S04.M01 accept them |
| TEST-PS-001-09.T07 | integration | PS-001-04.R03 | expiry sweep with clock advanced one week | all overdue listings expired in one batch, one event each, expiresAt from the statement honoured |
| TEST-PS-001-09.T08 | abuse | PS-001-05.R01, PS-001-05.R02, PS-001-05.R03 | other principal or UI context calls expire, restores foreign record | FORBIDDEN or NOT_FOUND |
| TEST-PS-001-09.T09 | integration | PS-001-06.R01, PS-001-06.R02 | replay close; run sweeps twice; two tabs | one record, one tombstone, no duplicate events; second tab CONFLICT_REVISION |
| TEST-PS-001-09.T10 | chaos | PS-001-06.R03, PS-001-02.R03 | signing key locked during close; later tombstone transport fails | close refused atomically; later local close stands and transport retries |
| TEST-PS-001-09.T11 | integration | PS-001-07.R01, PS-001-07.R03 | privacy.deletion.requested then 30 days | listings archived and then purged with tombstones; UI never shows sold as verified |
| TEST-PS-001-09.T12 | load | PS-001-08.R01, PS-001-08.R02, PS-001-08.R03 | sweep of 2 000 listings on Moto G profile | <= 500 ms, lag gauge returns to 0, no telemetry requests |
| TEST-PS-001-09.T13 | unit | PS-001-09.R01, PS-001-09.R03 | traceability tool run | every PS-001 requirement maps to a passing test; injected clock used |
| TEST-PS-001-09.T14 | integration | PS-001-10.R01, PS-001-10.R02, PS-001-10.R03 | export, import to fresh vault, import record with restoreUntil in the past | records round-trip; stale archived record imported as purged candidate |
| TEST-PS-001-09.T15 | integration | PS-001-04.R01 | stock zero for 7 days then restocked on day 6 in a second case | closed sold_out on day 7 in the first; timer cancelled in the second |

## Acceptance criteria

- All tests T01-T15 pass in CI.
- Closing or archiving a published listing always ends its publication and queues a tombstone.
- Restore never republishes, and no sold marking is displayed as verified without a signed counterparty record.

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F01.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
