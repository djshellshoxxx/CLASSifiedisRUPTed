# PS-068-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_crypto (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R01–R08), CTR-COM-001 (Authorization), CTR-PRV-001 (R07). **Decisions:** D09 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-068-05.R01 | Parties submit, attest and dispute on-chain claims (`participant` scope). | MVP |
| PS-068-05.R02 | Adapters act as `sys_` with a per-chain, verification-only grant; the grant has no write access to claim fields other than state transitions in PS-068-03. | MVP |
| PS-068-05.R03 | Registry writes require `chain_adapter.administer` with two distinct `ope_` approvers. | MVP |
| PS-068-05.R04 | Adapter may not verify claims whose method is not `onchain_transfer` (`COM.CASH_NOT_VERIFIABLE` for cash). | MVP |
| PS-068-05.R05 | No principal can create, sign, move or release funds. This is not a grantable capability. | MVP |

## Data / schema
Capability IDs: `chain_adapter.administer`, `adapter.verify`, `adapter.finality`, `adapter.reorg`, `clm.submit`, `clm.attest`, `clm.dispute`.

## Commands / queries / events
| Command | Action | Actor |
|---|---|---|
| `clm.submit` | `clm.propose` | party |
| `clm.attest` | `clm.attest` | counterparty |
| `adapter.verify` / `finality` / `reorg` | `clm.execute` | `sys_` (scope: one claim) |
| `chain_adapter.register` | `chain_adapter.administer` | `ope_` ×2 |

## States & transitions
Adapter grants expire at most 72 h after issue and are renewed by operator approval (CTR-CAP-001 R06).

## Validation & errors
Unauthorized adapter call: `SYS.FORBIDDEN`. Non-party claim access: `SYS.NOT_FOUND`.

## Authorization
Field visibility of `raw_digest` and `block_height`: parties and case moderators only; adapters write them.

## Failure, idempotency, concurrency, offline
Revoked adapter grant blocks the next call; in-flight verifications finish or fail with `COM.VERIFIER_UNAVAILABLE`.

## Privacy, retention, abuse
Registry changes and grants emit `aud_` records.

## Observability & budgets
Alert on any adapter call outside its granted claim scope.

## Tests
- TEST-PS-068-05-01 (unit): matrix rows.
- TEST-PS-068-05-02 (negative): adapter grant used for a different claim returns `SYS.FORBIDDEN`.
- TEST-PS-068-05-03 (negative): single operator cannot register an adapter (`CAP.SELF_APPROVAL_FORBIDDEN`).
- TEST-PS-068-05-04 (lint): no capability named like transfer, sign or release exists.

## Acceptance criteria
1. Matrix matches implementation.
2. Adapter scope enforced per claim.
3. No funds-moving capability exists.

## Assumptions & open decisions
- ASSUMPTION: adapter grant maximum 72 h.
- D09 (PROVISIONAL default, unapproved).
