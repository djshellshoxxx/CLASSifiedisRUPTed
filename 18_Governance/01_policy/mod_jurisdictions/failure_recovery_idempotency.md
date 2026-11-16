# PS-145-06 — Failure recovery and idempotency: Jurisdiction profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M01 Jurisdiction profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/jurisdictions` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-145-06.R01** Commands are idempotent per CTR-IDM-001; statements are deduplicated by cid and version.
- **PS-145-06.R02** Release, supersession of the previous version and the outbox entry commit in one transaction.
- **PS-145-06.R03** Offline use is complete locally; publication state is prepared until a relay receipt exists.

## Specification

- **idempotency:** Idempotency-Key required on authoring, release and select; keys kept 24 h; receive is idempotent by statementCid.
- **concurrency:** expectedRevision on draft, release and retire; unique active index per publisher and code; two releases racing in one publisher vault are serialized by the transaction and the second sees CONFLICT_REVISION.
- **retries:** Relay upload retries follow IDM-4 (base 500 ms, cap 30 s, 6 attempts); validation errors are not retried.
- **offline:** All commands except relay upload work offline; the last verified profile stays in force offline.
- **partial failure:** A rejected relay upload leaves the local release committed with delivery state relay_rejected; a failed signature check on receive stores nothing.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-145-09.T09 | integration | PS-145-06.R01, PS-145-06.R02 | replay release; crash after supersede | one active version; consistent after restart |
| TEST-PS-145-09.T10 | chaos | PS-145-06.R03 | relay rejects upload | local release stands with relay_rejected delivery |

## Dependencies

Module depends on: F18.S01.M03, F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
