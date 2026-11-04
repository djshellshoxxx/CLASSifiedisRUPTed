# PS-082-04 — Commands, queries and events: Privacy threat model

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M01 Privacy threat model](SPEC.md) · **Scope:** MVP · **Code:** `docs/privacy/threat_model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-082-04.R01** The module exposes no runtime commands, queries or events; its interface is the catalog file and the CI check command.
- **PS-082-04.R02** The CI check prints a table of threats with control and test counts and exits non-zero on any violation.
- **PS-082-04.R03** The check output is machine readable JSON in addition to text for the completeness report.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| PRIVACY_THREAT_INVALID | 422 | no | CI check found a threat entry that is incomplete or references unknown IDs |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Documentation and CI-check module. Interface: docs/privacy/threat_model/threats.yaml, rendered THREAT_MODEL.md, and the CI command privacy-threat-check which returns exit code 0 or 1 and a JSON summary. No relay or vault commands, no events.

### Example

```
threat entry excerpt:
id: PT-01  title: Trilateration of a seller's location through repeated distance queries
adversaries: [A2 curious member, A3 relay operator]  assets: [home area]
controls: [F10.S02.M03 coarse cells, CTR-PRV-001 PRV-2 distance buckets and minimum radius 5 km, relay rate limits]
residualRisk: A determined adversary with many queries over weeks may narrow a user to a 5 km cell, not to an address.
tests: [PRIVT-GEO-01, PRIVT-GEO-02]
CI: privacy-threat-check => 14 active threats, 0 violations
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-082-09.T03 | unit | PS-082-02.R03, PS-082-04.R01 | fixture with geolocation entry removed | check fails on missing mandatory topic |
| TEST-PS-082-09.T06 | contract | PS-082-04.R02, PS-082-04.R03, PS-082-09.R02 | run the check with --json | JSON summary validates against its schema and matches text output |

## Dependencies

Module depends on: F10.S02.M02, F10.S02.M03, F10.S01.M01, CTR-PRV-001, CTR-FED-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
