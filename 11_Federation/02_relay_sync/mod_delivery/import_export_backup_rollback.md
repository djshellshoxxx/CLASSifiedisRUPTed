# PS-088-10 — Import, export, backup and rollback: Relay delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M01 Relay delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/delivery` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-088-10.R01** Vault export includes queued and recent terminal entries so that a restore on another device continues delivery.
- **PS-088-10.R02** Import restores non-terminal entries as prepared and relies on receiver dedup for any envelope that was already delivered.
- **PS-088-10.R03** Schema changes follow expand/contract and v1 stays readable for 180 days.

## Specification

- **export:** Section federation.outbox in classrup-export/v1, one line per PeerOutbox (schema classrup.federation.peer_outbox/v1), excluding payloads.
- **import:** Non-terminal entries import as prepared with nextAttemptAt = now; entries whose envelope is missing import as cancelled with a warning in the import report.
- **backup:** Vault export is the primary backup (IOX-6); relay queues are covered by relay SQLite backup (CTR-IOX-001 IOX-3).
- **migration rollback:** Additive fields only in v1; rollback is safe because unknown optional fields are ignored and in-flight leases expire within 60 s.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-088-09.T17 | integration | PS-088-10.R01, PS-088-10.R02, PS-088-10.R03 | export vault with 20 queued entries, import into fresh vault | non-terminal entries restored as prepared and re-sent; terminal ones kept as history |

## Dependencies

Module depends on: F11.S01.M02, F11.S01.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F15.S01.M01, F15.S04.M02, CTR-FED-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
