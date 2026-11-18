# PS-113-09 — contract and acceptance tests

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/02_internationalization/mod_languages. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-ERR-001, CTR-EVT-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-113-09.R01 | Contract tests cover every LANG.* code, catalog schema and the catalog GET route. | MVP |
| PS-113-09.R02 | Language selector is a labeled native select in its own language name ("English", "Deutsch"). | MVP |
| PS-113-09.R03 | Screen reader reads text in the selected language (`lang` attribute on the element that changes). | MVP |
| PS-113-09.R04 | Translated UI is checked for text expansion up to 30% without clipping at 320 px width. | MVP |

## Data / schema
Fixtures: `en`, `de`, a deliberately broken `de`, and a long-string stress set.

## Commands / queries / events
Contract tests on catalog route and consumed `profile.updated`.

## States & transitions
All rows of workflow_state_machine.

## Validation & errors
One failing fixture per PS-113-02 rule.

## Authorization
Anonymous read and foreign-read fixtures.

## Failure, idempotency, concurrency, offline
Fault injection from PS-113-06.

## Privacy, retention, abuse
Telemetry scans (PS-113-07).

## Observability & budgets
Suite ≤ 5 min.

## Tests
- TEST-PS-113-09-01 (contract): LANG codes and catalog schema.
- TEST-PS-113-09-02 (e2e): switch to `de`, all visible UI strings from catalog.
- TEST-PS-113-09-03 (a11y): selector labeled and announced; `lang` attributes verified.
- TEST-PS-113-09-04 (visual): 320 px and +30% text expansion without clipping.

## Acceptance criteria
1. Contract suite green.
2. Visual and a11y checks pass for both locales.
3. Accessibility Lead sign-off pending (future gate).

## Assumptions & open decisions
- ASSUMPTION: manual screen reader check in both languages.
- No Dxx blocks test scope.
