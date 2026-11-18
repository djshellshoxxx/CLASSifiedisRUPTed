# PS-078-07 — privacy, retention and abuse controls

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/01_data_controls/mod_export (Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (disclosure matrix owner-export row; RET-SEC; RET-EPH; RET-AUD), CTR-COM-001 (R05 states; RET-EVD), CTR-ERR-001 (R06).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-078-07.R01 | Package contains PRIVATE_PERSONAL data of the subject only; LOCATION_PRECISE only when `include_precise_location` is true. | MVP |
| PS-078-07.R02 | Commerce records (CTR-COM-001 claims) included with amounts, states and dates; counterparty identities replaced by pseudonyms. | MVP |
| PS-078-07.R03 | Counterparty pseudonym = keyed HMAC of the counterparty `acc_` with a per-export key (ASSUMPTION), stable within one package only. | MVP |
| PS-078-07.R04 | Package excludes SECRET class (password hashes, tokens, key material) and session identifiers. | MVP |
| PS-078-07.R05 | Package encrypted at rest with a per-export key wrapped by the user-controlled key (PROVISIONAL D10); plaintext never written to durable storage. | MVP |
| PS-078-07.R06 | Export rate: ≤ 2 requests per subject per 7 days (ASSUMPTION); exceeded → `SYS.RATE_LIMITED` (429). | MVP |

## Data / schema
Manifest entries carry `data_class` from the field registry. Pseudonym key is destroyed at package expiry.

## Commands / queries / events
Notification event `export.ready` carries generic text only (CTR-PRV-001 push row).

## States & transitions
Expiry per PS-078-03 R03; purge of bytes within 1 h of expiry.

## Validation & errors
Rate limit: retry after `retry_after_ms`.

## Authorization
Pseudonym key access limited to generator `sys_` during generation.

## Failure, idempotency, concurrency, offline
Key destruction is idempotent.

## Privacy, retention, abuse
Retention: package RET-EPH after expiry (purged); token hash RET-SEC purged 30 days after expiry; audit RET-AUD. Abuse: export as bulk scraping of others' data is impossible by construction (own data only); session theft mitigated by reauth (PS-078-02 R02), single-use token and subject notification.

## Observability & budgets
Alert on any `LOCATION_PRECISE` value in logs (zero tolerance).

## Tests
- TEST-PS-078-07-01 (privacy): fixture with counterparty names and precise coordinates; output contains pseudonyms and no coordinates unless flag set.
- TEST-PS-078-07-02 (secrets): password-hash fixture absent from package.

## Acceptance criteria
1. Fixture corpus passes TEST-PS-078-07-01 and -02.
2. Plaintext never persisted (storage audit).
3. Rate limit enforced on the third request in 7 days.

## Assumptions & open decisions
- PROVISIONAL (D10 default): user-controlled keys with documented recovery and rotation.
- PROVISIONAL (D05 default): precise location only on explicit request.
- PROVISIONAL (D07 default): package retention as above.
- OPEN (R07): statutory export format and timing require jurisdiction review.
