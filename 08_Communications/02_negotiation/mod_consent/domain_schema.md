# PS-062-01 — domain schema
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/02_negotiation/mod_consent. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001 (`cns_` PENDING registry entry), CTR-EVT-001, CTR-COM-001 (quote binding, R04), CTR-PRV-001, CTR-SCH-001

**Canonical owner (B-06):** `cns_` record class (agreement to one proposal version) is owned by **F08.S02.M02** (this module). PROVISIONAL, unapproved. Consumers reference by full ID: F02.S03.M01 cycle execution. Privacy consent (F10.S01.M01) is a different record class and is not `cns_`.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-062-01.R01 | A consent record binds one party slot (`acc_`), one proposal (`cyc_` or `ofr_`), one `proposal_version` integer and one `terms_digest` (SHA-256 of JCS terms). | MVP |
| PS-062-01.R02 | At most one `given` record per (proposal, slot, version). | MVP |
| PS-062-01.R03 | Consent scope enum: `participate`, `accept_offer`, `accept_compensation`. A record carries exactly one scope. | MVP |
| PS-062-01.R04 | Cross-currency terms carry `quote_id` (`qte_`) valid at `given_at` (CTR-COM-001 R04). | MVP |
| PS-062-01.R05 | Consent is never inferred from read, view, reply or silence. | MVP |
| PS-062-01.R06 | Records are append-only; withdrawal creates a new record that references the prior `cns_`. | MVP |

## Data / schema
```json
{"consent_id":"cns_…","proposal_ref":"cyc_…|ofr_…","slot":"par_…|null","party":"acc_…","scope":"participate|accept_offer|accept_compensation","proposal_version":3,"terms_digest":"64 hex","quote_id":"qte_…|null","state":"given|declined|withdrawn|superseded|expired","given_at":"RFC3339 ms Z","effective_until":"RFC3339 ms Z (≤ proposal expiry, ≤ 14 d)","supersedes_id":"cns_…|null","schema_version":"1.0.0"}
```
Data classes: `party`, `proposal_ref` PSEUDONYMOUS; `terms_digest` PSEUDONYMOUS; amounts are not stored here (referenced via `ofr_`/`qte_`, FINANCIAL_EVIDENCE).

## Commands / queries / events
See [PS-062-04](commands_queries_events.md). Schema IDs `consent.v1`.

## States & transitions
See [PS-062-03](workflow_state_machine.md).

## Validation & errors
See [PS-062-02](validation_rules.md). Error slug `CONSENT`.

## Authorization
Party-only writes ([PS-062-05](authorization_capabilities.md)).

## Failure, idempotency, concurrency, offline
Version binding is the defense against stale consent (see [PS-062-06](failure_recovery_idempotency.md)).

## Privacy, retention, abuse
Consent evidence is RET-EVD (24 months after final state). Personal fields redacted after 12 months while digests remain (CTR-PRV-001 RET-EVD). See [PS-062-07](privacy_retention_abuse.md).

## Observability & budgets
Count records by `state` and `scope` only.

## Tests
- TEST-PS-062-01-01 (unit): schema rejects two `given` records for same (proposal, slot, version).
- TEST-PS-062-01-02 (unit): scope outside enum rejected.
- TEST-PS-062-01-03 (property): records never update in place; every change appends.

## Acceptance criteria
1. TEST-PS-062-01-01 to -03 pass.
2. A `given` record can always be traced to a `terms_digest` and version.

## Assumptions & open decisions
- ASSUMPTION: `effective_until` default = proposal expiry, capped at 14 days.
- PENDING CTR-ID-001 registry entry for `cns_` (proposed class: ulid; owner F08).
- D04 (partial barter execution): PROVISIONAL (D04 default, unapproved). Consent is per party, not atomic across parties.
