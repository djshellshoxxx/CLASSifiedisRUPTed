# PS-102-02 — Validation rules: Email delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M02 Email delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/email` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-102-02.R01** Address input is validated for syntax, length and domain in the vault and again at the relay before storage and before any verification mail.
- **PS-102-02.R02** Sends are validated for registered consent, address status, delivery kind and per-address, per-user, per-IP-prefix and relay-wide limits before the transport port is called.
- **PS-102-02.R03** Every violation maps to one stable error code.
- **PS-102-02.R04** Bounce and complaint reports are accepted only when authenticated, namely a DSN received at the VERP return address whose HMAC tag matches one delivery and that quotes its Message-ID, or a complaint from a configured feedback-loop source or a signed provider webhook.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | address is at most 254 characters, has one @, a local part of at most 64 characters, a domain with at least one dot, no control characters and no display name | NOTIFY_EMAIL_ADDRESS_INVALID |
| V02 | the domain is not on the relay's disposable-domain blocklist and is not a local or reserved domain | NOTIFY_EMAIL_ADDRESS_INVALID |
| V03 | a granted unexpired email ChannelConsent of the user is registered at this relay and named in the request | PRECONDITION_FAILED |
| V04 | verification token hash matches and verifyExpiresAt is in the future | EXPIRED |
| V05 | per (userDid, addressHash) at most 1 verification email per hour and 5 per day, counted per user so another user cannot exhaust them | RATE_LIMITED |
| V06 | templateKey is one of the fixed email registry keys and the payload contains no free text | VALIDATION_FAILED |
| V07 | address status is verified for every kind other than verify and the daily cap of 20 emails per address is not exceeded | NOTIFY_EMAIL_NOT_DELIVERABLE |
| V08 | the relay has an EmailTransportPort configured | FEATURE_DISABLED |
| V09 | RateLimitPort.consume (F12.S03.M03) allows - per user at most 3 distinct addresses and 5 verification emails per day; per IP prefix (/24 IPv4, /48 IPv6) at most 20 add calls per day; relay-wide at most 500 verification emails per hour by default, with an operator alert at 80 percent | RATE_LIMITED |
| V10 | add, remove and get_mine carry an F11.S01.M03 RFC 9421 HTTP Message Signature (tag classrup/relay-request/v1) by a device key of userDid that security.keyrecord.get_status of F16.S02.M02 (delegating to F07.S02.M01 KeyStatusPort) reports active at receipt time, signed before any revocationEffectiveFrom | UNAUTHENTICATED |
| V11 | a bounce report is a DSN at a VERP address whose tag verifies and whose Message-ID matches that delivery, or a signed provider webhook event; a complaint comes from a configured feedback-loop source or a signed provider webhook | NOTIFY_EMAIL_REPORT_UNVERIFIED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-102-09.T01 | unit | PS-102-01.R01, PS-102-01.R02, PS-102-02.R01 | add valid, invalid and disposable-domain addresses through vault enable and the relay | valid stored encrypted at the relay with masked output and locale; invalid refused NOTIFY_EMAIL_ADDRESS_INVALID in the vault and at the relay |
| TEST-PS-102-09.T02 | unit | PS-102-02.R03, PS-102-02.R02 | each rule V01 to V11 violated in turn | documented error code returned and nothing sent |
| TEST-PS-102-09.T10 | integration | PS-102-03.R05, PS-102-02.R04 | one authenticated hard bounce, a second within 72 h, 3 authenticated soft bounces, one signed provider event, a complaint from the configured feedback loop, a bounce for a settled delivery | bouncing only after the thresholds; complaint registers a withdrawal via unsubscribe_link; settled row unchanged while the address becomes bouncing and notify.email.bounced is emitted |
| TEST-PS-102-09.T16 | abuse | PS-102-07.R04, PS-102-02.R02 | one DID loops add and remove over 10 addresses; 50 DIDs from one /24 each add an address; a victim V verifies alex@example.org after attacker U requested 5 links for it | per-user and per-prefix limits return RATE_LIMITED; relay-wide cap alert at 80 percent; V still receives its verification mail |
| TEST-PS-102-09.T20 | contract | PS-102-01.R05, PS-102-02.R03 | LocalSettings.defaultLocale de-AT; enable with and without notify_email consent and capture every outgoing request; lint every email template declaration; verify add, remove and get_mine signatures against the F11.S01.M03 RFC 9421 vectors with a key that KeyStatusPort reports revoked | with consent only the sealed add carries locale de-AT; without consent nothing is sent; no template declares a parameter other than app origin link, verification link and unsubscribe URL and none carries user content or Money; valid signatures verify with tag classrup/relay-request/v1 and the revoked key is refused UNAUTHENTICATED |

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M02, F11.S01.M03, F07.S02.M01, F15.S01.M01, F15.S02.M01, F15.S04.M03, F12.S03.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
