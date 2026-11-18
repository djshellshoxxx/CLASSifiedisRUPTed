# PS-113-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/02_internationalization/mod_languages. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-113-04.R01 | This module exposes no state-changing server command. Language writes go through the F07 profile command `profile.update` with field `language`. | MVP |
| PS-113-04.R02 | This module consumes `profile.updated` (field `language`) to refresh cached locale for notification templates in mod_email. | MVP |
| PS-113-04.R03 | Catalog delivery is a static asset query: `GET /locales/{tag}/{catalog_version}.json`. | MVP |
| PS-113-04.R04 | Catalog responses are public (PUBLIC class), immutable per version, with `Cache-Control: max-age=31536000, immutable`. | MVP |

## Data / schema
**Queries**: `GET /locales/{tag}/{catalog_version}.json` (no auth). Unknown tag → 404 with CTR-ERR-001 envelope `LANG.TAG_UNSUPPORTED`.

**Consumed events**: `profile.updated` (producer F07). Max data class per F07.

**Emitted events**: none.

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
Catalogs are public. Profile writes are authorized by F07.

## Failure, idempotency, concurrency, offline
Catalog GET is idempotent and cacheable. Event consumption is idempotent by `(aggregate_id, revision)`.

## Privacy, retention, abuse
No personal data in catalog responses. Requests logged without query strings.

## Observability & budgets
Catalog GET p95 ≤ 100 ms at edge (ASSUMPTION).

## Tests
- TEST-PS-113-04-01 (contract): catalog response validates against schema 1.0.0.
- TEST-PS-113-04-02 (contract): unknown tag returns CTR-ERR-001 envelope with 404.
- TEST-PS-113-04-03 (integration): `profile.updated` with language refreshes template locale once.
- TEST-PS-113-04-04 (contract): no module-level write endpoint exists.

## Acceptance criteria
1. No server write path for language in this module.
2. Catalog caching headers verified.
3. Event consumer idempotent in test.

## Assumptions & open decisions
- ASSUMPTION: static catalog hosting on the same origin.
- No Dxx applies.
