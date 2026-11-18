# PS-037-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 04_Auctions/02_auction_integrity/mod_fraud. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-ID-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-037-07.R01 | Signals and `device_key_hash` are PRIVATE_PERSONAL. Signals are never shown to other bidders or sellers. | MVP |
| PS-037-07.R02 | `device_key_hash` = HMAC-SHA256 with a key held in the F16 KMS, rotated every 30 days; old-key hashes are dropped at rotation. | MVP |
| PS-037-07.R03 | Retention: signals 180 days after auction close; upheld cases 2 years; dismissed cases 90 days; `device_key_hash` 30 days. All PROVISIONAL (D07). | MVP |
| PS-037-07.R04 | Legal holds per CTR-PRV-001 R07 override retention and expire automatically. | MVP |
| PS-037-07.R05 | Fraud signals are never federated (D01 default: not exported). | MVP |
| PS-037-07.R06 | Precise location is never an input feature (CTR-PRV-001 R03). | MVP |

## Data / schema
Data classes: FraudSignal PRIVATE_PERSONAL; FraudCase PSEUDONYMOUS; aggregates PUBLIC at k >= 5.

## Commands / queries / events
No event carries `device_key_hash` (PS-037-04 R03).

## States & transitions
On retention expiry: signal row is deleted; case keeps score_max and status only.

## Validation & errors
`FRAUD.FEATURE_PROHIBITED` if a feature key matches a location or device class. Non-retryable.

## Authorization
Deletion requests from account holders produce an `aud_` completion record with IDs and counts only (CTR-PRV-001 R12).

## Failure, idempotency, concurrency, offline
Retention job is idempotent by date window. Deletion propagates to replicas and search within 24 h (CTR-PRV-001 R06).

## Privacy, retention, abuse
Abuse controls: rule thresholds not published in detail; claims rate-limited to 20 per moderator per day (ASSUMPTION); no automatic account suspension; false-positive appeals tracked as a metric. Pseudonyms do not guarantee anonymity: account linkage across auctions is a known risk.

## Observability & budgets
Retention job completion report with counts only. Appeal overturn rate tracked monthly.

## Tests
- TEST-PS-037-07-01 (lint): `device_key_hash` never appears in API or event schema.
- TEST-PS-037-07-02 (retention): fixture signal expires at 180 days; case keeps status.
- TEST-PS-037-07-03 (hold): legal-hold cas_ fixture is not deleted; auto-releases at end date.
- TEST-PS-037-07-04 (abuse): 21st claim in one day by one moderator is rejected.

## Acceptance criteria
1. Retention table matches CTR-PRV-001 classes.
2. No non-F12 response includes another account's identifiers.
3. Key rotation test shows old hashes dropped.

## Assumptions & open decisions
- ASSUMPTION: subject access returns the requester's own rule_id, score and outcome, not other accounts' data.
- PROVISIONAL (D07 default, unapproved): all retention periods above.
- PROVISIONAL (D01 default, unapproved): no federation of fraud records.
