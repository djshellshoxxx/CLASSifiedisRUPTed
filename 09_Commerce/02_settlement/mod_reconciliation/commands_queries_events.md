# PS-072-04 — Commands, queries and events: Settlement reconciliation

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M03 Settlement reconciliation](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/reconciliation` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-072-04.R01** Run and dismiss are vault commands (local, no signed statement, no relay command); queries return the latest and past reports.
- **PS-072-04.R02** A completed run emits one commerce.reconciliation.mismatch_found event per new mismatch key into the vault outbox in the same IndexedDB transaction as the report update.
- **PS-072-04.R03** The module consumes settlement events only to schedule coalesced incremental runs and never to change data.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `commerce.reconciliation.run` | commerce.reconciliation.run | [vault command, local] { scope?: {type: all\|deal, dealId?} (default all) } | { reportId, status: running } | VALIDATION_FAILED, NOT_FOUND, RATE_LIMITED, CONFLICT_STATE | commerce.reconciliation.mismatch_found | yes (Idempotency-Key) |
| `commerce.reconciliation.dismiss` | commerce.reconciliation.dismiss | [vault command, local] { reportId, key, note? } | { reportId, key, dismissedAt } | VALIDATION_FAILED, NOT_FOUND |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `commerce.reconciliation.latest` | commerce.reconciliation.read | { severity?: info\|warn\|action } | { report: ReconciliationReport \| null } |  |
| `commerce.reconciliation.list` | commerce.reconciliation.read | { cursor?, limit ≤ 30 } | { items: ReconciliationReport[], nextCursor? } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `commerce.reconciliation.mismatch_found` | P2 | { reportId, key, kind, severity, dealId?, claimId? } |

### Events consumed

| Type | Effect |
|---|---|
| `commerce.deal.completed` | schedule a coalesced incremental run for that deal 30 s later |
| `commerce.payment.finalized` | schedule an incremental run for the claim's deal |
| `commerce.payment.reorged` | schedule an incremental run for the claim's deal |
| `commerce.receipt.issued` | schedule an incremental run for the claim's deal |
| `commerce.payment.expired` | mark the matching stale-claim mismatch resolved on the next run |
| `commerce.payment.failed` | schedule an incremental run for the claim's deal |
| `privacy.deletion.completed` | through the DeletionPort plan, delete the deleted principal's reports and schedule a fresh run; reports are derived and hold no evidence |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMERCE_RECON_TRUNCATED | 200 | no | more than 500 mismatches were found and the report was truncated |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command commerce.reconciliation.run {}
=> { "reportId": "0192f3ac-…", "status": "running" }
completed report excerpt: { "counts": { "deals": 12, "claims": 15, "observations": 4, "receipts": 9, "statementsPending": 1 },
  "mismatches": [ { "key": "M05:0192f3a7-…", "kind": "stale_claim", "severity": "warn", "claimId": "0192f3a7-…", "detailKey": "recon.stale_claim", "resolved": false } ] }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-072-09.T06 | contract | PS-072-04.R01, PS-072-04.R02, PS-072-09.R02 | execute commands and queries | outputs and event payloads validate against registry schemas |
| TEST-PS-072-09.T07 | integration | PS-072-04.R03 | deliver deal completed and receipt issued events within 10 s | one coalesced incremental run starts after 30 s |

## Dependencies

Module depends on: F09.S01.M01, F09.S01.M03, F09.S02.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
