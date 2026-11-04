# PS-078-09 — Contract and acceptance tests: Data export

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M03 Data export](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/export` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-078-09.R01** Every requirement is covered by at least one automated test.
- **PS-078-09.R02** Round-trip tests export a seeded vault and import it into a fresh one through the IOX-2 dry-run and commit path.
- **PS-078-09.R03** Tamper, missing-section and over-limit scenarios are covered deterministically.

## Specification

See the module test table below (all processes).

**Fixtures:** Seeded vault with records in every module section, 20 photos, two device keys; ExportSectionPort stubs per module; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-078-09.T01 | unit | PS-078-01.R01, PS-078-01.R03, PS-078-02.R01 | request an export with fresh and stale unlock | fresh creates job with sections; stale returns UNAUTHENTICATED |
| TEST-PS-078-09.T02 | integration | PS-078-01.R02, PS-078-03.R02 | complete an export and inspect storage | bundle is an encrypted file, job holds only hashes and sizes, no content or key |
| TEST-PS-078-09.T03 | unit | PS-078-02.R02, PS-078-02.R03 | rules V01 to V08 violated in turn | documented error code returned and no partial file left |
| TEST-PS-078-09.T04 | integration | PS-078-02.R02, PS-078-03.R01 | module section throws after 3 attempts | job failed naming the module; no partial bundle; PRIVACY_EXPORT_SECTION_FAILED |
| TEST-PS-078-09.T05 | property | PS-078-03.R01 | random command and time sequences | only declared transitions succeed; terminal states have no exits |
| TEST-PS-078-09.T06 | integration | PS-078-03.R03, PS-078-04.R03 | clock advanced 7 days and account deletion completes | bundle deleted, key shredded, privacy.export.expired emitted with the right reason |
| TEST-PS-078-09.T07 | contract | PS-078-04.R01, PS-078-04.R02, PS-078-09.R02 | execute each command and read the bundle | outputs and events validate against registry schemas; manifest matches classrup-export/v1 |
| TEST-PS-078-09.T08 | integration | PS-078-04.R03, PS-078-06.R02 | PWA closed mid-collection and reopened within 24 h | resumes from the last completed section and produces identical hashes |
| TEST-PS-078-09.T09 | abuse | PS-078-05.R01, PS-078-05.R02, PS-078-05.R03 | locked vault; suspended relay; relay inspects traffic | request refused when locked; export unaffected by suspension; zero network traffic |
| TEST-PS-078-09.T10 | integration | PS-078-06.R01, PS-078-06.R03 | repeated request with same command ID; cancel mid-job | active job returned; cancel leaves no files or keys |
| TEST-PS-078-09.T11 | chaos | PS-078-06.R03 | storage quota exhausted midway | job failed with PRIVACY_EXPORT_QUOTA and temporary file removed |
| TEST-PS-078-09.T12 | abuse | PS-078-07.R01, PS-078-07.R03 | 4th export in 24 h; bundle scanned for another user's P2 content and private key patterns | 4th RATE_LIMITED; scan finds none |
| TEST-PS-078-09.T13 | integration | PS-078-07.R02, PS-078-02.R02 | bundle scanned for P4 fields and other users' private content | none present; user's own shared copies present |
| TEST-PS-078-09.T14 | load | PS-078-08.R01, PS-078-08.R02, PS-078-08.R03 | 50 000 records and 200 MB media | ≤ 120 s, main-thread block ≤ 50 ms, manifest sign ≤ 300 ms, no telemetry |
| TEST-PS-078-09.T15 | unit | PS-078-09.R01, PS-078-09.R03 | traceability tool run and tamper test of one byte | every PS-078 requirement maps to a passing test; tampered bundle fails import verification |
| TEST-PS-078-09.T16 | e2e | PS-078-01.R03, PS-078-10.R01, PS-078-10.R02, PS-078-10.R03 | export, import into a fresh vault via IOX-2 dry-run and commit, roll back one release | all sections round-trip with identical counts; v1 bundle readable by the previous release; axe zero serious issues on export screens |
| TEST-PS-078-09.T17 | unit | PS-078-04.R03 | CI check that every module owning user data registers a section | build fails for a module without a section |

## Acceptance criteria

- All tests T01 to T17 pass in CI.
- A bundle from a seeded vault imports into a fresh vault with identical record counts and a verifying signature.
- No bundle contains P4 secrets or other users' private content.
- A ready bundle is unreachable after 7 days and its key is gone.

## Dependencies

Module depends on: F07.S01.M01, F10.S01.M01, CTR-IOX-001, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
