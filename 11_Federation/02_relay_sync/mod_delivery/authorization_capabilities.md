# PS-088-05 — Authorization and capabilities: Relay delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M01 Relay delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/delivery` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-088-05.R01** In the vault only the unlocked local principal routes and acknowledges its statements; vault outbox commands (resolve, discard) belong to F15.S01.M01.
- **PS-088-05.R02** On a relay, dispatch and pull are authorized by relay policy for allowlisted peers and registered device keys, and the relay operator may read queue statistics, retry and cancel entries.
- **PS-088-05.R03** Queue contents of one vault are never visible to other vaults or to relay operators beyond cid prefix and destination.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| federation.outbox.enqueue | local principal, system | vault policy: statement authored by the principal or an ack it signed; relay policy: public record or author tombstone accepted from a hosted device key |
| federation.outbox.retry | operator | relay policy: failed entry of this relay, audited |
| federation.outbox.cancel | operator, system | relay policy: non-terminal entry of this relay |
| federation.outbox.acknowledge | local principal | vault policy: ack accepted by F11.S01.M02 and signed by a recipient of the acknowledged statement |
| federation.outbox.dispatch | local principal, system | worker only; the vault adapter runs under the principal; relay peers require flag F11 on |
| federation.outbox.read | operator | relay: operator of that relay sees counts and entries per peer only |
| federation.outbox.pull | relay peer, vault device | relay policy: RFC 9421 request by an allowlisted peer or a registered device key; public envelopes only |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-088-09.T08 | abuse | PS-088-05.R01, PS-088-05.R02, PS-088-05.R03 | other vault reads routes; peer without allowlist pulls; non-operator reads relay stats | NOT_FOUND or FEDERATION_PEER_NOT_ALLOWED or FORBIDDEN |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F15.S01.M01, F15.S04.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
