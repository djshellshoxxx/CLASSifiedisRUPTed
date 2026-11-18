# PS-112-04 — commands, queries and events
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/02_internationalization/mod_currencies. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-112-04.R01 | `cur.catalog.publish` requires `idempotency_key` and the expected digest of the draft. | MVP |
| PS-112-04.R02 | `cur.catalog.get` returns the current version in ≤ 100 ms p95 (CDN-cacheable). | MVP |
| PS-112-04.R03 | Formatting is a pure client function with no network call. | MVP |

## Data / schema
Command `cur.catalog.publish` v1.0.0: `{idempotency_key, catalog_version, digest, entries[]}`.
Query `cur.catalog.get` v1.0.0: `{version?}` → `{catalog_version, digest, entries[]}`.
Format function (client): `format(amount_minor: string, code: string, locale: string) → string`.

## Commands / queries / events
Event `currency_catalog.published` (aggregate `cur`, PUBLIC): `{catalog_version, digest}`.
Errors per [PS-112-02](validation_rules.md); `SYS.NOT_FOUND` for unknown version.

## States & transitions
Per [PS-112-03](workflow_state_machine.md).

## Validation & errors
Validation before idempotency lookup.

## Authorization
Per [PS-112-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Idempotency scope per CTR-EVT-001 R03. Publish with same digest returns original result.

## Privacy, retention, abuse
Payloads contain codes and digests only.

## Observability & budgets
Latency and error counters; see [PS-112-08](observability_performance.md).

## Tests
- TEST-PS-112-04-01 contract: schemas validate.
- TEST-PS-112-04-02 integration: duplicate publish, one event.
- TEST-PS-112-04-03 unit: format is pure (same input, same output, no I/O).

## Acceptance criteria
1. Every command has schema, errors and idempotency scope.
2. Format function performs no network or storage access (test asserts).

## Assumptions & open decisions
- ASSUMPTION: catalog has at most 400 entries.
- No Dxx decision directly affects the interface.
