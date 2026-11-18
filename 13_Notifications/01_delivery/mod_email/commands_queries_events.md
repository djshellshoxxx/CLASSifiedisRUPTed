# PS-102-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_email (Platform Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001, CTR-ID-001.

**Decision labels:** Webhook signature scheme is PROVISIONAL (D10 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-102-04.R01 | Commands: `eml.bind`, `eml.verify`, `eml.remove`, `eml.send`, `eml.webhook_ingest`. Query: `eml.status` (self only). | MVP |
| PS-102-04.R02 | Every state-changing command carries `idempotency_key` (CTR-EVT-001 R03). | MVP |
| PS-102-04.R03 | `eml.webhook_ingest` accepts only HMAC-SHA-256-signed bodies; unsigned or mismatched → `SYS.UNAUTHORIZED`. | MVP |
| PS-102-04.R04 | `eml.status` returns state, bounce_state and masked address (first character and domain TLD only). | MVP |
| PS-102-04.R05 | Events: `email_address.bound`, `email_address.verified`, `email_address.removed`, `email_delivery.sent`, `email_delivery.bounced`, `email_delivery.suppressed`, `email_delivery.expired`. | MVP |

## Data / schema
Command envelope per CTR-EVT-001. Event payloads carry `email_id`, `account_ref`, `ntf_ref` (where applicable), `template_id`, `status`. Never the address, token or body.

Example request:
```json
{"command_type":"eml.bind","idempotency_key":"k_01J...","payload":{"address":"<client-supplied>","purpose":"account_security"}}
```
The address field is accepted once, is never echoed, and is redacted from logs at ingest.

## Commands / queries / events
| Name | Caller | Idempotency key | Revision | Errors |
|---|---|---|---|---|
| `eml.bind` | `acc_` (self) | (acc, normalized address) | n/a | EMAIL.ADDRESS_INVALID, EMAIL.ADDRESS_DISPOSABLE, EMAIL.RATE_LIMITED |
| `eml.verify` | `acc_` (self) | (acc, token hash) | required | EMAIL.VERIFICATION_EXPIRED, EMAIL.VERIFICATION_USED |
| `eml.remove` | `acc_` (self) or deletion job | (acc, email_id) | required | SYS.NOT_FOUND |
| `eml.send` | `sys_` | (ntf_id, channel, template_version) | n/a | EMAIL.TEMPLATE_UNKNOWN, EMAIL.HEADER_INVALID, EMAIL.LINK_NOT_ALLOWED |
| `eml.webhook_ingest` | `sys_` (provider) | (provider_message_id, event_type, provider_event_id) | n/a | SYS.UNAUTHORIZED |

Versioning: template additions are MINOR; changing a variable's data class is MAJOR (CTR-SCH-001 R10).

## States & transitions
Event-to-transition mapping: PS-102-03.

## Validation & errors
PS-102-02 table and CTR-ERR-001 envelope.

## Authorization
Capability IDs and scopes: PS-102-05.

## Failure, idempotency, concurrency, offline
Duplicate key with same digest returns original; different digest → `EVT.IDEMPOTENCY_KEY_REUSED`. Details: PS-102-06.

## Privacy, retention, abuse
No event carries PRIVATE_PERSONAL data. `max_data_class` is PSEUDONYMOUS for all `email_*` events.

## Observability and budgets
Counts per command and result (PS-102-08).

## Tests
- TEST-PS-102-09 (contract): `email_delivery.sent` 1.0.0 golden fixture validates; payload has no address field.
- TEST-PS-102-10 (negative): webhook with bad HMAC rejected; no state change.
- TEST-PS-102-11 (integration): `eml.status` masking shows no more than first character and TLD.

## Acceptance criteria
1. Every command has golden request examples and error rows.
2. Event schemas registered in CTR-SCH-001.
3. No event or response contains the full address.

## Assumptions & open decisions
- ASSUMPTION: provider supports HMAC-signed webhooks; if not, mTLS allowlist applies.
- D10 (PROVISIONAL, unapproved).
