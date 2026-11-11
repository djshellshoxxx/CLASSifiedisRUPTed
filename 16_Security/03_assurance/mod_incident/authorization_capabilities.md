# PS-131-05 — Authorization and capabilities: Incident records

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M02 Incident records](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/incident` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-131-05.R01** Relay policy: relay_operators and admins of the relay (relay-scope F16.S01.M01 roles) open, triage, contain, resolve and close incidents, admins notify and redact timeline entries, moderators and tenant operators have no access, and members never read incident records.
- **PS-131-05.R02** Vault policy: a vault accepts an incident notice only when signed by the key of a relay it uses, shows it with the relay name and never changes local data because of it; a notice from a successor relayId that the old relay's key revocation or restore announcement names is shown as 'unverified until confirmed out of band', never silently quarantined and never acted on.
- **PS-131-05.R03** Detection hooks run as actor kind system with a restricted capability to open incidents only.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| security.incident.open | relay_operator, admin | relay-scope role; hooks run as system with open only |
| security.incident.triage | relay_operator, admin | relay-scope role |
| security.incident.annotate | relay_operator, admin | relay-scope role |
| security.incident.contain | relay_operator, admin | relay-scope role |
| security.incident.resolve | relay_operator, admin | relay-scope role |
| security.incident.notify | admin | relay-scope admin; notification decision recorded with reason |
| security.incident.redact | admin | relay-scope admin; one redaction per timeline row; reason recorded; audit entry written |
| security.incident.close | relay_operator, admin | relay-scope role; SEV1 and SEV2 need postmortem and notification decision; pending notices need an override reason |
| security.incident.read | relay_operator, admin | relay-scope role |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-131-09.T07 | abuse | PS-131-05.R01, PS-131-05.R03 | moderator M, tenant operator T and a member read incidents; the system hook actor tries triage | FORBIDDEN or NOT_FOUND; FORBIDDEN |
| TEST-PS-131-09.T17 | abuse | PS-131-05.R02 | vault receives a notice signed by an unknown key; by a successor relayId named in its relay's key revocation; by a successor relayId known only through a restore announcement naming the old relayId after a certificate-only revocation; by the key of the relay it uses | first quarantined by F11.S01.M02; second and third shown as unverified until confirmed out of band and not acted on; fourth shown with the relay name and no local data change |

## Dependencies

Module depends on: F16.S01.M01, F16.S01.M02, F16.S02.M02, F16.S02.M03, F16.S03.M01, F18.S01.M01, F08.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
