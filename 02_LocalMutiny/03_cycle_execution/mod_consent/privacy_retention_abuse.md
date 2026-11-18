# PS-021-07 — Privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/03_cycle_execution/mod_consent. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-CAP-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-021-07.R01 | Consent rows hold no home address, precise location or free text. | MVP |
| PS-021-07.R02 | Participants of one cycle cannot learn each other's IP or device data. Only `acc_` pseudonyms are stored. | MVP |
| PS-021-07.R03 | Retention: rows deleted or reduced to counts 90 days after cycle end (D07 default, PROVISIONAL). | MVP |
| PS-021-07.R04 | Deletion request by a party removes that party's row content; cycle aggregate counts retained. | MVP |
| PS-021-07.R05 | Consent timing is not exposed publicly (prevents graph timing deanonymization). | MVP |

## Data / schema
Data classes per CTR-PRV-001: `party_id`, `snapshot_hash` PSEUDONYMOUS; `decided_at` visible to participants only.

## Commands / queries / events
Events never include `party_id` in public topics; they go to participant channels only.

## States & transitions
Deletion does not change the state machine; a deleted decision is represented as `REDACTED` in counts only.

## Validation & errors
| Code | Retryable | Class | Notes |
|---|---|---|---|
| CYC_CONSENT.RATE_LIMITED | true | rate_limited / 429 | 20 commands per principal per cycle per hour |

## Authorization
Deletion requires `self` scope (CTR-CAP-001 R04). Legal hold per CTR-PRV-001 R07.

## Failure, idempotency, concurrency, offline
Deletion propagates to caches and replicas within 24 h (CTR-PRV-001 R06).

## Privacy, retention, abuse
Abuse threats: consent flooding to probe cycle membership (rate limit and uniform `SYS.NOT_FOUND`); forged consent for a victim (signature check, D10); consent-based graph inference across cycles (aggregate counts only). Pseudonyms do not guarantee anonymity.

## Observability & budgets
Logs: envelope IDs and codes only; `party_id` hashed with keyed HMAC in logs (ASSUMPTION).

## Tests
- TEST-PS-021-07-01 (privacy): log scan finds no `acc_` in plaintext.
- TEST-PS-021-07-02 (abuse): flood of 100 commands → rate-limited after 20.
- TEST-PS-021-07-03 (retention): row removed or reduced at T+90 days in test clock.

## Acceptance criteria
1. No free-text or location field exists in `cycle_consent`.
2. Rate limit enforced at the stated threshold.
3. Retention job verified on a seeded dataset.

## Assumptions & open decisions
- ASSUMPTION: keyed HMAC for log pseudonyms.
- [DECISIONS.md](../../../DECISIONS.md) D07 — PROVISIONAL (D07 default, unapproved): 90 days after cycle end, legal-hold exceptions.
- [DECISIONS.md](../../../DECISIONS.md) D05 — geoprivacy. PROVISIONAL (D05 default, unapproved): no location in consent.
