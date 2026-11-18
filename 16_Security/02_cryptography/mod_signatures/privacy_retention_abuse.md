# PS-130-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_signatures. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-FED-001, CTR-CAP-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-130-07.R01 | Signature records hold no personal data beyond `signer_ref` (PSEUDONYMOUS). | MVP |
| PS-130-07.R02 | Signing input bytes are never stored by this module. | MVP |
| PS-130-07.R03 | Signature bytes and digests are PUBLIC because they travel with signed events. | MVP |
| PS-130-07.R04 | On subject deletion, retain digest, `key_id`, timestamps and result; delete `signer_ref` link after 30 days (ASSUMPTION). | MVP |
| PS-130-07.R05 | Per-producer sign rate ≤ 600/min (ASSUMPTION); above that returns `SYS.RATE_LIMITED`. | MVP |

## Data / schema
See [domain_schema.md](domain_schema.md).

## Commands / queries / events
Events contain `signer_ref` only.

## States & transitions
Retention change at subject deletion only.

## Validation & errors
Abuse: signing requests for non-canonical subjects rejected by [validation_rules.md](validation_rules.md).

## Authorization
Signing oracle prevention per PS-130-05.R02.

## Failure, idempotency, concurrency, offline
N/A.

## Privacy, retention, abuse
- Retention: records live with their subject; tombstoned subjects keep digest only (CTR-PRV-001 R12).
- Abuse: replay of a signed envelope to a different audience is prevented by `audience` inside the signed bytes (CTR-FED-001 R04).
- Cross-protocol replay blocked by distinct domain tags.
- Metadata: `signed_at` is producer-claimed and coarse to the minute in public views (ASSUMPTION).

## Observability & budgets
Logs record `key_id`, `subject_type`, result. Never subject payloads.

## Tests
- TEST-PS-130-07-01: privacy, grep of logs for payload fixtures yields zero hits.
- TEST-PS-130-07-02: abuse, cross-domain replay rejected.
- TEST-PS-130-07-03: rate limit at 601/min.

## Acceptance criteria
1. Zero payload bytes in logs and events for the fixture set.
2. Cross-audience and cross-domain replays rejected.

## Assumptions & open decisions
- ASSUMPTION: 30-day link removal and coarse `signed_at` in public views.
- D07 (retention): PROVISIONAL (D07 default, unapproved).
