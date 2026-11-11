# PS-108-01 — Domain schema: Quiet-hours enforcement

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M01 Quiet-hours enforcement](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/quiet` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-108-01.R01** A DeferredNotification stores the user DID, channel (os_alert, push or email), category, template key, a content-free reference (type and opaque ID), collapse key, the decision time, the release time, jitter, status and expiry, with tenant and revision per CTR-ID-001.
- **PS-108-01.R02** Deferred items contain no message text, no names, no amounts and no schedule; they are P2 only because the reference reveals that an event of a kind happened, and they live at most 24 hours (RET-EPHEMERAL).
- **PS-108-01.R03** Only urgency normal is stored as deferred; urgent security alerts are never deferred, so no urgent deferred record exists.

## Specification

### DeferredNotification

Schema `classrup.notify.deferred/v1` · storage **relay+device** · privacy **P2** · retention **RET-EPHEMERAL**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| userDid | did:key — recipient |
| channel | enum — os_alert \| push \| email |
| category | enum — offers \| cycles \| messages \| auctions \| bookings \| moderation \| security |
| templateKey | string — notify.tpl.<category>.<name>, ≤ 80 characters |
| ref? | object — { type: enum listing\|offer\|proposal\|cycle\|thread\|auction\|booking\|rental\|deal\|case\|account, id: uuidv7 } |
| collapseKey? | string — ≤ 64 characters, items with equal key collapse into one |
| notificationId? | uuidv7 — local inbox row for os_alert and cancel on read |
| deferredAt | timestamp — decision time on the deciding clock |
| releaseAt | timestamp — quiet window end plus jitter |
| jitterMs | int — 0..300 000 chosen uniformly at random |
| status | enum — deferred \| released \| dropped \| cancelled |
| dropReason? | enum — no_consent \| category_off \| expired \| superseded_by_digest \| channel_unavailable |
| cancelReason? | enum — read_in_app \| schedule_changed_not_quiet \| user_cancelled |
| expiresAt | timestamp — deferredAt + 24 h |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- releaseAt is at or after the end of the quiet window that was active at deferredAt and never later than deferredAt + 24 h.
- A record never carries free text and urgency urgent never reaches status deferred.
- At most 200 deferred records exist per user and channel; further items collapse into the digest.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-108-09.T01 | unit | PS-108-01.R01, PS-108-01.R02, PS-108-01.R03, PS-108-02.R01 | dispatch normal offers alert at 03:00 local | deferred record with only templateKey, ref and timing; no text fields; release at 07:00 plus jitter |
| TEST-PS-108-09.T07 | integration | PS-108-01.R03, PS-108-02.R02 | urgent security alert at 03:00 with push consent; urgent offers alert; urgent security with no consent | first sent immediately; second treated as normal and deferred; third not sent |

## Dependencies

Module depends on: F13.S02.M02, F13.S02.M03, F13.S02.M04, F13.S01.M01, F13.S01.M02, F13.S01.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
