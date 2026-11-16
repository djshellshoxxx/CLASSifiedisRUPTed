# PS-077-09 — Contract and acceptance tests: Account and data deletion

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M04 Account and data deletion](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/delete` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-077-09.R01** Every requirement is covered by at least one automated test.
- **PS-077-09.R02** Execution is tested with a controllable clock and stub DeletionPorts for every module including failing ones.
- **PS-077-09.R03** The no-resurrection property is tested by restoring an old export after completion.

## Specification

See the module test table below (all processes).

**Fixtures:** Seeded vault with listings, messages, deals, receipts, an open committed cycle and two relays (one offline); stub DeletionPorts; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-077-09.T01 | unit | PS-077-01.R01, PS-077-01.R02, PS-077-02.R01, PS-077-02.R02 | request deletion with wrong then right confirmation text and stale unlock | right text with fresh unlock creates pending_grace; others return documented errors |
| TEST-PS-077-09.T02 | unit | PS-077-01.R03, PS-077-02.R03, PS-077-03.R01 | cancel at day 13; try to cancel while executing | cancelled with salt destroyed; executing refuses with CONFLICT_STATE |
| TEST-PS-077-09.T03 | unit | PS-077-02.R03, PS-077-03.R02 | commitments open at day 14, then clear at day 20, then limit reached | deferred then executing; at day 44 execution proceeds with notices sent |
| TEST-PS-077-09.T04 | integration | PS-077-03.R03, PS-077-06.R02, PS-077-06.R03 | kill the app after each step and reopen | execution resumes from persisted state; keys destroyed only after all earlier steps done |
| TEST-PS-077-09.T05 | property | PS-077-03.R01 | random event and time sequences | only declared transitions succeed; completed and cancelled have no exits |
| TEST-PS-077-09.T06 | contract | PS-077-04.R01, PS-077-04.R02, PS-077-04.R03, PS-077-09.R02 | execute request and execution; ingest relay_apply on a relay double | statements, tombstones and events validate against registry schemas |
| TEST-PS-077-09.T07 | integration | PS-077-04.R02, PS-077-07.R01 | complete deletion with keepEvidence true then false | true keeps pseudonymized evidence and deletes content; false also purges own evidence copies; pseudonym stable across modules |
| TEST-PS-077-09.T08 | abuse | PS-077-05.R01, PS-077-05.R02, PS-077-05.R03 | relay_apply with a statement signed by another did; operator tries to start deletion; suspended on a relay | rejected or FORBIDDEN; deletion by owner still allowed |
| TEST-PS-077-09.T09 | integration | PS-077-06.R01 | replay same command ID; offline execution with an offline relay | original result; completion with relay shown prepared |
| TEST-PS-077-09.T10 | integration | PS-077-07.R01, PS-077-07.R02 | after completion inspect storage and UI summary | content gone, salt destroyed, pseudonym recorded, cannot-recall notice and relay-hold notice displayed |
| TEST-PS-077-09.T11 | chaos | PS-077-07.R03, PS-077-06.R03 | restore an old export after completion | restore flow refuses the deleted principal via the ledger unless the user overrides with a new identity |
| TEST-PS-077-09.T12 | abuse | PS-077-07.R03, PS-077-02.R03 | publish a listing and create a deal during grace | PRIVACY_DELETION_PENDING |
| TEST-PS-077-09.T13 | load | PS-077-08.R01, PS-077-08.R02, PS-077-08.R03 | 10 000 records and 200 MB blobs; 100-tombstone relay batch | ≤ 120 s; relay p95 ≤ 500 ms; main-thread block ≤ 50 ms; no telemetry sent |
| TEST-PS-077-09.T14 | unit | PS-077-09.R01, PS-077-09.R03 | traceability tool run and CI check for modules without DeletionPort | every PS-077 requirement maps to a passing test; build fails for a module without a plan |
| TEST-PS-077-09.T15 | e2e | PS-077-01.R02, PS-077-07.R02 | user flow on two devices with banner, cancel and final summary | banner and summary shown with limits; axe zero serious issues |
| TEST-PS-077-09.T16 | integration | PS-077-10.R01, PS-077-10.R02, PS-077-10.R03 | export before deletion, import into fresh vault, roll back one release | export contains the request metadata only; ledger survives rollback |

## Acceptance criteria

- All tests T01 to T16 pass in CI.
- After completion no module retains content or recoverable keys for the principal, and retained evidence carries only the pseudonym.
- The grace period of 14 days cannot be shortened by any API.
- The completion summary always states what cannot be recalled.

## Dependencies

Module depends on: F10.S01.M01, F10.S01.M02, F10.S01.M03, F07.S01.M01, F16.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
