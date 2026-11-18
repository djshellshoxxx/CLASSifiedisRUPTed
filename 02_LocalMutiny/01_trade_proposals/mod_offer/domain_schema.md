# PS-013-01 — domain schema
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_offer. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-PRV-001, CTR-SCH-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-013-01.R01 | An offer revision is one immutable row keyed by (`ofr_id`, `revision_no`). Prefix `ofr` is PENDING CTR-ID-001 registration (proposed: ulid class). | MVP |
| PS-013-01.R02 | Each revision holds 1–8 `give_lines` and 1–8 `want_lines`. No duplicate `line_key` or duplicate `lst_id` on one side. | MVP |
| PS-013-01.R03 | A `give` line references a `lst_` owned by the slot's `acc_` at submit. A `want` line references a `lst_` not owned by the slot, or a `category_code`. | MVP |
| PS-013-01.R04 | A revision binds to exactly one `par_` slot and one `cyc_`. Neither changes after creation. | MVP |
| PS-013-01.R05 | No field stores precise location (CTR-PRV-001 R03). Record max data class: PSEUDONYMOUS. | MVP |

## Data / schema
```json
{ "ofr_id": "ofr_<26>", "revision_no": 1, "cyc_id": "cyc_<26>", "par_id": "par_<26>",
  "status": "draft|submitted|locked|withdrawn|expired|superseded|closed",
  "give_lines": [{"line_key": "g1", "lst_id": "lst_<26>", "qty": "1"}],
  "want_lines": [{"line_key": "w1", "kind": "listing|category", "lst_id": "lst_<26>|null", "category_code": "string|null"}],
  "valuation": {"mode": "none|quote", "qte_id": "qte_<26>|null"},
  "note": "string, <=280 chars, nullable",
  "expires_at": "RFC3339 UTC", "submitted_at": "RFC3339|null",
  "content_digest": "sha256 hex of JCS(give, want, valuation, expires_at)",
  "schema_version": "1.0.0" }
```
Constraints: `qty` is a decimal string, integer 1–99 (ASSUMPTION). `content_digest` is recomputed at lock. Provenance: `source_kind = local` (no federated fields in MVP). Amounts never stored here; valuation is referenced by `qte_id` (F09.S03 owns quotes).

## Commands / queries / events
Defined in PS-013-04. Ordering uses `revision_no`, never timestamps (CTR-EVT-001 R04).

## States & transitions
Status values and transitions are defined in PS-013-03. Only `status` and `submitted_at` change after insert, and only through PS-013-03 transitions.

## Validation & errors
Rules and codes: PS-013-02 (`OFFER.*`).

## Authorization
Field visibility and actions: PS-013-05. `note` is `owner` visible only.

## Failure, idempotency, concurrency, offline
Insert is atomic per revision; see PS-013-06.

## Privacy, retention, abuse
Data class PSEUDONYMOUS. Retention and export: PS-013-07 and PS-013-10.

## Observability & budgets
Row count and size per revision logged as counts only (PS-013-08).

## Tests
- TEST-PS-013-01-01 (unit): schema accepts 1 and 8 lines per side; rejects 0 and 9.
- TEST-PS-013-01-02 (property): `content_digest` is invariant under key reordering.
- TEST-PS-013-01-03 (integration): `revision_no` strictly increments under concurrent writers.

## Acceptance criteria
1. 100% of valid fixtures pass and 100% of invalid fixtures fail (fixtures defined in PS-013-09).
2. CI reports zero `PRV.UNCLASSIFIED_FIELD` and zero field above PSEUDONYMOUS.

## Assumptions & open decisions
- ASSUMPTION: 8 lines per side; `qty` ≤ 99.
- PENDING CTR-ID-001: `ofr` prefix registration.
- D03 PROVISIONAL (Dxx default, unapproved): valuation by pinned quote reference only.
