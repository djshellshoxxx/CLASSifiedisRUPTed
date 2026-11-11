# PS-144-05 — Authorization and capabilities: Goods taxonomy

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M03 Goods taxonomy](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/goods` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-144-05.R01** Vault policy: authoring and release require the vault's principal to hold a publisher key; apply is available to every vault owner for packs from publishers trusted for scope taxonomy in F18.S02.M01, and the apply command never grants trust.
- **PS-144-05.R02** There is no global taxonomy role; relay operator and moderator roles apply only to what that relay hosts (CAP-9), and a relay cannot change a user's mirror.
- **PS-144-05.R03** Relay policy: a relay serves the pack read-only to anonymous clients and accepts a pack upload only from a registered operator device key.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| governance.category.author | owner | local principal holds a publisher key for the pack; vault unlocked |
| governance.category.release | owner | local principal is the publisher; staged changes exist; required decisions verified; signing key unrevoked |
| governance.category.apply | owner | vault unlocked; pack signature valid and publisher trusted for scope taxonomy and not paused (otherwise held pending); ownerConfirmed accepted only from the pending inbox Apply action |
| governance.category.read | owner | vault unlocked; reads the local mirror; internal callers F01.S01.M01, F01.S01.M03, F06.S01.M03 and F18.S01.* |
| governance.category.relay_read | relay-anonymous | relay policy: public read of latest pack with receipt, rate limit 60 requests per minute per IP prefix |
| governance.category.relay_publish | relay-operator | relay policy: request signed by a registered operator device key of this relay; pack size <= 1 MiB; 10 uploads per day per key |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-144-09.T07 | integration | PS-144-04.R03, PS-144-05.R03 | relay_latest by anonymous client; relay_upload by operator key and by another key | read served unchanged with receipt; upload by operator applied as hosting taxonomy with relay-local changed events; other key FORBIDDEN; relay cannot alter user mirror |
| TEST-PS-144-09.T08 | abuse | PS-144-05.R01, PS-144-05.R02 | non-publisher authors; untrusted publisher pack; tampered pack; apply called with a trust flag from sync ingestion | FORBIDDEN; pack held pending; signature failure rejects; trust unchanged |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, F11.S01.M01, F15.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
