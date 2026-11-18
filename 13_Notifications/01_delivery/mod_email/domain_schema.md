# PS-102-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_email (Platform Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001 (prefixes `eml`, `dlv` PENDING registry addition), CTR-PRV-001 (classes, RET-PRIV, RET-OPS, SECRET), CTR-SCH-001, CTR-EVT-001.

**Decision labels:** Address encryption and keyed-hash scheme are PROVISIONAL (D10 default, unapproved). Retention is PROVISIONAL (D07 default, unapproved). Owner of attempt record `dlv`: F13.S01.M03 (PROVISIONAL, unapproved; see PS-103-01).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-102-01.R01 | One `eml_` binding per (`acc_`, normalized address). At most 3 bindings per account. | MVP |
| PS-102-01.R02 | Address stored as ciphertext (AES-256-GCM via KMS-held key, ASSUMPTION) plus keyed HMAC-SHA-256 for uniqueness. Plaintext address is never persisted. | MVP |
| PS-102-01.R03 | Verification token: 256-bit CSPRNG, stored only as hash. Single use, TTL 30 minutes (ASSUMPTION). | MVP |
| PS-102-01.R04 | Delivery attempts `dlv_` reference a notification `ntf_` by full ID; body text is never stored. | MVP |
| PS-102-01.R05 | Bounce and complaint state is stored per binding, not per message body. | MVP |
| PS-102-01.R06 | Every record carries a retention class (RET-PRIV for binding, RET-OPS for attempts, RET-SEC for token hashes). | MVP |

## Data / schema
```json
{
  "email_id": "eml_<26>",
  "account_ref": "acc_<26>",
  "address_ciphertext": "bytes, PRIVATE_PERSONAL",
  "address_hmac": "hex(32), PSEUDONYMOUS (keyed; key SECRET)",
  "state": "UNVERIFIED | PENDING_VERIFY | VERIFIED | SUPPRESSED | REMOVED",
  "bounce_state": "NONE | SOFT | HARD",
  "verified_at": "RFC3339 UTC | null",
  "revision": "integer >= 1"
}
```
Token record: `token_hash` (SECRET, SHA-256 of 256-bit token), `email_id`, `expires_at`, `used_at`.
Attempt record `dlv_`: `dlv_id`, `ntf_ref`, `channel` = "email", `template_id`, `template_version`, `attempt_no` (1–5), `provider_message_id` (PSEUDONYMOUS), `status`, `last_error_code`, `next_attempt_at`.

## Commands / queries / events
See PS-102-04.

## States & transitions
See PS-102-03.

## Validation & errors
See PS-102-02. Persisted-record owner: this module for `eml_`; attempt owner per PS-103-01.

## Authorization
See PS-102-05.

## Failure, idempotency, concurrency, offline
Uniqueness and dedupe: PS-102-06.

## Privacy, retention, abuse
Classes and retention: PS-102-07. Export of the binding is owner-only (CTR-PRV-001 R11).

## Observability and budgets
No address values in metrics or logs (PS-102-08).

## Tests
- TEST-PS-102-01 (unit): binding with 4th address rejected; duplicate normalized address returns existing binding.
- TEST-PS-102-02 (negative): storage dump contains no plaintext address.

## Acceptance criteria
1. Schema registered in CTR-SCH-001 with classes per field.
2. Prefixes `eml` and `dlv` registered in CTR-ID-001 (PENDING).
3. Token stored as hash only; verified by fixture.

## Assumptions & open decisions
- ASSUMPTION: KMS available to the platform; key rotation per D10.
- D10 key and recovery model (PROVISIONAL, unapproved). D07 retention (PROVISIONAL, unapproved).
