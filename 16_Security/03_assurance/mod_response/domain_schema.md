# PS-132-01 — Domain schema: Incident response

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M03 Incident response](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/response` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-132-01.R01** Each runbook has ID RB-NN, title, trigger conditions, severity mapping, roles, numbered steps each with an owner role and a time target, verification checks, rollback, communication text and last drill date.
- **PS-132-01.R02** The read-only contract is a sentinel (file /var/lib/classrup/READ_ONLY or environment CLASSRUP_READ_ONLY=1) read without the database, and the federation kill contract is feature flag F11 set to off for the relay tenant (CTR-FLG-001 FLG-2 and FLG-3).
- **PS-132-01.R03** Notice templates contain relay name, plain description, data classes, user actions, contact route and the relay-signed time, and never include speculation or claims that no data was accessed without evidence.

## Specification

**Note:** No catalog entities. Runbooks and templates are versioned documents. Containment switch state is held as relay configuration (sentinel file and flag value) owned by F15.S04.M02 and the relay process, not as an entity here.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-132-09.T01 | unit | PS-132-01.R01, PS-132-01.R02, PS-132-02.R01, PS-132-04.R01, PS-132-04.R03, PS-132-09.R02 | lint the seven runbooks and each broken fixture | valid passes; each broken fixture yields its SECURITY_RUNBOOK_* code with runbook ID |
| TEST-PS-132-09.T02 | unit | PS-132-01.R03, PS-132-02.R02, PS-132-02.R03 | switch command with empty reason, short reason, wrong role | VALIDATION_FAILED, VALIDATION_FAILED, FORBIDDEN |

## Dependencies

Module depends on: F16.S03.M02, F16.S03.M01, F16.S02.M02, F15.S04.M02, CTR-CAP-001, CTR-FLG-001, CTR-ERR-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
