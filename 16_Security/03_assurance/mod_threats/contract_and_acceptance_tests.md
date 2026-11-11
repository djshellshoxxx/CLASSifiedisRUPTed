# PS-133-09 — Contract and acceptance tests: Security threat model

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M01 Security threat model](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/threat_model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-133-09.R01** Every requirement of this module is covered by at least one automated or documented review test.
- **PS-133-09.R02** The checker has fixtures with intentionally broken registers for each error code.
- **PS-133-09.R03** The release gate integration is tested with a passing and failing register.

## Specification

See the module test table below (all processes).

**Fixtures:** Fixture registers: valid (42 rows), missing STRIDE letter, dangling control, no test, stale review, forbidden claim; module spec fixtures with known requirement IDs.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-133-09.T01 | unit | PS-133-01.R01, PS-133-01.R02, PS-133-02.R01 | parse the valid fixture register | 42 rows parsed with all required fields; boundaries B1–B6, X1, X2 recognized |
| TEST-PS-133-09.T02 | unit | PS-133-02.R02, PS-133-02.R03 | each broken fixture | documented SECURITY_THREATMODEL_* code, row ID in the message, exit 1 |
| TEST-PS-133-09.T03 | unit | PS-133-01.R03, PS-133-02.R01 | boundary with all STRIDE letters, and one with a not-applicable reason of 10 characters | accepted for the full set; reason under 20 characters rejected |
| TEST-PS-133-09.T04 | integration | PS-133-03.R01, PS-133-03.R02 | change a control module ID in a spec; add a module touching keys without register rows | dangling reference error; out-of-cycle review flag raised |
| TEST-PS-133-09.T05 | integration | PS-133-03.R03, PS-133-08.R03 | residual risk with review date 7 months old | SECURITY_THREATMODEL_REVIEW_STALE and gate failed state shown in the report |
| TEST-PS-133-09.T06 | integration | PS-133-04.R01, PS-133-04.R02, PS-133-04.R03 | run CLI in CI on a pull request touching a spec | report text and JSON produced; non-zero exit blocks merge |
| TEST-PS-133-09.T07 | abuse | PS-133-05.R01, PS-133-05.R02, PS-133-05.R03, PS-133-07.R03 | author self-approves register change; document containing 'externally audited'; draft with exploit details | merge blocked by required reviewers; SECURITY_THREATMODEL_FORBIDDEN_CLAIM; flagged by review checklist |
| TEST-PS-133-09.T08 | integration | PS-133-06.R01, PS-133-06.R02, PS-133-06.R03 | run twice on the same input; unparsable spec | identical output; no files modified; parse error reported and exit 1 |
| TEST-PS-133-09.T09 | integration | PS-133-07.R01, PS-133-07.R02 | scan register and summary for emails, IPs, keys and tokens | none found |
| TEST-PS-133-09.T10 | load | PS-133-08.R01, PS-133-08.R02 | full repository with 148 module specs and 200 register rows | check completes ≤ 30 s; metrics present in report |
| TEST-PS-133-09.T11 | unit | PS-133-09.R01, PS-133-09.R03 | traceability tool run | every PS-133 requirement maps to a passing test |
| TEST-PS-133-09.T12 | manual | PS-133-03.R01, PS-133-04.R03, PS-133-10.R01 | tabletop review of rows T02, T37 and T39 by two maintainers before each release | review recorded with date and reviewers; any change merged via pull request |
| TEST-PS-133-09.T13 | integration | PS-133-10.R01, PS-133-10.R02, PS-133-10.R03 | export register as JSON, import into the checker in a fresh checkout, bump schema version | identical results; old version still parsed for 180 days |
| TEST-PS-133-09.T14 | unit | PS-133-09.R02 | fixture suite completeness | every error code has at least one failing fixture |

## Acceptance criteria

- All tests T01–T14 pass in CI and the register has zero dangling references.
- Every boundary B1 to B6 has all six STRIDE categories covered or a recorded reason, and X1 and X2 have rows.
- No document claims third-party audit, certification or guaranteed security.

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M02, F16.S02.M03, F12.S03.M03, CTR-PRV-001, CTR-CAP-001, CTR-FED-001, CTR-COM-001. Predecessor: [domain_schema.md](domain_schema.md).
