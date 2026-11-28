# PS-108-01 — Domain schema: Quiet-hours enforcement

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M01 Quiet-hours enforcement](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/quiet` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-108-01.R01** A vault DeferredNotification stores the user DID, channel (os_alert, push or email), category, template key, a content-free reference, collapse key, the linked inbox row, the relay dispatch handle, decision and release times, jitter, attempt, count, status and expiry, with tenant and revision per CTR-ID-001, and it never leaves the device.
- **PS-108-01.R02** A relay DeferredNotification holds no reference, template key or collapse key for vault-originated items - only the user DID, channel, urgency normal, sealed boxes it cannot open, an opaque collapse tag and the vault's dispatch ID - while hook items hold only the category, template key and reference that the dispatching relay hook already holds; both are P2, contain no content or schedule and live at most 24 hours (RET-EPHEMERAL).
- **PS-108-01.R03** Only urgency normal is stored as deferred; urgent security alerts are never deferred, so no urgent deferred record exists.
- **PS-108-01.R04** The digest template notify.tpl.system.digest is generated only by the gate, carries a count and no reference, uses the template class system that callers cannot submit, and is governed by the matrix cells of the items it replaces rather than by a cell of its own.

## Specification

### DeferredNotification

Schema `classrup.notify.deferred/v1` · storage **device** · privacy **P2** · retention **RET-EPHEMERAL**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| vaultId | uuidv7 — local vault scope (CTR-ID-001 tenant slot) |
| userDid | did:key — recipient, the local principal |
| channel | enum — os_alert \| push \| email |
| category | enum — offers \| cycles \| messages \| auctions \| bookings \| moderation \| security |
| templateKey | string — notify.tpl.<category>.<name>, ≤ 80 characters |
| ref? | object — { type, id } as in the inbox row |
| collapseKey? | string — ≤ 64 characters, items with equal key collapse into one |
| notificationId? | uuidv7 — local inbox row, for cancel on read |
| relayId? | string — relay for push and email items |
| dispatchId? | uuidv7 — handle sent to the relay with a handed-off item, used by notify.notification.cancel |
| deferredAt | timestamp — decision time on the local clock |
| releaseAt | timestamp — quiet window end plus jitter |
| jitterMs | int — 0..300 000 chosen uniformly at random |
| attempt | int — 0..3 re-deferrals after unreadable checks |
| count | int — 1..9999 collapsed decisions |
| status | enum — deferred \| handed_off \| released \| dropped \| cancelled |
| dropReason? | enum — no_consent \| category_off \| muted \| expired \| superseded_by_digest \| channel_unavailable \| gate_unreadable \| app_closed |
| cancelReason? | enum — read_in_app \| preference_changed \| user_cancelled |
| releaseReason? | enum — window_end \| schedule_changed \| retry |
| expiresAt | timestamp — deferredAt + 24 h |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- releaseAt is at or after the end of the quiet window active at deferredAt and never later than expiresAt.
- A record never carries free text and urgency urgent never reaches status deferred.
- status handed_off implies channel push or email, relayId and dispatchId are set and the relay accepted the item.

### DeferredNotification

Schema `classrup.notify.deferred_relay/v1` · storage **relay** · privacy **P2** · retention **RET-EPHEMERAL**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — deferredId, primary key |
| tenantId | uuidv7 — relay tenant scope |
| userDid | did:key — recipient |
| channel | enum — push \| email |
| origin | enum — vault \| hook |
| hookSource? | enum — mailbox \| auction_host \| cycle_match \| moderation (hook only) |
| category? | enum — offers \| cycles \| messages \| auctions \| bookings \| moderation \| activity (hook only) |
| hookPayload? | object — { tpl, ref?, ck? } with only data the hook already holds (hook only) |
| boxes? | bytes — sealed boxes per target device, ≤ 10 × 600 bytes, opaque (vault origin push only) |
| emailKind? | enum — notice \| security_notice \| activity |
| dispatchId? | uuidv7 — vault-chosen handle for cancel (vault origin only) |
| collapseTag | string — 22..64 base64url characters, opaque |
| deferredAt | timestamp — relay clock |
| releaseAt | timestamp — quiet window end per the relay mirror, or the vault notBefore, plus jitter |
| jitterMs | int — 0..300 000 |
| attempt | int — 0..3 |
| status | enum — deferred \| released \| dropped \| cancelled |
| dropReason? | enum — no_consent \| category_off \| expired \| superseded_by_digest \| channel_unavailable \| gate_unreadable \| collapsed |
| cancelReason? | enum — read_in_app \| preference_changed \| user_cancelled |
| releaseReason? | enum — window_end \| schedule_changed \| retry |
| expiresAt | timestamp — deferredAt + 24 h |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- origin vault implies category, hookPayload and every reference, template key and collapse key are absent.
- At most 200 deferred records per user and channel; further items collapse into the digest.
- releaseAt is never later than expiresAt and status released, dropped or cancelled never changes again.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-108-09.T01 | unit | PS-108-01.R01, PS-108-01.R02, PS-108-01.R03, PS-108-02.R01 | vault decision for a normal offers alert at 03:00 local arriving direct | vault record with templateKey, ref and timing; relay record holds only sealed boxes, tag and timing; release at 07:00 plus jitter |
| TEST-PS-108-09.T07 | integration | PS-108-01.R03, PS-108-02.R02, PS-108-06.R03 | urgent security alert at 03:00 with push consent; urgent offers alert; urgent security with no consent; relay with no preference mirror for a hook | first sent immediately; second downgraded to normal, counted and deferred; third not pushed; hook decided by the default matrix |
| TEST-PS-108-09.T18 | integration | PS-108-03.R04, PS-108-01.R04 | 7 items for one user due in one sweep at the relay and in the vault | one digest alert notify.tpl.system.digest with count 7 and no reference; the 7 items dropped with superseded_by_digest; digest sent only because at least one replaced item's cell is still on |

## Dependencies

Module depends on: F13.S02.M02, F13.S02.M03, F13.S02.M04, F13.S01.M01, F13.S01.M02, F13.S01.M03, F16.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F16.S02.M02, F07.S02.M01, F15.S01.M01, F12.S03.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
