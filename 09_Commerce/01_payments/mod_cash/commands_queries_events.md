# PS-067-04 — Commands, queries and events: Cash payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M02 Cash payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/cash` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-067-04.R01** Terms commands are vault commands that produce the signed statements classrup.commerce.cash_terms/v1, classrup.commerce.cash_terms_accept/v1 and classrup.commerce.cash_terms_decline/v1; no relay command exists.
- **PS-067-04.R02** The module emits no domain events (catalog emits is empty); state is observable through queries and the Deal card.
- **PS-067-04.R03** The module consumes Deal, claim and deletion events to create default terms, show safety guidance, prompt cash receipts and pseudonymize retained terms.
- **PS-067-04.R04** Incoming terms statements are ingested through the StatementHandlerPort of F09.S01.M01 - signer role payee for cash_terms and payer for cash_terms_accept and cash_terms_decline - deduplicated by cid, idempotent, and quarantined with a reason (signer_not_payee, signer_not_payer, deal_unknown, proposal_unknown, stale_revision) or dropped silently when the signer is blocked.
- **PS-067-04.R05** The cash MethodRulePort returns the termsCid of the in-force terms, which F09.S01.M01 signs into the cash claim.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `commerce.cash_terms.set` | commerce.cash_terms.set | [vault command, produces signed statement classrup.commerce.cash_terms/v1] { dealId, obligationId, expectedRevision (revision of the in-force terms), receiptRequired, handoverHint? } | { termsId, revision: 1, status: proposed, expiresAt, replacesTermsCid, peerSync } | VALIDATION_FAILED, NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, COMMERCE_CASH_NOT_ALLOWED, COMMERCE_CASH_LIMIT_EXCEEDED, COMMERCE_CASH_HINT_PRIVATE, RATE_LIMITED |  | yes (Idempotency-Key) |
| `commerce.cash_terms.accept` | commerce.cash_terms.accept | [vault command, produces signed statement classrup.commerce.cash_terms_accept/v1] { termsId, expectedRevision } | { termsId, revision, status: accepted, supersededTermsId } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED |  | yes (Idempotency-Key) |
| `commerce.cash_terms.decline` | commerce.cash_terms.decline | [vault command, produces signed statement classrup.commerce.cash_terms_decline/v1] { termsId, expectedRevision } | { termsId, revision, status: declined, inForceTermsId } | NOT_FOUND, FORBIDDEN, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `commerce.cash_terms.get` | commerce.cash_terms.read | { dealId, obligationId } | { inForce: CashTerms, pendingProposal?: CashTerms, history: CashTerms[], guidance: { level, keys[] } } | NOT_FOUND |

### Events produced

_None._

### Events consumed

| Type | Effect |
|---|---|
| `commerce.deal.opened` | create default accepted CashTerms (acknowledgement required, no receipt) for every obligation that allows cash |
| `commerce.payment.claimed` | for cash claims show the safety guidance and record which termsCid the claim signed |
| `commerce.payment.acknowledged` | for cash claims whose signed termsCid names terms with receiptRequired, prompt both parties to sign receipts through F09.S02.M01; this is the only cash receipt prompt; no state change here |
| `commerce.payment.expired` | close open receipt prompts for the expired cash claim |
| `commerce.deal.cancelled` | expire a pending proposal of the cancelled Deal; accepted terms stay as history |
| `privacy.deletion.completed` | through the DeletionPort plan, replace the deleted principal's did in retained CashTerms with the per-deletion pseudonym; signatures kept and flagged unverifiable-after-pseudonymization |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMERCE_CASH_NOT_ALLOWED | 422 | no | the obligation does not allow cash or the Deal is not open |
| COMMERCE_CASH_LIMIT_EXCEEDED | 422 | no | obligation exceeds the cash limit of the active jurisdiction profile |
| COMMERCE_CASH_TERMS_UNACCEPTED | 409 | no | the claim does not name the payer-accepted terms in force |
| COMMERCE_CASH_HINT_PRIVATE | 422 | no | hint appears to contain a stored private address |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statement registry (N2, registered in F11.S01.M01): classrup.commerce.cash_terms/v1 - obligation payee; classrup.commerce.cash_terms_accept/v1 - obligation payer, names the proposal termsCid; classrup.commerce.cash_terms_decline/v1 - obligation payer, names the proposal termsCid. These types are delivered by the F09.S01.M01 ingest dispatcher to this module's StatementHandlerPort handler, which checks the signer role against the Deal obligation, deduplicates by cid, buffers a statement whose Deal or proposal is unknown for 24 h (deal_unknown, proposal_unknown), quarantines wrong signers (signer_not_payee, signer_not_payer) and statements naming a revision older than the in-force terms (stale_revision), and drops statements from blocked dids silently (F07.S02.M02 isBlockedEither). Default terms are local records with no statement.

### Example

```
vault command commerce.cash_terms.set
{ "dealId": "5b1d0c7e-…", "obligationId": "o1", "expectedRevision": 1, "receiptRequired": true, "handoverHint": "Outside the library main entrance, daytime" }
=> { "termsId": "0192f3a8-…", "revision": 1, "status": "proposed", "expiresAt": "2026-11-11T10:00:00.000Z", "replacesTermsCid": "sha256-dflt…", "peerSync": "prepared" }
vault command commerce.cash_terms.accept { "termsId": "0192f3a8-…", "expectedRevision": 1 }
=> { "termsId": "0192f3a8-…", "revision": 2, "status": "accepted", "supersededTermsId": "0192f3a6-…" }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-067-09.T05 | contract | PS-067-04.R01, PS-067-04.R02, PS-067-09.R02 | execute all three commands and ingest in vault B | outputs and envelopes validate; no events emitted |
| TEST-PS-067-09.T06 | integration | PS-067-04.R03, PS-067-01.R02 | commerce.deal.opened delivered twice | exactly one default terms row per cash obligation |
| TEST-PS-067-09.T15 | integration | PS-067-03.R02, PS-067-01.R04, PS-067-04.R05 | defaults in force, payee proposes receiptRequired true, payer claims before accepting, then accepts and claims again | first claim signs the default termsCid; defaults superseded only in the acceptance transaction; second claim signs the new termsCid and triggers the receipt prompt after acknowledgement |
| TEST-PS-067-09.T16 | integration | PS-067-04.R04, PS-067-02.R04 | vault B ingests cash_terms signed by the payer, an accept signed by the payee, a duplicate and a valid terms statement | first two quarantined with signer_not_payee or signer_not_payer; duplicate is a no-op; the valid one applied once |

## Dependencies

Module depends on: F09.S01.M01, F09.S02.M01, F09.S03.M03, F18.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
