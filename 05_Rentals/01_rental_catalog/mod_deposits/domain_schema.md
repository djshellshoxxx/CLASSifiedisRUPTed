# PS-040-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 05_Rentals/01_rental_catalog/mod_deposits. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-COM-001 (currency, method, claim), CTR-PRV-001 (data classes), CTR-ID-001 (`dep_` PENDING registry entry, proposed owner F05), CTR-SCH-001.

**Decision labels:** D09 no custody (PROVISIONAL, unapproved). D03 integer minor units (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-040-01.R01 | At most one non-`CANCELLED` deposit per `rental_id`. Second insert → `DEPOSITS.DUPLICATE_ARRANGEMENT`. | MVP |
| PS-040-01.R02 | `amount_minor` is a base-10 decimal string, > 0, ≤ listing cap (validation rules, PS-040-02). No float fields. | MVP |
| PS-040-01.R03 | No platform account, wallet, balance or payout property at any depth (CTR-COM-001 R01). | MVP |
| PS-040-01.R04 | `custody` is constant `direct_party`. `owner_ref` ≠ `renter_ref`. | MVP |
| PS-040-01.R05 | Each field has one CTR-PRV-001 class. Amounts, method, status, party refs and claim refs = FINANCIAL_EVIDENCE. `notes` = PRIVATE_PERSONAL. | MVP |
| PS-040-01.R06 | `terms_hash` = SHA-256 of JCS(`amount_minor`, `currency`, `method`, `release_rule`). Any term change changes the hash and needs new agreement. | MVP |

## Data / schema
```json
{
  "deposit_id": "dep_<26 Crockford base32>",
  "rental_id": "rnt_<26>",
  "owner_ref": "acc_<26>",
  "renter_ref": "acc_<26>",
  "amount_minor": "<decimal string>",
  "currency": "<CTR-COM-001 currency object>",
  "method": "cash | bank_transfer | onchain_transfer | external_card | other_external",
  "custody": "direct_party",
  "release_rule": "full_return_or_agreed_deduction",
  "terms_hash": "<64 lowercase hex>",
  "status": "PROPOSED | AGREED | HELD | RELEASE_PENDING | PARTIALLY_RELEASED | RELEASED | DISPUTED | CANCELLED",
  "claim_ids": ["clm_<26>"],
  "state_version": "integer >= 1",
  "created_at": "RFC 3339",
  "schema_version": "1.0.0"
}
```
`claim_ids` is non-empty from `HELD` onward. `clm_` records are owned by F09 (CTR-COM-001); this record links to them by ID only.

## Commands / queries / events
Not applicable to the schema itself. Commands are in PS-040-04. Schema registered per CTR-SCH-001 R01 with owner F05.

## States & transitions
Status values are defined in PS-040-03. This file fixes the field set only.

## Validation & errors
Schema violations use `SYS.REQUEST_MALFORMED` (400). Custody fields use `COM.CUSTODY_FORBIDDEN` (422). Rules in PS-040-02.

## Authorization
Field visibility: `amount_minor`, `currency`, `method`, `status`, `claim_ids`, `terms_hash`: participant. `notes`: participant. Non-participants see nothing (`SYS.NOT_FOUND`). Detail in PS-040-05.

## Failure, idempotency, concurrency, offline
Insert uses the uniqueness constraint in R01 as the final guard. Offline clients may generate a `ulid` `dep_` locally (CTR-ID-001 R02, D08 PROVISIONAL).

## Privacy, retention, abuse
FINANCIAL_EVIDENCE: RET-EVD (24 months after final state; personal fields redacted at 12 months, hashes kept). `notes`: RET-PRIV. Never federated (CTR-FED-001 R03).

## Observability & budgets
Schema-violation counter `deposits_schema_reject_total{code}`. Target: 0 custody-field rejects reach storage.

## Tests
- TEST-PS-040-01-01 (unit): valid record passes; float `amount_minor`, negative amount, and missing `claim_ids` after `HELD` fail.
- TEST-PS-040-01-02 (lint): no property named `wallet`, `balance`, `payout` or `platform_*` in the schema.
- TEST-PS-040-01-03 (integration): second active deposit for one `rental_id` → `DEPOSITS.DUPLICATE_ARRANGEMENT`.
- TEST-PS-040-01-04 (unit): `terms_hash` golden vectors match across two JCS implementations.

## Acceptance criteria
1. Schema registered with owner F05 and a SHA-256 digest (CTR-SCH-001 R02).
2. TEST-PS-040-01-01 through -04 pass in CI.
3. Lint finds zero custody-capable fields.

## Assumptions & open decisions
- PROVISIONAL (D09 default, unapproved): direct-party arrangement, no platform custody.
- PROVISIONAL (D03 default, unapproved): minor units, single currency per deposit.
- ASSUMPTION: deposits never use pinned quotes; a deposit currency always equals the rental currency.
- OPEN (F05): whether `release_rule` supports rules other than full return or agreed deduction.
