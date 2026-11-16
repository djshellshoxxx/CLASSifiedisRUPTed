# CTR-COM-001 — Payment and settlement evidence

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** F09 Commerce (named owner UNASSIGNED; S3-11). **Parent:** planning/CONTRACTS.md. **Canonical contracts:** CTR-COM-001 (this file). **Depends on:** CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-PRV-001, CTR-CAP-001, CTR-SCH-001. **Consumed by:** CTR-FED-001 (deferred for financial evidence), LocalMutiny cycle execution (F02), services, rentals and auctions (F03–F05), notifications (F13).

**Decision labels:** Integer minor units, pinned quotes and expiry are PROVISIONAL (D03 default, unapproved). Claims and receipts are signed statements only (D06 default, unapproved). Physical exchange and deposits are direct arrangements with no platform custody (D09 default, unapproved).

## Scope

Schemas, states and transitions for payment claims, counterparty attestations, external verification results and finality of commerce settlement. Applies to cash, bank transfer, on-chain transfer, external card payments and in-kind compensation in mixed-value barter.

## Requirements

| ID | Requirement (measurable) | Priority |
|---|---|---|
| CTR-COM-001.R01 | No platform custody. No schema contains a platform account, platform wallet, balance or payout field. Any such field → `COM.CUSTODY_FORBIDDEN`. Platform holds no funds and no custodial keys (PROJECT_SPEC.md). | MVP |
| CTR-COM-001.R02 | Amounts are integers in minor units, encoded as base-10 decimal strings (no leading zeros except `0`, max 39 digits). Floats are forbidden. Minor-unit exponent comes from the currency registry (R03). | MVP |
| CTR-COM-001.R03 | Currency is either `fiat` (ISO 4217 alpha-3 code) or `asset` (CAIP-19 asset ID). In-kind compensation uses `reference_currency` (fiat or asset) as a valuation only. | MVP |
| CTR-COM-001.R04 | A proposal that spans currencies pins a quote at consent: `rate` as decimal string, `rounding` = `HALF_EVEN` (ASSUMPTION), `valid_until` ≤ 15 min after `observed_at` (ASSUMPTION), `quote_hash` = SHA-256 of JCS(quote without `quote_hash`). The agreed value is fixed by the consented quote. Expiry blocks new quotes, not already-consented proposals (see Versioning). | MVP |
| CTR-COM-001.R05 | State set is exactly: `CLAIMED`, `COUNTERPARTY_ATTESTED`, `EXTERNALLY_VERIFIED`, `FINAL`, `DISPUTED`, `REVERSED`. No other settlement state exists. There is no `PAID` state. | MVP |
| CTR-COM-001.R06 | Only a self-submitted claim creates `CLAIMED`. A party's own claim never moves it past `CLAIMED` on its own. | MVP |
| CTR-COM-001.R07 | Methods `cash`, `in_kind_compensation` and `other_external` can reach at most `COUNTERPARTY_ATTESTED`. They can never reach `EXTERNALLY_VERIFIED` or `FINAL`. | MVP |
| CTR-COM-001.R08 | Each claim binds: `trx_` ID, claimant party, counterparty party, direction, amount_minor, currency, quote_id (if cross-currency), method, evidence digests, and `claim_hash` (SHA-256 of JCS of the claim body). | MVP |
| CTR-COM-001.R09 | On-chain verification requires exact match of: chain (CAIP-2), asset (CAIP-19), recipient address, amount ≥ expected amount, confirmations ≥ chain finality threshold for `FINAL` (ASSUMPTION thresholds published per chain). Partial amounts stay `CLAIMED` with `COM.AMOUNT_MISMATCH` recorded. | MVP |
| CTR-COM-001.R10 | Uniqueness: (chain, tx_hash) may verify at most one claim. Duplicate → `COM.DUPLICATE_TX_REF`. | MVP |
| CTR-COM-001.R11 | Each verifier adapter has a registry ID (`fpr_`-independent adapter ID, F09 registry). Adapter results are stored with their raw response digest and adapter ID. Adapters are untrusted until registered and signed. | MVP |
| CTR-COM-001.R12 | Reorg: each poll re-reads transaction status. A dropped or replaced transaction moves `EXTERNALLY_VERIFIED` → `CLAIMED` (or `COUNTERPARTY_ATTESTED`) and `FINAL` → `REVERSED`. Each move is a new state event. | MVP |
| CTR-COM-001.R13 | Append-only: each transition appends a `clm.state_changed` event with `state_version` (CTR-EVT-001). No in-place update of state. | MVP |
| CTR-COM-001.R14 | Attestation: counterparty signs `claim_hash` with its registered key (Ed25519, ASSUMPTION). Signatures evidence an assertion; they do not prove physical handover or delivery (PROJECT_SPEC.md). | MVP |
| CTR-COM-001.R15 | UI labels: each state has a fixed label from the catalog. Labels for states below `FINAL` must not contain "paid", "payment received" or "settled". `FINAL` label names the verifier (for example "Final on chain X, N confirmations"). | MVP |
| CTR-COM-001.R16 | Dispute window: 14 days after the last transition (ASSUMPTION). A party may raise `DISPUTED` only inside the window. | MVP |

