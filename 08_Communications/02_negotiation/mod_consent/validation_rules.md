# PS-062-02 — validation rules
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/02_negotiation/mod_consent. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-COM-001 (R04 quote validity), CTR-CAP-001, CTR-ID-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-062-02.R01 | `proposal_version` in request must equal current version; otherwise `CONSENT.STALE_VERSION`. | MVP |
| PS-062-02.R02 | `terms_digest` in request must equal the server-computed digest of the current terms. Mismatch → `CONSENT.TERMS_DIGEST_MISMATCH`. | MVP |
| PS-062-02.R03 | Consent to a cross-currency version requires `quote_id` with `now ≤ valid_until`; else `COM.QUOTE_EXPIRED` (CTR-COM-001). | MVP |
| PS-062-02.R04 | Non-participant slot → `SYS.NOT_FOUND`. | MVP |
| PS-062-02.R05 | Consent requires an explicit `scope` value; default values are rejected. | MVP |
| PS-062-02.R06 | Withdrawal rejected once the proposal reaches execution lock (`cyc_` lock event from F02.S03.M01). | MVP |

## Data / schema
Rule identifiers for `details[].rule`: `stale_version`, `digest_mismatch`, `quote_expired`, `scope_missing`, `scope_invalid`, `execution_locked`, `already_withdrawn`.

## Commands / queries / events
Validation precedes idempotency lookup for malformed input. Repeats of a committed key return the original record.

## States & transitions
Validation does not change state.

## Validation & errors
| Code | Retryable | Category / HTTP | message_key | Diagnostic |
|---|---|---|---|---|
| CONSENT.STALE_VERSION | false | conflict / 409 | err.consent.stale_version | current version number (not terms) |
| CONSENT.TERMS_DIGEST_MISMATCH | false | conflict / 409 | err.consent.terms_changed | rule only |
| CONSENT.SCOPE_INVALID | false | validation / 400 | err.consent.scope | field path |
| CONSENT.EXECUTION_LOCKED | false | unprocessable_state / 422 | err.consent.locked | state name |
| CONSENT.ALREADY_WITHDRAWN | false | conflict / 409 | err.consent.withdrawn | none |
| COM.QUOTE_EXPIRED | false | unprocessable_state / 422 | err.com.quote_expired | none (owned by CTR-COM-001) |
| SYS.NOT_FOUND | false | not_found / 404 | err.sys.not_found | none |

## Authorization
Party identity from the authenticated principal only; body `acc_` fields are ignored (CTR-CAP-001 R11).

## Failure, idempotency, concurrency, offline
Server re-runs R01–R03 at commit even for offline-queued consent (see [PS-062-06](failure_recovery_idempotency.md)).

## Privacy, retention, abuse
Diagnostics never include terms text, amounts or the counterparty ID.

## Observability & budgets
Counter `consent_validation_reject_total{code}`.

## Tests
- TEST-PS-062-02-01 (unit): each code in the table reachable.
- TEST-PS-062-02-02 (negative): version bumped by counterparty between view and consent → `CONSENT.STALE_VERSION`; no record written.
- TEST-PS-062-02-03 (negative): terms edited with same version number is impossible (version bump enforced) — assert digest check still rejects forged digest.
- TEST-PS-062-02-04 (time): consent at `valid_until + 1 ms` on cross-currency terms → `COM.QUOTE_EXPIRED`.

## Acceptance criteria
1. Stale or altered terms never produce a `given` record (TEST-PS-062-02-02, -03).
2. Quote-expiry rule matches CTR-COM-001 R04 (TEST-PS-062-02-04).

## Assumptions & open decisions
- ASSUMPTION: version numbers are integers starting at 1; each term edit increments.
- D03 (mixed currency valuation): PROVISIONAL (D03 default, unapproved) — pinned quote at consent.
