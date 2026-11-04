# PS-072-01 — Domain schema: Settlement reconciliation

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M03 Settlement reconciliation](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/reconciliation` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-072-01.R01** A ReconciliationReport stores scope, time window, record counts, a list of at most 500 mismatches and a status, and is derived data that can always be recomputed.
- **PS-072-01.R02** Each mismatch has a stable key made of kind and subject IDs so repeated runs recognize it.
- **PS-072-01.R03** Reports are P2 because they reference deals and claims, are kept in the vault only for 30 days, and never leave the device except in the user's own export.

## Specification

### ReconciliationReport

Schema `classrup.commerce.reconciliation_report/v1` · storage **device** · privacy **P2** · retention **RET-SHORT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| vaultId | uuidv7 — local vault scope (CTR-ID-001 tenant slot) |
| trigger | enum — daily \| manual \| event |
| scope | object — {type: all\|deal, dealId?} |
| startedAt | timestamp — local clock |
| completedAt? | timestamp — local clock |
| status | enum — running \| completed \| failed |
| counts | object — {deals, claims, observations, receipts, statementsPending} |
| mismatches | array — up to 500 {key, kind, severity: info\|warn\|action, dealId?, claimId?, detailKey, firstSeenAt, dismissedAt?, dismissNote? ≤ 280, resolved: boolean} |
| truncated | boolean — true when more than 500 mismatches were found |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- mismatch keys are unique within a report.
- A completed report has completedAt and counts; a failed report keeps no partial mismatch list.
- The module writes only ReconciliationReport rows; it never writes to Deal, PaymentClaim, ChainObservation or Receipt.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-072-09.T01 | unit | PS-072-01.R01, PS-072-01.R02, PS-072-02.R01 | run on the seeded vault | report has counts and keys for M01 to M10 as expected, scope validated |
| TEST-PS-072-09.T04 | unit | PS-072-01.R03, PS-072-03.R01, PS-072-03.R03 | interrupt a run at 40 percent and rerun | first report failed with no partial list; second identical to a fresh run |
| TEST-PS-072-09.T15 | e2e | PS-072-01.R03, PS-072-09.R03 | open the Deals screen with issues | card lists action items with accessible severity text; axe zero serious issues |

## Dependencies

Module depends on: F09.S01.M01, F09.S01.M03, F09.S02.M01, F09.S03.M03, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
