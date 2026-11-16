# PS-123-07 — Privacy, retention and abuse: Feature registry

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S04.M01 Feature registry](SPEC.md) · **Scope:** MVP · **Code:** `packages/platform/src/configuration/feature` · **Contracts:** [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-123-07.R01** The registry contains no personal data and no per-user information, only public module metadata.
- **PS-123-07.R02** Querying the registry reveals nothing about a user's configuration, which lives in F15.S04.M02.
- **PS-123-07.R03** A tampered registry in a modified client cannot enable server-side features on a relay because relays evaluate their own flags (F15.S04.M02).

## Specification

**Data classification**
- Registry: P0 public metadata.

**Retention**
- Not stored beyond the application bundle; superseded with each release.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Modified registry in a hostile client claims dependencies are satisfied | registry is advisory in the vault for UX; relays enforce dependencies using their own copy and FEATURE_DISABLED checks |
| T02 | Cycle or missing edge introduced by a careless spec edit | CI generation check on every pull request, cycle path printed, property test over random graphs |
| T03 | Registry drift between vault and relay | hash comparison query and a UI notice listing unknown modules instead of failing |

**Abuse controls**
- Queries are in-memory and limited to 100 requests per minute per client on a relay (relay policy), which suffices because results are static.
- Registry size capped at 1 MiB uncompressed; generation fails above 512 KiB so that the initial JS budget is protected.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-123-09.T09 | abuse | PS-123-07.R01, PS-123-07.R02, PS-123-07.R03 | inspect registry and query payloads | contain no personal data or configuration values; client-claimed dependency satisfaction not trusted by relay |

## Dependencies

Module depends on: CTR-FLG-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
