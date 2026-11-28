# PS-132-10 — Import, export, backup and rollback: Incident response

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M03 Incident response](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/response` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-132-10.R01** Runbooks and templates are exportable as markdown and JSON from the repository, and the relay containment status is part of the operator configuration export.
- **PS-132-10.R02** A fork importing runbooks must pass the same linter before use.
- **PS-132-10.R03** Runbook format changes are versioned, with the linter reading the previous version for 180 days.

## Specification

- **export:** pnpm security:runbooks:export writes RB-01 to RB-07, templates, the generated inventory and drill records as markdown and JSON; relay configuration export includes containment switch status with last change time.
- **import:** pnpm security:runbooks:check --input dir validates an external runbook set; nothing is applied automatically.
- **backup:** Documents are covered by repository history; containment sentinel files are part of the relay data directory backup (CTR-IOX-001 IOX-3) and are deliberately restored in their last state so a restored relay does not silently lift containment.
- **migration rollback:** Runbook schema is versioned in front matter; rollback is a revert of the pull request; the sentinel contract is stable across releases and unknown future switches default to off.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-132-09.T13 | integration | PS-132-10.R01, PS-132-10.R02, PS-132-10.R03 | export runbooks and templates, import into fork, schema bump; restore a relay backup taken while read-only | linter results identical; old version parsed for 180 days; restored relay stays read-only |

## Dependencies

Module depends on: F16.S03.M02, F16.S03.M01, F16.S02.M02, F16.S01.M01, F11.S03.M01, F15.S02.M01, CTR-CAP-001, CTR-FLG-001, CTR-ERR-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
