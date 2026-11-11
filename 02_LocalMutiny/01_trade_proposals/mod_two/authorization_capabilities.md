# PS-015-05 — Authorization and capabilities: Two-party barter

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M01 Two-party barter](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/two` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-015-05.R01** Vault policy lets only the unlocked local principal create, accept, counter, reject or withdraw, and only when the principal is one of the two parties and the role rule for the head revision holds.
- **PS-015-05.R02** Incoming statements are accepted only when signed by a registered device key of the proposer or counterparty with the role the statement claims; everything else is quarantined.
- **PS-015-05.R03** Relays have no capability over proposals; they carry ciphertext and cannot read, accept or alter anything.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| mutiny.proposal.create | principal | vault unlocked; not blockedWith(counterparty); participation limit not exceeded |
| mutiny.proposal.accept | principal | principal is a party; proposal open or draft; principal has not consented to the head hash |
| mutiny.proposal.counter | principal | principal is a party and not the author of the head revision |
| mutiny.proposal.reject | principal | principal is the party who is not the head author |
| mutiny.proposal.withdraw | principal | principal is the head author |
| mutiny.proposal.ingest | principal | envelope is classrup.mutiny.proposal_response/v1 signed by the head author with a non-revoked device key; signer not blocked by the principal |
| mutiny.proposal.read | principal | proposal stored in this vault |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-015-09.T09 | abuse | PS-015-05.R01, PS-015-05.R02, PS-015-05.R03, PS-015-02.R03 | other principal calls commands; withdrawal signed by non-party or by the non-author; statement from relay not by party; withdrawal from a DID the recipient blocked | FORBIDDEN or quarantine; blocked sender dropped silently; relay cannot read plaintext |

## Dependencies

Module depends on: F02.S01.M02, F02.S01.M03, F02.S01.M04, F02.S02.M05, F02.S03.M02, F01.S03.M01, F07.S01.M01, F07.S02.M02, F08.S02.M02, F12.S03.M04, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
