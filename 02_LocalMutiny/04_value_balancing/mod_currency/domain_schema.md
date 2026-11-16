# PS-025-01 — Domain schema: Barter currency normalization

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M02 Barter currency normalization](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/currency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-025-01.R01** A NormalizationRecord pins, for one subject and revision, the settlement currency, each item's declared and converted Money, and every FX quote used with id, rational rate, asOf, expiresAt and source label.
- **PS-025-01.R02** Conversions use CTR-MNY-001 MNY-4 with HALF_EVEN rounding applied once per conversion, bigint arithmetic and no floating point anywhere.
- **PS-025-01.R03** The record is P2, embedded in the signed revision snapshot, and its hash covers the quotes so changing a rate changes the digest participants sign.

## Specification

### NormalizationRecord

Schema `classrup.mutiny.normalization_record/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — vault tenant scope |
| subjectType | enum — trade_proposal \| cycle \| suggestion |
| subjectId | uuidv7 — subject the record normalizes |
| origin | enum — local \| peer_verified |
| settlementCurrency | string — registered currency code |
| items | array — 2..16 items {inventoryItemId uuidv7, valuationId uuidv7, declared Money, quoteId? uuidv7, converted Money, rounding HALF_EVEN} |
| quotes | array — 0..8 items {quoteId, base, quote, rate {num, den} positive integer strings, asOf, expiresAt, source label, sourceSigned boolean} |
| earliestQuoteExpiry? | timestamp — min of quotes[].expiresAt; absent when no quotes |
| normalizationHash | cid — sha256 of JCS(settlementCurrency, items, quotes) |
| status | enum — current \| superseded \| expired \| frozen \| closed |
| mismatch | boolean — true when a peer's recomputation differs |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC, local clock |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- items, quotes, settlementCurrency and normalizationHash never change after creation.
- Every converted amount equals round_half_even(declared × num × 10^dq ÷ (den × 10^db)) for its quote, or declared when currencies are equal.
- At most one record with status current exists per (subjectId, headRevision).
- A record with a quote expiring at or before the local clock cannot be current.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-025-09.T01 | unit | PS-025-01.R01, PS-025-01.R02, PS-025-02.R02, PS-025-09.R03 | compute the 3-currency example | converted amounts 12000, 11700, 11463 EUR minor; normalizationHash stable |
| TEST-PS-025-09.T02 | property | PS-025-01.R02, PS-025-02.R02 | 10 000 random conversions vs reference | identical results with single HALF_EVEN rounding; no floating point |
| TEST-PS-025-09.T04 | unit | PS-025-01.R03, PS-025-02.R03 | JPY settlement with EUR items | exponent difference applied exactly as in MNY-4 |

## Dependencies

Module depends on: F02.S04.M03, F09.S03.M01, F09.S03.M02, F09.S03.M03, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
