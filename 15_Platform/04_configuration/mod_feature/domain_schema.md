# PS-123-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/04_configuration/mod_feature (F15.S04.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-ID-001, CTR-CAP-001. **Canonical owner of record class "feature definition":** F15.S04.M01.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-123-01.R01 | Every product capability that can be switched on or off has exactly one feature definition. | MVP |
| PS-123-01.R02 | `slug` is unique, matches `^[a-z][a-z0-9_]{2,47}$`, and is never reused after retirement. | MVP |
| PS-123-01.R03 | `owner_module` is a full module ID from INDEX.md; lint refuses unknown IDs. | MVP |
| PS-123-01.R04 | `decision_refs` lists every Dxx in DECISIONS.md the feature depends on; a feature with any OPEN decision defaults to off. | MVP |
| PS-123-01.R05 | Feature definitions do not hold runtime rollout state; that belongs to PS-124. | MVP |

## Data / schema
```json
{
  "slug": "snake_case, unique, never reused",
  "title_key": "catalog key, e.g. feat.rental_deposits.title",
  "owner_module": "F-code module ID, e.g. F05.S02.M01",
  "mvp_or_future": "MVP | Future",
  "decision_refs": ["D09"],
  "requires": ["slug of another feature"],
  "default_state": "off | on",
  "lifecycle": "draft | active | deprecated | retired",
  "schema_version": "1.0.0"
}
```
Constraints: `default_state = on` only when every `decision_refs` entry is APPROVED; `requires` graph is acyclic; `retired` is terminal.

## Commands / queries / events
See PS-123-04.

## States & transitions
See PS-123-03.

## Validation & errors
See PS-123-02.

## Authorization
See PS-123-05.

## Failure, idempotency, concurrency, offline
Definition writes are idempotent on (`slug`, `schema_version`, digest).

## Privacy, retention, abuse
Definitions contain no personal data. Retention: all versions kept (RET-AUD).

## Observability & budgets
Feature catalog size and lint results are reported (PS-123-08).

## Tests
- TEST-PS-123-01-01 (lint): unique, pattern-valid slugs; no reuse.
- TEST-PS-123-01-02 (lint): every `owner_module` exists in INDEX.md.
- TEST-PS-123-01-03 (unit): `default_state = on` with an OPEN decision refused.
- TEST-PS-123-01-04 (lint): dependency graph acyclic.

## Acceptance criteria
1. Every MVP capability in FEATURE_INVENTORY.md has a definition or documented deferral.
2. TEST-PS-123-01-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: feature slugs are registry-owned; a `feat_` entity prefix is not needed while slugs are not entities (PENDING F15 decision).
- OPEN: decisions D01–D10 all OPEN; every feature that depends on them is default off.
