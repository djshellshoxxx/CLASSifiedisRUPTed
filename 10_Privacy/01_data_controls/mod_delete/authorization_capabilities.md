# PS-077-05 — Authorization and capabilities: Account and data deletion

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M04 Account and data deletion](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/delete` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-077-05.R01** Under vault policy (CAP-8) only the unlocked principal requests or cancels deletion of its own vault, with a fresh unlock within 5 minutes; deletion rights survive suspension on any relay (CAP-5, CAP-9).
- **PS-077-05.R02** Relays accept privacy.deletion.relay_apply only for statements signed by a registered key of the deleted did, or listed as final by its account_deleted revocation; relay operators cannot start deletion of a user's vault.
- **PS-077-05.R03** Operators can view relay-side deletion counts but not subjects' vault contents, and users learn only whether some relay copies are retained under legal obligation, never a count.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| privacy.deletion.request | local-principal | vault unlocked within 5 minutes; no active request |
| privacy.deletion.cancel | local-principal | request pending_grace or deferred |
| privacy.deletion.relay_apply | signed-statement | statement signed by a registered key of the did; relay rate limit 60 batches per hour per did; handler runs as relay-system |
| privacy.deletion.read | local-principal | vault unlocked |
| privacy.deletion.guard | local-principal | in-process call from publishing and commitment modules of the unlocked vault |
| privacy.deletion.ledger_check | local-principal | in-process call from the vault restore flow (IOX-2) before any record commits |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-077-09.T08 | abuse | PS-077-02.R03, PS-077-05.R01, PS-077-05.R02, PS-077-05.R03 | relay_apply with a statement signed by another did; operator tries to start deletion; suspended on a relay; user reads the relay result | rejected or FORBIDDEN; deletion by owner still allowed; result carries someRetained without a count |

## Dependencies

Module depends on: F10.S01.M02, F10.S01.M03, F07.S01.M01, F16.S02.M02, F11.S01.M01, F15.S01.M01, F15.S02.M02, F10.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
