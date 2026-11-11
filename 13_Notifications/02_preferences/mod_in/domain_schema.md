# PS-106-01 — Domain schema: In-app notification preferences

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M04 In-app notification preferences](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/in` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-106-01.R01** A NotificationPreference stores user DID, category, the three channel flags, the lock flags, a per-cell revision and the per-channel mirror sequence last sent from this device, with tenant and revision per CTR-ID-001.
- **PS-106-01.R02** Preferences are P2, held in the vault; a relay holds only the column of each channel consented at that relay (push flags at a push relay, email flags at an email relay) per device chain, and deletes them as soon as the last consent for that channel at that relay ends.
- **PS-106-01.R03** The default matrix is fixed and versioned as defaultsVersion 2 - in-app on for the seven inbox categories, push on for offers, cycles, messages, auctions, bookings, security and activity, push off for moderation, email on only for security, all others off - and the relay applies the same versioned defaults when no mirror exists.
- **PS-106-01.R04** The activity category covers content-free wake-ups for mailbox arrivals; only its push and email cells exist (inApp is fixed false and not editable), and after a wake-up the service worker applies the routed category's push cell and thread mute in the vault.
- **PS-106-01.R05** Unknown categories from a newer app version are stored, with V01 relaxed only for import and app-update merge, under an other bucket with in-app on and push and email off, and are never mirrored.

## Specification

### NotificationPreference

Schema `classrup.notify.preference/v1` · storage **device** · privacy **P2** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| vaultId | uuidv7 — local vault scope (CTR-ID-001 tenant slot) |
| userDid | did:key — owner |
| category | enum — offers \| cycles \| messages \| auctions \| bookings \| moderation \| security \| activity \| other |
| originalCategory? | string — unknown category name kept in the other bucket, ≤ 40 characters |
| inApp | boolean — in-app notifications and OS alerts for this category; vault only, never mirrored |
| push | boolean — allow push for this category; mirrored only to relays with a registered push consent |
| email | boolean — allow email for this category; mirrored only to relays with a registered email consent |
| inAppLocked | boolean — true for security (always on) and activity (always off) |
| defaultsVersion | int — version of the default matrix applied |
| mirrorSeq | object — { push: int, email: int } seq of this device's last statement per channel |
| updatedAtClaim | timestamp — user clock, a claim |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- Exactly one record per (userDid, category) for the 8 known categories, plus one per unknown category in the other bucket.
- category security always has inApp true and inAppLocked true; category activity always has inApp false and inAppLocked true.
- A mirror statement contains one channel, the 8 known categories with one boolean each, and never the in-app column or the other bucket.

### NotificationPreference

Schema `classrup.notify.preference_relay/v1` · storage **relay** · privacy **P2** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — relay tenant scope |
| userDid | did:key — statement author |
| deviceKeyId | string — signing device key of this chain |
| channel | enum — push \| email; only a channel consented at this relay |
| cells | object — 8 booleans keyed by known category |
| defaultsVersion | int — as stated |
| headSeq | int — seq of the applied head of this chain |
| headCid | string — cid of the applied head |
| acceptedAt | timestamp — relay clock; the most recent across the user's active chains is effective |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- At most one row per (userDid, channel, deviceKeyId); headSeq only increases.
- A row exists only while a granted consent of the user for that channel is registered at this relay.
- Rows of a device key revoked per F16.S02.M02 are never effective.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-106-09.T01 | unit | PS-106-01.R01, PS-106-01.R03, PS-106-02.R01, PS-106-01.R04 | create a new vault and read the matrix | 8 records equal the golden default table version 2; security inApp true and locked; activity inApp false and locked |
| TEST-PS-106-09.T02 | unit | PS-106-01.R02, PS-106-02.R02, PS-106-02.R03 | each rule V01 to V09 violated in turn including security in-app off and activity in-app on | documented error code returned and nothing changed |
| TEST-PS-106-09.T13 | integration | PS-106-10.R01, PS-106-10.R02, PS-106-10.R03, PS-106-01.R05 | export, import into fresh vault with an unknown category, restore relay from backup | matrix round trips; unknown category kept in the other bucket with defaults and never mirrored |

## Dependencies

Module depends on: F13.S02.M03, F11.S01.M01, F16.S02.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
