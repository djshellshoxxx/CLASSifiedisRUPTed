# PS-068-07 — privacy, retention and abuse controls

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/01_payments/mod_crypto (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R01, R06, R08, RET-EVD), CTR-COM-001 (Privacy section), CTR-FED-001 (R03). **Decisions:** D07, D09 (PROVISIONAL, unapproved). Privacy Lead (F10) review required.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-068-07.R01 | Addresses and tx hashes are FINANCIAL_EVIDENCE and never leave claim or verification stores except to the owning parties and case moderators. | MVP |
| PS-068-07.R02 | Linking an address to an account is PSEUDONYMOUS at most and disclosed to the user before the first claim. | MVP |
| PS-068-07.R03 | No crypto data is federated (CTR-FED-001 R03). | MVP |
| PS-068-07.R04 | Retention: RET-EVD (24 months after final state, ASSUMPTION). Raw provider responses kept 90 days, then only digest. | MVP |
| PS-068-07.R05 | Address-poisoning and look-alike asset defense: UI shows the asset contract and recipient in full with a checksum and does not accept clipboard-swapped values without a visible re-confirm. | MVP |
| PS-068-07.R06 | Adapters never request wallet keys, seed phrases or signatures for funds (test-enforced). | MVP |

## Data / schema
Data classes per PS-068-01. Raw response bodies are not stored; digests only, plus a 90-day encrypted cache for dispute review (ASSUMPTION).

## Commands / queries / events
Purge emits `clm.evidence_purged` with claim ID.

## States & transitions
Retention: `active` → `redacted` → `expired`, per CTR-PRV-001.

## Validation & errors
Forbidden key names (`seed`, `private_key`, `mnemonic`) rejected with `SYS.REQUEST_MALFORMED`.

## Authorization
Public blockchain data is readable by anyone; the platform only stores what parties submit.

## Failure, idempotency, concurrency, offline
Purge is idempotent.

## Privacy, retention, abuse
- Graph deanonymization: the platform stores no transaction graph beyond the single claim.
- Phishing and look-alike assets: R05 plus the asset allowlist.
- Public data does not prove handover; disclosed in UI.
- Fabricated chain references are caught by adapter match; they cannot reach `EXTERNALLY_VERIFIED`.

## Observability & budgets
Abuse metric: claims rejected for asset or recipient mismatch per party (alert on repeated attempts).

## Tests
- TEST-PS-068-07-01 (contract): federation of an on-chain claim rejected.
- TEST-PS-068-07-02 (UI): recipient change after copy triggers re-confirm.
- TEST-PS-068-07-03 (lint): forbidden key names rejected in any payload.
- TEST-PS-068-07-04 (integration): raw provider body not persisted after 90 days.

## Acceptance criteria
1. No platform request for keys or signatures (test).
2. Disclosure text present before first claim.
3. Retention enforced.

## Assumptions & open decisions
- ASSUMPTION: 90-day raw cache.
- D07, D09 (PROVISIONAL defaults, unapproved).
