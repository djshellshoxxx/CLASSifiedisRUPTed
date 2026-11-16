# PS-118-05 — Authorization and capabilities: Relay service

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M01 Relay service](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/relays` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-118-05.R01** Relay policy applies, so identity and status reads are public or operator-only, and rotation requires the relay operator role, a per-relay role that governs nothing beyond this relay (CTR-CAP-001 CAP-9).
- **PS-118-05.R02** The relay holds no user credentials; operator actions are authorized by signed requests from a device key registered as operator in the relay's own configuration, or by the local CLI with filesystem access to the key file.
- **PS-118-05.R03** Receipts and announcements are signed with the relay key under context strings, so a relay signature never authorizes any action on a vault.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| platform.relay_identity.read_public | anonymous, member, moderator, operator, admin | none; response contains only public data |
| platform.relay.read_status | operator, admin | signed request by a registered relay operator device key |
| platform.relay_identity.rotate | operator | signed request by a registered relay operator device key, or local CLI with access to the key file; at most 1 rotation per 24 h |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-118-09.T09 | abuse | PS-118-05.R01, PS-118-05.R02, PS-118-05.R03 | non-operator rotates and reads status; relay signature presented as vault authorization | FORBIDDEN; relay signature ignored by vault verification test |

## Dependencies

Module depends on: F15.S02.M02, F15.S02.M03, F15.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
