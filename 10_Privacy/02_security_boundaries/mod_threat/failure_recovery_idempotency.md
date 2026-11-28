# PS-082-06 — Failure recovery and idempotency: Privacy threat model

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M01 Privacy threat model](SPEC.md) · **Scope:** MVP · **Code:** `docs/privacy/threat_model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-082-06.R01** The CI check is deterministic and idempotent for the same repository state.
- **PS-082-06.R02** A failing check blocks release; there is no override flag, only fixing the catalog or recording a retirement.
- **PS-082-06.R03** Review tasks are generated again if a release candidate is rebuilt, without duplicating entries.

## Specification

- **idempotency:** The check is a pure function of repository files; repeated runs give identical output.
- **concurrency:** Concurrent edits to threats.yaml are resolved by git merge; the check validates the merged result.
- **retries:** Not applicable; CI reruns on every push.
- **offline:** The check and rendering run offline in CI.
- **partial failure:** A failure of rendering does not hide check results; the check reports and exits non-zero.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-082-09.T08 | integration | PS-082-06.R01 | run the check twice and with a failing renderer | identical output; renderer failure does not hide check result |
| TEST-PS-082-09.T09 | abuse | PS-082-05.R02, PS-082-06.R02 | attempt to merge a catalog change without privacy reviewer approval or with a failing check | CI blocks the merge |
| TEST-PS-082-09.T15 | unit | PS-082-03.R02, PS-082-06.R03 | run privacy-threat-check --release-candidate on the fixture history, then rebuild the same release candidate | a review task listing the modules changed since the last review is generated once; the rebuild does not duplicate it |

## Dependencies

Module depends on: F10.S02.M02, F10.S02.M03, F10.S01.M01, CTR-PRV-001, CTR-FED-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
