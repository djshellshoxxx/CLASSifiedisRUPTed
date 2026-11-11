# PS-082-09 — Contract and acceptance tests: Privacy threat model

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M01 Privacy threat model](SPEC.md) · **Scope:** MVP · **Code:** `docs/privacy/threat_model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-082-09.R01** Every requirement is covered by at least one automated test of the check tool or a documented manual review step.
- **PS-082-09.R02** The mandatory topic list is verified by a fixture-based test.
- **PS-082-09.R03** Link integrity between the catalog and module specs is verified on the real repository in CI.

## Specification

See the module test table below (all processes).

**Fixtures:** Fixture catalogs: valid with 17 entries, missing test, dangling requirement ID, missing topic, residual risk containing banned words, review dates 90, 91, 104 and 105 days old; a git history with two release candidates; the real repository specs for link checks.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-082-09.T01 | unit | PS-082-01.R01, PS-082-01.R02, PS-082-02.R01 | run the check on the valid fixture and on one missing a test | valid passes with exit 0; invalid exits 1 naming the entry and rule |
| TEST-PS-082-09.T02 | unit | PS-082-01.R02, PS-082-02.R02 | catalog with a dangling PS requirement ID and unknown PRIVT ID | both reported with entry ID |
| TEST-PS-082-09.T03 | unit | PS-082-02.R03, PS-082-04.R01 | fixture with geolocation entry removed | check fails on missing mandatory topic |
| TEST-PS-082-09.T04 | unit | PS-082-03.R01 | retire a threat without reason, then with reason; delete an entry | retire without reason fails; deletion detected by diff check and fails |
| TEST-PS-082-09.T05 | unit | PS-082-03.R03 | residual risk accepted without reviewer or date | check fails |
| TEST-PS-082-09.T06 | contract | PS-082-04.R02, PS-082-04.R03, PS-082-09.R02 | run the check with --json | JSON summary validates against its schema and matches text output |
| TEST-PS-082-09.T07 | integration | PS-082-05.R01, PS-082-05.R03 | run the check in an offline sandbox with no secrets | works with no network |
| TEST-PS-082-09.T08 | integration | PS-082-06.R01 | run the check twice and with a failing renderer | identical output; renderer failure does not hide check result |
| TEST-PS-082-09.T09 | abuse | PS-082-05.R02, PS-082-06.R02 | attempt to merge a catalog change without privacy reviewer approval or with a failing check | CI blocks the merge |
| TEST-PS-082-09.T10 | unit | PS-082-01.R03, PS-082-07.R01 | scan catalog for emails, keys, URLs to real services and exploit payload patterns | none found |
| TEST-PS-082-09.T11 | manual | PS-082-07.R03 | reviewer reads the user-facing summary page | states pseudonymity is not anonymity, relay metadata visibility and non-recall limits; reading level grade 8 |
| TEST-PS-082-09.T12 | unit | PS-082-08.R01, PS-082-08.R02, PS-082-08.R03 | run on 100 entries with review ages 90, 91, 104 and 105 days as a non-release-candidate build, and 90 and 91 days as a release candidate build | completes ≤ 5 s; non-RC passes at 90, warns at 91 and 104 and fails at 105; RC passes at 90 and fails at 91 |
| TEST-PS-082-09.T13 | integration | PS-082-09.R01, PS-082-09.R03 | real repository run | all 17 active threats resolve controls and tests; every PS-082 requirement maps to a passing test |
| TEST-PS-082-09.T14 | integration | PS-082-10.R01, PS-082-10.R02, PS-082-10.R03 | export the catalog bundle and restore from git tag | identical files and check result; schema v1 file validates after upgrade |
| TEST-PS-082-09.T15 | unit | PS-082-03.R02, PS-082-06.R03 | run privacy-threat-check --release-candidate on the fixture history, then rebuild the same release candidate | a review task listing the modules changed since the last review is generated once; the rebuild does not duplicate it |
| TEST-PS-082-09.T16 | manual | PS-082-07.R02 | privacy reviewer compares each attack description with the security disclosure policy | no entry holds more detail than needed to verify its controls; sensitive details are referenced to F16.S03.M03 |
| TEST-PS-082-09.T17 | unit | PS-082-02.R04, PS-082-02.R03 | fixtures each missing one of cross-relay-linkability, enumeration-scraping and statement-integrity | check fails naming the missing topic; the valid fixture passes |

## Acceptance criteria

- privacy-threat-check passes on the real repository with 0 violations.
- All fifteen mandatory topics have an active or retired entry with controls, tests and residual risk.
- The user-facing summary states the honesty constraints verbatim in plain language.

## Dependencies

Module depends on: F10.S02.M02, F10.S02.M03, F10.S01.M01, CTR-PRV-001, CTR-FED-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
