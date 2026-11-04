# PS-096-02 — Validation rules: Enforcement actions

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M01 Enforcement actions](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/enforcement` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-096-02.R01** Action input is validated strictly, and rule references, facts summary and expiry are mandatory.
- **PS-096-02.R02** Role limits (moderator versus operator) and last-admin protection are checked before persistence.
- **PS-096-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | kind is allowed and ruleRefs has 1..5 existing published rule versions | MODERATION_RULE_REQUIRED |
| V02 | factsSummary 50..2000 code points and contains no reporter identity or internal note text | VALIDATION_FAILED |
| V03 | expiresAt within limits: restrict ≤ 365 days, suspend by moderator ≤ 90 days, permanent only for operator | MODERATION_ACTION_LIMIT |
| V04 | the subject key is not the relay's last admin or operator key | MODERATION_LAST_ADMIN_PROTECTED |
| V05 | case is open or assigned and expectedRevision matches | CONFLICT_REVISION |
| V06 | decider is an assigned moderator and is not the sole subject of the case | FORBIDDEN |
| V07 | remove_from_index targets content currently in this relay's index | NOT_FOUND |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-096-09.T01 | unit | PS-096-01.R01, PS-096-01.R02, PS-096-02.R01 | apply remove_from_index with valid rule and facts | action stored with ruleRefs and statement CID; case resolved actioned |
| TEST-PS-096-09.T02 | unit | PS-096-02.R02, PS-096-02.R03 | each rule V01–V07 violated | documented error code, nothing stored, no effect on index |

## Dependencies

Module depends on: F12.S02.M03, F12.S01.M02, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
