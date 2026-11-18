# PS-131-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_incident. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-EVT-001, CTR-SCH-001, CTR-CAP-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-131-01.R01 | One `security_incident` record per confirmed or suspected security event; closed status set. | MVP |
| PS-131-01.R02 | `severity` is one of SEV1–SEV4; SEV1 and SEV2 require named incident commander (`ope_`). | MVP |
| PS-131-01.R03 | `affected_scope` stores data classes and counts only, never record IDs of individuals or precise locations. | MVP |
| PS-131-01.R04 | Timeline is append-only; each entry hashes the previous entry (SHA-256 chain). | MVP |
| PS-131-01.R05 | Notification obligations are tracked as separate rows with jurisdiction code and deadline; deadlines are not computed until legal review (CTR-PRV-001 R07, OPEN). | MVP |

## Data / schema
```json
{
  "incident_id": "inc_<26 Crockford base32> (PENDING CTR-ID-001 prefix, proposed inc, class ulid)",
  "status": "detected | triaged | contained | eradicated | recovered | closed | reopened",
  "severity": "SEV1 | SEV2 | SEV3 | SEV4",
  "category": "credential_compromise | key_exposure | data_exposure | integrity_fault | availability | abuse_campaign | supply_chain",
  "detected_at": "RFC 3339 UTC",
  "declared_at": "RFC 3339 UTC",
  "commander": "ope_...",
  "affected_scope": {"data_classes": ["PRIVATE_PERSONAL"], "approx_subject_count": "integer, bucketed to 10"},
  "linked_threats": ["threat_id per mod_threats"],
  "timeline_head": "sha256 hex",
  "notifications": [{"jurisdiction": "ISO 3166-1 alpha-2", "obligation": "string", "deadline": "date | null", "status": "pending | sent | waived"}],
  "revision": "integer"
}
```
- `approx_subject_count` is bucketed (0, 1–9, 10–99, 100+) to avoid precise exposure metrics (ASSUMPTION).
- Timeline text is classed PRIVATE_PERSONAL at most; free text is validated by [validation_rules.md](validation_rules.md).

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
Read restricted to `case:` scope for incident responders and `global` scope for F16 leads (CTR-CAP-001 R04).

## Failure, idempotency, concurrency, offline
Revision per record (CTR-EVT-001 R02). Timeline hash chain verified on read of closed incidents.

## Privacy, retention, abuse
Affected-scope fields are PRIVATE_PERSONAL at most. No PII in timeline unless classified PRIVATE_PERSONAL and access-restricted.

## Observability & budgets
Gauge `incident_open_total{severity}`.

## Tests
- TEST-PS-131-01-01: unit, bucket function for counts.
- TEST-PS-131-01-02: unit, timeline hash chain detects edit of one entry.

## Acceptance criteria
1. No schema field stores an individual record ID.
2. Timeline chain verifies on 100% of closed fixtures.

## Assumptions & open decisions
- ASSUMPTION: 10-subject buckets and jurisdiction codes.
- PENDING CTR-ID-001: prefix `inc`.
- D07 (retention, legal holds): PROVISIONAL (D07 default, unapproved).
