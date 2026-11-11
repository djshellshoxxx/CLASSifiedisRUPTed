# F14.S02.M01 — Languages

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F14.S02](../SPEC.md). **Process IDs:** PS-113-01…PS-113-10. **Code:** `packages/i18n/src/internationalization/languages`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Message catalogs, locale negotiation, plural rules, text direction and missing-key fallback for the PWA and relay-rendered text. Catalogs are JSON files packages/i18n/messages/<locale>.json with {name} parameters and plural forms selected by Intl.PluralRules (CTR-UX-001 UX-3). MVP locales are en (default), de, fr and es, plus two pseudolocales (en-XA accented and expanded, ar-XB right to left) used to test expansion and RTL. A missing key falls back to en and warns in development. Layouts use CSS logical properties. The module runs offline in the browser and sends no telemetry.

## Responsibilities

- Load catalogs lazily per locale (at most 30 KiB gzip each) from the app bundle, with en always available as fallback.
- Negotiate the locale from the vault setting, then navigator.languages by BCP 47 lookup (de-AT to de), then en; set the document lang and dir attributes accordingly.
- Provide t(key, params), plural selection through Intl.PluralRules with the categories zero, one, two, few, many and other, and list, date and number helpers through Intl.ListFormat, Intl.DateTimeFormat and Intl.NumberFormat.
- Fall back to the en string when a key is missing, log a development warning with the key and locale, record the key in local diagnostics, and never show a raw key or an empty string to users.
- Provide CI checks for key parity, parameter parity, plural completeness, maximum message length (500 characters) and logical-CSS usage (no left or right physical properties in component styles).

## Not responsible for

- Money, currency and quote-label formatting (F14.S02.M02).
- Spoken names for assistive technology (F14.S01.M02), which uses these catalogs.
- Translation of user-generated content; listings and messages are shown in the language their authors wrote them.
- Future: community translation workflow, machine translation of user content, and shipped catalogs for ar, he and fa; MVP verifies RTL layout with the ar-XB pseudolocale only.

## User stories

- As a German speaker, I see the whole app in German, including plurals such as "1 Angebot" and "3 Angebote".
- As a user whose browser prefers de-AT, I get German even though only de is shipped.
- As a user, if a translation is missing I see the English text, not a key or a blank.
- As a right-to-left reader, layouts mirror correctly and icons that imply direction flip.

## Edge cases

- Locale tag is malformed or unsupported (xx-YY); negotiation falls back to en and does not throw.
- A plural message lacks the category the locale needs (for example few in a language that uses it); CI fails and runtime falls back to other.
- A parameter name appears in en but is missing in de; CI fails parity and runtime uses en for that key.
- A translated string is 40 percent longer than English; the pseudolocale check shows no clipping or overlap in any component.
- The user changes locale while a form is open; text updates without losing form input or focus.
- Message params contain user text with braces or markup; params are inserted as plain text and never interpreted as parameters or HTML.
- Numbers in an RTL locale are embedded in text; bidi isolation (Unicode FSI and PDI or the dir attribute) keeps order correct.

## UX and accessibility

- Language settings: list of languages in their own names (Deutsch, Français, Español, English) with the active one marked, plus 'Automatic'.
- Development-only missing-translation badge on strings that fell back to English.

**States:** loading-catalog; ready; fallback-en; error

**Accessibility:** The html element carries the correct lang attribute and inline passages in another language carry their own lang attribute.; Language names are displayed in their own language and the selector has a visible label.; Changing language announces "Language changed to Deutsch" in the new language through the polite live region.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-113-01 | [Domain schema](domain_schema.md) | 3 |
| PS-113-02 | [Validation rules](validation_rules.md) | 3 |
| PS-113-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-113-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-113-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-113-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-113-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-113-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-113-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-113-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/i18n/src/internationalization/languages/index.ts`.

## Acceptance criteria

- All tests T01–T14 pass in CI.
- No user ever sees a raw key or an empty string for a missing translation.
- Pseudolocale runs show no clipping at 40 percent expansion and correct RTL mirroring on every route.
