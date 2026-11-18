# PS-055-07 — privacy, retention and abuse
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/02_profiles/mod_portable. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-055-07.R01 | Bundle contents obey CTR-PRV-001 R11: owner's own data at its classes; counterparty PRIVATE_PERSONAL redacted; LOCATION_PRECISE excluded by default. | MVP |
| PS-055-07.R02 | Region in bundle is the registered cell only (LOCATION_COARSE). Cell not published below K_MIN is exported as the owner's own value only. | MVP |
| PS-055-07.R03 | Bundles are encrypted at rest with per-bundle keys; key destroyed at deletion. | MVP |
| PS-055-07.R04 | Import preview shows counts and field names only, never values. | MVP |
| PS-055-07.R05 | Abuse: export ≤ 3 per 24 h; import stage ≤ 5 per 24 h; repeated invalid uploads from one session lock stage for 1 h (ASSUMPTION). | MVP |

## Data / schema
Classes: bundle body PRIVATE_PERSONAL; subject_token PSEUDONYMOUS; signature PUBLIC-within-bundle.

## Commands / queries / events
Events carry no bundle content.

## States & transitions
Retention bound to states in [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
Rate limits return `SYS.RATE_LIMITED` (429).

## Authorization
Only owner reads bundle contents.

## Failure, idempotency, concurrency, offline
Not applicable beyond PS-055-06.

## Privacy, retention, abuse
| Data | Class | Retention |
|---|---|---|
| bundle file | PRIVATE_PERSONAL | until download, expiry (7 d) or 24 h after generation, whichever first (RET-EPH) |
| bnd_/imj_ metadata | PSEUDONYMOUS | 12 months (RET-AUD) |
| staged import bytes | PRIVATE_PERSONAL | 24 h then deleted (RET-EPH) |
Threat: bundle exfiltration in transit (TLS only, download token), replay of old bundle (expiry + digest-applied check), forged bundle from another user (signature check).

## Observability & budgets
Logs: IDs and codes only.

## Tests
TEST-PS-055-14 (exported body vs class rules), TEST-PS-055-15 (LOCATION_PRECISE absent unless requested), TEST-PS-055-16 (rate limits), TEST-PS-055-17 (log scan).

## Acceptance criteria
1. Zero LOCATION_PRECISE values in default export fixtures.
2. Preview contains no field values.

## Assumptions & open decisions
- ASSUMPTION: rate limits above.
- PROVISIONAL (D05 default, unapproved): coarse region in export.
- PROVISIONAL (D07 default, unapproved): retention above.
