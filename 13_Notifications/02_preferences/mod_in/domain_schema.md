# PS-106-01 — Domain schema: In-app notification preferences

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M04 In-app notification preferences](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/in` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-106-01.R01** A NotificationPreference stores user DID, category, the three channel flags, the lock flag for in-app, a per-cell revision and the mirror sequence last sent, with tenant and revision per CTR-ID-001.
- **PS-106-01.R02** Preferences are P2, held in the vault; relays hold only the push and email flags and a sequence number per user, retained as long as the user's channel consent at that relay is granted plus 30 days.
- **PS-106-01.R03** The default matrix is fixed and versioned as follows, in-app on for all categories, push on for offers, cycles, messages, auctions, bookings and security, push off for moderation, email on only for security, all others off.

## Specification

### NotificationPreference

Schema `classrup.notify.preference/v1` · storage **relay+device** · privacy **P2** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| userDid | did:key — owner |
| category | enum — offers \| cycles \| messages \| auctions \| bookings \| moderation \| security |
| inApp | boolean — in-app notifications for this category; vault only, never mirrored |
| push | boolean — allow push for this category (mirrored to relays with push consent) |
| email | boolean — allow email for this category (mirrored to relays with email consent) |
| inAppLocked | boolean — true only for security |
| defaultsVersion | int — version of the default matrix applied |
| mirrorSeq | int — sequence of the last mirror statement that included this cell |
| updatedAtClaim | timestamp — user clock, a claim |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- Exactly one record per (userDid, category) and exactly 7 known categories exist in v1.
- category security always has inApp true and inAppLocked true.
- The mirror statement contains only category, push and email, plus userDid and a strictly increasing seq.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-106-09.T01 | unit | PS-106-01.R01, PS-106-01.R03, PS-106-02.R01 | create a new vault and read the matrix | 7 records equal the golden default table; security inApp true and locked |
| TEST-PS-106-09.T02 | unit | PS-106-01.R02, PS-106-02.R02, PS-106-02.R03 | each rule V01 to V07 violated in turn including security in-app off | documented error code returned and nothing changed |

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
