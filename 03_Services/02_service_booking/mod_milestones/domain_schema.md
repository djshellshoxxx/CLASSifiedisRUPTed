# PS-031-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_milestones. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-COM-001 (amounts, claim states), CTR-ID-001, CTR-SCH-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-031-01.R01 | A booking holds 1–12 milestones (ASSUMPTION). `order_index` is unique per booking, 1..N, contiguous. | MVP |
| PS-031-01.R02 | `amount_minor` is a base-10 decimal string (≤ 39 digits, no leading zeros except `0`), currency equals booking currency. | MVP |
| PS-031-01.R03 | Sum of `amount_minor` over milestones equals the accepted quote total exactly (integer equality; no rounding). | MVP |
| PS-031-01.R04 | `acceptance_text` ≤ 1,000 Unicode scalars, NFC-normalized, stored as participant-supplied text (PRIVATE_PERSONAL class, ASSUMPTION). | MVP |
| PS-031-01.R05 | `due_at` is RFC 3339 UTC; must be ≥ booking start and ≤ booking end (both ASSUMPTION fields in parent booking). | MVP |
| PS-031-01.R06 | Milestones are not federated in MVP (CTR-FED-001 R02). | MVP |

## Data / schema
```
milestone {
  id: string                  // prefix PENDING CTR-ID-001 registry (proposed mst_), 30 chars
  booking_id: string          // parent booking ref
  order_index: integer 1..12
  amount_minor: string        // decimal string, CTR-COM-001 R02
  currency: string            // ISO 4217 or CAIP-19
  acceptance_text: string     // ≤1000 scalars
  due_at: string              // RFC 3339 UTC
  state: enum                 // see workflow_state_machine.md
  rejection_count: integer 0..2
  revision: integer ≥1
  schema_version: "1.0.0"
}
```
Claim records are owned by F09 (CTR-COM-001 R08); this module stores only `claim_ref` (nullable).

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md). Module code `MILESTON` (CTR-ERR-001 R02).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
See [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Acceptance text follows booking retention. See [privacy_retention_abuse.md](privacy_retention_abuse.md).

## Observability & budgets
Counts by state; no amounts in metric labels.

## Tests
- TEST-PS-031-01-01 unit: 12 vs 13 milestones; `order_index` gaps.
- TEST-PS-031-01-02 property: sum equals quote total for random splits; off-by-one minor unit rejected.
- TEST-PS-031-01-03 contract: schema golden fixture 1.0.0.

## Acceptance criteria
1. Sum invariant holds after every write.
2. No floating-point or rounding path exists for milestone amounts.
3. No claim status field is writable from this module.

## Assumptions & open decisions
- ASSUMPTION: 12-milestone cap; acceptance text 1,000 scalars.
- D03 (mixed currency valuation) PROVISIONAL: milestones are single-currency; cross-currency handled by quote pin.
- Payment checklist applies: amounts and claim references per CTR-COM-001.
