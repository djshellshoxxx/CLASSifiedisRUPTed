# PS-148-05 — Authorization and capabilities: Transparency reports

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M02 Transparency reports](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/transparency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-148-05.R01** Vault policy: compiling, importing snapshots and discarding require an operator key of the relay; publishing requires a different operator key of the same relay; applying a received report is open to the vault owner for publishers trusted for scope transparency.
- **PS-148-05.R02** Relay policy (CAP-9): the relay serves published reports to anonymous readers, and serves counter snapshots and accepts legal tallies and report uploads only on requests signed by its operator keys; a relay role has no power over other relays.
- **PS-148-05.R03** Counter data is operator-private and is not readable by members or by other relays.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| governance.transparency.record | relay-operator | relay policy: request signed by an operator device key of this relay; period not frozen; 100 requests per day per key |
| governance.transparency.compile | owner | local principal holds an operator key of the relay (verified tenant_config operatorKeys); period ended |
| governance.transparency.review | owner | local key is an operator key of the relay different from the draft's compiler key; draft verified and awaiting_review |
| governance.transparency.apply | owner | vault unlocked; statement signatures valid and publisher relay trusted for scope transparency (otherwise held pending); drafts only when addressed to a local operator key |
| governance.transparency.read_public | relay-anonymous | public signed reports; relay policy rate limit 60 requests per minute per IP prefix |
| governance.transparency.relay_publish | relay-operator | relay policy: request signed by an operator device key of this relay; report carries two distinct operator signatures; report <= 64 KiB; 5 uploads per day per key |
| governance.transparency.relay_snapshot | relay-operator | relay policy: request signed by an operator device key of this relay; response sealed to that key; 20 requests per day per key |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-148-09.T08 | abuse | PS-148-05.R01, PS-148-05.R03, PS-148-01.R03 | member reads counters; non-operator computes; X requests a snapshot; inspect the sealed snapshot in transit | FORBIDDEN or NOT_FOUND; snapshot refused to X; counters only on the relay and the snapshot readable only by the requesting operator key |
| TEST-PS-148-09.T18 | integration | PS-148-05.R02, PS-148-04.R03 | anonymous get_published on the relay; relay_upload by O2 with a two-key report, with a single-signature report and by X | anonymous read served; two-key upload stored with receipt; single-signature and X uploads refused |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, F11.S01.M01, F15.S02.M01, F15.S04.M03, F07.S02.M01, F12.S01.M01, F12.S01.M03, F12.S02.M01, F12.S02.M02, F10.S01.M02, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
