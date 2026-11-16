# PS-005-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_giveaway. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (envelope, revision, idempotency), CTR-SCH-001 (versions), CTR-ERR-001 (envelope), CTR-CAP-001 (verbs). PENDING CTR-LST-001 (F01 reserve/reopen commands).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-005-04.R01 | Every state-changing command takes `idempotency_key` (16–128 chars) and `expected_revision` (integer ≥ 1). | MVP |
| PS-005-04.R02 | Every command returns the new `revision` and `state`, or a typed error. Responses carry no claimant contact data. | MVP |
| PS-005-04.R03 | Each event envelope uses `aggregate_type = giveaway_claim` and `event_type` per CTR-EVT-001 R10. | MVP |
| PS-005-04.R04 | Queries are paginated (limit ≤ 50) and return only fields allowed by PS-005-05 visibility. | MVP |
| PS-005-04.R05 | Events carry no payload field beyond state, reason_code, revision, ids and timestamps. `max_data_class` = PRIVATE_PERSONAL. | MVP |
| PS-005-04.R06 | Commands are versioned `v1`; a breaking change is a new MAJOR (CTR-SCH-001 R03). | MVP |

## Data / schema
Command request (example, submit):
```json
{"command":"giveaway.claim.submit","version":"v1","listing_id":"lst_01HZX3M0J4R8S2A6C9E3F5G7H1","pickup_region":"cell_R07","idempotency_key":"k7Qp2mWx9LbT4vHc"}
```
Response: `{"claim_id":"gcl_<26>","state":"SUBMITTED","revision":1}`.

## Commands / queries / events
| Name | Actor | Input | Emits / returns |
|---|---|---|---|
| giveaway.claim.submit | acc (not giver) | listing_id, pickup_region?, key | `giveaway_claim.submitted` |
| giveaway.claim.withdraw | claimant | claim_id, expected_revision, key | `giveaway_claim.withdrawn` |
| giveaway.claim.accept | giver | claim_id, expected_revision, key | `giveaway_claim.accepted`, `giveaway_claim.rejected` (others) |
| giveaway.claim.reject | giver | claim_id, expected_revision, key | `giveaway_claim.rejected` |
| giveaway.claim.rescind | giver | claim_id, expected_revision, key | `giveaway_claim.withdrawn` |
| giveaway.claim.record_handover | giver | claim_id, expected_revision, key | `giveaway_claim.handover_recorded` |
| giveaway.claim.confirm_receipt | claimant | claim_id, expected_revision, key | `giveaway_claim.receipt_confirmed` |
| giveaway.claim.expire (timer) | sys | claim_id | `giveaway_claim.expired` / `closed_unconfirmed` |
| giveaway.claim.get | claimant or giver | claim_id | claim view |
| giveaway.claim.list_for_listing | giver | listing_id, cursor, limit ≤ 50 | claim views (pseudonymous) |
| giveaway.claim.list_mine | claimant | cursor, limit ≤ 50 | own claims |

Events (CTR-EVT-001 envelope): `giveaway_claim.submitted`, `.withdrawn`, `.accepted`, `.rejected`, `.expired`, `.handover_recorded`, `.receipt_confirmed`, `.closed_unconfirmed`. Each event payload uses schema `giveaway_claim.<event>` v1.0.0.

## States & transitions
Command effects are defined in [workflow_state_machine](workflow_state_machine.md). Commands not in the table above do not exist.

## Validation & errors
Input rules: [validation_rules](validation_rules.md). Error codes: GIVE.* (PS-005-02, PS-005-03) plus `EVT.REVISION_CONFLICT`, `EVT.IDEMPOTENCY_KEY_REUSED`, `SYS.*`.

## Authorization
Every command checks capability `giveaway_claim.<verb>` ([authorization_capabilities](authorization_capabilities.md)) before validation of state.

## Failure, idempotency, concurrency, offline
Idempotency scope and retention per CTR-EVT-001 R03. Detailed in [failure_recovery_idempotency](failure_recovery_idempotency.md).

## Privacy, retention, abuse
Events are immutable; purge uses redaction per CTR-EVT-001 R08 ([privacy_retention_abuse](privacy_retention_abuse.md)).

## Observability & performance
Command p95 ≤ 400 ms server-side (ASSUMPTION). Event lag to F01 and F13 consumers p95 ≤ 60 s (ASSUMPTION).

## Tests
- TEST-PS-005-04-01: schema fixtures for each event and command (valid/invalid).
- TEST-PS-005-04-02: pagination limit enforced at 50 and cursor stable under insert.
- TEST-PS-005-04-03: event envelope passes CTR-EVT-001 validation with no forbidden fields.

## Acceptance criteria
1. Every command in the table has an idempotency key and revision check.
2. No event or response contains names, emails, coordinates or free text.
3. Unknown command versions return `SCH.UNKNOWN_VERSION`.

**Assumptions and open decisions:** F01 reserve/reopen command names are PENDING CTR-LST-001. D06 (PROVISIONAL default: signed statements only, unapproved) governs record_handover and confirm_receipt semantics. See [DECISIONS.md](../../../DECISIONS.md).
