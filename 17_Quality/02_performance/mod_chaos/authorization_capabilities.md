# PS-138-05 — Authorization and capabilities: Chaos testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M02 Chaos testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/chaos` · **Contracts:** [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-138-05.R01** Chaos runs use only the test relay and fake ports; no real peers, hosts or credentials are touched.
- **PS-138-05.R02** Fault injection endpoints exist only in the test harness process, not exposed over HTTP.
- **PS-138-05.R03** Authorization checks keep working under fault: a denied command still denies after recovery, and audit entries are not lost.

## Specification

_None._

No runtime capabilities of its own: this module runs only in developer shells and CI jobs. Under ADR-0016 (CTR-CAP-001 CAP-8) the tests exercise two layers: vault policy (local principal mutates only its records; incoming signed statements accepted only from a key authorized for the role, else quarantined) and relay policy (relay-signed requests or relay access tokens). Tests never ship in the PWA or relay bundles.

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-138-09.T09 | chaos | PS-138-05.R01, PS-138-05.R02 | scan relay for HTTP exposure of injection endpoints | none reachable; fake ports only |
| TEST-PS-138-09.T19 | abuse | PS-138-05.R03 | issue a command the actor is not authorized for before and after db_busy and peer_outage faults | both attempts denied with the same code; both decisions have audit entries after recovery and none is lost |

## Dependencies

Module depends on: CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-FED-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M03, F15.S02.M03, F15.S01.M01, F11.S02.M01, F11.S01.M02, F01.S03.M01, F16.S02.M02, F16.S01.M01. Predecessor: [domain_schema.md](domain_schema.md).
