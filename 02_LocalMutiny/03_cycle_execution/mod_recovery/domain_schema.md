# PS-024-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_recovery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-SCH-001, CTR-COM-001 (R08, R14), CTR-EVT-001, CTR-PRV-001. Recovery prefix PENDING CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-024-01.R01 | One recovery record per locked cycle version; at most one open recovery per cycle. | MVP |
| PS-024-01.R02 | Each party has at most one attestation per recovery; attestations are immutable once submitted. | MVP |
| PS-024-01.R03 | Attestation content is a closed enum (`gave_as_agreed`, `not_received`, `partly_received`, `not_given`, `other_with_code`) plus `claim_hash` binding. No free text. | MVP |
| PS-024-01.R04 | Compensation plan lists release actions per listing and slot status changes; no monetary amounts. | MVP |
| PS-024-01.R05 | Attestation bytes are stored as received; the parsed view is derived (CTR-SCH-001 R08). | MVP |

## Data / schema
```json
{
  "recovery_id": "rcv_<26> (PENDING prefix)",
  "cycle_id": "cyc_<26>",
  "cycle_version": "integer >= 1",
  "status": "enum(open, awaiting_attestations, compensating, closed_complete, closed_partial, escalated)",
  "window_ends_at": "timestamp",
  "attestations": "[{par_id, participant_ref: acc_, outcome: enum, claim_hash: sha256 hex, signature: ed25519 b64, received_revision}]",
  "plan": "[{listing_ref: lst_, action: enum(release, relist, hold), slot_index}]",
  "schema_version": "1.0.0"
}
```
Classes: attestations FINANCIAL_EVIDENCE for any value-bearing cycle, else PRIVATE_PERSONAL (signatures and counterparties); refs PSEUDONYMOUS.

## Commands / queries / events
Shapes in PS-024-04.

## Validation & errors
PS-024-02.

## Authorization
Party-scoped (PS-024-05).

## Failure, idempotency, concurrency, offline
Immutable attestations; plan versioned (PS-024-06).

## Privacy, retention, abuse
Retention RET-EVD (PS-024-07).

## Observability & budgets
Record ≤ 16 KB (ASSUMPTION).

## Tests
- TEST-PS-024-01-01 (unit): one open recovery per cycle.
- TEST-PS-024-01-02 (contract): attestation with free text is rejected.
- TEST-PS-024-01-03 (property): stored bytes equal received bytes.

## Acceptance criteria
1. Second open recovery for one cycle is refused.
2. Attestation outcomes outside the enum are rejected.
3. Stored attestation bytes are byte-identical to input.

## Assumptions & open decisions
- PROVISIONAL (D04 default, unapproved): per-party attestations; no atomic real-world guarantee.
- PROVISIONAL (D06 default, unapproved): signed statements only; verification separate.
