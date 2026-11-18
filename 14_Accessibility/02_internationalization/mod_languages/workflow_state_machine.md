# PS-113-03 — workflow state machine

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/02_internationalization/mod_languages. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-113-03.R01 | Catalog version states: `bundled` (in the build), `active` (served and in use), `superseded` (replaced by newer). | MVP |
| PS-113-03.R02 | Language resolution is deterministic: profile tag → browser language if profile null and supported → `en`. | MVP |
| PS-113-03.R03 | Language change applies on next render without a full data reload. | MVP |

## Data / schema
Resolution input: `profile.language`, `navigator.languages`, supported list.

## States & transitions
| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| bundled | client starts with matching version | none | active | none |
| active | new build with higher catalog_version deployed | client detects on next load | superseded (client reloads) | show reload notice if drafts exist (D08) |
| active | profile language changed | valid tag | active (new locale) | re-render UI; `<html lang>` updated |
| any | language field null and browser language unsupported | none | active (`en`) | none |

## Validation & errors
`LANG.CATALOG_VERSION_MISMATCH` (retryable true) when a server response requires a newer catalog than the client has; the client reloads.

## Authorization
Not applicable.

## Failure, idempotency, concurrency, offline
Offline: last active catalog kept; switch allowed only among bundled locales (both are precached).

## Privacy, retention, abuse
Browser language list is read in memory; not stored unless the user saves a choice.

## Observability & budgets
Count of resolutions per tag; fallback counter. Render cost on switch ≤ 200 ms.

## Tests
- TEST-PS-113-03-01 (unit): each resolution path covered.
- TEST-PS-113-03-02 (e2e): change language, `<html lang>` updates, no page reload.
- TEST-PS-113-03-03 (offline): both locales switch while offline.
- TEST-PS-113-03-04 (integration): stale client receives mismatch and reloads once.

## Acceptance criteria
1. Resolution table matches tests.
2. No reload on language switch.
3. Offline switch works for bundled locales.

## Assumptions & open decisions
- ASSUMPTION: both MVP locales precached.
- No Dxx blocks state logic.
