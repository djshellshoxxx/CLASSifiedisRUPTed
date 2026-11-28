# PS-125-07 — Privacy, retention and abuse: Tenants

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M03 Tenants](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/tenants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-125-07.R01** Tenant configuration is public hosting information and contains no personal data beyond operator public keys, which are pseudonymous identifiers and not proof of anonymity.
- **PS-125-07.R02** LocalSettings are P3, stay on the device, are not telemetry and are never uploaded as a record; they can reveal a user's language, currencies and chosen relays, so they are excluded from federation and from any relay request, with one exception - a copy of defaultLocale is sent only in the F13.S01.M02 notify.email.add registration after notify_email consent, sealed to that one user-selected email relay.
- **PS-125-07.R03** Archived tenants are purged after 90 days and their exported configuration remains with the operator.
- **PS-125-07.R04** The module registers ExportSectionPort (section platform.local_settings), DeletionPort and RetentionPurgePort for F10.S01.M03, F10.S01.M04 and F10.S01.M02 through the kernel port registry (inverted dependency, because F10.S01.M04 depends on F15.S01.M01, which depends on this module), classifies every field with F10.S02.M02 and consumes privacy.deletion.completed (N6).

## Specification

**Data classification**
- Tenant and tenant_config statements: P0 public hosting configuration and derived operator public keys.
- LocalSettings: P3 preferences (defaultLocale, preferredCurrencies, a11yMotion, moneyDisplay), vaultId and known relay configurations, device only; a copy of defaultLocale leaves the device only in the consented F13.S01.M02 email registration to the one selected email relay, where F13.S01.M02 owns that copy.

**Retention**
- Tenant: RET-STANDARD while the community exists; archived tenants purged 90 days after archiving; configuration statements kept as long as the tenant; operator audit of tenant changes 1 year (RET-AUDIT).
- LocalSettings: until the vault is erased (DeletionPort).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Rogue operator weakens limits or changes currencies to harm members | every revision is a relay-signed statement vaults store and compare before publishing, limits have hard maximums, all changes audited, members may leave |
| T02 | Takeover by adding a malicious operator key | operators exist only as F16.S01.M01 RoleAssignments granted by a relay admin with expiry ≤ 365 days; tenant operators cannot add operators or use relay-wide capabilities; the last operator is protected; operator keys appear in every signed configuration, so a vault sees the change |
| T03 | Slug squatting or lookalike community names | slug unique per relay, display name plain text only, relay identity fingerprint shown in the client next to the name |
| T04 | Leakage of local preferences to a relay | LocalSettings never included in any relay request or statement, except the defaultLocale copy in the F13.S01.M02 notify.email.add registration after notify_email consent, sealed to that one user-selected email relay; network test verifies both the exception and its absence without consent |
| T08 | Break-glass bootstrap used to seize a running relay | RoleBootstrapPort refuses an admin key while an admin exists unless a 20..500 code point reason is given from the local CLI; F16.S01.M01 records the OS user and opens a SEV1 incident; HTTP create never carries an admin key |
| T05 | Tenant enumeration across relays | platform.tenant.get is public by design for the relay's own communities only; no cross-relay directory in MVP |
| T06 | Relay shows different configurations to different clients | each revision is a relay-signed statement; two statements for one revision are kept as proof and shown as an equivocation warning |
| T07 | Cross-tenant escalation by an operator of another community | every tenant capability checks a RoleAssignment of scope tenant:<tenantId>; abuse tests cover T1 operators acting on T2 |

**Abuse controls**
- Tenant creation limited to relay admins and 50 tenants per relay; configure limited to 30 changes per minute per operator.
- Suspension by an operator requires a reason that is shown to clients, and every status change is audit-logged with actor and capability.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-125-09.T09 | integration | PS-125-07.R01, PS-125-07.R03 | archive tenant and advance 90 days | purged from relay; operator export exists; audit retained 1 year |
| TEST-PS-125-09.T10 | abuse | PS-125-07.R02, PS-125-07.R01, PS-125-01.R03 | capture network traffic during LocalSettings changes (including a11yMotion and moneyDisplay), publishing, and the email opt-in with and without notify_email consent | zero requests contain currency preferences, display preferences or the vaultId; the locale appears only in the consented notify.email.add registration, sealed to that one selected email relay, and not at all without consent |
| TEST-PS-125-09.T11 | abuse | PS-125-07.R01, PS-125-07.R02 | O1 adds a key through assign_operator; A1 removes the last operator of T1 | FORBIDDEN and PLATFORM_TENANT_LAST_OPERATOR; the client shows the signed configuration with unchanged operators |
| TEST-PS-125-09.T26 | integration | PS-125-07.R04 | export section, deletion plan and retention purge through the F10 ports, then privacy.deletion.completed for L1 | section platform.local_settings with P3 field classes; deletion removes LocalSettings; nothing purged early; no row remains |

## Dependencies

Module depends on: F15.S02.M03, F15.S02.M01, F15.S04.M01, F16.S01.M01, F10.S02.M02, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-IOX-001, CTR-OBS-001, CTR-SCH-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
