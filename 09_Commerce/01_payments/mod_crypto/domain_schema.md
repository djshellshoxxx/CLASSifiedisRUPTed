# PS-068-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_crypto (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (claim external_ref, currency, R01, R09–R11), CTR-ID-001, CTR-PRV-001, CTR-SCH-001. **Pending:** `chn` adapter prefix and `cur_` (PENDING prefix) asset prefix (CTR-ID-001). **Decisions:** D03, D09 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-068-01.R01 | `chain` values are CAIP-2 (`^[-a-z0-9]{3,8}:[-_a-zA-Z0-9]{1,32}$`); `asset` values are CAIP-19. | MVP |
| PS-068-01.R02 | Adapter record holds a public verification key, never a signing key for funds. | MVP |
| PS-068-01.R03 | Verification record stores raw-response SHA-256, adapter ID, observed block height and timestamp. | MVP |
| PS-068-01.R04 | Chain entries include a finality threshold (integer confirmations, PROVISIONAL) and status `enabled`, `disabled`. | MVP |
| PS-068-01.R05 | No schema contains wallet, seed, private key, balance or platform address (CTR-COM-001 R01). | MVP |

## Data / schema
| Field | Type / constraint | Class |
|---|---|---|
| `chain_id` | CAIP-2 string | PUBLIC |
| `adapter_id` | `chn_` ID (PENDING) | PUBLIC |
| `adapter_pubkey` | Ed25519 public key, base64, 44 chars | PUBLIC |
| `finality_confirmations` | integer 1–10000 (ASSUMPTION range) | PUBLIC |
| `asset_id` | CAIP-19, unique per chain | PUBLIC |
| `asset_exponent` | integer 0–18 | PUBLIC |
| `verification.raw_digest` | SHA-256 hex | FINANCIAL_EVIDENCE |
| `verification.block_height` | integer ≥ 0 | FINANCIAL_EVIDENCE |
| `verification.observed_at` | RFC 3339 UTC | FINANCIAL_EVIDENCE |

External addresses and tx hashes are carried in the claim `external_ref` (CTR-COM-001) and classed FINANCIAL_EVIDENCE.

## Commands / queries / events
Specified in PS-068-04.

## States & transitions
Adapter: `enabled` ↔ `disabled` (PS-068-03).

## Validation & errors
See PS-068-02.

## Authorization
Registry reads are public; writes are operator-only (PS-068-05).

## Failure, idempotency, concurrency, offline
Verification records are append-only.

## Privacy, retention, abuse
Public chain data is out of the platform's control; account linkage is PSEUDONYMOUS at most (CTR-COM-001 Privacy).

## Observability & budgets
Gauge: enabled adapters by chain.

## Tests
- TEST-PS-068-01-01 (unit): CAIP-2 and CAIP-19 patterns accept and reject golden strings.
- TEST-PS-068-01-02 (lint): custody lint over all crypto schemas (CTR-COM-001 test 02).
- TEST-PS-068-01-03 (unit): exponent outside 0–18 rejected.

## Acceptance criteria
1. Every field classed once.
2. No signing key for funds in any schema.
3. CAIP patterns match CTR-COM-001.

## Assumptions & open decisions
- ASSUMPTION: confirmation range 1–10000.
- D09 (PROVISIONAL default, unapproved): no custody.
- D03 (PROVISIONAL default, unapproved): integer minor units for asset amounts.