## Data / schema

Quote:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:classrupt:contract:CTR-COM-001:quote:1.0.0",
  "type": "object",
  "required": ["quote_id","base","quote","rate","rate_scale","rounding","source_id","observed_at","valid_until","quote_hash"],
  "properties": {
    "quote_id": {"type": "string", "pattern": "^qte_[0-9A-HJKMNP-TV-Z]{26}$"},
    "base": {"$ref": "#/$defs/currency"},
    "quote": {"$ref": "#/$defs/currency"},
    "rate": {"type": "string", "pattern": "^(0|[1-9][0-9]{0,17})(\\.[0-9]{1,18})?$"},
    "rate_scale": {"type": "integer", "minimum": 0, "maximum": 18},
    "rounding": {"const": "HALF_EVEN"},
    "source_id": {"type": "string", "pattern": "^[a-z0-9_.-]{3,64}$"},
    "observed_at": {"type": "string", "format": "date-time"},
    "valid_until": {"type": "string", "format": "date-time"},
    "quote_hash": {"type": "string", "pattern": "^[a-f0-9]{64}$"}
  },
  "$defs": {
    "currency": {
      "type": "object", "required": ["kind","code","exponent"],
      "properties": {
        "kind": {"enum": ["fiat","asset"]},
        "code": {"type": "string", "pattern": "^([A-Z]{3}|[-a-z0-9]{3,8}:[-_a-zA-Z0-9]{1,32}/[-a-z0-9]{3,8}:[-.%a-zA-Z0-9]{1,128})$"},
        "exponent": {"type": "integer", "minimum": 0, "maximum": 18}
      }
    }
  }
}
```

Claim:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:classrupt:contract:CTR-COM-001:claim:1.0.0",
  "type": "object",
  "required": ["claim_id","transaction_id","claimant","counterparty","direction","amount_minor","currency","method","evidence","state","state_version","claim_hash","schema_version"],
  "additionalProperties": false,
  "properties": {
    "claim_id": {"type": "string", "pattern": "^clm_[0-9A-HJKMNP-TV-Z]{26}$"},
    "transaction_id": {"type": "string", "pattern": "^trx_[0-9A-HJKMNP-TV-Z]{26}$"},
    "claimant": {"type": "string", "pattern": "^acc_[0-9A-HJKMNP-TV-Z]{26}$"},
    "counterparty": {"type": "string", "pattern": "^acc_[0-9A-HJKMNP-TV-Z]{26}$"},
    "direction": {"enum": ["claimant_paid","claimant_received"]},
    "amount_minor": {"type": "string", "pattern": "^(0|[1-9][0-9]{0,38})$"},
    "currency": {"$ref": "quote#/$defs/currency"},
    "quote_id": {"type": ["string","null"], "pattern": "^qte_[0-9A-HJKMNP-TV-Z]{26}$"},
    "method": {"enum": ["cash","bank_transfer","onchain_transfer","external_card","in_kind_compensation","other_external"]},
    "external_ref": {
      "type": ["object","null"],
      "properties": {
        "chain": {"type": "string", "pattern": "^[-a-z0-9]{3,8}:[-_a-zA-Z0-9]{1,32}$"},
        "tx_hash": {"type": "string", "pattern": "^[A-Za-z0-9x]{8,128}$"},
        "recipient": {"type": "string", "maxLength": 128},
        "asset": {"type": "string"}
      }
    },
    "evidence": {"type": "array", "maxItems": 10, "items": {"type": "object", "required": ["kind","digest_sha256","source"], "properties": {
      "kind": {"enum": ["screenshot","receipt_statement","bank_reference","chain_transaction","other"]},
      "digest_sha256": {"type": "string", "pattern": "^[a-f0-9]{64}$"},
      "source": {"enum": ["claimant","counterparty","external_adapter"]}}}},
    "state": {"enum": ["CLAIMED","COUNTERPARTY_ATTESTED","EXTERNALLY_VERIFIED","FINAL","DISPUTED","REVERSED"]},
    "state_version": {"type": "integer", "minimum": 1},
    "claim_hash": {"type": "string", "pattern": "^[a-f0-9]{64}$"},
    "schema_version": {"const": "1.0.0"}
  }
}
```

