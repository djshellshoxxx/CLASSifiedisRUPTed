# PS-053-05 — Authorization and capabilities: Account recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M03 Account recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-053-05.R01** Vault policy - creating and verifying a kit require an unlocked vault; begin runs in a new or empty vault where possession of the words and blob is the authorization.
- **PS-053-05.R02** Disputes are authorized by a signature from an active device key listed in the account's identity document; the dispute proves only that such a key signed it.
- **PS-053-05.R03** Relays have no capability here; they only carry signed notices and end-to-end encrypted mailbox items.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| identity.recovery_kit.create | principal | unlocked vault; no pending recovery |
| identity.recovery_kit.verify | principal | unlocked vault and possession of words and blob |
| identity.recovery_kit.begin | anonymous | possession of the 24 words and kit file; local backoff after 5 failures |
| identity.recovery_kit.complete | principal | unlocked vault on the recovering device; window passed when revoking others |
| identity.recovery_kit.cancel | principal | unlocked vault holding an active device key, or the recovering device |
| identity.recovery_kit.read_own | principal | unlocked local principal |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-053-09.T09 | abuse | PS-053-05.R01, PS-053-05.R02, PS-053-05.R03 | locked vault creates a kit; dispute signed by a revoked key; relay tries to call begin | FORBIDDEN or rejected; relay has no capability |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
