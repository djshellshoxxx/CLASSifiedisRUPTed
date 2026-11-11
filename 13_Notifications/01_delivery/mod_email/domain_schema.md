# PS-102-01 — Domain schema: Email delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M02 Email delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/email` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-102-01.R01** An EmailAddress stores the normalized address encrypted at rest with a lookup hash, status, verification token hash and expiry, bounce counters and consent reference; it is a P3 secret held only at the relay.
- **PS-102-01.R02** An EmailDelivery stores the template key, category, status, attempts, a transport message ID and times, never the address in clear and never any user content.
- **PS-102-01.R03** Emails carry a generic subject and body from a template registry (at most 12 templates in the MVP), a link to the app origin without identifiers, and one-click unsubscribe headers.

## Specification

### EmailAddress

Schema `classrup.notify.email_address/v1` · storage **relay** · privacy **P3** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — tenant scope |
| userDid | did:key — owner |
| addressCipher | bytes — AES-256-GCM encrypted normalized address, ≤ 254 characters plaintext |
| addressHash | bytes — HMAC-SHA256 with a relay secret, for uniqueness checks |
| status | enum — unverified \| verified \| bouncing \| removed |
| consentId | uuidv7 — ref F13.S02.M03 ChannelConsent for email at this relay; must be granted |
| verifyTokenHash? | bytes — SHA-256 of a 128-bit token |
| verifyExpiresAt? | timestamp — issued time + 24 h |
| verificationsSentToday | int — 0..5 |
| hardBounceCount | int — 0..1 |
| softBounces7d | int — soft bounces in the last 7 days |
| verifiedAt? | timestamp — relay clock |
| createdAt | timestamp — relay clock, RFC 3339 UTC |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- At most one non-removed address per user and relay.
- status verified implies verifiedAt is set and a granted ChannelConsent for email exists.
- The cleartext address is never returned by a query, event or log; the owner sees only a masked form such as a***@example.org.

### EmailDelivery

Schema `classrup.notify.email_delivery/v1` · storage **relay** · privacy **P2** · retention **RET-SHORT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| emailAddressId | uuidv7 — ref EmailAddress |
| userDid | did:key — recipient |
| templateKey | string — notify.tpl.<category>.<name> or notify.tpl.email.verify |
| category | enum — offers \| cycles \| messages \| auctions \| bookings \| moderation \| security \| system |
| status | enum — queued \| sent \| settled \| bounced \| failed |
| attempts | int — 0..3 |
| transportMessageId? | string — Message-ID header value, ≤ 255 characters |
| bounceKind? | enum — hard \| soft \| complaint |
| queuedAt | timestamp — relay clock |
| sentAt? | timestamp — relay clock |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- A delivery references only an address with status verified (verification mail excepted) and never contains the address in clear.
- status bounced implies bounceKind is set.
- At most 3 attempts per delivery.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-102-09.T01 | unit | PS-102-01.R01, PS-102-01.R02, PS-102-02.R01, PS-102-02.R02 | add valid, invalid and disposable-domain addresses | valid stored encrypted with masked output; invalid refused NOTIFY_EMAIL_ADDRESS_INVALID |
| TEST-PS-102-09.T02 | unit | PS-102-02.R03, PS-102-01.R03 | each rule V01 to V08 violated in turn | documented error code returned and nothing sent |
| TEST-PS-102-09.T03 | contract | PS-102-01.R03, PS-102-04.R02 | send a template email through the fake SMTP server | subject and body are generic, contain app origin link only, headers List-Unsubscribe and List-Unsubscribe-Post present, DKIM-signed by the adapter, no user content |

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
