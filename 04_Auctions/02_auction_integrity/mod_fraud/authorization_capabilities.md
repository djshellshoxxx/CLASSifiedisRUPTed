# PS-037-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_fraud. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ID-001, CTR-PRV-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-037-05.R01 | Capability IDs match `^[a-z_]{2,24}\.[a-z_]{2,24}$`: `fraud.record`, `fraud.review`, `fraud.decide`, `fraud.escalate`, `fraud.read_aggregate`, `fraud.read_own_outcome`. | MVP |
| PS-037-05.R02 | Default deny. No actor may read another account's signal detail. | MVP |
| PS-037-05.R03 | A moderator cannot hold `fraud.review` on an auction where they have a role (PS-037-03 R02). | MVP |
| PS-037-05.R04 | Operators receive `fraud.read_aggregate` only; aggregates contain no account or bid IDs. | MVP |

## Data / schema
Grant records per CTR-CAP-001 (`grt_` prefix). Scope field: `case` or `auction` for moderators.

## Commands / queries / events
Each command checks one capability before validation (PS-037-02).

## States & transitions
Grant states follow CTR-CAP-001 (active, revoked). Revocation during UNDER_REVIEW releases the claim (PS-037-03).

## Validation & errors
Missing capability: `CAP.DENIED`. Scope mismatch: `CAP.SCOPE_MISMATCH`.

## Authorization
| Actor | Action | Resource | Capability |
|---|---|---|---|
| sys (bid-stream service) | record signal | FraudSignal | fraud.record |
| mod (F12) | claim, read case | FraudCase (case scope) | fraud.review |
| mod (F12 with decide grant) | dismiss, uphold | FraudCase | fraud.decide |
| mod (F12 lead) | escalate, resolve | FraudCase | fraud.escalate |
| ope | read counts | aggregate | fraud.read_aggregate |
| bidder or seller (acc_) | read own outcome | own case result | fraud.read_own_outcome |
| any other | any | any | deny |

Appellant sees: rule_id, rule_version, decision, date. Never: other accounts, scores, features.

## Failure, idempotency, concurrency, offline
Grant checks are synchronous; cache TTL for grants <= 60 s, revocation invalidates cache.

## Privacy, retention, abuse
Operator access to signal-level detail requires dual control (ASSUMPTION, CTR-CAP-001 R07). Access logs record actor ID and case ID.

## Observability & budgets
Count denials by capability. Alert on any denial spike > 10x baseline.

## Tests
- TEST-PS-037-05-01 (negative): each actor-action pair in the table tested for allow and deny.
- TEST-PS-037-05-02 (conflict): moderator with bidder role on same auction is denied claim.
- TEST-PS-037-05-03 (revocation): revoked grant blocks the next command within 60 s.

## Acceptance criteria
1. Every command maps to exactly one capability.
2. No response to any non-F12 actor contains other accounts' identifiers.
3. Conflict and revocation tests pass.

## Assumptions & open decisions
- ASSUMPTION: moderator decide and escalate capabilities are separate grants.
- PROVISIONAL (no Dxx): operator aggregate access requires no dual control.
