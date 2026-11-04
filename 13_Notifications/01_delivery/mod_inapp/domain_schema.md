# PS-103-01 — Domain schema: In-app notifications

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M03 In-app notifications](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/inapp` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-103-01.R01** A Notification stores the recipient DID, category, template key, a content-free reference (type and opaque ID), collapse key, collapsed count, urgency class, read state, source event ID and times, with tenant and revision per CTR-ID-001.
- **PS-103-01.R02** Notifications are P2 vault records that never contain message text, names or amounts; titles and lines are rendered at display time from the template key and data the vault already holds, and retention is RET-SHORT with a cap of 500 items.
- **PS-103-01.R03** Urgency class is normal or urgent where urgent is allowed only for the security category.

## Specification

### Notification

Schema `classrup.notify.notification/v1` · storage **device** · privacy **P2** · retention **RET-SHORT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| userDid | did:key — recipient, always the local principal |
| category | enum — offers \| cycles \| messages \| auctions \| bookings \| moderation \| security |
| templateKey | string — notify.tpl.<category>.<name>, ≤ 80 characters |
| ref? | object — { type: enum listing\|offer\|proposal\|cycle\|thread\|auction\|booking\|rental\|deal\|case\|account, id: uuidv7 } |
| collapseKey? | string — ≤ 64 characters from a-z A-Z 0-9 - _ . |
| count | int — 1..9999, number of collapsed events |
| urgency | enum — normal \| urgent |
| muted | boolean — true when the thread or category is muted so no OS alert is allowed |
| sourceEventIds | array — last 20 source event IDs for dedupe, each uuidv7 |
| status | enum — unread \| read |
| createdAt | timestamp — local clock, RFC 3339 UTC |
| updatedAt | timestamp — local clock, bumped on collapse |
| readAt? | timestamp — local clock |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- At most one unread Notification per (userDid, templateKey, collapseKey) created within a 10-minute collapse window.
- urgency urgent implies category security.
- No field holds free text; ref.type and template key come from fixed registries.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-103-09.T01 | unit | PS-103-01.R01, PS-103-01.R02, PS-103-01.R03, PS-103-02.R01 | route bazaar.offer.made to seller U | Notification stored with category offers, template notify.tpl.offers.made, ref offer, no text fields |

## Dependencies

Module depends on: F13.S02.M04, F08.S01.M01, F08.S01.M02, F08.S03.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
