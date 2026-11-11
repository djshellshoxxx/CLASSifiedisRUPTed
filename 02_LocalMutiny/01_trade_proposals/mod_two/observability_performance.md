# PS-015-08 — Observability and performance: Two-party barter

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M01 Two-party barter](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/two` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-015-08.R01** Local diagnostics record command outcomes and sync-state transitions without DIDs, item names or values; nothing is transmitted (OBS-7).
- **PS-015-08.R02** create and accept complete locally within 300 ms at p95 on a mid-range phone including hashing, reservation and signing.
- **PS-015-08.R03** Relays that carry statements expose only ciphertext sizes and delivery counts under CTR-OBS-001.

## Specification

**Metrics**
- classrup_mutiny_proposals_total{outcome=created|accepted|rejected|withdrawn|expired|frozen} (local diagnostics)
- classrup_mutiny_proposal_sync_ms{state=prepared|transport_acknowledged|peer_accepted} (local diagnostics)
- classrup_mutiny_mailbox_deliveries_total{outcome} (relay)

**Logs**
- info proposal.accepted {proposalId, revisionNo, correlationId} — no DIDs, values or note.
- warn proposal.statement_quarantined {code, correlationId}

**Budgets**
- create and accept p95 ≤ 300 ms locally; ingest of one envelope p95 ≤ 80 ms including signature verification.
- list_mine p95 ≤ 50 ms for 200 proposals.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-015-09.T13 | load | PS-015-08.R02, PS-015-08.R03 | 200 proposals list and 100 creates on emulated Moto G | p95 within budgets |
| TEST-PS-015-09.T14 | unit | PS-015-08.R01, PS-015-09.R01 | diagnostics and traceability tool | no identifiers in diagnostics; every PS-015 requirement maps to a passing test |

## Dependencies

Module depends on: F02.S01.M02, F02.S01.M03, F02.S01.M04, F02.S02.M05, F02.S03.M02, F01.S03.M01, F07.S01.M01, F07.S02.M02, F08.S02.M02, F12.S03.M04, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
