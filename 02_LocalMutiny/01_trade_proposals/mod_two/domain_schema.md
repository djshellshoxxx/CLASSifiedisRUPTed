# PS-015-01 — domain schema
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/01_trade_proposals/mod_two. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001 (`cyc` prefix, registered: barter cycle proposal), CTR-EVT-001, CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-015-01.R01 | `cyc_` is canonical here (B-06): owner F02.S01.M01. Size 2 (direct two-party barter) and sizes 3–6 (matched cycles) share one aggregate. | MVP |
| PS-015-01.R02 | `size` equals the number of `par_` slots; 2 ≤ size ≤ 6 (ASSUMPTION; D02 governs any increase). | MVP |
| PS-015-01.R03 | A cycle references slots and offers by full ID only; it stores no offer lines. | MVP |
| PS-015-01.R04 | `origin` is `direct` (size 2 proposal) or `matched:cdc_<id>` (promoted candidate from F02.S02.M03). | MVP |
| PS-015-01.R05 | Cycle record holds no location, no account IDs and no free text. Max data class: PSEUDONYMOUS. | MVP |

## Data / schema
```json
{ "cyc_id": "cyc_<26>", "size": 2, "origin": "direct|matched",
  "candidate_ref": "cdc_<26>|null",
  "par_ids": ["par_<26>", "par_<26>"],
  "status": "draft|proposed|fully_accepted|confirming|locked|declined|withdrawn|expired|closed",
  "expires_at": "RFC3339", "fully_accepted_at": "RFC3339|null", "confirm_until": "RFC3339|null",
  "feasibility_ref": "fsb_<26>|null", "revision": 1, "schema_version": "1.0.0" }
```
`cdc_` prefix is owned by F02.S02.M03 and PENDING CTR-ID-001 registration. `fsb_` owned by F02.S02.M05, PENDING registration.

## Commands / queries / events
Defined in PS-015-04. Ordering by `revision` (CTR-EVT-001 R02).

## States & transitions
PS-015-03 defines all transitions. `status` is the only mutable field besides timestamps and `feasibility_ref`.

## Validation & errors
PS-015-02 (`TWO.*`).

## Authorization
PS-015-05. Cycle metadata is visible to participants only.

## Failure, idempotency, concurrency, offline
Creation of a cycle and its slot references is atomic (PS-015-06).

## Privacy, retention, abuse
Max data class PSEUDONYMOUS; retention in PS-015-07.

## Observability & budgets
Counts by size and status; no IDs as labels.

## Tests
- TEST-PS-015-01-01 (unit): size equals slot count; size 1 and 7 refused.
- TEST-PS-015-01-02 (unit): schema rejects any offer-line field on the cycle.
- TEST-PS-015-01-03 (privacy): cycle serialization has no account or free text fields.

## Acceptance criteria
1. Schema fixtures pass for sizes 2–6; sizes 1 and 7 rejected.
2. Zero unclassified fields (CI).

## Assumptions & open decisions
- ASSUMPTION: 2–6 in MVP.
- D02 PROVISIONAL (Dxx default, unapproved): bounded deterministic search for matched cycles; size cap is an input to that search.
