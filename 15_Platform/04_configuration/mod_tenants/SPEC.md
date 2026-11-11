# F15.S04.M03 — Tenants

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F15.S04](../SPEC.md). **Process IDs:** PS-125-01…PS-125-10. **Code:** `packages/platform/src/configuration/tenants`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A tenant is relay-local configuration: a community hosted by one relay, with its allowed currencies, jurisdiction profile, default locale and limits. A relay may host several tenants, and a single-community relay has one fixed tenant created at bootstrap (CTR-ID-001 ID-6). Operators and admins are not stored here: the single source of operator and admin roles is the F16.S01.M01 RoleAssignment, scoped tenant:<id> for tenant operators, and bootstrap creates the tenant together with its first operator and admin assignments in one transaction. Every configuration revision is published as a relay-signed statement (classrup.platform.tenant_config/v1) that vaults store and compare, status and limits are enforced by named modules through TenantPort, and "suspended" means suspended on that relay (CTR-CAP-001 CAP-9). The vault has no relay tenant record: its ID-6 tenant slot is the per-vault UUIDv7 vaultId created at vault initialisation and kept in the vault's LocalSettings, together with local preferences (default locale, preferred currencies, motion and money display preferences, local limits) that stay on the device; the one exception is a copy of defaultLocale in the consented F13.S01.M02 email registration.

## Responsibilities

- Own the Tenant record on a relay with slug, display name, status, allowed currencies (1..20), jurisdiction profile id, default locale and limits, with revision-based concurrency; operator keys are a derived read of F16.S01.M01 RoleAssignment records of scope tenant:<id>.
- Bootstrap the first tenant from the relay CLI with filesystem access (relay tenant bootstrap --slug <slug> --operator <did:key> [--admin <did:key>] [--break-glass --reason <text>]), creating the tenant and its first operator and admin assignments through F16 RoleBootstrapPort.bootstrap({ adminKey?, operatorKeys, tenantId, breakGlassReason?, osUser }) in the same transaction, and allow a relay admin to create further tenants on a multi-community relay (up to 50 per relay) without granting any admin role; admin grants after bootstrap go only through security.roleassignment.propose and approve of F16.S01.M01.
- Publish every configuration revision as a relay-signed classrup.platform.tenant_config/v1 statement (signed through the RelaySignerPort of F15.S02.M01) returned by platform.tenant.get, so vaults can store, verify and compare what the relay told them.
- Register TenantPort with the F15.S02.M02 bus (writes to a suspended or archived tenant answer PLATFORM_TENANT_SUSPENDED) and with the relay process, and serve limits(tenantId) to the module that enforces each limit - maxIndexedListingsPerPublisher and allowedCurrencies the relay index and publish intake (F06.S01.M01, F11.S01.M02), maxUploadBytes the media upload route (F15.S02.M01 into F15.S02.M03), maxMailboxBytesPerRecipient and maxEnvelopeBytes the mailbox (F08.S01.M01), maxCycleLength relay matching (F02.S02.M03), and the relay discovery settings anonymousAllowed, anonymousMinRadiusKm, anonymousCenterLevel and maxDepth relay proximity queries (F06.S02.M03).
- Own the vault-local LocalSettings record holding the vaultId (the ID-6 tenantId of every vault record), local preferences (including the optional a11yMotion and moneyDisplay display preferences that the PWA shell passes to F14.S01.M01 setMotionPreference and F14.S02.M02 formatMoney) and local limits (maxOutboxEntries enforced by F15.S01.M01, maxLocalAttachmentBytes by the vault blob store), stored only in the user's vault and included in the user's export.
- Emit platform.tenant.created, platform.tenant.configured (with the full configuration snapshot, also at creation and on operator changes) and platform.tenant.status_changed, so consumers react without reading the tenant.
- Register the F10 privacy ports for LocalSettings (N6) by inverted port registration, because F10.S01.M04 already depends on F15.S01.M01, which depends on this module.

## Not responsible for

- Registering currencies and validating that a code is a registered asset (F09.S03.M01 CurrencyDef); refusing records in a currency the tenant does not allow is done by the relay index and publish intake (F06.S01.M01, F11.S01.M02) through TenantPort.
- Resolving jurisdiction profiles to retention and legal rules (F18.S01.M01); this module stores only the profile id and F18 falls back to the generic profile when the id is unknown.
- Message catalogs and locale negotiation (F14.S02.M01 falls back to en for an unsupported default locale).
- Role assignment records and authorization decisions (F16.S01.M01 RoleAssignment is the single source of operator and admin roles; this module calls it through RoleBootstrapPort and security.roleassignment.assign and revoke with role operator at scope tenant:<id>, stores no operator list, and never grants an admin role outside bootstrap, because admin grants are security.roleassignment.propose and approve with a signed approval from a second admin).
- Applying the display preferences (F14.S01.M01 motion, F14.S02.M02 money formatting) and email registration (F13.S01.M02 notify.email.add, which carries its own consented copy of defaultLocale).
- Rate policy (F12.S03.M03 RatePolicy owns request rates; the tenant record has no rate limit).
- Flag values (F15.S04.M02) and relay process configuration (F15.S02.M01).
- Future: per-tenant branding and custom domains; Future: signed tenant directory shared between federated relays.

## User stories

- As a relay operator, I can start a relay for my town, name the community, choose EUR as the only currency, set the German default locale and limits, and name my own device key as the first operator and admin.
- As a relay operator running two communities, I can configure each with different currencies and limits and suspend one without affecting the other.
- As a member, I can set my own default language and preferred currencies on my device, and these settings are not shared with any relay.
- As a member, I can see which currencies, jurisdiction profile, limits and operators the selected relay applies before I publish, signed by the relay, and I am told what changed since my last visit.

