# F15.S04.M03 — Tenants

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F15.S04](../SPEC.md). **Process IDs:** PS-125-01…PS-125-10. **Code:** `packages/platform/src/configuration/tenants`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A tenant is relay-local configuration: a community hosted by one relay, with its allowed currencies, jurisdiction profile, default locale, limits and operator assignment. A relay may host several tenants, and a single-community relay has one fixed tenant created at bootstrap (CTR-ID-001 ID-6). Under ADR-0016 the vault has no tenants and no accounts; it has local settings of the same shape (default locale, preferred currencies, local limits) that never leave the device. Tenant configuration governs only what that relay hosts, and "suspended" means suspended on that relay (CTR-CAP-001 CAP-9). Operators are device keys (did:key), assigned by the relay configuration, not user accounts in a central database.

## Responsibilities

- Own the Tenant record on a relay with slug, display name, status, allowed currencies (1..20), jurisdiction profile id, default locale, limits and operator device keys (1..10), with revision-based concurrency.
- Bootstrap the first tenant from the relay CLI with filesystem access (relay tenant bootstrap --slug <slug> --operator <did:key>), and allow an admin operator to create further tenants on a multi-community relay (up to 50 per relay).
- Provide the configuration query used by other modules to apply currencies, locale and limits, with a 30 s cache and invalidation on change.
- Own the vault-local LocalSettings record with the same settings shape, stored only in the user's vault and included in the user's export.
- Emit platform.tenant.created and platform.tenant.configured, plus platform.tenant.status_changed, with payloads that let consumers react without reading the tenant.

## Not responsible for

- Registering currencies and validating that a code is a registered asset (F09.S03.M01 consumes tenant events and enforces membership at use time).
- Resolving jurisdiction profiles to retention and legal rules (F18.S01.M01); this module stores only the profile id and F18 falls back to the generic profile when the id is unknown.
- Message catalogs and locale negotiation (F14.S02.M01 falls back to en for an unsupported default locale).
- Role assignment records and authorization decisions (F16.S01.M01 consumes the operator list from tenant events).
- Flag values (F15.S04.M02) and relay process configuration (F15.S02.M01).
- Future: per-tenant branding and custom domains; Future: signed tenant directory shared between federated relays.

## User stories

- As a relay operator, I can start a relay for my town, name the community, choose EUR as the only currency, set the German default locale and limits, and name my own device key as operator.
- As a relay operator running two communities, I can configure each with different currencies and limits and suspend one without affecting the other.
- As a member, I can set my own default language and preferred currencies on my device, and these settings are not shared with any relay.
- As a member, I can see which currencies, jurisdiction profile and limits the selected relay applies before I publish.

## Edge cases

- Shrinking allowedCurrencies while listings in a removed currency exist; allowed, existing records keep their currency, consumers refuse new records in removed currencies, and the change event carries the removed codes.
- Removing the last operator key; refused with PLATFORM_TENANT_LAST_OPERATOR so the community cannot become unmanageable.
- Two operators edit settings at once; the second gets CONFLICT_REVISION with currentRevision.
- A tenant is suspended; the relay refuses writes for it with PLATFORM_TENANT_SUSPENDED while reads and exports stay available, and other tenants and all vaults are unaffected.
- The slug is already used on this relay; refused with PLATFORM_TENANT_SLUG_TAKEN.
- Bootstrap is run twice with the same arguments; the second run finds the existing tenant and returns it unchanged (idempotent), a different slug on a single-tenant relay is refused.
- A limit is set above its allowed maximum (for example maxUploadBytes 50 MiB); refused with VALIDATION_FAILED and the maximum in fields.
- The vault default locale is unsupported by the build; the app falls back to en and shows a notice, no error.

## UX and accessibility

- Operator console > Community: form for display name, currencies (chip input with ISO code check), jurisdiction profile (select), default locale (select), limits table with defaults and maximums, operator keys list with add and remove.
- Settings > Preferences (vault): language, preferred currencies, display options; clearly marked 'Stored only on this device'.
- Relay details sheet (client): shows the selected relay's community name, allowed currencies, jurisdiction profile id, limits and status.

**States:** loading; ready; saving; conflict; suspended; archived; offline-read-only; validation-error

**Accessibility:** Every field has a visible label with units (for example bytes shown as MiB) and error messages are linked with aria-describedby.; Currency chips are removable by keyboard with accessible names, and status changes are announced via aria-live polite.; Destructive actions (suspend, archive, remove operator) use a confirmation dialog with focus on the cancel action.

## Owned data

- `Tenant` (classrup.platform.tenant/v1, P0, RET-STANDARD)
- `LocalSettings` (classrup.platform.local_settings/v1, P1, RET-STANDARD)

## Interfaces

- Commands: `platform.tenant.create`, `platform.tenant.configure`, `platform.tenant.assign_operator`, `platform.tenant.change_status`, `platform.local_settings.update`
- Queries: `platform.tenant.get`, `platform.tenant.list`, `platform.local_settings.get`
- Emits: `platform.tenant.created`, `platform.tenant.configured`, `platform.tenant.status_changed`
- Consumes: none

## Dependencies

F15.S02.M03, F15.S04.M01, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-IOX-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-125-01 | [Domain schema](domain_schema.md) | 3 |
| PS-125-02 | [Validation rules](validation_rules.md) | 3 |
| PS-125-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-125-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-125-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-125-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-125-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-125-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-125-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-125-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/platform/src/configuration/tenants/index.ts`.

## Acceptance criteria

- All tests T01-T18 pass in CI.
- A relay can bootstrap from the CLI and host several tenants with separate currencies, locales and limits.
- Operator changes are validated, audited and visible to clients; the last operator can never be removed.
- LocalSettings never leave the device and no tenant concept exists in the vault.
