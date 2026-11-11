# PS-124-05 — Authorization and capabilities: Feature flags

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M02 Feature flags](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/flags` · **Contracts:** [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-124-05.R01** Vault policy applies, so only the unlocked local principal can change or reset vault-scope flags, and no remote party can change them.
- **PS-124-05.R02** Relay policy applies, so only a key holding an active F16.S01.M01 RoleAssignment of role operator for scope tenant:<tenantId>, or admin, on that relay can change or reset relay-scope flags, and that changes only what that relay hosts for that community (CTR-CAP-001 CAP-9).
- **PS-124-05.R03** Effective values may be read by any local principal, and by any relay client for the community they use, because clients need them to hide entry points.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| platform.flag.set | local-principal | vault unlocked; actor owns the vault; vault scope only (set and reset) |
| platform.flag.set_relay | operator, admin | signed request by a key holding an active F16.S01.M01 RoleAssignment of role operator for scope tenant:<tenantId> or admin on this relay; Idempotency-Key; rate limit 30 changes per minute (set_relay and reset_relay) |
| platform.flag.read_effective | anonymous, member, moderator, operator, admin | none for relay public effective values; vault policy for vault scope |
| platform.flag.read_settings | local-principal, operator, admin | vault owner for vault scope; tenant operator or admin for relay scope (includes reasons and actors) |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-124-09.T08 | abuse | PS-124-05.R01, PS-124-05.R02, PS-124-05.R03 | member M1 and O2 (operator of T2) change T1's relay flags; relay tries to change vault flags | FORBIDDEN; no remote path alters vault flags |
| TEST-PS-124-09.T10 | integration | PS-124-06.R03, PS-124-05.R03 | user turns F13 push and F06 location off, then the settings store becomes unreadable in a new process with and without the mirror row; relay settings unreadable; FUTURE module queried | with the mirror the switched-off modules stay off (source last_committed); without it every switchable non-core module is off (source fail_closed) and 'settings unavailable' is shown; relay commands of affected modules answer DEPENDENCY_UNAVAILABLE; FUTURE module off |
| TEST-PS-124-09.T19 | abuse | PS-124-05.R02, PS-124-04.R01 | member M1, O2 and O1 call platform.flag.reset_relay on T1 for a module whose default is on; L1 calls platform.flag.reset with a relay scope argument | M1 and O2 get FORBIDDEN and the module stays off; O1 succeeds with one audit row; the vault reset refuses the relay scope with VALIDATION_FAILED |

## Dependencies

Module depends on: F15.S04.M01, F15.S04.M03, F15.S02.M03, F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FLG-001, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-EVT-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
