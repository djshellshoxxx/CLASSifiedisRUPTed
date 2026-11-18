# PS-107-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_opt. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-107-07.R01 | No pre-ticked consent. Each enable is a user action with the cell and wording shown. | MVP |
| PS-107-07.R02 | Withdrawal is as easy as enabling: one action in settings and one-click unsubscribe in every email. | MVP |
| PS-107-07.R03 | Unsubscribe links do not require login, do not reveal account existence, and show the same page for valid and invalid tokens. | MVP |
| PS-107-07.R04 | Email addresses are PRIVATE_PERSONAL and are read only by the email delivery module. | MVP |
| PS-107-07.R05 | Consent evidence retention follows F10 mod_consent; this module keeps cell state for RET-ACC. | MVP |

## Data / schema
| Field | Class | Retention |
|---|---|---|
| cell state, source, changed_at | PSEUDONYMOUS | RET-ACC |
| consent_ref | PSEUDONYMOUS (reference) | per F10 |
| token hash | SECRET | RET-SEC; purged 30 days after use or expiry |

## Commands / queries / events
No address or token in events (PS-107-04.R03).

## States & transitions
Account deletion revokes tokens and removes cells within deletion SLA.

## Validation & errors
Error responses for unsubscribe never reveal whether an account exists.

## Authorization
See authorization_capabilities.

## Failure, idempotency, concurrency, offline
Purge job idempotent.

## Privacy, retention, abuse
- Abuse: enumeration via unsubscribe tokens (tokens are 256-bit random, rate-limited 10 per IP-hash per minute).
- Abuse: forced subscription by third parties: email enable requires confirmation (R02 in workflow).
- Abuse: email scanners consuming tokens: GET is inert (PS-107-03.R04).
- Privacy: IP addresses used for rate limiting are not stored beyond RET-EPH 24 h.

## Observability & budgets
Token failure counts only.

## Tests
- TEST-PS-107-07-01 (contract): valid and invalid unsubscribe responses are byte-identical in body and status.
- TEST-PS-107-07-02 (integration): GET to unsubscribe URL leaves state unchanged.
- TEST-PS-107-07-03 (unit): default matrix has no `on` cell except inapp/security.
- TEST-PS-107-07-04 (integration): deletion removes cells and revokes tokens.

## Acceptance criteria
1. No pre-ticked consent in UI tests.
2. Indistinguishable unsubscribe responses.
3. Privacy Lead review pending (no audit claimed).

## Assumptions & open decisions
- ASSUMPTION: 256-bit token, 10 requests per minute per hashed source.
- D07 PROVISIONAL (D07 default, unapproved).
