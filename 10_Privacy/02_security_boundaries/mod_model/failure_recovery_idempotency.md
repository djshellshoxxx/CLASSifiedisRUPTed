# PS-081-06 — Failure recovery and idempotency: Data classification model

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M02 Data classification model](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/security_boundaries/model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-081-06.R01** Redaction is idempotent, so redacting an already redacted value returns the same value.
- **PS-081-06.R02** A failure to find a classification map fails closed with PRIVACY_CLASSIFICATION_MISSING and treats all fields as P4.
- **PS-081-06.R03** There is no shared mutable state, so concurrent calls cannot interfere.

## Specification

- **idempotency:** Pure functions; redact(redact(x)) equals redact(x).
- **concurrency:** No shared state; safe in workers and the UI thread.
- **retries:** Not applicable; deterministic failures are never retried.
- **offline:** Fully offline; classification maps ship with the schema registry bundle.
- **partial failure:** A redaction either returns a complete safe copy or a refusal; never a partial unsafe copy.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-081-09.T05 | property | PS-081-03.R01, PS-081-03.R02, PS-081-06.R01 | random records and schemas | redaction is pure, idempotent and monotonic; class order is total |
| TEST-PS-081-09.T06 | property | PS-081-02.R01, PS-081-06.R03 | random nested structures with unknown paths | unknown paths default to P4 and never appear in any sink output |
| TEST-PS-081-09.T11 | unit | PS-081-06.R02, PS-081-07.R02 | classification map missing for a schema | fail closed with all fields P4; redactForExport refuses with PRIVACY_CLASSIFICATION_MISSING |

## Dependencies

Module depends on: CTR-PRV-001, CTR-EVT-001, CTR-FED-001, CTR-ERR-001, CTR-IOX-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
