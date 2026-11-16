# PS-139-10 — Import, export, backup and rollback: Load testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M01 Load testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/load` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-139-10.R01** Reports are exported as JSON and Markdown; the gates module (F17.S03.M02) reads reports/load.json.
- **PS-139-10.R02** Report schema is versioned; the gates module accepts v1 and ignores unknown fields.
- **PS-139-10.R03** Rollback is a git revert; budgets are defined in CTR-OBS-001 and are never edited in this module without a contract change.

## Specification

- **export:** reports/load.json (classrup-load-report/v1) and reports/load.md as CI artifacts.
- **import:** Not applicable: the module imports only its deterministic seed; the gates module imports reports.
- **backup:** Reports retained 90 days in CI artifacts.
- **migration rollback:** Report schema versioned; consumers ignore unknown fields; rollback by git revert.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-139-09.T16 | integration | PS-139-10.R01, PS-139-10.R02, PS-139-10.R03 | gates module parses a v1 report with an extra unknown field; budget file changed by commit | parsed successfully; budgets unchanged without contract change |

## Dependencies

Module depends on: CTR-OBS-001, CTR-TST-001, CTR-IDM-001, CTR-ERR-001, F17.S01.M01, F15.S02.M01, F15.S02.M03. Predecessor: [domain_schema.md](domain_schema.md).