## Edge cases

- Shrinking allowedCurrencies while listings in a removed currency exist; allowed, existing records keep their currency, the relay index and publish intake refuse new projections in removed currencies through TenantPort, and the change event carries the removed codes.
- Removing the last operator assignment of a tenant; refused with PLATFORM_TENANT_LAST_OPERATOR so the community cannot become unmanageable.
- Two operators edit settings at once; the second gets CONFLICT_REVISION with currentRevision.
- A tenant is suspended; the bus TenantPort stage refuses member writes for it with PLATFORM_TENANT_SUSPENDED while reads and exports stay available, its operators may still configure and resume it, and other tenants and all vaults are unaffected.
- The slug is malformed; refused with VALIDATION_FAILED; the slug is already used on this relay; refused with PLATFORM_TENANT_SLUG_TAKEN.
- Bootstrap is run twice with the same arguments; the second run finds the existing tenant and role assignments and returns them unchanged (idempotent), a different slug on a single-tenant relay is refused.
- A limit is set above its allowed maximum (for example maxUploadBytes 10 MiB or maxEnvelopeBytes 1 MiB); refused with VALIDATION_FAILED and the maximum (5242880, 262144) in fields.
- An admin grants a tenant operator role directly through security.roleassignment.assign; this module consumes security.role.assigned and publishes a new signed configuration listing the new operator key.
- Bootstrap names an admin key on a relay that already has an active admin; RoleBootstrapPort refuses with SECURITY_BOOTSTRAP_REFUSED and no tenant or assignment is created, unless the operator gives --break-glass with a reason of 20 to 500 code points, which F16.S01.M01 records with the OS user and reports as a SEV1 incident.
- A relay admin sends platform.tenant.create over HTTP with adminKey; refused with VALIDATION_FAILED, because admin grants go only through security.roleassignment.propose and approve.
- An operator sets anonymousMinRadiusKm 10, anonymousCenterLevel L2 or maxDepth 600; refused with VALIDATION_FAILED, because F06.S02.M03 never serves anonymous centers finer than L1, radii below 25 km or depths above 500.
- An imported LocalSettings record carries a11yMotion fast or moneyDisplay emoji; the import keeps the other preferences and replaces each invalid value with its default (system, symbol).
- A tenant operator tries to rotate the relay identity, run a backup or replay dead letters; refused with FORBIDDEN because those relay-wide capabilities need the relay_operator role.
- The relay shows different configurations to different clients; each is a relay-signed statement with a revision, so a vault that sees two different statements for one revision holds proof and shows a warning.
- The vault default locale is unsupported by the build; the app falls back to en and shows a notice, no error.

## UX and accessibility

- Operator console > Community: form for display name, currencies (chip input with ISO code check), jurisdiction profile (select), default locale (select), limits table with defaults, maximums and the enforcing module, and the operators list (from F16 role assignments) with add (admin) and remove (admin).
- Settings > Preferences (vault): language, preferred currencies, display options (reduce motion: follow system or reduced; money shown as symbol, code or name); clearly marked 'Stored on this device; your language is also shared with your email relay if you turn on email notifications'.
- Relay details sheet (client): shows the selected relay's signed community configuration (name, allowed currencies, jurisdiction profile id, limits, operators, status), its revision and 'Changed since your last visit' with the differences.

**States:** loading; ready; saving; conflict; suspended; archived; offline-read-only; validation-error; config-equivocation

**Accessibility:** Every field has a visible label with units (for example bytes shown as MiB) and error messages are linked with aria-describedby.; Currency chips are removable by keyboard with accessible names, and status changes are announced via aria-live polite.; Destructive actions (suspend, archive, remove operator) use a confirmation dialog with focus on the cancel action.

## Owned data

- `Tenant` (classrup.platform.tenant/v1, P0, RET-STANDARD)
- `LocalSettings` (classrup.platform.local_settings/v1, P3, RET-STANDARD)

## Interfaces

- Commands: `platform.tenant.create`, `platform.tenant.configure`, `platform.tenant.assign_operator`, `platform.tenant.change_status`, `platform.local_settings.update`
- Queries: `platform.tenant.get`, `platform.tenant.list`, `platform.local_settings.get`
- Emits: `platform.tenant.created`, `platform.tenant.configured`, `platform.tenant.status_changed`
- Consumes: `security.role.assigned`, `security.role.revoked`, `privacy.deletion.completed`

## Dependencies

F15.S02.M03, F15.S02.M01, F15.S04.M01, F16.S01.M01, F10.S02.M02, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-IOX-001, CTR-OBS-001, CTR-SCH-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-125-01 | [Domain schema](domain_schema.md) | 6 |
| PS-125-02 | [Validation rules](validation_rules.md) | 5 |
| PS-125-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-125-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-125-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-125-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-125-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-125-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-125-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-125-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/platform/src/configuration/tenants/index.ts`.

## Acceptance criteria

- All tests T01-T30 pass in CI.
- A relay can bootstrap from the CLI and host several tenants with separate currencies, locales and limits, and every limit is enforced by its named module.
- Operator changes are made only through F16 role assignments by admins, are validated, audited and visible to clients as signed configuration; the last operator can never be removed.
- LocalSettings never leave the device except the consented defaultLocale copy in the F13.S01.M02 email registration, no relay tenant record exists in the vault, and every vault record carries its vault's own vaultId as tenantId.
