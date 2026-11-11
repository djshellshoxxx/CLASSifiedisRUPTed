# PS-025-04 — Commands, queries and events: Barter currency normalization

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M02 Barter currency normalization](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/currency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-025-04.R01** compute and verify are vault commands that produce no signed statement, because the record travels inside the signed revision snapshot of F02.S01.M04.
- **PS-025-04.R02** Quotes are requested through F09.S03.M02 and pinned by id; the module never invents rates.
- **PS-025-04.R03** Events are written in the same IndexedDB transaction as the records.
- **PS-025-04.R04** Every quote request names purpose barter_normalization and a lifetime of at most 24 h, and the module closes records of subjects that ended, forked or froze.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `mutiny.normalization.compute` | mutiny.normalization.compute | { subjectType, subjectId, items: { inventoryItemId, valuationId }[2..16], settlementCurrency?, consentDeadline } — vault command; requests F09.S03.M02 quotes {base, quote, purpose: barter_normalization, validForMs ≤ 86400000}; produces no statement | { normalizationId?, normalizationHash?, settlementCurrency, earliestQuoteExpiry?, effectiveConsentDeadline (≤ now + 24 h when more than one currency), toleranceRef?, rateLabel: 'pinned rate agreed by all parties', totals: { actorId, givesMinor, receivesMinor }[] } | VALIDATION_FAILED, COMMERCE_CURRENCY_UNKNOWN, MUTINY_NORMALIZATION_LIMIT, MUTINY_QUOTE_UNAVAILABLE, MUTINY_QUOTE_TOO_SHORT, MUTINY_QUOTE_SOURCE_UNLABELLED, DEPENDENCY_UNAVAILABLE | mutiny.values.normalized | yes (Idempotency-Key) |
| `mutiny.normalization.verify` | mutiny.normalization.verify | { revisionId } — vault command that recomputes a peer revision's normalization snapshot; produces no statement | { normalizationId, matches: boolean, differences: { inventoryItemId, expectedMinor, presentedMinor }[] } | NOT_FOUND, MUTINY_NORMALIZATION_MISMATCH, VALIDATION_FAILED | mutiny.values.normalized | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `mutiny.normalization.get` | mutiny.normalization.read | { normalizationId } | { record: NormalizationRecord, expiresInMs?: int } | NOT_FOUND |
| `mutiny.normalization.current_for_subject` | mutiny.normalization.read | { subjectType, subjectId } | { record?: NormalizationRecord, expiresInMs?: int } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `mutiny.values.normalized` | P2 | { normalizationId, subjectType, subjectId, settlementCurrency, normalizationHash, quoteIds, earliestQuoteExpiry?, origin } |
| `mutiny.normalization.expired` | P2 | { normalizationId, subjectType, subjectId, earliestQuoteExpiry } |

### Events consumed

| Type | Effect |
|---|---|
| `mutiny.valuation.declared` | mark current records of non-committed subjects that include the item as superseded so they are recomputed before the next revision |
| `mutiny.proposal.revised` | supersede records of the subject that are not referenced by the new head revision |
| `mutiny.cycle.committed` | freeze the subject's current record |
| `mutiny.proposal.accepted` | freeze the subject's current record |
| `mutiny.cycle.declined` | close the subject's current record |
| `mutiny.cycle.cancelled` | close the subject's current record |
| `mutiny.proposal.rejected` | close the subject's current record |
| `mutiny.proposal.expired` | close the subject's current record |
| `mutiny.proposal.withdrawn` | close the subject's current record |
| `mutiny.revision.forked` | close the subject's current record; renegotiation is a new subject with a new record |
| `mutiny.lock.conflict_detected` | close the current records of the subjects named in subjectIds |
| `privacy.deletion.completed` | pseudonymize the erased DID in retained records' local metadata; pinned numbers stay unchanged so revision digests verify |
| `commerce.fx_quote.issued` | index a new barter_normalization quote so compute can reuse a quote with at least 30 minutes of life instead of requesting another |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| MUTINY_NORMALIZATION_LIMIT | 422 | no | more than 5 currencies, 8 quotes or 16 items |
| MUTINY_QUOTE_UNAVAILABLE | 409 | yes | no quote with enough remaining life exists for a required pair |
| MUTINY_QUOTE_TOO_SHORT | 422 | no | the consent deadline would be later than the earliest quote expiry or more than 24 h away for a cross-currency subject |
| MUTINY_QUOTE_SOURCE_UNLABELLED | 422 | no | a quote lacks a source label or a manual rate is not labelled |
| MUTINY_NORMALIZATION_MISMATCH | 409 | no | recomputed amounts differ from those presented in a revision |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
# 3-party cycle in EUR, GBP, CHF; settlement EUR; local now 2026-11-04T10:00Z; cross-currency consent deadline 23 h 30 min; quotes purpose barter_normalization pinned for 24 h
mutiny.normalization.compute { "subjectType":"cycle", "subjectId":"0192f432-…", "consentDeadline":"2026-11-05T09:30:00.000Z",
  "items":[ {"inventoryItemId":"i1","valuationId":"v1"}, {"inventoryItemId":"i2","valuationId":"v2"}, {"inventoryItemId":"i3","valuationId":"v3"} ] }
-> item i1: 12000 EUR stays 12000; item i2: 10000 GBP with quote GBP->EUR num 117 den 100 => 10000 x 117 x 10^2 / (100 x 10^2) = 11700 EUR (HALF_EVEN, exact);
   item i3: 10990 CHF with quote CHF->EUR num 1043 den 1000 => 11462.57 -> 11463 EUR minor units rounded once (HALF_EVEN)
   earliestQuoteExpiry 2026-11-05T10:00:00.000Z (24 h after issue), effectiveConsentDeadline 2026-11-05T09:30:00.000Z, normalizationHash sha256-Nn4…,
   every rate shown as 'pinned rate agreed by all parties' with its source; a 72 h deadline would be refused with MUTINY_QUOTE_TOO_SHORT
The same call with 2, 4 or N items (N ≤ 16 item lines across at most 8 legs) uses one quote per currency pair and the same rounding rule.
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-025-09.T07 | contract | PS-025-04.R01, PS-025-04.R02, PS-025-09.R02 | commands and events | outputs and events validate against classrup.mutiny.normalization_record/v1 and registry; no statement produced |
| TEST-PS-025-09.T08 | integration | PS-025-04.R02, PS-025-06.R02 | rate source down | MUTINY_QUOTE_UNAVAILABLE, no guessed rate, no partial record |
| TEST-PS-025-09.T12 | integration | PS-025-04.R03, PS-025-06.R02 | valuation.declared after compute | record superseded and recomputed before the next revision |
| TEST-PS-025-09.T16 | contract | PS-025-04.R04, PS-025-02.R03 | compute for the 3-currency example with consent deadlines of 23 h 30 min and 72 h | quote requests carry purpose barter_normalization and validForMs ≤ 86400000; 23 h 30 min accepted with every rate labelled 'pinned rate agreed by all parties'; 72 h refused with MUTINY_QUOTE_TOO_SHORT |
| TEST-PS-025-09.T17 | integration | PS-025-03.R01, PS-025-04.R04 | mutiny.proposal.withdrawn, mutiny.revision.forked and mutiny.lock.conflict_detected for subjects with current records | each record closed; later compute for a new subject creates a new record |

## Dependencies

Module depends on: F02.S04.M03, F09.S03.M01, F09.S03.M02, F09.S03.M03, F16.S02.M03, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
