# PS-113-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/02_internationalization/mod_languages. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-113-02.R01 | `language` must be `null` or a tag in the build's supported list; comparison is case-insensitive, stored canonical (`de`, `en`). | MVP |
| PS-113-02.R02 | Region subtags are not accepted in MVP (`de-AT` rejected) to keep the catalog set closed. | MVP |
| PS-113-02.R03 | Catalog message values must be ≤ 500 characters and must not contain `<` or `>` (no markup). | MVP |
| PS-113-02.R04 | ICU placeholders in a translation must match the `en` placeholder names exactly. | MVP |

## Data / schema
| Field | Rule | Error code | Retryable | message_key |
|---|---|---|---|---|
| language | R01 | LANG.TAG_UNSUPPORTED | false | err.lang.tag_unsupported |
| language | R02 | LANG.TAG_UNSUPPORTED | false | err.lang.tag_unsupported |
| catalog value | R03 | LANG.CATALOG_INVALID (build time) | false | n/a (build failure) |
| catalog placeholder | R04 | LANG.PLACEHOLDER_MISMATCH (build time) | false | n/a (build failure) |
| catalog version | client older than server minimum | LANG.CATALOG_VERSION_MISMATCH | true | err.lang.catalog_version_mismatch |

## Commands / queries / events
Validation runs on profile write (F07) and in CI for catalogs.

## States & transitions
Not applicable.

## Validation & errors
Build-time errors block release. Runtime errors use CTR-ERR-001 envelope.

## Authorization
Language is self-service; no additional capability.

## Failure, idempotency, concurrency, offline
Validation deterministic. Offline clients may pre-check the closed list (bundled).

## Privacy, retention, abuse
No personal data in errors.

## Observability & budgets
Build report lists parity and placeholder failures.

## Tests
- TEST-PS-113-02-01 (unit): `DE` normalizes to `de`; `fr` rejected.
- TEST-PS-113-02-02 (unit): `de-AT` rejected.
- TEST-PS-113-02-03 (unit): value with `<b>` fails build.
- TEST-PS-113-02-04 (unit): placeholder rename in `de` fails build.

## Acceptance criteria
1. All rules enforced in CI or runtime with fixtures.
2. No markup in any catalog.
3. Unsupported tag never stored.

## Assumptions & open decisions
- ASSUMPTION: region subtags deferred to Future.
- Message keys for LANG.* added to catalog `en` at build.
