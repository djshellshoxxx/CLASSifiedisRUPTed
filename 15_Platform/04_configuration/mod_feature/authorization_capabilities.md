# PS-123-05 — Authorization and capabilities: Feature registry

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M01 Feature registry](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/feature` · **Contracts:** [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-123-05.R01** Registry data is public information about the application, so queries are available to every local principal and to anonymous relay clients without authentication.
- **PS-123-05.R02** Vault policy applies locally and relay policy applies on a relay; neither can alter the registry because it is read-only and compiled in.
- **PS-123-05.R03** No capability exists to modify the registry at runtime, which prevents an operator or remote party from rewriting the dependency graph.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| platform.feature.read_registry | anonymous, member, moderator, operator, admin | none; read-only static data (vault policy: local principal; relay policy: public) |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-123-09.T06 | abuse | PS-123-05.R01, PS-123-05.R02, PS-123-05.R03 | attempt to mutate the registry through the API and as a hostile client | no mutation path exists; relay ignores client-claimed flags |

## Dependencies

Module depends on: CTR-FLG-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
