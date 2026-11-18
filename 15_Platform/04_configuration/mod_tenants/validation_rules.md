# PS-125-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [mod_tenants](SPEC.md) (Platform Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-125-02.R01 | Slug validated before any uniqueness lookup; first failing rule returned in `details[]`. | MVP |
| PS-125-02.R02 | Reserved slugs (ASSUMPTION: 40 names, e.g. `admin`, `api`, `support`, `security`, `root`, `mod`) are refused with `TEN.SLUG_RESERVED`. | MVP |
| PS-125-02.R03 | Config accepts only allowlisted keys; unknown key → `TEN.CONFIG_INVALID`. Input values never echoed. | MVP |
| PS-125-02.R04 | `region_cells` entries must be in the registered cell set; otherwise `TEN.REGION_NOT_REGISTERED`. | MVP |
| PS-125-02.R05 | `admin_ref` must be an active `acc_`; otherwise `TEN.ADMIN_NOT_ACTIVE`. | MVP |
| PS-125-02.R06 | `display_name` is NFC, 1–80 code points, no Unicode category Cc/Cf. | MVP |
| PS-125-02.R07 | Config size ≤ 16 KiB, depth ≤ 4, strings ≤ 512 chars. | MVP |

## Data / schema
Slug pattern and field types as in [PS-125-01](domain_schema.md). Config allowlist (ASSUMPTION, MVP): `welcome_text` (string ≤ 500), `contact_policy` (enum `admin_only`, `members`), `listing_categories` (array of category IDs ≤ 50), `retention_profile` (enum), `federation_mode` (enum).

## Commands / queries / events
Validation runs inside `tenant.create` and `tenant.update_config` before the state transition in [PS-125-03](workflow_state_machine.md).

## States & transitions
Not applicable; validation is a guard, not a state.

## Validation & errors
| Code | Retryable | Category / HTTP | Trigger |
|---|---|---|---|
| TEN.SLUG_INVALID | false | validation / 400 | Pattern or length failure. |
| TEN.SLUG_RESERVED | false | validation / 400 | Name on reserved list. |
| TEN.SLUG_TAKEN | false | conflict / 409 | Unique constraint hit. |
| TEN.CONFIG_INVALID | false | validation / 400 | Unknown key, wrong type, depth or size. |
| TEN.REGION_NOT_REGISTERED | false | validation / 400 | Cell not in registry. |
| TEN.ADMIN_NOT_ACTIVE | false | unprocessable_state / 422 | `admin_ref` suspended, deleted or absent. |

Stale writes use `EVT.REVISION_CONFLICT` from CTR-EVT-001 and are not redefined here.

## Authorization
Validation runs after authorization. Invalid input from an unauthorized actor returns `SYS.NOT_FOUND` for unreadable tenants, per CTR-ERR-001 R08.

## Failure, idempotency, concurrency, offline
Validation is pure and deterministic. Re-validating the same payload returns the same result. Offline clients may pre-validate for UX only; the server is authoritative.

## Privacy, retention, abuse
Error `details[].field` uses JSON-pointer paths; `details[].rule` is an enum. No input echo (CTR-ERR-001 R07).

## Observability & budgets
`tenant_validation_failures_total{code}`. Validation adds ≤ 1 ms p95.

## Tests
- TEST-PS-125-02-01 (unit): each rule R01–R07 has one passing and one failing fixture.
- TEST-PS-125-02-02 (negative): reserved and confusable slugs (for example Cyrillic `а` in `adm`) are refused.
- TEST-PS-125-02-03 (negative): config with 5 nesting levels or 17 KiB is refused without partial write.

## Acceptance criteria
1. Each code above is returned for its trigger and no other.
2. No validation error response contains an input value.
3. Reserved list is versioned and changes are audited.

## Assumptions & open decisions
- ASSUMPTION: reserved list of 40 names and config allowlist as stated; Trust&Safety Lead to confirm.
- PROVISIONAL (D05 default, unapproved): region cells limited to coarse public regions.
- PROVISIONAL (D07 default, unapproved): `retention_profile` values map to D07 defaults.
