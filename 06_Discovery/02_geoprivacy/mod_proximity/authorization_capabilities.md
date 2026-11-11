# PS-049-05 — Authorization and capabilities: Proximity queries

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M03 Proximity queries](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/proximity` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-049-05.R01** Vault policy - local proximity search is available to the unlocked principal only and has no rate limit.
- **PS-049-05.R02** Relay policy - the relay endpoint allows anonymous callers at reduced precision and quota, and token or signed-request callers (keyed by their per-relay access token) at the higher quota; a relay may disable anonymous access.
- **PS-049-05.R03** Relay moderators and operators get no extra proximity powers; they can only change policy values.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| discovery.proximity_area.search | principal, anonymous | vault - unlocked principal, no limit; relay - caller class and shared proximity budget through RateLimitPort, anonymous only when the relay setting anonymousAllowed is true |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-049-09.T08 | abuse | PS-049-05.R01, PS-049-05.R02, PS-049-05.R03 | locked vault queries locally; operator tries special access on relay; anonymous at a relay with anonymousAllowed false | UNAUTHENTICATED until unlock; operator has no extra power; anonymous gets FORBIDDEN |
| TEST-PS-049-09.T10 | integration | PS-049-01.R01, PS-049-05.R01 | local proximity offline over local index with 5 000 documents | results returned with no limits applied and no relay call |

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, F06.S01.M03, F06.S03.M01, F06.S03.M02, F07.S02.M02, F11.S01.M03, F12.S01.M01, F12.S03.M01, F12.S03.M02, F12.S03.M03, F15.S04.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
