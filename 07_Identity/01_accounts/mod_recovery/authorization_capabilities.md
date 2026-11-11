# PS-053-05 — Authorization and capabilities: Account recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M03 Account recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-053-05.R01** Vault policy - creating and verifying a kit require an unlocked vault; begin runs in a new or empty vault where possession of the words and file is the authorization.
- **PS-053-05.R02** Disputes are authorized by a signature from a device key active in the account's latest document known to the receiving vault; a dispute proves only that such a key signed it and freezes the recovery as contested instead of cancelling it, so a stolen device cannot block a recovery for ever.
- **PS-053-05.R03** Relays have no capability here; they only carry signed notices, disputes and end-to-end encrypted mailbox items.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| identity.recovery_kit.create | principal | unlocked vault; no pending or contested recovery in this vault |
| identity.recovery_kit.verify | principal | unlocked vault and possession of words and file |
| identity.recovery_kit.begin | anonymous | possession of the 24 words and kit file; local backoff after 5 failures |
| identity.recovery_kit.complete | principal | unlocked vault on the recovering device; window passed when revoking others |
| identity.recovery_kit.cancel | principal | unlocked vault on the recovering device |
| identity.recovery_kit.receive_notice | principal | intake pipeline of the unlocked vault; notice verifies against the DID root key |
| identity.recovery_kit.dispute | principal | unlocked vault holding a device key active in the latest document; no kit state required |
| identity.recovery_kit.acknowledge | principal | unlocked vault with an observed notice for the own DID |
| identity.recovery_kit.receive_dispute | principal | intake pipeline of the unlocked vault; dispute signed by an active device key other than the new key |
| identity.recovery_kit.read_own | principal | unlocked local principal |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-053-09.T06 | integration | PS-053-03.R02, PS-053-05.R02 | begin, then a verified dispute from D2 arrives in the recovering vault | kit contested; complete refused with IDENTITY_RECOVERY_WINDOW_OPEN before 7 days and allowed at 7 days with contested true; the new key is not revoked |
| TEST-PS-053-09.T09 | abuse | PS-053-05.R01, PS-053-05.R03 | locked vault creates a kit; relay tries to call begin or dispute | FORBIDDEN or rejected; relay has no capability |
| TEST-PS-053-09.T17 | integration | PS-053-09.R04, PS-053-02.R02, PS-053-05.R02 | two isolated vaults begin offline from the same kit with N1 and N2; a second begin inside one vault | both succeed locally; after sync receivers see two notices for one DID and freeze it as contested; the second begin in one vault returns CONFLICT_STATE |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
