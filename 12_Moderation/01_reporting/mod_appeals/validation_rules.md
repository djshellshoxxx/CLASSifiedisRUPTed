# PS-092-02 — Validation rules: Appeals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M03 Appeals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/appeals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-092-02.R01** Appeal input is validated strictly and the appellant must be the subject of the contested action.
- **PS-092-02.R02** The 30-day window is computed from the relay-signed statement of reasons time, never from the appellant's clock.
- **PS-092-02.R03** Decisions require a different reviewer, a reasoned text and at least one policy rule ID.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | statement length 20..2000 code points and at most 3 attachments of at most 5 MiB | VALIDATION_FAILED |
| V02 | appellantKey equals the subject key of the action and a verified statement of reasons exists | NOT_FOUND |
| V03 | now ≤ deadlineAt (30 days after reasonsIssuedAt) | MODERATION_APPEAL_WINDOW_CLOSED |
| V04 | no existing appeal for the action | MODERATION_APPEAL_DUPLICATE |
| V05 | reviewerKey differs from the action decider key | MODERATION_APPEAL_REVIEWER_CONFLICT |
| V06 | decision reasons 50..2000 code points and at least one decisionRuleId that exists in F12.S02.M03 | VALIDATION_FAILED |
| V07 | the signature on the appeal statement verifies against appellantKey | FORBIDDEN |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-092-09.T01 | unit | PS-092-01.R01, PS-092-01.R03, PS-092-02.R01 | file a valid appeal | Appeal stored with deadlineAt = reasonsIssuedAt + 30 days and status filed |
| TEST-PS-092-09.T02 | unit | PS-092-02.R02, PS-092-02.R03 | window day 30 and day 31; duplicate; same reviewer; short reasons | accepted on day 30; documented error codes otherwise |

## Dependencies

Module depends on: F12.S02.M01, F12.S01.M02, F12.S02.M03, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
