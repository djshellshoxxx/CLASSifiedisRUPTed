# PS-125-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** [mod_tenants](SPEC.md) (Platform Lead; privacy review by Privacy Lead). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-125-07.R01 | Tenant record classed PSEUDONYMOUS; no PRIVATE_PERSONAL field stored. | MVP |
| PS-125-07.R02 | `admin_ref` is redacted in logs to a keyed hash (ASSUMPTION) and never appears in error bodies. | MVP |
| PS-125-07.R03 | Anonymous slug lookup returns PUBLIC fields only and is limited to 60 requests/min per IP (ASSUMPTION). | MVP |
| PS-125-07.R04 | Tenant creation is limited to 5 per admin per day (ASSUMPTION). | MVP |
| PS-125-07.R05 | Slugs resembling public bodies or brands go to manual review before activation. | MVP |

## Data / schema
| Data | Class | Retention |
|---|---|---|
| Tenant record | PSEUDONYMOUS | RET-ACC: tenant lifetime + 30 days |
| Config history | PSEUDONYMOUS | RET-AUD: 12 months |
| Saga log | PUBLIC | RET-OPS: 30 days |
| Offboarding export | PRIVATE_PERSONAL (if it contains admin data) | RET-PRIV until delivered, then purged |

## Commands / queries / events
Export and purge run as `tenant.offboard` steps; see [PS-125-03](workflow_state_machine.md).

## States & transitions
Purge is the last step of `offboarding` → `deleted`. Legal hold (RET-LEGAL) blocks it.

## Validation & errors
`TEN.SLUG_RESERVED` and manual-review holds use `TEN.SLUG_PENDING_REVIEW` (conflict / 409, retryable true while under review).

## Authorization
Export is available to the admin (owner rule) and to `ope` with purpose `tenant_offboarding`.

## Failure, idempotency, concurrency, offline
Purge is idempotent by `tenant_id`; re-running after partial purge removes remaining rows only.

## Privacy, retention, abuse
- Enumeration: `tenant.get_by_slug` rate-limited (R03); responses identical for active and suspended tenants where status is not PUBLIC.
- Squatting: 5-per-day cap (R04) and a reserved list.
- Impersonation: names resembling public bodies need Trust&Safety review (R05).
- Export excludes other tenants' data and all secrets.

## Observability & budgets
`tenant_slug_lookups_total{outcome}`, `tenant_review_queue_depth`. Logs never record config values.

## Tests
- TEST-PS-125-07-01 (privacy): log capture during full lifecycle contains no `admin_ref` in cleartext and no config value.
- TEST-PS-125-07-02 (abuse): 61st anonymous lookup in one minute is rate limited.
- TEST-PS-125-07-03 (abuse): 6th creation in one day is refused.
- TEST-PS-125-07-04 (retention): purge under legal hold leaves records untouched.

## Acceptance criteria
1. Lifecycle logs pass the redaction test with zero hits.
2. Export contains no secrets and no data from other tenants.
3. Legal hold blocks purge in 100% of test cases.

## Assumptions & open decisions
- ASSUMPTION: rate limits and review queue as stated; Trust&Safety Lead to confirm.
- PROVISIONAL (D07 default, unapproved): retention values above follow D07 defaults and legal-hold exceptions.
- PROVISIONAL (D05 default, unapproved): no precise location on tenant records.
