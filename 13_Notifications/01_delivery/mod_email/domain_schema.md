# PS-102-01 — Domain schema: Email delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M02 Email delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/email` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-102-01.R01** A relay EmailAddress service copy stores the normalized address encrypted at rest with a lookup hash, the locale, status, verification token hash and expiry, bounce counters, the creating device key and the registered consent reference; it is P2 for the single relay named in the granted notify_email channel consent (PRV-5 participant rule, with the channel-identifier amendment requested from F10).
- **PS-102-01.R02** An EmailDelivery stores the delivery kind, the template key from the fixed email registry, status, attempts, the transport Message-ID, the VERP tag and times, never the address in clear, never a notification category and never any user content.
- **PS-102-01.R03** Emails carry a generic subject and body from the fixed email template registry (notify.tpl.email.verify, notify.tpl.email.notice, notify.tpl.email.security_notice, notify.tpl.email.activity and notify.tpl.email.digest, at most 12 templates), a link to the app origin without identifiers, and RFC 8058 one-click unsubscribe headers whose URL comes from UnsubscribeTokenPort of F13.S02.M03.
- **PS-102-01.R04** The vault email target is the authoritative user-owned record - the cleartext normalized address (P3), locale, relayId, the relay emailAddressId and a status mirror - while the relay copy is a disclosed service copy, sealed to the relay key in transit, never authoritative, and rebuilt from the vault record after a relay loss or a vault import.

## Specification

### EmailAddress

Schema `classrup.notify.email_address/v1` · storage **relay** · privacy **P2** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — emailAddressId, primary key |
| tenantId | uuidv7 — relay tenant scope |
| userDid | did:key — owner principal |
| createdByKeyId | string — device key ID that signed the add request |
| addressCipher? | bytes — AES-256-GCM encrypted normalized address, ≤ 254 characters plaintext; absent after erasure |
| addressHash | bytes — HMAC-SHA256 with a relay secret, for per-(user, address) limits and uniqueness |
| locale | string — BCP 47 locale from the add request, used to render the generic templates |
| status | enum — unverified \| verified \| bouncing \| removed |
| consentId | uuidv7 — email ChannelConsent registered at this relay (F13.S02.M03); must be granted |
| consentStatementCid | string — cid of the registered channel consent statement |
| verifyTokenHash? | bytes — SHA-256 of a 128-bit token |
| verifyExpiresAt? | timestamp — issued time + 24 h |
| hardBounces72h | int — authenticated hard bounces in the last 72 hours |
| softBounces7d | int — authenticated soft bounces in the last 7 days |
| verifiedAt? | timestamp — relay clock |
| removedAt? | timestamp — relay clock |
| createdAt | timestamp — relay clock, RFC 3339 UTC |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- At most one non-removed address per user and relay.
- status verified implies verifiedAt is set and a granted email ChannelConsent is registered at this relay.
- The cleartext address is never returned by a query, event or log; the owner sees only a masked form such as a***@example.org.
- status removed implies addressCipher is absent within 24 hours of removedAt.

### EmailAddress

Schema `classrup.notify.email_target/v1` · storage **device** · privacy **P3** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — emailTargetId, primary key |
| vaultId | uuidv7 — local vault scope (CTR-ID-001 tenant slot) |
| userDid | did:key — local principal |
| relayId | string — canonical self-certifying relayId (F15.S02.M01) of the email relay |
| relayHost | string — display hint only |
| address | string — normalized address, ≤ 254 characters, P3, vault only |
| locale | string — BCP 47 locale chosen by the user (F14.S02.M01) |
| emailAddressId? | uuidv7 — relay copy once accepted |
| status | enum — pending \| unverified \| verified \| bouncing \| removed (mirror of the relay copy) |
| consentId | uuidv7 — local email ChannelConsent for relayId |
| lastStatusSyncAt? | timestamp — local clock of the last notify.email.get_mine result |
| endedAt? | timestamp — local clock of removal |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- At most one non-removed email target per relayId.
- status mirrors the relay copy only as last synced; the UI labels it with lastStatusSyncAt.
- status other than pending implies privacy.consent.check for notify_email at relayId returned granted when the address was sent.

### EmailDelivery

Schema `classrup.notify.email_delivery/v1` · storage **relay** · privacy **P2** · retention **RET-SHORT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — deliveryId, primary key |
| emailAddressId | uuidv7 — ref EmailAddress relay copy |
| userDid | did:key — recipient |
| kind | enum — verify \| notice \| security_notice \| activity \| digest |
| templateKey | string — notify.tpl.email.<kind> from the fixed email registry |
| dispatchRef? | string — gate deferred ID or dispatch ID, for dedupe |
| status | enum — queued \| sent \| settled \| bounced \| failed \| cancelled |
| attempts | int — 0..3 |
| transportMessageId? | string — Message-ID header value, ≤ 255 characters |
| verpTag | string — first 16 characters of base64url(HMAC-SHA256(relay VERP key, deliveryId)) in the return path |
| bounceKind? | enum — hard \| soft \| complaint |
| bounceSource? | enum — dsn \| provider_webhook \| feedback_loop |
| cancelReason? | enum — address_removed \| consent_withdrawn \| deletion |
| queuedAt | timestamp — relay clock |
| sentAt? | timestamp — relay clock |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- A delivery references only an address with status verified (kind verify excepted) and never contains the address in clear.
- status bounced implies bounceKind and bounceSource are set.
- At most 3 attempts per delivery.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-102-09.T01 | unit | PS-102-01.R01, PS-102-01.R02, PS-102-02.R01 | add valid, invalid and disposable-domain addresses through vault enable and the relay | valid stored encrypted at the relay with masked output and locale; invalid refused NOTIFY_EMAIL_ADDRESS_INVALID in the vault and at the relay |
| TEST-PS-102-09.T03 | contract | PS-102-01.R03, PS-102-04.R04, PS-102-09.R02 | send every template kind through the fake SMTP server | subject and body generic with the app origin link only; List-Unsubscribe URL from UnsubscribeTokenPort works on POST; List-Unsubscribe-Post and VERP Return-Path present; DKIM-signed; no user content |
| TEST-PS-102-09.T13 | integration | PS-102-10.R01, PS-102-10.R02, PS-102-10.R03, PS-102-01.R04 | export from the vault; restore the relay from a backup that lacks the address; import the export into a fresh vault | export holds the email target with the cleartext address and no relay copy; restore fails stale queued deliveries; the vault offers re-add from its target and re-verification after confirmation |
| TEST-PS-102-09.T18 | integration | PS-102-04.R05, PS-102-01.R04 | DeletionPort plan and purge, export section and retention purge with F10 registry doubles; enable with privacy.consent.check not granted | purge deletes the vault targets; section notify.email exported; delivery rows purged after 30 days; enable refused PRECONDITION_FAILED before anything is sealed |

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
