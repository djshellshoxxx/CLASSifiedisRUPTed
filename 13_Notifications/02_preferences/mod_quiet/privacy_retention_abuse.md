# PS-108-07 — Privacy, retention and abuse: Quiet-hours enforcement

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M01 Quiet-hours enforcement](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/quiet` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-108-07.R01** Deferred items carry only a template key, a reference and timing, never content, and are erased on release, drop, cancel or after 24 hours.
- **PS-108-07.R02** The quiet-hours mirror is used only for evaluation and is never written into deferred records.
- **PS-108-07.R03** Urgent bypass is limited to the security category so that quiet hours cannot be abused to push promotional content, and the platform sends no promotional content.

## Specification

**Data classification**
- DeferredNotification: P2, content-free reference and timing.
- Decision logs: counts only, no DIDs.

**Retention**
- Deferred records: RET-EPHEMERAL (24 h) and deleted on terminal states within 1 hour.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Attacker floods a victim with pushes to defeat quiet hours | only relay hooks and the victim's own devices may dispatch, 120 per user per hour, collapse keys and digesting above 5 pending items |
| T02 | Misuse of urgent class to bypass quiet hours | urgent accepted only for category security and only from fixed templates; other categories requesting urgent are treated as normal and counted |
| T03 | Release stampede at window end | jitter 0 to 300 s and batch size 500 per sweep |
| T04 | Gate bug sends without consent | single procedure with consent first, tests that no send occurs without consent on any path, fail-closed on read errors |
| T05 | Timing correlation reveals user's quiet hours to a network observer | pushes after quiet hours are jittered and the observer cannot see which category; the relay operator can see timing, which is disclosed |

**Abuse controls**
- Rate limits of 120 dispatches per user per hour and 30 per minute per caller.
- Relay operators can disable dispatch hooks from a source under their hosting policy.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-108-09.T11 | abuse | PS-108-07.R01, PS-108-07.R02, PS-108-07.R03 | 121st dispatch in an hour; inspect deferred records and logs | RATE_LIMITED; no content or schedule in records |

## Dependencies

Module depends on: F13.S02.M02, F13.S02.M03, F13.S02.M04, F13.S01.M01, F13.S01.M02, F13.S01.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
