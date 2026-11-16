# PS-102-07 — Privacy, retention and abuse: Email delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M02 Email delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/email` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-102-07.R01** Email address is P3, stored encrypted, never in events, logs or exports to others, and deleted within 24 hours of removal, consent withdrawal or deletion request.
- **PS-102-07.R02** Emails contain no listing, message, name or amount content and carry only a generic subject and a link to the app origin; the operator and mail providers still learn that the address received a ClassRup email.
- **PS-102-07.R03** Pseudonymity is not anonymity because email links an identity to a DID at the operator, so consent text says this plainly.

## Specification

**Data classification**
- EmailAddress: P3 at the relay only; masked form for the owner.
- EmailDelivery: P2 template key and timing only.
- Verification and unsubscribe tokens: P3, stored as hashes.

**Retention**
- EmailAddress: RET-STANDARD until removal; ciphertext erased within 24 hours of removal.
- EmailDelivery rows: RET-SHORT (30 days).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Address enumeration through verification emails | same response whether or not the address exists elsewhere, 1 mail per address per hour, 5 per day |
| T02 | Relay used to spam third parties | verification only after signed request from a consented user, 5 per day per address, 20 emails per day per address, domain blocklist, operator abuse controls |
| T03 | Email content leaks private data | templates are generic with no free text; template registry reviewed; test asserts no user content fields |
| T04 | Phishing imitating notifications | emails carry only the app origin link, DKIM, SPF and DMARC alignment are required by operator checklist, users are told the app never asks for passwords by email |
| T05 | Bounce storms damaging operator reputation | hard bounce stops sends at once; 3 soft bounces in 7 days stop sends; complaints withdraw consent |
| T06 | Address theft from database | AES-256-GCM encryption with relay key, HMAC hash for lookup, key in relay key store |

**Abuse controls**
- Rate limits of 5 verification mails per address per day, 20 emails per address per day, 10 verification attempts per minute per IP.
- Operator can disable the email feature or block a domain on that relay.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-102-09.T09 | abuse | PS-102-07.R01, PS-102-07.R02, PS-102-07.R03 | inspect database, logs, events, exports; 6th verification mail in a day; 21st email in a day | no address outside encrypted storage; RATE_LIMITED and NOTIFY_EMAIL_NOT_DELIVERABLE |
| TEST-PS-102-09.T10 | integration | PS-102-07.R03, PS-102-02.R03 | hard bounce, 3 soft bounces, complaint | address bouncing and sends stop; complaint withdraws email consent |

## Dependencies

Module depends on: F13.S02.M03, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
