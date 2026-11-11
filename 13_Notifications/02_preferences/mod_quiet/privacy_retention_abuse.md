# PS-108-07 — Privacy, retention and abuse: Quiet-hours enforcement

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M01 Quiet-hours enforcement](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/quiet` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-108-07.R01** Deferred items carry only template key, reference and timing in the vault and, for vault-originated items, only sealed bytes, an opaque tag and timing at the relay; they never carry content and are erased on release, drop, cancel or after 24 hours.
- **PS-108-07.R02** The quiet-hours mirror is used only for evaluation and is never written into deferred records.
- **PS-108-07.R03** Urgent bypass is limited to the security category so that quiet hours cannot be abused to push promotional content, and the platform sends no promotional content.
- **PS-108-07.R04** The relay can neither read sealed payloads nor link participants of one cycle, thread or booking, because references, template keys and collapse keys of vault-originated alerts never appear in relay records, events, logs or push headers and collapse tags are keyed per dispatching device.

## Specification

**Data classification**
- DeferredNotification vault record: P2, content-free reference and timing, vault only.
- DeferredNotification relay record: P2; vault-origin items sealed bytes, opaque tag and timing only; hook items only data the hook already holds.
- Decision logs: counts only, no DIDs.

**Retention**
- Deferred records: RET-EPHEMERAL (24 h) and deleted on terminal states within 1 hour.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Attacker floods a victim with pushes to defeat quiet hours | only relay hooks and the victim's own active device keys may dispatch, 120 per user per hour through RateLimitPort, collapse and digesting above 5 due items |
| T02 | Misuse of urgent class to bypass quiet hours | urgent accepted only for category security; other categories requesting urgent are downgraded to normal and counted |
| T03 | Release stampede at window end | jitter 0 to 300 s, batch loops of 500 bounded by the 200 per second push budget |
| T04 | Gate bug sends without consent | single procedure with consent before matrix, tests that no send occurs without consent on any path, fail-closed on read errors |
| T05 | Timing correlation reveals user's quiet hours to a network observer | pushes after quiet hours are jittered and the observer cannot see which category; the relay operator can see timing, which is disclosed |
| T06 | Relay rebuilds private graphs (who is in a cycle) from shared identifiers in dispatches | sealed boxes, no ref, template key or collapse key at the relay for vault-originated alerts, per-device collapse tags, per-subscription Topic HMAC |
| T07 | Duplicate alerts for one event (hook and vault both push) | single producer per channel by arrival path; mailbox wakes collapse within 60 s after any push |
| T08 | Stolen device key cancels or floods alerts for its owner | V08 checks key status at receipt time in F16.S02.M02; revoked keys get UNAUTHENTICATED |

**Abuse controls**
- Rate limits of 120 dispatches per user per hour and 30 per minute per caller through RateLimitPort (F12.S03.M03); cancel limited to 60 per user per hour.
- Relay operators can disable dispatch hooks from a source under their hosting policy.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-108-09.T11 | abuse | PS-108-07.R01, PS-108-07.R02, PS-108-07.R03 | 121st dispatch in an hour; inspect deferred records and logs | RATE_LIMITED; no content or schedule in records |
| TEST-PS-108-09.T15 | abuse | PS-108-07.R04, PS-108-04.R04 | U and W in one cycle both receive cycle alerts dispatched from their vaults through relay R; capture R's database, logs, events and push headers | no cycleId, threadId, template key or collapse key appears; U's and W's tags, Topics and boxes share no identifier; R cannot open the boxes |

## Dependencies

Module depends on: F13.S02.M02, F13.S02.M03, F13.S02.M04, F13.S01.M01, F13.S01.M02, F13.S01.M03, F08.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F16.S02.M02, F07.S02.M01, F15.S01.M01, F12.S03.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
