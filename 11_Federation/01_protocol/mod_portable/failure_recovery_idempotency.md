# PS-083-06 — Failure recovery and idempotency: Portable record packaging

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M01 Portable record packaging](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/portable` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-083-06.R01** Draft building is deterministic for identical record, head and clock, so retries cannot create divergent drafts.
- **PS-083-06.R02** A failed draft leaves no state; the caller retries after fixing the record.
- **PS-083-06.R03** The caller, not this module, supplies seq and prev, so a lost response never skips a sequence number.

## Specification

- **idempotency:** buildDraft is a pure function; identical inputs give identical drafts (same payload and canonical bytes).
- **concurrency:** No shared state. Two concurrent drafts for the same author use the same head and one will fail the seq/prev check in F11.S01.M02 with CONFLICT_STATE; the loser re-reads the head and rebuilds.
- **retries:** Callers retry after refreshing the author head; no automatic retry inside the library.
- **offline:** Runs fully offline on-device; drafts are queued in the outbox (F15.S01.M01) and signed locally when the device key is available.
- **partial failure:** A draft either validates entirely or returns an error; there is no partially mapped payload.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-083-09.T10 | unit | PS-083-06.R01, PS-083-06.R02, PS-083-06.R03 | identical inputs twice; concurrent builds with same head; missing head | identical drafts; second ingest returns CONFLICT_STATE; missing head returns VALIDATION_FAILED |

## Dependencies

Module depends on: F10.S02.M02, CTR-FED-001, CTR-PRV-001, CTR-ERR-001, CTR-SCH-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
