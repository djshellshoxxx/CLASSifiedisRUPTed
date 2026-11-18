# PS-071-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_receipts (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R02–R04, R07, R08, R14), CTR-ERR-001, CTR-PRV-001 (R03). **Decisions:** D06 (PROVISIONAL default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-071-02.R01 | A claim may be submitted only by a participant of the `trx_`, and only with a `route_id` that belongs to that trx (PS-069). | MVP |
| PS-071-02.R02 | Methods `cash`, `in_kind_compensation`, `other_external` can never produce a claim above `COUNTERPARTY_ATTESTED` (R07); the UI and API say so before submit. | MVP |
| PS-071-02.R03 | Cross-currency claims require a `qte_` with `valid_until` ≥ submit time at consent; otherwise `COM.QUOTE_EXPIRED` or `COM.QUOTE_MISSING`. | MVP |
| PS-071-02.R04 | Evidence file type allowlist: JPEG, PNG, PDF, plain text ≤ 4 KB; max size 5 MiB. Others rejected before storage. | MVP |
| PS-071-02.R05 | Attestation requires a valid Ed25519 signature over `claim_hash` from the counterparty's registered key. | MVP |
| PS-071-02.R06 | A claim body containing a field of class LOCATION_PRECISE or a name field is rejected. | MVP |

## Data / schema
Rule enum: `participant`, `route_belongs`, `method_ceiling`, `quote_required`, `quote_valid`, `amount_format`, `evidence_type`, `evidence_size`, `evidence_count`, `signature_valid`, `forbidden_field`.

## Commands / queries / events
Applies to `clm.submit`, `clm.attest` (PS-071-04) and `evd.upload`.

## States & transitions
Validation failure creates no claim row and no `evd_` row.

## Validation & errors
| Rule | Code | Retryable | Message key | Diagnostic |
|---|---|---|---|---|
| Non-participant | `SYS.NOT_FOUND` | false | `err.sys.not_found` | none |
| Route not on trx | `RECEIPT.ROUTE_MISMATCH` | false | `err.receipt.route_mismatch` | none |
| Method ceiling exceeded on attest | `COM.CASH_NOT_VERIFIABLE` | false | `err.com.cash_not_verifiable` | method enum |
| Quote missing | `COM.QUOTE_MISSING` | false | `err.com.quote_missing` | currency pair |
| Quote expired | `COM.QUOTE_EXPIRED` | false | `err.com.quote_expired` | seconds since expiry |
| Amount format invalid | `RECEIPT.AMOUNT_INVALID` | false | `err.receipt.amount_invalid` | rule enum |
| Evidence type not allowed | `RECEIPT.EVIDENCE_TYPE` | false | `err.receipt.evidence_type` | MIME class |
| Evidence too large | `SYS.PAYLOAD_TOO_LARGE` | false | `err.sys.payload_too_large` | size class |
| Evidence count exceeded | `RECEIPT.EVIDENCE_LIMIT` | false | `err.receipt.evidence_limit` | count |
| Bad attestation signature | `COM.ATTESTATION_INVALID` | false | `err.com.attestation_invalid` | key_id |
| Forbidden field | `SYS.REQUEST_MALFORMED` | false | `err.sys.request_malformed` | field path |

## Authorization
Validation runs after participant check (PS-071-05). Attestor key must belong to the counterparty of the claim.

## Failure, idempotency, concurrency, offline
Validation is deterministic. Quote validity is checked against server time at commit.

## Privacy, retention, abuse
Diagnostics contain rule names or classes only, never amounts with party IDs together.

## Observability & budgets
Counter per (code, rule). Alert when `RECEIPT.EVIDENCE_TYPE` rate exceeds 10% of uploads (abuse or client fault).

## Tests
- TEST-PS-071-02-01 (unit): each row of the error table.
- TEST-PS-071-02-02 (unit): evidence allowlist with JPEG, PNG, PDF, SVG (rejected), EXE (rejected).
- TEST-PS-071-02-03 (contract): attestation with a key from a third party is refused.
- TEST-PS-071-02-04 (negative): cash claim cannot reach `EXTERNALLY_VERIFIED` through any path.

## Acceptance criteria
1. Error table implemented exactly; codes registered.
2. No diagnostic includes amounts together with party references.
3. Cash and in-kind claims never exceed `COUNTERPARTY_ATTESTED` (property test).

## Assumptions & open decisions
- ASSUMPTION: evidence allowlist is JPEG, PNG, PDF and plain text.
- D06 (PROVISIONAL default, unapproved).
