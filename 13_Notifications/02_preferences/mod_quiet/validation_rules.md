# PS-108-02 — Validation rules: Quiet-hours enforcement

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M01 Quiet-hours enforcement](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/quiet` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-108-02.R01** Dispatch requests are validated per mode (vault routing decision, sealed relay dispatch, relay hook) for template, category, reference, sealed boxes and urgency before the gate decides.
- **PS-108-02.R02** The gate procedure is deterministic and side-effect free until the decision is applied, and applies one order everywhere - caller authentication, deletion pause for non-security, mute, collapse, channel consent or browser permission, matrix cell, single-producer arrival rule, urgency, quiet hours, rate.
- **PS-108-02.R03** Every violation maps to one stable error code.
- **PS-108-02.R04** os_alert needs browser Notification permission and follows the inApp column of the matrix because an OS alert is the local alert of an inbox row; push and email need the channel consent and their own columns; muted items are dropped for all three channels; collapse updates never dispatch again and only raise the count of a deferred item.
- **PS-108-02.R05** Each event has a single alert producer per channel - events that arrived through a relay mailbox are pushed only by the relay mailbox hook (category activity) and the vault never requests push for them, while locally raised and direct-file events are pushed only by the vault path and email for them is requested only by the vault.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | vault and hook modes - templateKey matches notify.tpl.<category>.<name>, category is a matrix category (activity only from the mailbox hook), ref holds only type and opaque ID; sealed mode carries no category, template or ref; category system only for gate-generated digests | VALIDATION_FAILED |
| V02 | urgency is normal or urgent; urgent on a category other than security is downgraded to normal and counted in classrup_notify_urgent_downgraded_total, which is a normalization and never a rejection; only an unknown urgency value fails | VALIDATION_FAILED |
| V03 | push and email only - in the vault privacy.consent.check {purpose notify_push or notify_email, relayId} is granted and the local ChannelConsent is granted and registered; at the relay a granted unexpired ChannelConsent of userDid for the channel is registered (privacy.consent.check is vault in-process only); os_alert needs no ChannelConsent | PRECONDITION_FAILED |
| V04 | the matrix allows the category on the channel - in the vault notify.preference.check for every channel with os_alert following inApp; at the relay notify.preference.resolve for hook items, which applies the versioned default matrix when no mirror exists | NOTIFY_CATEGORY_DISABLED |
| V05 | release time does not exceed deferredAt plus 24 hours | NOTIFY_DEFER_EXPIRED |
| V06 | RateLimitPort.consume (F12.S03.M03) allows at most 120 dispatch requests per user per hour and 30 per minute per caller at a relay | RATE_LIMITED |
| V07 | collapseKey is at most 64 characters of a-z A-Z 0-9 - _ . and collapseTag is 22..64 base64url characters | VALIDATION_FAILED |
| V08 | relay dispatch, cancel and list requests are signed (classrup/relay-request/v1) by a device key of userDid that F16.S02.M02 reports active at receipt time, or are in-process relay hook calls | UNAUTHENTICATED |
| V09 | the signing key is valid but belongs to a principal other than userDid; refused before any lookup of userDid, so nothing about the target is revealed | FORBIDDEN |
| V10 | sealed push mode carries 1..10 boxes, each for a deviceKeyId of userDid with an active subscription at this relay and each at most 600 bytes; sealed email mode carries no boxes | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-108-09.T01 | unit | PS-108-01.R01, PS-108-01.R02, PS-108-01.R03, PS-108-02.R01 | vault decision for a normal offers alert at 03:00 local arriving direct | vault record with templateKey, ref and timing; relay record holds only sealed boxes, tag and timing; release at 07:00 plus jitter |
| TEST-PS-108-09.T02 | unit | PS-108-02.R03, PS-108-02.R01 | each rule V01 and V03 to V10 violated in turn, and V02 with urgency critical | documented error code returned and nothing sent |
| TEST-PS-108-09.T07 | integration | PS-108-01.R03, PS-108-02.R02, PS-108-06.R03 | urgent security alert at 03:00 with push consent; urgent offers alert; urgent security with no consent; relay with no preference mirror for a hook | first sent immediately; second downgraded to normal, counted and deferred; third not pushed; hook decided by the default matrix |
| TEST-PS-108-09.T16 | integration | PS-108-02.R04, PS-108-02.R05 | muted thread message; collapse update for a deferred item; offer arriving by mailbox while the app is closed; locally raised security event; os_alert with in-app off for offers | muted dropped on all channels; collapse raises the count without a second dispatch; no vault push for the mailbox offer while the hook wake is sent once; vault push sealed for device B; no os_alert for offers |

## Dependencies

Module depends on: F13.S02.M02, F13.S02.M03, F13.S02.M04, F13.S01.M01, F13.S01.M02, F13.S01.M03, F16.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F16.S02.M02, F07.S02.M01, F15.S01.M01, F12.S03.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
