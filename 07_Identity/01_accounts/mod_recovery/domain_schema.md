# PS-053-01 — domain schema
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_recovery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-053-01.R01 | Two entities: `rec_` recovery request, `rmt_` recovery method (enrolled proof, per `acc_`). Each field carries exactly one data class (CTR-PRV-001 R01). | MVP |
| PS-053-01.R02 | No plaintext recovery code, OTP, contact address or raw IP is stored. Codes: Argon2id encoded hash. OTP: HMAC-SHA-256 under a KMS key. Both are SECRET class. | MVP |
| PS-053-01.R03 | Contact address (`verified_contact`) stored encrypted at rest (PRIVATE_PERSONAL); API returns masked form only (for example `j***@d***.de`). | MVP |
| PS-053-01.R04 | ≤ 2 active `rmt_` per `acc_` (ASSUMPTION). ≤ 1 open `rec_` per `acc_` in state `requested` or `verified`. | MVP |
| PS-053-01.R05 | `rec_` uses CTR-ID-001 class `opaque` (creation time sensitive). `rmt_` uses class `ulid`. Prefixes `rec`, `rmt` are PENDING CTR-ID-001 registry entry. | MVP |
| PS-053-01.R06 | Stored `requester_ctx_digest` = keyed hash of coarse network prefix and user-agent family (PSEUDONYMOUS). No device fingerprint. | MVP |
| PS-053-01.R07 | Trusted-contact quorum method: no schema in MVP. Deferred; see Assumptions. | Future |

## Data / schema
```json
recovery_request {
  "id": "rec_<26 opaque>", "account_id": "acc_<26>",
  "method": "recovery_code | verified_contact",
  "state": "requested | verified | completed | cancelled | expired | locked",
  "otp_hmac": "bytes32 | null  (SECRET, purged at expiry or use)",
  "attempt_count": "int 0..5", "lock_until": "RFC3339 ms UTC | null",
  "expires_at": "created_at + 15 min", "cooldown_ends_at": "verified_at + 24 h | null",
  "requester_ctx_digest": "hex64 (PSEUDONYMOUS)", "revision": "int >= 1"
}
recovery_method {
  "id": "rmt_<26>", "account_id": "acc_<26>", "kind": "recovery_code | verified_contact",
  "secret_hash": "argon2id string | null (SECRET)", "contact_enc": "bytes | null (PRIVATE_PERSONAL)",
  "contact_masked": "string | null", "status": "active | revoked", "created_at": "RFC3339", "revoked_at": "RFC3339 | null"
}
```
Provenance: `source = operator | user`; every row carries `created_by` (`acc_` or `sys_`).

## Commands / queries / events
Defined in [commands_queries_events](commands_queries_events.md). Entities here are the only persisted recovery records.

## States & transitions
See [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Field rules in [validation_rules](validation_rules.md).

## Authorization
Field visibility per CTR-CAP-001 R10: `state` and `expires_at` visible to owner; `otp_hmac`, `secret_hash` and `contact_enc` visible to `never`.

## Failure, idempotency, concurrency, offline
Schema changes are additive; see [import_export_backup_rollback](import_export_backup_rollback.md).

## Privacy, retention, abuse
Retention per row: `recovery_request` 30 days (RET-OPS); `otp_hmac` purged at expiry (RET-EPH); `recovery_method.secret_hash` RET-SEC; `contact_enc` RET-ACC.

## Observability & budgets
Row counts by state exported as metrics only.

## Tests
TEST-PS-053-01 (schema lint: every field classed), TEST-PS-053-02 (no plaintext code in any column dump).

## Acceptance criteria
1. All fields classified; lint passes (CTR-PRV-001 TEST-01).
2. Stored columns contain no plaintext code, OTP or contact address.

## Assumptions & open decisions
- ASSUMPTION: field sizes and limits above.
- PROVISIONAL (D10 default, unapproved): user-held recovery codes, no platform-held recovery key.
- PROVISIONAL (D07 default, unapproved): retention classes above.
- Canonical owner note: this module is the canonical owner of account-recovery records. Slug is shared with `02_LocalMutiny/03_cycle_execution/mod_recovery` and `15_Platform/03_operations/mod_recovery`, which own different record classes; consumers use full IDs only.