Conditions: `quote_id` required when `currency` differs from the transaction's agreed currency. `external_ref` required when `method = onchain_transfer`. `evidence` contains digests only; attachment content is governed by CTR-PRV-001 and F08. Data class: FINANCIAL_EVIDENCE.

## Commands / queries / events

| Command | Event | From states | To state |
|---|---|---|---|
| `clm.submit` | `clm.submitted` | (none) | `CLAIMED` |
| `clm.attest` | `clm.attested` | `CLAIMED` | `COUNTERPARTY_ATTESTED` |
| `clm.dispute` | `clm.disputed` | `CLAIMED`, `COUNTERPARTY_ATTESTED`, `EXTERNALLY_VERIFIED`, `FINAL` (within window) | `DISPUTED` |
| `adapter.verify` (system) | `clm.verified` | `CLAIMED`, `COUNTERPARTY_ATTESTED` | `EXTERNALLY_VERIFIED` |
| `adapter.finality` (system) | `clm.finalized` | `EXTERNALLY_VERIFIED` | `FINAL` |
| `adapter.reorg` (system) | `clm.reorged` | `EXTERNALLY_VERIFIED`, `FINAL` | `CLAIMED` (from verified) or `REVERSED` (from final) |
| `case.resolve` (`mod` with `case` scope) | `clm.dispute_resolved` | `DISPUTED` | prior state, or `REVERSED` |

All events are CTR-EVT-001 envelopes with `aggregate_type = claim`, `max_data_class = FINANCIAL_EVIDENCE`.

## States & transitions

| From | Event | Guard | To | Side effect |
|---|---|---|---|---|
| (none) | clm.submit | Actor is a transaction party; amount, currency and method valid; quote valid if cross-currency | CLAIMED | Notify counterparty. |
| CLAIMED | clm.attest | Attester is the other party; `claim_hash` matches; signature valid | COUNTERPARTY_ATTESTED | Notify claimant. |
| CLAIMED, COUNTERPARTY_ATTESTED | clm.verified | Method is `onchain_transfer`; adapter MATCH on R09 fields | EXTERNALLY_VERIFIED | Store raw adapter digest. |
| EXTERNALLY_VERIFIED | clm.finalized | Confirmations ≥ threshold; no open dispute; no reorg | FINAL | Label update (R15). |
| EXTERNALLY_VERIFIED | clm.reorged | Adapter reports dropped or replaced transaction | CLAIMED | Keep prior verification record. |
| FINAL | clm.reorged | Reorg deeper than finality policy or external reversal | REVERSED | Notify both parties. |
| CLAIMED, COUNTERPARTY_ATTESTED, EXTERNALLY_VERIFIED, FINAL | clm.disputed | Party; within R16 window | DISPUTED | Freeze further transitions except resolution. |
| DISPUTED | clm.dispute_resolved | `mod` with case scope and decision record | prior state or REVERSED | Decision record. |
| any | clm.submitted (new claim) | Superseding claim references prior `claim_id` | new claim in CLAIMED | Prior claim remains as history. |

