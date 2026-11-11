# PS-096-10 — Import, export, backup and rollback: Enforcement actions

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M01 Enforcement actions](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/enforcement` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-096-10.R01** A subject's vault export contains the statements of reasons they received and appeals, never case notes or reporter data.
- **PS-096-10.R02** Relay admin export of cases and actions requires operator role and omits reporter identities unless under legal hold.
- **PS-096-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section moderation.actions in classrup-export/v1 (vault, ExportSectionPort): signed statements of reasons and reversals received by the user; relay operator export: cases and actions as JSON lines without notes.
- **import:** Statements import after signature verification as read-only history; relay import restores cases and actions with original IDs and re-arms expiry; conflicting IDs are rejected.
- **backup:** Covered by relay SQLite backup (CTR-IOX-001 IOX-3); restoring recomputes active restrictions before accepting traffic.
- **migration rollback:** Additive fields only in v1 (targetType, targetId, reasonsIssuedAt, noticeState, advisoryCid, replacesActionId, actionIds, proposerKey, caseSource, hostRef); targetRef changes from the optional cid string to the object { type, id, cid? } by an expand step that builds it from targetType, targetId and the stored cid, with caseSource taken from the case source; readers of the earlier draft read targetRef.cid; rollback is safe because new optional fields are ignored by older readers, and new action kinds fall back to warn display.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-096-09.T16 | integration | PS-096-10.R01, PS-096-10.R02, PS-096-10.R03 | export subject statements, relay backup and restore | statements verify; restored active actions still enforce |

## Dependencies

Module depends on: F12.S02.M03, F12.S01.M01, F12.S01.M02, F12.S03.M03, F06.S01.M01, F08.S01.M01, F07.S02.M01, F11.S01.M01, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
