# PS-142-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_compatibility. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-142-07.R01 | Result records hold no device serial, advertising ID, IP address or user agent string beyond the coarse `client_platform` value. | MVP |
| PS-142-07.R02 | Lab device identifiers are replaced by lab slot IDs before storage. | MVP |
| PS-142-07.R03 | Compatibility results are `PUBLIC`; no test account data is stored. | MVP |

## Retention and abuse
- Result records: retained for the life of the release line plus 1 year (ASSUMPTION; D07 default, PROVISIONAL).
- Abuse: fake "supported" claims are blocked by R01 of PS-142-02 and by second approval.
- Scraping of matrix data: matrix is public for participants, no extra fields exposed.

## Assumptions & open decisions
- ASSUMPTION: no real user data is used during compatibility testing.
- D07 default is PROVISIONAL (D07 default, unapproved).
