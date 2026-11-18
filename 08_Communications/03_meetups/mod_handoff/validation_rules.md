# PS-065-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_handoff. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-COM-001 (R14 signature pattern), CTR-PRV-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-065-02.R01 | Attesting party must be one of the two exchange parties (`party_a` or `party_b`) and must not be the same `prf_` for both directions on one item. | MVP |
| PS-065-02.R02 | `item_ref` must belong to the referenced exchange and be in the exchange's agreed item list. | MVP |
| PS-065-02.R03 | `quantity` ≤ agreed quantity minus already-attested quantity for the same direction and item. | MVP |
| PS-065-02.R04 | `attested_at` is server time; client time is accepted only within ±5 min for display and is never stored as truth. | MVP |
| PS-065-02.R05 | Attestation submitted after `window_closes_at` is rejected. Window = 24 h after meetup `window_end` or exchange completion (ASSUMPTION). | MVP |
| PS-065-02.R06 | Signature must verify against the attesting party's registered key at `attested_at`. | MVP |
| PS-065-02.R07 | Free-text notes are not accepted in MVP. | MVP |

## Data / schema
Maps to [domain_schema.md](domain_schema.md).

## Commands / queries / events
Applies to `OpenHandoff`, `AttestHandoff`, `WithdrawAttestation`, `RaiseHandoffDispute`.

## States & transitions
Validation precedes state change.

## Validation & errors
| Code | `retryable` | `message_key` | `details[].rule` |
|---|---|---|---|
| `HANDOFF.PARTY_NOT_ALLOWED` | false | `err.handoff.party_not_allowed` | `party` |
| `HANDOFF.ITEM_NOT_IN_EXCHANGE` | false | `err.handoff.item_not_in_exchange` | `item` |
| `HANDOFF.QUANTITY_EXCEEDED` | false | `err.handoff.quantity_exceeded` | `quantity` |
| `HANDOFF.WINDOW_CLOSED` | false | `err.handoff.window_closed` | `window` |
| `HANDOFF.ALREADY_ATTESTED` | false | `err.handoff.already_attested` | `duplicate` |
| `HANDOFF.SIGNATURE_INVALID` | false | `err.handoff.signature_invalid` | `signature` |
| `HANDOFF.KEY_UNKNOWN` | true | `err.handoff.key_unknown` | `key_ref` |

## Authorization
Validation does not authorize; PS-065-05 runs first.

## Failure, idempotency, concurrency, offline
Deterministic for same inputs and exchange snapshot. `KEY_UNKNOWN` retryable after key registry sync.

## Privacy, retention, abuse
Errors never echo quantities, item names or signatures beyond rule enum.

## Observability & budgets
`handoff_validation_fail_total{code}`; p95 ≤ 10 ms.

## Tests
- TEST-PS-065-02-01 (unit): one fixture per code.
- TEST-PS-065-02-02 (negative): attestation after window rejected.
- TEST-PS-065-02-03 (negative): quantity over agreed amount rejected.
- TEST-PS-065-02-04 (privacy): error bodies contain no item names or values.

## Acceptance criteria
1. Every rule has a code and test.
2. Window enforced server-side.
3. Only exchange parties attest.
4. No free-text field accepted.

## Assumptions & open decisions
- ASSUMPTION: 24-hour attestation window; ±5 min client clock tolerance.
- PROVISIONAL (D04 default, unapproved): per-party attestations.
