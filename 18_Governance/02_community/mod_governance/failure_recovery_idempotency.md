# PS-147-06 — Failure recovery and idempotency: Community governance

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M01 Community governance](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/governance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-147-06.R01** All commands are idempotent per CTR-IDM-001 and statements are deduplicated by cid.
- **PS-147-06.R02** State change, signed statement and outbox entry commit in one IndexedDB transaction; transport is retried separately.
- **PS-147-06.R03** Equivocation (two different decisions for one proposal) is detected, marked conflicted and never resolved by last writer.

## Specification

- **idempotency:** Idempotency-Key required on commands, kept 24 h; relay accept deduplicates by statement cid; verify and receive are naturally idempotent.
- **concurrency:** expectedRevision on draft, open, decide, withdraw; a decision racing a withdrawal is settled by the publisher vault's single transaction; two decisions with different outcomes seen by a receiver mark the proposal conflicted for that publisher.
- **retries:** Transport retries follow IDM-4 (base 500 ms, cap 30 s, 6 attempts); comment posting retries only network errors and RATE_LIMITED after retryAfterMs.
- **offline:** Drafting, deciding and posting a comment can be prepared offline; sync state is prepared until a relay receipt exists, and peer_accepted is shown only after the relay's signed acceptance.
- **partial failure:** A failed relay upload leaves the local state committed and retries; a relay refusing a comment returns a signed refusal reason and the comment stays local with state relay_rejected.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-147-09.T09 | integration | PS-147-06.R01, PS-147-06.R02 | replay decide with same key; crash after signing | one decision statement; consistent state after restart |
| TEST-PS-147-09.T10 | integration | PS-147-06.R03 | two conflicting decisions delivered to a receiver | proposal marked conflicted; verify returns false with reason conflicted |
| TEST-PS-147-09.T11 | chaos | PS-147-06.R03 | relay down while comment posted and decision queued | states prepared then transport_acknowledged only on receipt; local state intact |

## Dependencies

Module depends on: F16.S02.M03, F11.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
