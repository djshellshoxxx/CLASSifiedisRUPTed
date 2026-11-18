# PS-054-01 — domain schema
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_sessions. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-054-01.R01 | Entities: `ses_` session (one per signed-in device context) and `rfm_` refresh family (one per login, holds the rotation chain). | MVP |
| PS-054-01.R02 | Access and refresh secrets are 256-bit CSPRNG values. Only SHA-256 digests are stored (SECRET class, RET-SEC). | MVP |
| PS-054-01.R03 | Device context stores user-agent family and coarse OS family only (PRIVATE_PERSONAL). No device identifier or fingerprint. | MVP |
| PS-054-01.R04 | Network context stores a keyed hash of the IPv4 /24 or IPv6 /48 prefix (PSEUDONYMOUS). Raw IP never persisted (CTR-PRV-001 R09). | MVP |
| PS-054-01.R05 | ≤ 20 active sessions per `acc_` (ASSUMPTION). Creating the 21st revokes the least recently used session. | MVP |
| PS-054-01.R06 | `ses_` IDs use CTR-ID-001 class `ulid`; prefixes `ses`, `rfm` pending CTR-ID-001 registry entry. | MVP |

## Data / schema
```json
session {
  "id": "ses_<26>", "account_id": "acc_<26>", "family_id": "rfm_<26>",
  "access_hash": "hex64 (SECRET)", "current_refresh_hash": "hex64 (SECRET)",
  "device": {"ua_family": "string<=32", "os_family": "string<=24"},
  "net_ctx_digest": "hex64 (PSEUDONYMOUS, keyed)",
  "step_up_at": "RFC3339 ms UTC | null", "idle_expires_at": "RFC3339", "absolute_expires_at": "RFC3339",
  "state": "active | revoked | expired", "end_reason": "logout | idle | absolute | revoked_by_user | family_reuse | lru_evicted | admin_security | null",
  "created_at": "RFC3339", "revision": "int >= 1"
}
```

## Commands / queries / events
See [commands_queries_events](commands_queries_events.md).

## States & transitions
See [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Field rules in [validation_rules](validation_rules.md).

## Authorization
Owner-only read of own sessions. Field visibility: `access_hash`, `current_refresh_hash` = `never`; `device` and `net_ctx_digest` = `owner`.

## Failure, idempotency, concurrency, offline
Schema changes additive; see [import_export_backup_rollback](import_export_backup_rollback.md).

## Privacy, retention, abuse
Row retention: ended sessions 30 days (RET-OPS); hashes purged 30 days after end (RET-SEC); end events kept 12 months (RET-AUD).

## Observability & budgets
Active session count gauge per shard; no account-labelled metrics.

## Tests
TEST-PS-054-01 (field classes lint), TEST-PS-054-02 (dump contains no plaintext token or raw IP).

## Acceptance criteria
1. Every column classified; lint passes.
2. Storage dump contains only digests and keyed hashes.

## Assumptions & open decisions
- ASSUMPTION: 20 sessions cap; keyed-hash key rotation every 90 days.
- PROVISIONAL (D07 default, unapproved): retention classes above.
