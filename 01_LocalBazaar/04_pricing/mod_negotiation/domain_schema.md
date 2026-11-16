# PS-010-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/04_pricing/mod_negotiation. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001 (`neg_` prefix PENDING registration), CTR-EVT-001, CTR-SCH-001, CTR-PRV-001, CTR-COM-001 (amount, currency, quote, method shapes), CTR-CAP-001.

**Decision labels:** Integer minor units and pinned quotes are PROVISIONAL (D03 default, unapproved). Ulid class for `neg_` is ASSUMPTION.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-010-01.R01 | One `negotiation` record per (`lst_` listing, initiator `acc_`) while active. Holds listing ID, listing version snapshot, initiator, seller, state, round (1–10), current terms, last proposer, response deadline, expiry, aggregate revision. | MVP |
| PS-010-01.R02 | `seller_id` is the listing owner `acc_` at open. Immutable. Listing ownership transfer does not rewrite it. | MVP |
| PS-010-01.R03 | Terms are immutable. Each round appends one terms record. No in-place terms edit. Terms identity is `terms_hash`. | MVP |
| PS-010-01.R04 | No free-text field exists in the record or in any terms record. Notes go to a message thread (`thr_`, F08). | MVP |
| PS-010-01.R05 | No location, street address, contact detail, device identifier, platform account, wallet or balance field (CTR-COM-001 R01; CTR-PRV-001 R03). | MVP |
| PS-010-01.R06 | Record data class is PSEUDONYMOUS (maximum). Negotiated amounts are commercial terms, not FINANCIAL_EVIDENCE. ASSUMPTION; F10 review required per CTR-SCH-001 R10. | MVP |

## Data / schema
Closed JSON object (`additionalProperties: false`). Owner: this module. Registry entry: `negotiation`, schema version 1.0.0.

```
negotiation {
  negotiation_id   string  ^neg_[0-9A-HJKMNP-TV-Z]{26}$        (ulid class, ASSUMPTION)
  listing_id       string  ^lst_[0-9A-HJKMNP-TV-Z]{26}$
  listing_version  integer >= 1                                  (listing revision at open; immutable)
  initiator_id     string  ^acc_...$                             (immutable)
  seller_id        string  ^acc_...$                             (immutable, R02)
  state            enum    AWAITING_RESPONSE|AGREED|REJECTED|WITHDRAWN|EXPIRED|VOIDED
  round            integer 1..10
  terms            Terms   (current round)
  last_proposer_id string  ^acc_...$
  response_deadline date-time
  expires_at       date-time                                     (open + 14 d max, ASSUMPTION)
  terminal_reason  null | agreed | rejected | withdrawn | expired | listing_voided
  revision         integer >= 1                                  (CTR-EVT-001 R02)
  schema_version   const "1.0.0"
}
Terms {
  amount_minor  string  ^(0|[1-9][0-9]{0,38})$, value > 0         (CTR-COM-001 R02)
  currency      object  CTR-COM-001 currency {kind, code, exponent}
  quote_id      string|null  qte_ ID; required if currency != listing currency
  method_hint   enum    CTR-COM-001 method set; hint only, never evidence
  terms_hash    string  64 hex, SHA-256 of JCS(Terms without terms_hash)
  round         integer 1..10
  proposed_by   string  ^acc_...$
}
```

Provenance per terms record: `source_kind` (`local_input` | `offline_replay`), `listing_version_seen`.

## Commands / queries / events
Event payloads are validated against this schema. Event types and command contracts: [PS-010-04](commands_queries_events.md).

## States & transitions
Defined in [PS-010-03](workflow_state_machine.md). `state` and `terminal_reason` must agree (`AGREED` ↔ `agreed`, etc.).

## Validation & errors
Field-level rules and error codes: [PS-010-02](validation_rules.md).

## Authorization
Record access follows participant scope only. Field visibility: [PS-010-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
- Persistence is append-only for terms and events. A state change and its event commit in one transaction.
- Uniqueness of active (listing, initiator) pairs is a storage constraint, not an application check alone (see [PS-010-06](failure_recovery_idempotency.md)).

## Privacy, retention, abuse
Data class and retention: [PS-010-07](privacy_retention_abuse.md). Pseudonym views (`prf_`) are presentation only; the record stores `acc_` IDs.

## Observability & budgets
Record counts per state exported as gauges (no IDs). See [PS-010-08](observability_performance.md).

## Tests
- TEST-PS-010-01-01 (schema): valid record and terms validate; float amount, extra field and free-text field rejected.
- TEST-PS-010-01-02 (lint): every field has one CTR-PRV-001 class; no forbidden field class exists in the schema.
- TEST-PS-010-01-03 (hash): `terms_hash` is stable under key reordering (JCS); any amount or currency change alters it.
- TEST-PS-010-01-04 (ID): lowercase body normalizes; `lst_` or `acc_` in a `neg_` slot returns `ID.PREFIX_MISMATCH`.

## Acceptance criteria
1. Schema validates with `additionalProperties: false` at every level.
2. Forbidden field classes absent (TEST-PS-010-01-02).
3. `neg_` registration is recorded as PENDING CTR-ID-001 until the registry change lands.
4. TEST-PS-010-01-01 through -04 pass in CI.

## Assumptions & open decisions
- PENDING CTR-ID-001: `neg` prefix (ulid, owner F01) not yet in the registry.
- PROVISIONAL (D03 default, unapproved): integer minor units, pinned quote for cross-currency terms.
- ASSUMPTION: negotiated amounts classed PSEUDONYMOUS; F10 review pending.
- OPEN (D04): in-kind compensation is valued only through `method_hint` and `currency`; no partial barter execution is modeled.
- Related: D05 (no location in terms), D07 (retention, PS-010-07).
