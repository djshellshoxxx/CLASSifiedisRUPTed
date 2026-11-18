# PS-071-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_receipts (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-COM-001 (R02, R03, R06–R08, R14), CTR-ID-001 (`clm`, `evd`, `trx`, `qte`), CTR-PRV-001, CTR-SCH-001. **Decisions:** D06, D07 (PROVISIONAL defaults, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-071-01.R01 | A receipt is a signed self-statement: one `clm_` claim plus its evidence digests, signed by the claimant and, after attestation, by the counterparty. It is not proof of handover or payment. | MVP |
| PS-071-01.R02 | `amount_minor` is a decimal string, 1–39 digits, no leading zeros, > 0 (CTR-COM-001 R02). | MVP |
| PS-071-01.R03 | `currency` is `fiat` (ISO 4217) or `asset` (CAIP-19), resolved through PS-073. | MVP |
| PS-071-01.R04 | `claim_hash` = SHA-256 of JCS(claim body without `claim_hash`, `signatures`). | MVP |
| PS-071-01.R05 | `evd_` evidence items: ≤ 5 per claim party, each ≤ 5 MiB, stored encrypted; the claim stores digests only. | MVP |
| PS-071-01.R06 | Evidence images have EXIF and all location metadata stripped before digest computation (LOCATION_PRECISE protection). | MVP |

## Data / schema
| Field | Type / constraint | Class |
|---|---|---|
| `claim_id` | `clm_` + ULID | FINANCIAL_EVIDENCE |
| `trx_id` | `trx_` ID | FINANCIAL_EVIDENCE |
| `claimant_ref` / `counterparty_ref` | `acc_` | PSEUDONYMOUS |
| `direction` | enum `payer_to_payee`, `payee_to_payer` | FINANCIAL_EVIDENCE |
| `method` | enum `on_chain`, `cash`, `in_kind_compensation`, `other_external` (route from PS-069) | FINANCIAL_EVIDENCE |
| `amount_minor` | decimal string, 1–39 digits | FINANCIAL_EVIDENCE |
| `currency` | fiat or asset object (CTR-COM-001) | FINANCIAL_EVIDENCE |
| `quote_id` | `qte_` or null (required if cross-currency) | FINANCIAL_EVIDENCE |
| `route_id` | `rte_` ID from PS-069 | FINANCIAL_EVIDENCE |
| `evidence_digests` | array of SHA-256 hex, ≤ 10 | FINANCIAL_EVIDENCE |
| `claim_hash` | SHA-256 hex, 64 chars | PSEUDONYMOUS |
| `signatures` | array: `{signer_ref, key_id, alg: "Ed25519", sig}` | PSEUDONYMOUS |
| `status` | CTR-COM-001 state set | FINANCIAL_EVIDENCE |
| `state_version` | integer ≥ 1 | — |

`evd_` item: `evidence_id`, `claim_id`, `kind` (`photo`, `document`, `chain_ref`, `text_note`), `content_ref` (encrypted blob), `sha256`, `byte_size`, `exif_stripped` (bool), `uploaded_by`.

## Commands / queries / events
Specified in PS-071-04. Claim state values are owned by CTR-COM-001.

## States & transitions
See PS-071-03.

## Validation & errors
See PS-071-02.

## Authorization
`evd_` content is visible to its uploader and to the claim counterparty only after the claim is `COUNTERPARTY_ATTESTED`; to a moderator only with case grant.

## Failure, idempotency, concurrency, offline
Canonical JSON (JCS) and hashing must produce identical digests across implementations; golden vectors required (PS-071-09).

## Privacy, retention, abuse
Amount, party and method are FINANCIAL_EVIDENCE (RET-EVD). Personal free text is not part of the claim body.

## Observability & budgets
Count of claims by status and method per day; no per-claim logs.

## Tests
- TEST-PS-071-01-01 (unit): `amount_minor` accepts `0`, `1`, 39 digits; rejects `01`, `1.0`, `-1`, 40 digits.
- TEST-PS-071-01-02 (contract): JCS golden vectors produce expected `claim_hash`.
- TEST-PS-071-01-03 (unit): image with GPS EXIF yields digest of stripped bytes and `exif_stripped = true`.

## Acceptance criteria
1. All fields carry exactly one class.
2. No claim body contains free text or personal names.
3. Golden vectors (≥ 50 cases) pass in two independent implementations.

## Assumptions & open decisions
- ASSUMPTION: evidence cap 5 items × 5 MiB per party.
- D06 (PROVISIONAL default, unapproved): signed statements only; external verification is separate (PS-072).
- D07 (PROVISIONAL default, unapproved).
