# PS-125-07 — Privacy, retention and abuse: Tenants

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M03 Tenants](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/tenants` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-125-07.R01** Tenant configuration is public hosting information and contains no personal data beyond operator public keys, which are pseudonymous identifiers and not proof of anonymity.
- **PS-125-07.R02** LocalSettings stay on the device, are not telemetry, and are never uploaded; they can reveal a user's language and currencies, so they are excluded from federation and from any relay request.
- **PS-125-07.R03** Archived tenants are purged after 90 days and their exported configuration remains with the operator.

## Specification

**Data classification**
- Tenant: P0 public hosting configuration and operator public keys.
- LocalSettings: P1 preferences, device only.

**Retention**
- Tenant: RET-STANDARD while the community exists; archived tenants purged 90 days after archiving; operator audit of tenant changes 1 year (RET-AUDIT).
- LocalSettings: until the vault is erased.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Rogue operator weakens limits or changes currencies to harm members | changes are public events, vaults see the relay's configuration before publishing and may leave, limits have hard maximums, all changes audited |
| T02 | Takeover by adding a malicious operator key | adding keys needs an existing operator signature, removing needs admin, last operator protected, every change emitted as an event that vault clients display |
| T03 | Slug squatting or lookalike community names | slug unique per relay, display name plain text only, relay identity fingerprint shown in the client next to the name |
| T04 | Leakage of local preferences to a relay | LocalSettings never included in any relay request or statement; network test verifies |
| T05 | Tenant enumeration across relays | platform.tenant.get is public by design for the relay's own communities only; no cross-relay directory in MVP |

**Abuse controls**
- Tenant creation limited to admins and 50 tenants per relay; configure limited to 30 changes per minute per operator.
- Suspension by an operator requires a reason that is shown to clients, and every status change is audit-logged with actor and capability.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-125-09.T09 | integration | PS-125-07.R01, PS-125-07.R03 | archive tenant and advance 90 days | purged from relay; operator export exists; audit retained 1 year |
| TEST-PS-125-09.T10 | abuse | PS-125-07.R02, PS-125-07.R01 | capture network traffic during LocalSettings changes and publishing | zero requests contain locale or currency preferences |
| TEST-PS-125-09.T11 | abuse | PS-125-07.R01, PS-125-07.R02 | add a malicious operator key without existing operator signature; remove the last operator | FORBIDDEN and PLATFORM_TENANT_LAST_OPERATOR; events displayed in client |

## Dependencies

Module depends on: F15.S02.M03, F15.S04.M01, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-MNY-001, CTR-PRV-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
