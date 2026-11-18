# PS-129-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_management. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-FED-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-129-07.R01 | All stored fields are class PUBLIC; any field above PUBLIC fails lint `PRV.UNCLASSIFIED_FIELD` or `MGMT.POLICY_INVALID` with `rule = class_not_public`. | MVP |
| PS-129-07.R02 | Policy records never contain key material, passphrases or device identifiers. | MVP |
| PS-129-07.R03 | Proposal rate ≤ 5 per `ope` per 24 h (ASSUMPTION). | MVP |
| PS-129-07.R04 | Policy documents exported to peers are signed (CTR-EVT-001 R05). | MVP |
| PS-129-07.R05 | Downgrade guard: a new active policy may not remove a suite that is still in use for verification of retained signatures before its `retired` date. | MVP |

## Data / schema
Only `crypto_policy` and suite registry fields in [domain_schema.md](domain_schema.md). No personal data.

## Commands / queries / events
Events carry `actor_ref` = `ope_` only.

## States & transitions
Retention class changes only at `retired`, after which records remain as governance history (ASSUMPTION).

## Validation & errors
Downgrade attempt: `MGMT.ALGORITHM_DEPRECATED`. Rate limit: `SYS.RATE_LIMITED` with `retry_after_ms`.

## Authorization
Insider collusion is limited by dual control (PS-129-05.R02). Disclosure of policy is not restricted.

## Failure, idempotency, concurrency, offline
N/A beyond [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
- Retention: policy and approval records retained indefinitely as public governance records (ASSUMPTION; D07 default).
- Abuse: compromised `ope` account can propose but cannot activate alone; alerts on unusual proposal volume.
- Pseudonymity: approver identities are pseudonymous and linkable only by F07 under CTR-CAP-001 rules.

## Observability & budgets
Logs record `policy_id`, event type, approver IDs. Never log policy bodies beyond IDs.

## Tests
- TEST-PS-129-07-01: unit, lint rejects any non-PUBLIC field.
- TEST-PS-129-07-02: negative, downgrade proposal denied.
- TEST-PS-129-07-03: abuse, 6th proposal in 24 h rate-limited.

## Acceptance criteria
1. Zero non-PUBLIC fields in registry.
2. Downgrade fixtures all rejected.
3. Rate-limit fixture returns 429 with `retry_after_ms`.

## Assumptions & open decisions
- ASSUMPTION: 5 proposals per 24 h.
- D07 (retention): PROVISIONAL (D07 default, unapproved).
