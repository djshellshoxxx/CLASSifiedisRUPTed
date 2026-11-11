# PS-102-07 — Privacy, retention and abuse: Email delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M02 Email delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/email` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-102-07.R01** The email address is P3 in the vault and a P3-equivalent service copy at the selected relay under CTR-PRV-001 PRV-10 (sealed in transit, encrypted at rest), never in events, logs, federation or exports to others, and erased at the relay with its locale within 24 hours of removal or a registered consent withdrawal.
- **PS-102-07.R02** Emails contain no listing, message, name or amount content and carry only a generic subject and a link to the app origin; the operator and mail providers still learn that the address received a ClassRup email.
- **PS-102-07.R03** Pseudonymity is not anonymity because email links an identity to a DID at the operator, so consent text says this plainly.
- **PS-102-07.R04** The relay cannot be used to mail arbitrary addresses, because verification mail is limited per (user, address), per user, per IP prefix and relay-wide, and no user can exhaust another user's verification quota.
- **PS-102-07.R05** Forged DSN or ARF reports are refused, so third parties can neither stop a victim's security email nor withdraw the victim's consent.

## Specification

**Data classification**
- EmailAddress vault target: P3 in the vault; exported only in the user's own export.
- EmailAddress relay copy: P3-equivalent at the selected relay only (disclosed service copy of the channel identifiers address and locale under the granted notify_email consent, CTR-PRV-001 PRV-10); masked form for the owner; never federated or exported.
- EmailDelivery: P2 delivery kind, template key and timing only; no category.
- Verification tokens: P3, stored as hashes; unsubscribe tokens are derived by F13.S02.M03 and never stored here.

**Retention**
- EmailAddress relay copy: RET-STANDARD until removal; ciphertext and locale erased within 24 hours of removal or registered withdrawal (CTR-PRV-001 PRV-10).
- EmailAddress vault target: RET-STANDARD; address deleted within 24 hours of disable or vault-local withdrawal.
- EmailDelivery rows: RET-SHORT (30 days).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Address enumeration through verification emails | same response whether or not the address exists elsewhere; limits counted per (user, address) |
| T02 | Relay used to spam third parties | sealed request from a consented user with an active device key, per-(user, address) limits of 1 per hour and 5 per day, at most 3 distinct addresses and 5 verification mails per user per day, 20 adds per IP prefix per day, relay-wide hourly cap with operator alert, domain blocklist |
| T03 | Email content leaks private data | fixed generic templates with no free text; template registry reviewed; test asserts no user content fields |
| T04 | Phishing imitating notifications | emails carry only the app origin link, DKIM, SPF and DMARC alignment are required by operator checklist, users are told the app never asks for passwords by email |
| T05 | Bounce storms damaging operator reputation | bouncing thresholds stop sends; complaints withdraw consent |
| T06 | Address theft from database | AES-256-GCM encryption with relay key, HMAC hash for lookup, key in relay key store |
| T07 | Forged DSN or ARF report cuts off a victim's security email or withdraws their consent | VERP tag with HMAC per delivery and Message-ID match, complaints only from configured feedback-loop sources or signed webhooks, two hard bounces in 72 h or one signed provider event before bouncing |
| T08 | Sybil did:key identities multiply verification mail | per-IP-prefix and relay-wide limits through RateLimitPort in addition to per-user limits |

**Abuse controls**
- Through RateLimitPort (F12.S03.M03): 1 verification mail per (user, address) per hour and 5 per day, 3 distinct addresses and 5 verification mails per user per day, 20 adds per IP prefix per day, 500 verification mails per relay per hour, 20 emails per address per day, 10 verification attempts per minute per IP prefix.
- Operator can disable the email feature, block a domain on that relay, and configure feedback-loop sources and webhook keys.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-102-09.T09 | abuse | PS-102-07.R01, PS-102-07.R02, PS-102-07.R03, PS-102-09.R03, PS-102-01.R01 | inspect vault, relay database, field classification, logs, events, federation outbox and exports | address only in the vault target and relay ciphertext; the relay copy is classified P3 (CTR-PRV-001 PRV-10) and absent from federation and exports; no content in emails; consent text names what the operator learns |
| TEST-PS-102-09.T16 | abuse | PS-102-07.R04, PS-102-02.R02 | one DID loops add and remove over 10 addresses; 50 DIDs from one /24 each add an address; a victim V verifies alex@example.org after attacker U requested 5 links for it | per-user and per-prefix limits return RATE_LIMITED; relay-wide cap alert at 80 percent; V still receives its verification mail |
| TEST-PS-102-09.T17 | abuse | PS-102-07.R05, PS-102-05.R04 | forged DSN at the plain bounce address quoting a real Message-ID; DSN with a wrong VERP tag; ARF report from an unknown source; unsigned webhook | each refused NOTIFY_EMAIL_REPORT_UNVERIFIED; address stays verified; consent unchanged |
| TEST-PS-102-09.T19 | e2e | PS-102-07.R03, PS-102-05.R03, PS-102-07.R02 | open the email settings, the opt-in sheet and the example email preview | text says the relay operator can read the address it sends to, that email links the address to the pseudonym at that operator, and the preview shows only the generic subject and app link |

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M02, F11.S01.M03, F07.S02.M01, F15.S01.M01, F15.S02.M01, F15.S04.M03, F12.S03.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
