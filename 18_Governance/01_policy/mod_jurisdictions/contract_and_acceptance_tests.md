# PS-145-09 — Contract and acceptance tests: Jurisdiction profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M01 Jurisdiction profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/jurisdictions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-145-09.R01** Every requirement is covered by at least one automated test.
- **PS-145-09.R02** Contract tests validate statements, commands and events against the registry and verify signatures.
- **PS-145-09.R03** Privacy-floor tests fail the build if any profile field can loosen CTR-PRV-001.

## Specification

See the module test table below (all processes).

**Fixtures:** Publisher vault P with key KP, trusted and untrusted publisher keys, categories C1 (restricted) and C2, approved proposal D1 for code eu_de, bundled generic profile, user vault U, rule R1 of F18.S01.M02 scoped to ProfileRef (KP, eu_de), consumer fixtures for F09.S01.M02, F10.S01.M02, F15.S04.M03 and F16.S03.M02, clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-145-09.T01 | unit | PS-145-01.R01, PS-145-02.R01 | draft a valid profile with code eu_de, one with all new fields and one with bad code | stored revision 1; invalid input rejected with documented code |
| TEST-PS-145-09.T02 | unit | PS-145-01.R02, PS-145-01.R03, PS-145-02.R03 | violate each rule V01-V13 | documented error code returned; nothing released or stored |
| TEST-PS-145-09.T03 | property | PS-145-01.R03 | random retention, cash limit, breach hours and location values | values outside bounds or above L2 never accepted |
| TEST-PS-145-09.T04 | property | PS-145-03.R01, PS-145-03.R02 | random lifecycle commands | only declared transitions; at most one active version per ProfileRef; retired terminal |
| TEST-PS-145-09.T05 | integration | PS-145-03.R03, PS-145-04.R03, PS-145-02.R05 | table-driven: for every merge-table row select two overlapping profiles with differing values | each field merged in its table direction (max, min or union); sources reported per field; Compare labels match the table |
| TEST-PS-145-09.T06 | contract | PS-145-04.R01, PS-145-04.R02, PS-145-04.R05, PS-145-04.R06, PS-145-09.R02 | release, receive, select, deselect, retire | statements validate against schemas and F11.S01.M01 registry rows; activated events carry ProfileRef and the matching change value |
| TEST-PS-145-09.T07 | abuse | PS-145-05.R01, PS-145-05.R02 | untrusted publisher, tampered statement, non-publisher release | pending or FORBIDDEN or rejected; selection and age never sent over network (spy) |
| TEST-PS-145-09.T08 | abuse | PS-145-05.R03, PS-145-04.R04 | anonymous relay_latest; relay_upload by the operator key and by another key; scan logs for age declaration | read served unchanged with receipt; operator upload applied as hosting profile with relay-local activated (scope relay); other key FORBIDDEN; no age data in logs |
| TEST-PS-145-09.T09 | integration | PS-145-06.R01, PS-145-06.R02 | replay release; crash after supersede | one active version; consistent after restart |
| TEST-PS-145-09.T10 | chaos | PS-145-06.R03 | relay rejects upload | local release stands with relay_rejected delivery |
| TEST-PS-145-09.T11 | abuse | PS-145-07.R01, PS-145-07.R03 | inspect UI strings and stored data | disclaimer present; no age verification claim; no personal data in profiles |
| TEST-PS-145-09.T12 | load | PS-145-08.R01, PS-145-08.R02, PS-145-08.R03 | 100 resolves per second for 1 minute on Moto G profile; relay 50 req/s | resolve p95 <= 15 ms, relay p95 <= 150 ms, no telemetry |
| TEST-PS-145-09.T13 | unit | PS-145-09.R01, PS-145-09.R03 | traceability tool run | every PS-145 requirement maps to a passing test |
| TEST-PS-145-09.T14 | integration | PS-145-10.R01, PS-145-10.R02, PS-145-10.R03 | export, import to fresh vault, import profile with bad bounds | round-trip; invalid profile rejected in dry-run |
| TEST-PS-145-09.T15 | integration | PS-145-07.R02 | receive 5 versions of eu_de | the vault keeps exactly the last 3 versions; older ones purged under RET-STANDARD |
| TEST-PS-145-09.T16 | unit | PS-145-02.R02 | select an untrusted profile, a retired profile and 4 profiles | GOVERNANCE_PROFILE_UNTRUSTED, CONFLICT_STATE and VALIDATION_FAILED; selection unchanged |
| TEST-PS-145-09.T17 | abuse | PS-145-02.R04 | KP releases a restriction change without a proposal and a new code differing from generic without a proposal, both delivered to U; a new code equal to generic | first two held pending (decision_unavailable) with GOVERNANCE_PROFILE_PROPOSAL_REQUIRED, not applied, and the previous version stays in force; the generic-equal profile accepted without a decision |
| TEST-PS-145-09.T18 | integration | PS-145-01.R04 | resolve with nothing selected; resolve for a tenant code unknown to the vault | both return the bundled generic values (CTR-PRV-001 defaults) with fallback true |
| TEST-PS-145-09.T19 | integration | PS-145-03.R04, PS-145-07.R04 | version 4 of a selected eu_de shortens evidenceDays; owner confirms; version 5 only adds a notice; R1 evaluated after each bump | upgrade_pending until confirmed and shorter retention applies only to records created after effectiveFrom; version 5 applies automatically; R1 keeps matching through ProfileRef |
| TEST-PS-145-09.T20 | contract | PS-145-04.R03, PS-145-04.R05 | consumer fixtures read resolve: F09.S01.M02 cash limit, F16.S03.M02 breach hours, F10.S01.M02 retention by ProfileRef, F15.S04.M03 code with underscore | each consumer gets cashLimits, breachNotificationHours and retention values in the documented shape; underscore code valid |
| TEST-PS-145-09.T21 | integration | PS-145-07.R05 | export the vault; run DeletionPort plan and execute; inspect field classes | selection and age declaration exported to the owner only; deleted by the port; classified P3 |
| TEST-PS-145-09.T22 | integration | PS-145-02.R04, PS-145-04.R03 | vault offline 45 days receives eu_de version 4 released 40 days ago; fresh vault receives version 3 whose decision is a year old and was anchored 2 days before its release receipt | both versions apply because asOf is the anchored release time (or the claimed release time labelled as a claim), never the receiving vault clock |

## Acceptance criteria

- All tests T01-T22 pass in CI.
- No profile can weaken a privacy floor, set evidence retention outside 180 to 3 650 days, or reach a user vault with a governed change that lacks a verified decision (only the bundled generic profile and profiles equal to it need none).
- The age declaration and selection never leave the device, and Looser versions never apply without the owner's confirmation.

## Dependencies

Module depends on: F18.S01.M03, F18.S02.M01, F16.S02.M03, F11.S01.M01, F15.S02.M01, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-MNY-001. Predecessor: [domain_schema.md](domain_schema.md).
