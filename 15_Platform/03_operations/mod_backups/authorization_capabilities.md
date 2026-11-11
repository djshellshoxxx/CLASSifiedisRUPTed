# PS-120-05 — Authorization and capabilities: Backups

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M02 Backups](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/backups` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-120-05.R01** Relay policy applies, and only a key holding the relay-scope relay_operator or admin role of this relay (an F16.S01.M01 RoleAssignment) may run, verify or read backups; tenant-scoped operator roles grant nothing here.
- **PS-120-05.R02** The module has no vault access and handles no user credentials; requests are signed by a device key with an active F16.S01.M01 RoleAssignment, or come from the local CLI with filesystem access.
- **PS-120-05.R03** Backup artifacts are readable only with the operator-supplied key, and the key never passes through the API.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| platform.backup.run | relay_operator, admin | signed request by a key with an active relay-scope F16.S01.M01 RoleAssignment, or local CLI; max 1 per 10 minutes |
| platform.backup.verify | relay_operator, admin | signed request by a key with an active relay-scope F16.S01.M01 RoleAssignment, or local CLI; restores only into RELAY_DATA_DIR/tmp-verify-<id> and deletes it afterwards |
| platform.backup.read | relay_operator, admin | signed request by a key with an active relay-scope F16.S01.M01 RoleAssignment, or local CLI |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-120-09.T07 | abuse | PS-120-05.R01, PS-120-05.R02, PS-120-05.R03 | member key, tenant-scoped operator key and expired relay_operator assignment call run, verify, list; artifact read without key | FORBIDDEN for all three; ciphertext does not decrypt without key; key never in API output |

## Dependencies

Module depends on: F15.S02.M01, F15.S02.M03, F15.S03.M01, F16.S01.M01, CTR-IOX-001, CTR-PRV-001, CTR-OBS-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
