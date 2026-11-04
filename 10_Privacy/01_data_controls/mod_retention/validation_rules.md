# PS-079-02 — Validation rules: Retention and legal hold

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M02 Retention and legal hold](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/retention` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-079-02.R01** Policy and hold input is validated strictly against schema and class bounds.
- **PS-079-02.R02** Hold approval enforces separation of duties and current relay roles.
- **PS-079-02.R03** Sweeps validate that every record kind has a registered purge port and that anchor times are not in the future.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | durationDays is inside the bounds of the class | VALIDATION_FAILED |
| V02 | user override in a vault only shortens SHORT, STANDARD or EVIDENCE within bounds and never changes AUDIT | FORBIDDEN |
| V03 | jurisdictionCode refers to a profile known to F18.S01.M01 | VALIDATION_FAILED |
| V04 | hold requester holds the operator or admin role on the relay | FORBIDDEN |
| V05 | hold approver differs from the requester and holds operator or admin on the relay | PRIVACY_HOLD_SELF_APPROVAL |
| V06 | hold approved before approvalDeadline | EXPIRED |
| V07 | hold reference at most 100 code points and contains no email or phone pattern | VALIDATION_FAILED |
| V08 | at most one active or requested hold per subject on a relay | PRIVACY_HOLD_EXISTS |
| V09 | sweep cursor and batch size are at most 1000 rows per transaction and 50 000 per run | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-079-09.T01 | unit | PS-079-01.R01, PS-079-02.R01, PS-079-01.R03 | set durations at, below and above class bounds | in-bound accepted; out-of-bound VALIDATION_FAILED; defaults EPHEMERAL 1, SHORT 30, STANDARD 30, EVIDENCE 730, AUDIT 365 |
| TEST-PS-079-09.T02 | unit | PS-079-01.R02, PS-079-02.R02 | hold requested with personal data in reference; user tries to change AUDIT | VALIDATION_FAILED and FORBIDDEN |
| TEST-PS-079-09.T03 | unit | PS-079-02.R02, PS-079-03.R01 | A requests, A approves; B approves; B then requests release and B approves it | self approvals refused with PRIVACY_HOLD_SELF_APPROVAL; second operator approvals succeed |
| TEST-PS-079-09.T05 | integration | PS-079-02.R03, PS-079-03.R02 | sweep with records at each age and one under active hold; one record kind without port | expired records purged, held record untouched, missing port reported skipped_unregistered |
| TEST-PS-079-09.T08 | integration | PS-079-04.R03, PS-079-02.R03 | federation.tombstone.applied for a held and a non-held record | held sealed and not served; non-held purged within 24 h |

## Dependencies

Module depends on: F18.S01.M01, F16.S01.M01, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
