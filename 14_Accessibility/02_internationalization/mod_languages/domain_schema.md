# PS-113-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/02_internationalization/mod_languages. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001, CTR-ERR-001, CTR-PRV-001. This module owns no database entity; the preference field lives on the profile record owned by F07.S02.M02 (mod_profiles).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-113-01.R01 | Supported UI locales are a closed list in the build: MVP `en` and `de` (ASSUMPTION, product confirmation pending). | MVP |
| PS-113-01.R02 | `language` profile field holds one BCP 47 tag from the closed list, or null (use browser language). | MVP |
| PS-113-01.R03 | Catalog file holds one locale's strings, keyed by message key, with `catalog_version` (semver). | MVP |
| PS-113-01.R04 | Catalog keys match the CTR-ERR-001 `message_key` form (`err.<code>`) or UI key form `ui.<area>.<name>`. | MVP |
| PS-113-01.R05 | Money, quantity and date values are stored in canonical form (CTR-EVT-001 R12 decimal strings, RFC 3339); localization applies only at display. | MVP |

## Data / schema
```json
catalog  (file, one per locale; not a database record)
{
  "$id": "urn:classrupt:catalog:1.0.0",
  "locale": "de",
  "catalog_version": "1.2.0",
  "messages": { "err.sys.not_found": "Nicht gefunden.", "ui.listing.unread_count": "{count, plural, one {# ungelesen} other {# ungelesen}}" }
}
```
Constraints: the key set of every locale must equal the `en` key set in CI (parity). Message syntax is ICU MessageFormat (ASSUMPTION). Values contain no HTML and no user content.

Profile field (owner F07): `language`: `"en" | "de" | null`.

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Catalog states: `bundled`, `active`, `superseded`. See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
See [failure_recovery_idempotency.md](failure_recovery_idempotency.md).

## Privacy, retention, abuse
See [privacy_retention_abuse.md](privacy_retention_abuse.md).

## Observability & budgets
See [observability_performance.md](observability_performance.md).

## Tests
- TEST-PS-113-01-01 (contract): key parity across all locales in CI.
- TEST-PS-113-01-02 (unit): catalog without `catalog_version` is rejected at build.
- TEST-PS-113-01-03 (property): every `message_key` emitted by CTR-ERR-001 registry exists in `en`.
- TEST-PS-113-01-04 (unit): decimal money string round-trips unchanged through display formatting.

## Acceptance criteria
1. Parity check fails the build on any missing key.
2. Catalog schema validated at build time.
3. Storage fields never contain localized text.

## Assumptions & open decisions
- ASSUMPTION: MVP locales `en` and `de`.
- ASSUMPTION: ICU MessageFormat syntax.
- No Dxx in DECISIONS.md applies; ASSUMPTION L-01 (localization policy) requires lead registration.