Forbidden transitions return `COM.INVALID_TRANSITION`. Cash and in-kind claims reaching `clm.verified` return `COM.CASH_NOT_VERIFIABLE` (R07).

## Validation and errors

| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| COM.AMOUNT_INVALID | false | validation / 400 | Not decimal string, leading zeros, > 39 digits, or zero for non-zero claim. |
| COM.CURRENCY_MISMATCH | false | unprocessable_state / 422 | Claim currency differs from agreed currency. |
| COM.QUOTE_MISSING | false | unprocessable_state / 422 | Cross-currency claim without `quote_id`. |
| COM.QUOTE_EXPIRED | false | unprocessable_state / 422 | New quote use after `valid_until`. Existing consented proposals unaffected. |
| COM.CUSTODY_FORBIDDEN | false | unprocessable_state / 422 | Platform account, wallet or balance field present. |
| COM.INVALID_TRANSITION | false | conflict / 409 | Transition not in table. |
| COM.CASH_NOT_VERIFIABLE | false | unprocessable_state / 422 | Verification attempted on cash or in-kind claim. |
| COM.CHAIN_MISMATCH | false | unprocessable_state / 422 | Adapter chain differs. Claim stays in prior state. |
| COM.ASSET_MISMATCH | false | unprocessable_state / 422 | Adapter asset differs. |
| COM.RECIPIENT_MISMATCH | false | unprocessable_state / 422 | Adapter recipient differs. |
| COM.AMOUNT_MISMATCH | false | unprocessable_state / 422 | Partial or excess amount. Recorded; claim stays `CLAIMED`. |
| COM.DUPLICATE_TX_REF | false | conflict / 409 | (chain, tx_hash) already verified for another claim. |
| COM.ATTESTATION_INVALID | false | unprocessable_state / 422 | Attestation signature or hash mismatch. |
| COM.DISPUTE_WINDOW_CLOSED | false | conflict / 409 | Dispute after R16 window. |
| COM.FINALITY_PENDING | true | precondition_failed / 412 | Confirmations below threshold. Retry later. |
| COM.VERIFIER_UNAVAILABLE | true | unavailable / 503 | Adapter down. Claim state unchanged. |

## Authorization

- Only transaction parties may submit, attest or dispute (CTR-CAP-001 `participant` scope). Non-parties receive `SYS.NOT_FOUND`.
- Adapter writes use `sys` principals scoped to verification only.
- Dispute resolution requires `mod` with case scope and decision record; operator access follows CTR-PRV-001 dual control.

## Failure, idempotency, concurrency, offline

- Submissions use CTR-EVT-001 idempotency keys. Duplicate submission returns the original claim.
- Concurrent attestation and dispute: revision check; the later write gets `SYS.CONFLICT` and re-reads state.
- Offline clients may queue claims and attestations as pending (D08). Server re-validates the transaction, proposal version, party status and quote at commit. Stale pending claims are rejected with the code that applies (CR-14).
- Adapter outage: state unchanged; retry with backoff (`COM.VERIFIER_UNAVAILABLE`).

## Privacy, retention, abuse

