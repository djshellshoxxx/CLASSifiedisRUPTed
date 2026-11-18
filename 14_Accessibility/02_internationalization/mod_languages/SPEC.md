# F14.S02.M01 — languages

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Accessibility Lead. **Parent:** [F14.S02 internationalization](../SPEC.md).

## Purpose and business behavior
Provide the closed set of UI languages (MVP: English and German, ASSUMPTION), the language preference that drives display, and the message catalogs that render every CTR-ERR-001 `message_key` and UI string. Translation applies to interface copy only. User-entered content (listing text, messages, reviews) is shown as written and is never machine-translated by this module.

## User stories
- As a participant who reads German, I can switch the interface to German and keep my place in a barter cycle.
- As a participant with a screen reader, I hear each text in the language it is written in.
- As a participant with a language I cannot use, I see English rather than raw keys.

## Scope
- In scope: supported locale list, catalog format and parity, language resolution, catalog delivery, fallback rules, `lang` attributes.
- Out of scope: currency and money formatting (F14.S02.M02 mod_currencies), profile storage (F07.S02.M02), email template content (F13.S01.M02), search language filter (F06.S01.M03).

## Public interfaces
No server write command. Query `GET /locales/{tag}/{catalog_version}.json`. Profile field `language` via F07. See [commands_queries_events.md](commands_queries_events.md).

## Relationships, dependencies and integration
Upstream: profile (F07.S02.M02). Downstream: search filter (F06.S01.M03) and currencies (F14.S02.M02) use the same tag list; notification email locale (F13.S01.M02). Contracts: CTR-ERR-001, CTR-SCH-001. Edges per DEPENDENCY_MATRIX.md.

## Data ownership
Owns catalog artifacts and the supported-locale list. Owns no user records. Profile `language` field is owned by F07.

## Risk considerations
- Accessibility: wrong `lang` attributes break screen reader pronunciation; raw keys confuse users.
- Integrity: catalog injection via translation workflow; placeholder mismatches changing meaning.
- Privacy: language can hint at origin; not used beyond display.
- Correctness: money or dates re-parsed from localized strings would corrupt values; forbidden.
- No platform custody of money.

## Completion criteria
Process specs PS-113-01 to PS-113-10 at SPEC-DRAFT-COMPLETE; MVP locale list confirmed by product (ASSUMPTION); Accessibility Lead review pending.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-113-01
- [x] [validation_rules.md](validation_rules.md) — PS-113-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-113-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-113-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-113-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-113-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-113-07
- [x] [observability_performance.md](observability_performance.md) — PS-113-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-113-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-113-10
