# PS-127-05 — Authorization and capabilities: Secrets handling

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M02 Secrets handling](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/secrets` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-127-05.R01** Only the relay process user can read secret files, and the library enforces owner and mode checks at load time.
- **PS-127-05.R02** Operators access secrets through the hosting environment, never through the product's API.
- **PS-127-05.R03** The CI scan runs with read-only repository access and cannot publish artifacts on failure.

## Specification

_None._

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-127-09.T08 | abuse | PS-127-05.R01, PS-127-05.R02, PS-127-05.R03, PS-127-07.R02 | attempt to read secrets via any command or query; scanner run with write token | no route exposes secrets; scanner cannot publish |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-CAP-001. Predecessor: [domain_schema.md](domain_schema.md).
