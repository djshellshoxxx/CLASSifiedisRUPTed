# PS-129-05 — Authorization and capabilities: Key registry and revocation

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M02 Key registry and revocation](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/management` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-129-05.R01** Vault policy: only the unlocked local principal registers own keys or revokes them; counterparty keys enter only through statements whose signatures verify, and a statement not signed by an authorized key is quarantined.
- **PS-129-05.R02** Relay policy: any key can register itself with a signed request subject to limits; revocation lists are public; relay-owned keys are registered only by relay operators.
- **PS-129-05.R03** Status queries are read-only and public for published keys, and revocation recording does not require a session because it is authorized by signatures.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| security.keyrecord.register | local principal, relay access | vault unlocked, or signed relay request; new-key signature present; limits respected |
| security.keyrecord.revoke | local principal | vault unlocked; signer authorized under V03 |
| security.keyrecord.record_revocation | local principal, relay access | statement signature authorizes under V03; source recorded |
| security.keyrecord.read_status | anonymous, member, local principal | public key status; own vault always allowed |
| security.keyrecord.read_public | anonymous | published revocation list on a relay |
| security.keyrecord.read_own | local principal, member | vault unlocked, or member on own keys on a relay |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-129-09.T08 | abuse | PS-129-05.R01, PS-129-05.R02, PS-129-05.R03, PS-129-07.R01 | stolen K3 revokes K1 and K2; unauthorized signer revokes; recovery key revokes K3 | flagged pending confirmation; SECURITY_KEY_UNAUTHORIZED; recovery revocation wins |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
