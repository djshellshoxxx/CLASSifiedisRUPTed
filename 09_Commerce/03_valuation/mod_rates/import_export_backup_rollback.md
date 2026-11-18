# PS-075-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/03_valuation/mod_rates (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R05–R08), CTR-PRV-001 (R06), CTR-FED-001 (R03). **Decisions:** D03, D07 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-075-10.R01 | No import of quotes from third parties or federation; source registry imports require dual approval. | MVP |
| PS-075-10.R02 | Export of quotes referenced by a user's claims or proposals, with `quote_hash`, so the user can verify the agreed value. | MVP |
| PS-075-10.R03 | Rollback disabling issuance keeps all issued quotes readable and pinned proposals valid. | MVP |
| PS-075-10.R04 | Backups preserve quotes and hashes; restore does not re-issue expired quotes. | MVP |

## Data / schema
Export: array of quote objects plus `quote_hash`; manifest with count and digest.

## Commands / queries / events
`quote.exported` event with count only.

## States & transitions
Export: `queued` → `generated` → `expired` (24 h).

## Validation & errors
`SYS.RATE_LIMITED` on export frequency.

## Authorization
Party may export quotes linked to own proposals or claims only.

## Failure, idempotency, concurrency, offline
Idempotent export by ID.

## Privacy, retention, abuse
Quote exports contain no party data beyond the link by `quote_id`.

## Observability & budgets
Export p95 ≤ 5 s (ASSUMPTION).

## Tests
- TEST-PS-075-10-01 (contract): exported quote hash verifies.
- TEST-PS-075-10-02 (integration): rollback keeps pinned proposals valid.
- TEST-PS-075-10-03 (integration): restore does not re-issue expired quotes.
- TEST-PS-075-10-04 (negative): export of unrelated quote refused.

## Acceptance criteria
1. Export verifies.
2. Rollback leaves pinned proposals valid.

## Assumptions & open decisions
- D03, D07 (PROVISIONAL, unapproved).
