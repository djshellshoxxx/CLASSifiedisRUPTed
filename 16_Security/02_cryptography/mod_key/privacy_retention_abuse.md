# PS-128-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_key (F16.S02.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-128-07.R01 | User private keys are generated and kept on user devices (or user-held hardware) only. The platform holds no user private key and no escrow (D10 PROVISIONAL default). | MVP |
| PS-128-07.R02 | Public keys are PSEUDONYMOUS class; they are linkable within a pseudonym and not to legal identity. | MVP |
| PS-128-07.R03 | Key records retention: active and revoked records kept for the life of the owner account plus 12 months for audit (RET-AUD); public keys already published to peers are not recalled. | MVP |
| PS-128-07.R04 | Per-audience pseudonymity: federation exports use per-audience key references where the contract allows (CTR-FED-001). | MVP |
| PS-128-07.R05 | Enumeration and graph-linking abuse: `key.list` rate-limited; no bulk public-key export to unauthenticated clients. | MVP |

## Data / schema
Retention class RET-ACC for active records, RET-AUD for revoked records.

## Commands / queries / events
None beyond PS-128-04.

## States & transitions
Expiry per PS-128-03.

## Validation & errors
`KEY.PRIVATE_MATERIAL_REJECTED` (PS-128-02).

## Authorization
Per PS-128-05.

## Failure, idempotency, concurrency, offline
Not applicable beyond PS-128-06.

## Privacy, retention, abuse
Sybil risk: many keys per owner are capped (PS-128-01 R05); graph deanonymization via key reuse across purposes is prevented by one key per purpose; threat model entries are in RISK_REGISTER (OPEN link).

## Observability & budgets
No key material in metrics or logs; fingerprints allowed in audit logs only.

## Tests
- TEST-PS-128-07-01 (lint): no schema field can hold private key material.
- TEST-PS-128-07-02 (negative): unauthenticated bulk key request refused.
- TEST-PS-128-07-03 (privacy): same key used across two purposes refused.
- TEST-PS-128-07-04 (retention): revoked record kept 12 months after account deletion.

## Acceptance criteria
1. Zero platform-held user private keys (TEST-01 and architecture review).
2. TEST-PS-128-07-01 through -04 pass.

## Assumptions & open decisions
- PROVISIONAL (D10 default, unapproved): user-controlled keys with documented recovery.
- OPEN (D05, D07): retention and linkage rules interact with location and identity modules.
