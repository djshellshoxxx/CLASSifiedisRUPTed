# PS-049-03 — Workflow state machine: Proximity queries

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M03 Proximity queries](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/proximity` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-049-03.R01** The module has no entity lifecycle; each query is evaluated independently against current counters.
- **PS-049-03.R02** Counter windows slide by fixed buckets (1 min, 1 h, 24 h) and reset by expiry, not by operator edits.
- **PS-049-03.R03** A blocked or rate-limited caller recovers automatically when the window ends.

## Specification

**Note:** Stateless per request; counters are ephemeral relay-side values, not entity state.

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-049-09.T05 | abuse | PS-049-02.R02, PS-049-03.R03, PS-049-07.R03 | third new center within 1 h and sixth within 24 h; recovery after window | RATE_LIMITED with reason center_changes and retryAfterMs; works again after the window |
| TEST-PS-049-09.T06 | abuse | PS-049-02.R02, PS-049-03.R02 | 21 queries in one minute as anonymous, 61 as token caller | 21st and 61st RATE_LIMITED with reason per_minute |
| TEST-PS-049-09.T15 | unit | PS-049-01.R01, PS-049-03.R01 | read relay policy values and inspect counters storage | policy versioned, counters hashed with rotating salt and expire in 24 h |

## Dependencies

Module depends on: F06.S02.M01, F06.S01.M01, F06.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
