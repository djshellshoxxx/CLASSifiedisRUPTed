# PS-030-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/02_service_booking/mod_disputes. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-COM-001 (dispute window, claim states), CTR-ID-001, CTR-SCH-001, CTR-PRV-001. Canonical dispute record owner: F09.S02.M02 `09_Commerce/02_settlement/mod_disputes` (PROVISIONAL, see SPEC.md).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-030-01.R01 | This module stores only a `service_dispute_link` (reference to the canonical record plus service context). It does not store dispute narrative, evidence bodies or outcome. | MVP |
| PS-030-01.R02 | `dispute_ref` is the full canonical ID issued by F09.S02.M02; no local dispute ID is minted. | MVP |
| PS-030-01.R03 | `subject_type` ∈ {`milestone`, `booking`}. `booking` applies only when the booking has no milestones. | MVP |
| PS-030-01.R04 | `reason_code` closed enum: `NOT_DELIVERED`, `SCOPE_MISMATCH`, `QUALITY`, `LATE`, `ACCEPTANCE_DISPUTED`, `OTHER`. `OTHER` requires a note ≤ 500 Unicode scalars. | MVP |
| PS-030-01.R05 | `requested_minor` is a base-10 decimal string of minor units, ≥ 1, ≤ subject amount, currency equal to subject currency (CTR-COM-001 R02, R03). | MVP |
| PS-030-01.R06 | `evidence_digests` ≤ 10 entries per party; each SHA-256 hex plus `media_class` enum and `self_attested` = true. | MVP |
| PS-030-01.R07 | `window_ends_at` = last subject transition + 14 days (CTR-COM-001 R16, ASSUMPTION). | MVP |

## Data / schema
```
service_dispute_link {
  dispute_ref: string          // F09 canonical ID, 30 chars (CTR-ID-001)
  subject_type: enum           // milestone | booking
  subject_id: string           // milestone or booking ID (owned by PS-031 / PS-032 parents)
  opened_by: string            // acc_ of participant; PSEUDONYMOUS
  reason_code: enum            // R04
  requested_minor: string      // R05
  currency: string             // fiat ISO 4217 or CAIP-19
  window_ends_at: string       // RFC 3339 UTC
  link_state: enum             // requested | opened | refused
  schema_version: "1.0.0"      // CTR-SCH-001
}
```
Provenance: `source = participant_input`. Field classes: `requested_minor` FINANCIAL_EVIDENCE-adjacent; classify as FINANCIAL_EVIDENCE per CTR-PRV-001 R02 ordering (ASSUMPTION).

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md). Record mutations are F09 commands; this module emits `service_dispute.link_opened`.

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md). Module code prefix `DISPUTE`.

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
See [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Link rows follow the F09 record's retention and legal holds (CTR-PRV-001 R06, R07). See [privacy_retention_abuse.md](privacy_retention_abuse.md).

## Observability & budgets
Counts per `reason_code` and `link_state`; no narrative text.

## Tests
- TEST-PS-030-01-01 unit: R03 `subject_type` selection; R05 amount boundary (minor = subject, minor = subject + 1).
- TEST-PS-030-01-02 contract: link payload golden fixture, schema 1.0.0.

## Acceptance criteria
1. Link row contains no narrative, evidence body or outcome field.
2. Every `dispute_ref` resolves in F09 or the link is marked `refused`.
3. Amounts are integers in decimal-string form.

## Assumptions & open decisions
- ASSUMPTION: canonical dispute owner is F09.S02.M02 (PROVISIONAL; B-06 owner confirmation pending).
- D06 (receipts) PROVISIONAL: evidence is signed self-attestation, not verification.
- Payment checklist applies: claim states per CTR-COM-001 R05; no "paid" label.
