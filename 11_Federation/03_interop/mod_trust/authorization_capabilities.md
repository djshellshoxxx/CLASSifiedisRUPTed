# PS-091-05 — Authorization and capabilities: Peer trust

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M01 Peer trust](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/trust` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-091-05.R01** In a vault only the unlocked local principal manages the selected-relay list.
- **PS-091-05.R02** On a relay only that relay's operator manages peers, and every change is written to the relay audit log.
- **PS-091-05.R03** resolve_key is internal to F11.S01.M02 and F11.S02.M01 code paths and not exposed to external requests.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| federation.peer.propose | local principal, operator | vault policy: unlocked vault owner for selected_relay; relay policy: operator role of this relay for peer_relay, with audit entry |
| federation.peer.accept | local principal, operator | same as propose; requires fingerprintConfirmed |
| federation.peer.suspend | local principal, operator, system | system only for automatic health or equivocation suspension |
| federation.peer.reinstate | local principal, operator | same as propose |
| federation.peer.remove | local principal, operator | same as propose |
| federation.peer.update | local principal, operator | same as propose |
| federation.peer.read | local principal, operator | own vault or own relay only |
| federation.peer.resolve | system | internal call from the verified inbox pipeline |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-091-09.T09 | abuse | PS-091-05.R01, PS-091-05.R02, PS-091-05.R03 | non-operator manages peers on relay; external call to resolve_key; other vault reads relay list | FORBIDDEN or FEDERATION_PEER_NOT_ALLOWED or NOT_FOUND; operator change logged |

## Dependencies

Module depends on: F11.S01.M03, F15.S04.M02, F07.S02.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
