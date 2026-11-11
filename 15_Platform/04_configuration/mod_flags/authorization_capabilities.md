# PS-124-05 — Authorization and capabilities: Feature flags

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M02 Feature flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/flags` · **Contracts:** [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-124-05.R01** Vault policy applies, so only the unlocked local principal can change vault-scope flags, and no remote party can change them.
- **PS-124-05.R02** Relay policy applies, so only a relay operator or admin of the relay and community can change relay-scope flags, and that changes only what that relay hosts (CTR-CAP-001 CAP-9).
- **PS-124-05.R03** Effective values may be read by any local principal, and by any relay client for the community they use, because clients need them to hide entry points.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| platform.flag.set | local-principal | vault unlocked; actor owns the vault (vault scope only) |
| platform.flag.set_relay | operator, admin | signed request by an operator device key registered for the tenant on this relay; rate limit 30 changes per minute |
| platform.flag.read_effective | anonymous, member, moderator, operator, admin | none for relay public effective values; vault policy for vault scope |
| platform.flag.read_settings | local-principal, operator, admin | vault owner for vault scope; relay operator for relay scope (includes reasons and actors) |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-124-09.T08 | abuse | PS-124-05.R01, PS-124-05.R02, PS-124-05.R03 | non-operator and other tenant's operator change relay flags; relay tries to change vault flags | FORBIDDEN; no remote path alters vault flags |
| TEST-PS-124-09.T10 | integration | PS-124-06.R03, PS-124-05.R03 | settings table unreadable, FUTURE module queried | defaults used, FUTURE and host-dependent features off, diagnostic logged |

## Dependencies

Module depends on: F15.S04.M01, F15.S04.M03, F15.S02.M03, CTR-FLG-001, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
