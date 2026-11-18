# PS-062-07 — privacy retention abuse
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/02_negotiation/mod_consent. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (RET-EVD, R12), CTR-CAP-001 (R13 decision records), CTR-EVT-001 (R06)

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-062-07.R01 | Consent records are RET-EVD: 24 months after final state; personal fields (party `acc_` linkage kept as hash) redacted after 12 months. | MVP |
| PS-062-07.R02 | Consent is an explicit action with the full terms visible on the same screen; no pre-checked controls (dark-pattern ban). | MVP |
| PS-062-07.R03 | Consent records never enter push previews, analytics or federation. | MVP |
| PS-062-07.R04 | Rate limit: ≤ 30 consent commands per account per hour (ASSUMPTION) to limit scripted acceptance. | MVP |
| PS-062-07.R05 | Coercion risk: a party cannot give consent on another party's behalf; the proposal owner cannot pre-fill consent. | MVP |

## Data / schema
Classes: `party`, `slot`, `proposal_ref` PSEUDONYMOUS; `terms_digest` PSEUDONYMOUS; `quote_id` FINANCIAL_EVIDENCE (referenced, not copied).

## Commands / queries / events
Events carry IDs and states only (see [PS-062-04](commands_queries_events.md)).

## States & transitions
Retention: `active` → `final` (terminal consent state) → `redacted_personal` (12 months) → `expired` (24 months). `legal_hold` overrides (CTR-PRV-001 R07).

## Validation & errors
Rate-limit error: `CONSENT.RATE_LIMITED` (rate_limited / 429, retryable, `retry_after_ms`).

## Authorization
See [PS-062-05](authorization_capabilities.md). Data export gives each party their own consent history only.

## Failure, idempotency, concurrency, offline
Redaction job is idempotent; re-run leaves digests in place.

## Privacy, retention, abuse
Threats: (1) proposal owner pressuring acceptance; (2) scripted mass acceptance; (3) consent records used to link a party's pseudonym to a specific proposal in public views (not displayed, R03); (4) forged consent via replay (version and digest binding, PS-062-02). Residual risk: an observer with access to terms can infer participation; documented, not mitigated in MVP.

## Observability & budgets
Metrics: `consent_rate_limited_total`. No per-party labels.

## Tests
- TEST-PS-062-07-01 (UI, a11y): consent control unchecked by default; terms and action on one screen; keyboard operable.
- TEST-PS-062-07-02 (privacy): push and analytics fixtures contain no consent records.
- TEST-PS-062-07-03 (retention): at 12 months personal link redacted; digest unchanged.
- TEST-PS-062-07-04 (abuse): 31st command in an hour → `CONSENT.RATE_LIMITED`.

## Acceptance criteria
1. No consent record appears in non-owner-visible or analytics data (TEST-PS-062-07-02).
2. Redaction schedule holds (TEST-PS-062-07-03).

## Assumptions & open decisions
- D07 (retention): PROVISIONAL (D07 default, unapproved).
- ASSUMPTION: consent evidence RET-EVD (not RET-PRIV) because it evidences agreement.
- Privacy consent under F10.S01.M01 is out of scope here (different record class).
