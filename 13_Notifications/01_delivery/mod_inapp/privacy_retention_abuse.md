# PS-103-07 — Privacy, retention and abuse: In-app notifications

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M03 In-app notifications](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/inapp` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-103-07.R01** Notifications are vault-local, content-free and P2; they never leave the device except as the separate content-free push or email alerts decided by the gate.
- **PS-103-07.R02** Retention is 30 days with a cap of 500 items, and security rows are the last to be dropped by the cap.
- **PS-103-07.R03** Notification spam from hostile peers is limited by blocking, by collapsing, and by per-source caps.

## Specification

**Data classification**
- Notification: P2, vault only; contains template key and reference but no content.

**Retention**
- Rows: RET-SHORT (30 days) and at most 500; counters of removed rows kept in diagnostics.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Peer floods the inbox with offers or messages | blocking, collapse within 10 minutes, cap of 500, per-source cap of 50 rows per day, hidden counter instead of rows beyond the cap |
| T02 | Forged event creates a fake security notification | notifications are created only from events derived from verified statements; security templates only from local identity events |
| T03 | Notification text leaks content on lock screen | OS alerts come from F13.S02.M01 with generic text from the template; in-app titles never contain amounts or names unless the user enabled previews (default off) |
| T04 | Urgent class abused | urgent only for security templates in a fixed list of 3 templates |

**Abuse controls**
- Per-source cap of 50 rows per day per actor DID and local block list.
- Users can mute categories and threads; the user can report a source from the notification screen.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-103-09.T10 | abuse | PS-103-07.R01, PS-103-07.R02, PS-103-07.R03 | 51st event from one actor in a day; 501st row; inspect exported diagnostics | hidden counter increments, cap removes read rows first, no content in exports |

## Dependencies

Module depends on: F13.S02.M04, F08.S01.M01, F08.S01.M02, F08.S03.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
