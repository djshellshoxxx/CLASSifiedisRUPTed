# PS-089-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_blocklists. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001 (envelope of codes), CTR-FED-001 (peer states, size limits), CTR-SCH-001 (closed enums), CTR-PRV-001 (privacy-safe diagnostics), CTR-ID-001 (`blk_`, `nod_`, `fpr_`, `cas_`, `dlv_` prefixes).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-089-02.R01 | Every write is validated before commit; zero rows violating PS-089-01 persist (TEST-PS-089-02-02). | MVP |
| PS-089-02.R02 | Enum fields are closed. Unknown values are refused with `BLOCKLISTS.REASON_INVALID` or `BLOCKLISTS.TARGET_INVALID`; no open-enum passthrough. | MVP |
| PS-089-02.R03 | `peer_import` entries require `expires_at` > receipt time and ≤ receipt + 180 days (ASSUMPTION). Local entries: ≤ 365 days. | MVP |
| PS-089-02.R04 | `scope = federate` requires federation enabled and, for export, a `trusted` destination peer (CTR-FED-001 R01, R02). Imports from `restricted` peers create `proposed` entries only. | MVP |
| PS-089-02.R05 | Error details name field path and code only. Rejected values are never echoed or logged. | MVP |

## Data / schema
| Field | Rule | Code on failure |
|---|---|---|
| `target_kind` | closed enum | `BLOCKLISTS.TARGET_INVALID` |
| `target_ref` | node `^nod_[0-9A-HJKMNP-TV-Z]{26}$`; peer `^fpr_…$`; digest `^[0-9a-f]{64}$`; any other prefix, including `acc_`/`prf_`, refused | `BLOCKLISTS.TARGET_INVALID` |
| `reason_code` | closed enum (F12 registry) | `BLOCKLISTS.REASON_INVALID` |
| any unlisted field | schema `additionalProperties: false`; free text absent by design | `BLOCKLISTS.REASON_INVALID` |
| `source_ref` | `cas_` for `local_moderator`; `dlv_` for `peer_import` | `BLOCKLISTS.SOURCE_REF_REQUIRED` |
| `expires_at` | R03 bounds | `BLOCKLISTS.EXPIRY_INVALID` |
| `scope` | R04 | `BLOCKLISTS.SCOPE_NOT_ALLOWED` |

Order: authenticate, authorize (PS-089-05), validate, check state (PS-089-03), commit. Unauthorized callers receive only `SYS.FORBIDDEN` or `SYS.NOT_FOUND` and no validation detail.

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| BLOCKLISTS.TARGET_INVALID | false | validation / 400 | Unknown kind, bad pattern, personal or location reference |
| BLOCKLISTS.REASON_INVALID | false | validation / 400 | Reason outside enum; unlisted or free-text field |
| BLOCKLISTS.SOURCE_REF_REQUIRED | false | validation / 400 | Missing or wrong-prefix `cas_`/`dlv_` |
| BLOCKLISTS.EXPIRY_INVALID | false | validation / 400 | Missing, past, or over cap |
| BLOCKLISTS.SCOPE_NOT_ALLOWED | false | forbidden / 403 | Federate scope with flag off or peer not `trusted` |
| BLOCKLISTS.LOCAL_OVERRIDE_PRESENT | false | unprocessable_state / 422 | Import targets a locally withdrawn or rejected entry |

Peer-import failures are returned per event as `rejected` with the code (CTR-FED-001 R13), not as HTTP errors.

## Privacy, retention, abuse
Diagnostics carry code, field path and `blk_` ID only (PS-089-07). Validation logs are pseudonymous and follow RET-OPS.

## Observability & budgets
`blocklist_validation_rejections_total{code}`. Alert when one code exceeds 10× its 7-day baseline (ASSUMPTION).

## Tests
- TEST-PS-089-02-01 (unit): one fixture per code in the table; each returns exactly that code.
- TEST-PS-089-02-02 (property): random strings and prefixes; no invalid row persists.
- TEST-PS-089-02-03 (unit): expiry boundaries at now, now + 180 d, and now + 180 d + 1 ms.
- TEST-PS-089-02-04 (negative): free text in `reason_code` field is refused and not echoed.
- TEST-PS-089-02-05 (integration): import from `restricted` peer yields `proposed`, not `active`.

## Acceptance criteria
1. All six codes reachable by fixtures; TEST-PS-089-02-01 passes.
2. No invalid row persists; TEST-PS-089-02-02 passes.
3. Rejected values never appear in responses or logs; TEST-PS-089-02-04 passes.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md). Labels below are PROVISIONAL (default, unapproved) where marked.
- ASSUMPTION: 180-day peer expiry cap; 365-day local cap (F10 to confirm).
- PROVISIONAL (D01 default, unapproved): inbound events validated against signature and schema before import.
- PENDING F12: reason enum values.
