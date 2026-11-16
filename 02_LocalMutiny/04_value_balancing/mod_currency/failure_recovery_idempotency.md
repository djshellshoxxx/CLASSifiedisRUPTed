# PS-025-06 — Failure recovery and idempotency: Barter currency normalization

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M02 Barter currency normalization](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/currency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-025-06.R01** compute is idempotent by (subjectId, inputs hash) and returns the same record while its quotes remain valid.
- **PS-025-06.R02** Rate source failures degrade to MUTINY_QUOTE_UNAVAILABLE and never to a guessed rate.
- **PS-025-06.R03** A crash during compute leaves no partial record because the record and event are written in one IndexedDB transaction.

## Specification

- **idempotency:** Idempotency-Key replay 24 h; compute is also idempotent by (subjectId, normalizationHash inputs) while the existing record is current.
- **concurrency:** Web Locks mutex per subjectId; the record is immutable so concurrent computes either return the existing current record or supersede it in order.
- **retries:** Quote retrieval retries 3 times with IDM-4 backoff (base 500 ms, cap 30 s); after that the error is surfaced and the user can choose a different settlement currency.
- **offline:** Compute works offline only with already retained unexpired quotes (at least 30 minutes of life); otherwise it reports MUTINY_QUOTE_UNAVAILABLE; verify of peer records works offline.
- **partial failure:** If one of several pairs has no quote the whole compute fails and no partial record is stored; if a quote expires between compute and revision creation the revision creation fails with MUTINY_QUOTE_TOO_SHORT.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-025-09.T08 | integration | PS-025-04.R02, PS-025-06.R02 | rate source down | MUTINY_QUOTE_UNAVAILABLE, no guessed rate, no partial record |
| TEST-PS-025-09.T11 | integration | PS-025-06.R01, PS-025-06.R03 | replay compute; crash mid-transaction | one current record; no partial state |
| TEST-PS-025-09.T12 | integration | PS-025-04.R03, PS-025-06.R02 | valuation.declared after compute | record superseded and recomputed before the next revision |

## Dependencies

Module depends on: F02.S04.M03, F09.S03.M01, F09.S03.M02, F09.S03.M03, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
