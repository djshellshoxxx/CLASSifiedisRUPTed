# PS-129-05 — Authorization and capabilities: Key registry and revocation

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M02 Key registry and revocation](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/management` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-129-05.R01** Vault policy: user device keys enter only through F07 identity events and verified identity documents, counterparty status is F07.S02.M01's and is cached here with freshness, and no command of this module revokes a user key; the principal uses identity.device_key.revoke (F07.S01.M01).
- **PS-129-05.R02** Relay policy: relay_operators and admins of the relay register and revoke relay_owned keys, which are signed by the relay key; peer keys come only from F11.S03.M01 pins; revocation lists are public.
- **PS-129-05.R03** Status and public-key queries are read-only and public for published keys, and revocation and list ingestion need no session because they are authorized by signatures.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| security.keyrecord.register | relay_operator, admin | relay-scope F16.S01.M01 role; purpose vapid only; at most 20 relay-owned keys |
| security.keyrecord.revoke | relay_operator, admin | relay-scope role; relay_owned VAPID keys only; statement signed by the relay key |
| security.keyrecord.record_revocation | local principal, relay process | statement signature authorizes under V03; source recorded; user-key revocations only produce a refresh hint |
| security.keyrecord.ingest_list | local principal, relay process | head signed by the publishing relay's current key; V08 monotonic checks |
| security.keyrecord.read_public_status | anonymous, member, local principal | status and public key of published keys; own vault always allowed |
| security.keyrecord.read_public | anonymous | published revocation list and its signed head |
| security.keyrecord.read_own | local principal | vault unlocked |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-129-09.T08 | abuse | PS-129-05.R01, PS-129-05.R02, PS-129-05.R03 | vault principal calls security.keyrecord.revoke for an own device key; member registers a VAPID key; anonymous reads a status; stolen K3 tries to add a new device key K9 without a root-signed link | FORBIDDEN (identity.device_key.revoke is the path); FORBIDDEN; public status returned; SECURITY_KEY_UNAUTHORIZED |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M03, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
