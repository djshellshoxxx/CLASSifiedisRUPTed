# PS-083-06 — Failure recovery and idempotency: Portable record packaging

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M01 Portable record packaging](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/portable` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-083-06.R01** Draft building is deterministic for identical record and clock, so retries cannot create divergent drafts.
- **PS-083-06.R02** A failed draft leaves no state; the caller retries after fixing the record.
- **PS-083-06.R03** This module never allocates seq or prev; F11.S01.M02 publish allocates them in the transaction that stores the envelope, so a lost response never skips or duplicates a sequence number.

## Specification

- **idempotency:** buildDraft is a pure function; identical inputs give identical drafts (same payload and canonical bytes).
- **concurrency:** No shared state. Two concurrent publishes of drafts by the same device are serialized by F11.S01.M02, which allocates seq n+1 and n+2 under its unique (author, signerKey, stream, seq) index.
- **retries:** Callers retry after fixing the record; no automatic retry inside the library.
- **offline:** Runs fully offline on-device; drafts are signed and stored locally by F11.S01.M02 and queued in the F15.S01.M01 outbox when the device key is available.
- **partial failure:** A draft either validates entirely or returns an error; there is no partially mapped payload.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-083-09.T10 | unit | PS-083-06.R01, PS-083-06.R02, PS-083-06.R03 | identical inputs twice; failing draft; two concurrent publishes of drafts from one device | identical drafts; failure leaves no state; F11.S01.M02 assigns seq n+1 and n+2 and no caller-supplied seq exists in the API |

## Dependencies

Module depends on: F06.S02.M01, F10.S02.M02, CTR-FED-001, CTR-PRV-001, CTR-ERR-001, CTR-SCH-001, CTR-TST-001, CTR-ID-001. Predecessor: [domain_schema.md](domain_schema.md).
