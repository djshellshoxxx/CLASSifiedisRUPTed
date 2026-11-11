# PS-131-05 — Authorization and capabilities: Incident records

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M02 Incident records](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/incident` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-131-05.R01** Relay policy: operators and admins of the relay open, triage, contain, resolve, notify and close incidents; moderators have no access; members never read incident records.
- **PS-131-05.R02** Vault policy: a vault accepts an incident notice only when signed by the relay key it uses, shows it with the relay name, and never changes local data because of it.
- **PS-131-05.R03** Detection hooks run as actor kind system with a restricted capability to open incidents only.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| security.incident.open | operator, admin | relay role; hooks run as system with open only |
| security.incident.triage | operator, admin | relay role |
| security.incident.annotate | operator, admin | relay role |
| security.incident.contain | operator, admin | relay role |
| security.incident.resolve | operator, admin | relay role |
| security.incident.notify | admin | relay role admin; notification decision recorded with reason |
| security.incident.close | operator, admin | relay role; SEV1 and SEV2 need postmortem and notification decision |
| security.incident.read | operator, admin | relay role |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-131-09.T07 | abuse | PS-131-05.R01, PS-131-05.R02, PS-131-05.R03 | moderator and member read incidents; vault accepts notice signed by another key | FORBIDDEN or NOT_FOUND; notice quarantined |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M02, F16.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
