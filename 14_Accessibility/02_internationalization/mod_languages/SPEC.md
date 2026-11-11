# F14.S02.M01 — Languages

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F14.S02](../SPEC.md). **Process IDs:** PS-113-01…PS-113-10. **Code:** `packages/i18n/src/internationalization/languages`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Message catalogs, locale negotiation, plural rules, text direction and missing-key fallback for the PWA, its service worker (device-side push alert text) and the generic email templates that a user-selected email relay renders (F13.S01.M02, no user content and no amounts). Catalogs are JSON files packages/i18n/messages/<locale>.json with {name} parameters and plural forms selected by Intl.PluralRules (CTR-UX-001 UX-3). MVP locales are en (default), de, fr and es, plus two pseudolocales (en-XA accented and expanded, ar-XB right to left) built for CI and development to test expansion and RTL. The chosen locale is F15.S04.M03 LocalSettings.defaultLocale; it stays in the vault and reaches a relay only inside the opted-in email registration. Every string parameter is bidi-isolated and stripped of unpaired directional controls at render time, because titles and names arrive in signed statements from other, possibly adversarial, vaults. A missing key falls back to en and warns in development. Layouts use CSS logical properties. The module runs offline and sends no telemetry.

## Responsibilities

- Ship every production catalog (en, de, fr, es; at most 30 KiB gzip each) in the service-worker precache, installed together (F15.S01.M02) so loading the active catalog never makes a per-locale network request; en is also inline in the main bundle as the fallback.
- Negotiate the locale from F15.S04.M03 LocalSettings.defaultLocale, then navigator.languages by BCP 47 lookup (de-AT to de), then en; before the vault is unlocked only navigator.languages and en are used; set the document lang and dir attributes accordingly. The selected relay's Tenant.defaultLocale is never used, because relays are optional, user-selected and never authoritative (ADR-0016).
- Provide t(key, params), plural selection through Intl.PluralRules with the categories zero, one, two, few, many and other, and list, date and number helpers through Intl.ListFormat, Intl.DateTimeFormat and Intl.NumberFormat; every string parameter is wrapped in FSI…PDI and stripped of unpaired directional controls.
- Fall back to the en string when a key is missing, log a development warning with the key and locale, write a P0 entry {key, locale} through the F15.S03.M01 logger into its in-memory ring buffer, and never show a raw key or an empty string to users.
- Provide CI checks for key parity, parameter parity, call-site parameter completeness, {name}-only parameter syntax, plural completeness, maximum message length (500 characters) and logical-CSS usage (no left or right physical properties in component styles).
- Dispatch a localechange DOM event after each locale switch so the F14.S01.M02 PageShell can announce the change.

## Not responsible for

- Money, currency and quote-label formatting (F14.S02.M02).
- Spoken names for assistive technology and the language-change announcement (F14.S01.M02), which use these catalogs.
- Storing the locale preference (F15.S04.M03 LocalSettings), storing diagnostics (F15.S03.M01 ring buffer) and precaching (F15.S01.M02).
- Sending push alerts and emails (F13.S01.M01, F13.S01.M02); this module only supplies t() for the device-side push text and the generic email templates.
- Translation of user-generated content; listings and messages are shown in the language their authors wrote them.
- Future: community translation workflow, machine translation of user content, and shipped catalogs for ar, he and fa; MVP verifies RTL layout with the ar-XB pseudolocale only.

## User stories

- As a German speaker, I see the whole app in German, including plurals such as "1 Angebot" and "3 Angebote".
- As a user whose browser prefers de-AT, I get German even though only de is shipped.
- As a user, if a translation is missing I see the English text, not a key or a blank.
- As a right-to-left reader, layouts mirror correctly and icons that imply direction flip.
- As a buyer, a listing title from another vault that contains a right-to-left override cannot reorder the surrounding text of a message.

## Edge cases

- Locale tag is malformed or unsupported (xx-YY); negotiation falls back to en and does not throw.
- A plural message lacks the category the locale needs (for example few in a language that uses it); CI fails and runtime falls back to other.
- A parameter name appears in en but is missing in de; CI fails parity and runtime uses en for that key.
- A call site omits a parameter declared in en (for example {price}); CI fails with I18N_CATALOG_PARAM_MISSING and at runtime the message shows '…' in its place with a development warning, never an empty value.
- A translated string is 40 percent longer than English; the pseudolocale check shows no clipping or overlap in any component.
- The user changes locale while a form is open; text updates without losing form input or focus.
- Message params contain user text with braces or markup; params are inserted as plain text and never interpreted as parameters or HTML.
- A received listing title contains U+202E (right-to-left override) without a closing U+202C; t() removes it and isolates the title, so the rest of the message keeps its order.
- Numbers in an RTL locale are embedded in text; bidi isolation (Unicode FSI and PDI or the dir attribute) keeps order correct.
- Imported LocalSettings.defaultLocale is pt-BR, which this release does not ship; negotiation continues with navigator.languages, then en, and the stored value is kept.

## UX and accessibility

- Language settings: list of languages in their own names (Deutsch, Français, Español, English) with the active one marked, plus 'Use browser language', which stores the best match of navigator.languages; the choice is saved through F15.S04.M03 platform.local_settings.update.
- Development-only missing-translation badge on strings that fell back to English.

**States:** loading-catalog; ready; fallback-en; error

**Accessibility:** The html element carries the correct lang attribute and inline passages in another language carry their own lang attribute.; Language names are displayed in their own language and the selector has a visible label.; Changing language dispatches localechange; the F14.S01.M02 PageShell announces "Language changed to Deutsch" in the new language through the polite live region.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

F15.S04.M03, F15.S03.M01, F15.S01.M02, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-113-01 | [Domain schema](domain_schema.md) | 3 |
| PS-113-02 | [Validation rules](validation_rules.md) | 3 |
| PS-113-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-113-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-113-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-113-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-113-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-113-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-113-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-113-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/i18n/src/internationalization/languages/index.ts`.

## Acceptance criteria

- All tests T01–T15 pass in CI.
- No user ever sees a raw key or an empty string for a missing translation or a missing parameter.
- Pseudolocale runs show no clipping at 40 percent expansion and correct RTL mirroring on every route.