- Data class FINANCIAL_EVIDENCE. Retention RET-EVD (24 months after final state, ASSUMPTION; jurisdiction review OPEN, R07 in RISK_REGISTER.md). Personal fields redacted at 12 months with hashes retained.
- Logs contain claim ID, state and code. Amounts, counterparties and external references are never logged (CTR-PRV-001).
- Abuse: fabricated screenshots cannot reach `EXTERNALLY_VERIFIED`; repeated disputes by one party trigger a review alert (BT-01).
- Shared on-chain data is public. Linking a chain address to an account is PSEUDONYMOUS at most; this must be disclosed to users (ASSUMPTION).

## Observability and budgets

- Metrics: `com_transitions_total{from,to}`, `com_invalid_transition_total`, `com_adapter_latency_ms` p95 ≤ 2 s (ASSUMPTION), `com_reorg_events_total`.
- Alerts: any transition into `FINAL` without adapter record (must be 0); reorg within finality window; unusual dispute rate per party.
- Audit: every state change is an event; every `case.resolve` emits an `aud_` record.

## Tests

- TEST-CTR-COM-001-01 (schema): valid claim and quote validate; float amounts, leading zeros and >39 digits rejected.
- TEST-CTR-COM-001-02 (custody lint): no platform account, wallet or balance field in any schema (R01).
- TEST-CTR-COM-001-03 (state machine): every row of the transition table passes; every other from/event pair returns `COM.INVALID_TRANSITION`.
- TEST-CTR-COM-001-04 (cash ceiling): cash and in-kind claims cannot reach `EXTERNALLY_VERIFIED` (R07).
- TEST-CTR-COM-001-05 (wrong chain, recipient, asset): each mismatch stays in prior state with its code.
- TEST-CTR-COM-001-06 (partial payment): 99% amount stays `CLAIMED` with `COM.AMOUNT_MISMATCH`; 100% verifies; 101% verifies with excess recorded.
- TEST-CTR-COM-001-07 (duplicate tx): same (chain, tx_hash) for a second claim → `COM.DUPLICATE_TX_REF`.
- TEST-CTR-COM-001-08 (reorg): tx dropped at 2 confirmations → `CLAIMED`; dropped after `FINAL` → `REVERSED`; both events appended.
- TEST-CTR-COM-001-09 (quote): quote with `valid_until` passed rejected for new proposals; consented proposal still settles at pinned amount; `HALF_EVEN` golden vectors pass (R04).
- TEST-CTR-COM-001-10 (attestation): altered claim body fails `COM.ATTESTATION_INVALID`; attestation by claimant itself rejected.
- TEST-CTR-COM-001-11 (labels): UI copy scan finds no "paid", "payment received" or "settled" for states below `FINAL` (R15).
- TEST-CTR-COM-001-12 (adapter outage): verifier down → `COM.VERIFIER_UNAVAILABLE`, state unchanged, retry succeeds after recovery.
- TEST-CTR-COM-001-13 (concurrency): simultaneous attest and dispute → exactly one wins; the other gets `SYS.CONFLICT`.

## Acceptance criteria

1. No code path moves any claim to `FINAL` without an adapter `clm.verified` and `clm.finalized` record (TEST-03, TEST-08).
2. Cash and in-kind claims never reach `EXTERNALLY_VERIFIED` (TEST-04).
3. No platform custody field exists in any schema (TEST-02).
4. Every state label passes the wording scan (TEST-11).
5. TEST-CTR-COM-001-01 through -13 pass in CI.

## Assumptions & open decisions

- PROVISIONAL (D03 default, unapproved): integer minor units, pinned quotes, expiry.
- PROVISIONAL (D06 default, unapproved): signed statements only; external verification separate.
- PROVISIONAL (D09 default, unapproved): no custody; deposits and rentals use direct arrangement evidence.
- ASSUMPTION: 15-minute quote validity; HALF_EVEN rounding; 14-day dispute window; per-chain finality thresholds published with the adapter registry (values OPEN, F09).
- OPEN: which chains and assets are in scope for MVP verification (F09 and R08).
- OPEN: fee-on-transfer and rebasing assets (excluded from MVP unless verified).
- Related: S3-08, CR-17, R03, R08, D04 (partial barter execution, OPEN).
