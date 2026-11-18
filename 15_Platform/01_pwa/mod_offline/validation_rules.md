# PS-116-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_offline (F15.S01.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-EVT-001, CTR-SCH-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-116-02.R01 | `command_type` matches `^[a-z_]{2,24}\.[a-z_]{2,24}$` and is in the module's declared offline-capable list. | MVP |
| PS-116-02.R02 | `aggregate_id`, when present, passes CTR-ID-001 R01–R04, R09 and its prefix matches the aggregate type (`ID.PREFIX_MISMATCH`). | MVP |
| PS-116-02.R03 | `expected_revision` is null for creation and an integer >= 1 for updates; any other value is refused. | MVP |
| PS-116-02.R04 | `schema_version` MAJOR must be supported by the local registry snapshot; unknown MAJOR is accepted into `upgrade_required`, not discarded (CTR-SCH-001 R06). | MVP |
| PS-116-02.R05 | Payload is validated against the local copy of the payload schema before enqueue. Validation errors report field path and rule only, never the input value (CTR-ERR-001 R07). | MVP |
| PS-116-02.R06 | Floats are refused in money fields (`OFFLINE.ENTRY_INVALID`, rule `float_money`). | MVP |
| PS-116-02.R07 | Replay validation repeats R01–R03 and R05 before send to detect corrupted storage. | MVP |

## Data / schema
Validation runs on the entry schema in PS-116-01. Rules map to codes:

| Rule | Code | Retryable |
|---|---|---|
| Schema, pattern, enum or range failure | OFFLINE.ENTRY_INVALID | false |
| Command not offline-capable | OFFLINE.COMMAND_NOT_OFFLINE_CAPABLE | false |
| Payload over 64 KiB or depth 8 | SYS.PAYLOAD_TOO_LARGE | false |
| Digest mismatch on read | OFFLINE.ENTRY_TAMPERED | false |
| Unknown MAJOR | OFFLINE.UPGRADE_REQUIRED | false |

## Commands / queries / events
Validation runs inside `offline.enqueue` (PS-116-04) before any write.

## States & transitions
Validation failure at enqueue creates no entry. Validation failure at replay moves the entry to `not_applied` with the code above (PS-116-03).

## Validation & errors
Error responses follow CTR-ERR-001 envelope. `message_key` = `err.offline.<code lowercased>`. No localized prose in the contract.

## Authorization
Validation does not authorize. The server re-authorizes on commit (CTR-CAP-001 R11).

## Failure, idempotency, concurrency, offline
Validation is pure and deterministic. Schema snapshot is updated only when online; a stale snapshot causes `upgrade_required`, not silent acceptance.

## Privacy, retention, abuse
Validation logs contain the rule name and code only. Input is never echoed or logged.

## Observability & budgets
Metric: `offline_validation_failures_total{code}`. Budget: validation ≤ 2 ms p95 for a 64 KiB payload on a mid-range phone (ASSUMPTION).

## Tests
- TEST-PS-116-02-01 (unit): each rule R01–R07 has a pass and a fail fixture.
- TEST-PS-116-02-02 (property): random strings in `command_type` never pass unless they match the pattern and the allow-list.
- TEST-PS-116-02-03 (unit): error body contains no input value (scan for fixture strings).
- TEST-PS-116-02-04 (integration): unknown MAJOR entry stays pending across app restart.

## Acceptance criteria
1. Every rule has a code in the table above; codes registered in the module catalog.
2. No validation error body contains an input value.
3. TEST-PS-116-02-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: payload schemas are shipped to the client as a signed snapshot (CTR-SCH-001).
- PROVISIONAL (D08 default): validation before enqueue and again before replay.
- OPEN: which commands are offline-capable per owner module; each owner module decides in its own spec.
