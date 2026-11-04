# PS-084-05 — Authorization and capabilities: Federated records

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M02 Federated records](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/records` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-084-05.R01** Vault policy applies in the browser vault where only the unlocked local principal may publish statements or issue tombstones, and received statements are accepted only when signed by a key authorized for the role.
- **PS-084-05.R02** Relay policy applies to the inbox where access requires a registered device key or an allowlisted peer relay; relay roles moderator and operator govern only what that relay hosts (CAP-9).
- **PS-084-05.R03** Public mirror reads are open to anyone the relay or vault serves; provenance diagnostics are local-principal or relay-operator reads.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| federation.record.ingest | relay peer, vault device | relay policy: request signed by an active allowlisted peer relay (flag F11 on) or by a device key registered with this relay; quota not exceeded |
| federation.record.receive | local principal | vault policy: unlocked vault; signer role verified per V14, otherwise quarantine |
| federation.record.publish | local principal | vault policy: envelope author is a device key of the principal; record opted in by its owner |
| federation.tombstone.issue | local principal, operator | vault policy: principal authored the target; relay operator may issue origin_relay tombstones for content that relay hosts, with an audit entry |
| federation.record.read_public | local principal, anonymous | vault: any local read; relay: public projections with status accepted only |
| federation.record.read_head | local principal | author is a did of the principal |
| federation.record.read_provenance | local principal, operator | vault: own vault; relay: operator of that relay or moderator with an open local case referencing the cid |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-084-09.T10 | abuse | PS-084-05.R02, PS-084-07.R01 | third party signs tombstone for X's record | FEDERATION_TOMBSTONE_UNAUTHORIZED and record remains accepted |
| TEST-PS-084-09.T17 | abuse | PS-084-05.R01, PS-084-05.R02, PS-084-05.R03 | unsigned and unknown-peer requests to the relay inbox; relay reads provenance without operator role; vault publish with a key not in the principal's document | FEDERATION_PEER_NOT_ALLOWED or FEDERATION_REQUEST_SIGNATURE_INVALID, FORBIDDEN, FEDERATION_AUTHOR_NOT_OWNED |
| TEST-PS-084-09.T18 | integration | PS-084-05.R02, PS-084-06.R01 | local publish with own key, then with another principal's did; relay ingest batch replayed with the same Idempotency-Key | first accepted, second FEDERATION_AUTHOR_NOT_OWNED, replay returns original response |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M03, F11.S02.M02, F11.S02.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F15.S04.M02, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
