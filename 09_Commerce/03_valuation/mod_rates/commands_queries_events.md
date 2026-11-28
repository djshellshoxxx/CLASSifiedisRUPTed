# PS-075-04 — Commands, queries and events: FX rates and quotes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M02 FX rates and quotes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/rates` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-075-04.R01** Commands request, issue_manual and revoke are vault commands (local, actor is the unlocked principal); relay_issue is a relay command that returns a relay-signed quote; revoke additionally produces the signed statement classrup.commerce.fx_quote_revocation/v1.
- **PS-075-04.R02** Each issue emits commerce.fx_quote.issued into the vault outbox in the same IndexedDB transaction as the insert.
- **PS-075-04.R03** Consumers pin quotes by ID only and never copy rates without the ID.
- **PS-075-04.R04** classrup.commerce.fx_quote_revocation/v1 (signer - the issuerRef of the manual quote) is ingested through the internal vault command commerce.fx_quote.ingest_revocation, idempotent by cid, with quarantine reasons signer_not_issuer, not_manual and quote_unknown (buffered 24 h), and statements from blocked dids are dropped silently.
- **PS-075-04.R05** commerce.fx_quote.verify_embedded is the one check consumers (F02.S04.M02, offers, Deals) call for quotes inside peer statements; it returns sourceSigned, the verification label, local-clock expiry with a skew note and, when asked, the ECB re-derivation.
- **PS-075-04.R06** Approximate values are rendered only through F14.S02.M02 formatApprox, reached through the injected ApproxFormatPort that the vault composition binds (F14.S02.M02 depends on this module, so there is no static edge back), with the QuoteLabel { source, sourceKind, issuerDisplay, label, signatureVerified, asOf, expiresAt, status, pinned?: { consentCollected } } from commerce.fx_quote.quote_label - issuerDisplay resolved and signatures verified before the call, signatureVerified true only for a verified relay signature, a verified manual issuer signature or a quote this vault fetched through its own direct adapter, status evaluated on the local clock, and pinned passed through only from the caller that pinned the quote.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `commerce.fx_quote.request` | commerce.fx_quote.request | [vault command] { base, quote, purpose?: general\|barter_normalization (default general), validForMs? (default 900000; 60000..3600000 for general, 60000..86400000 for barter_normalization), sourceId? (user-chosen RateSourcePort) } | FxQuote with id, rate, source, purpose, issuerRef, sourceSigned, verificationLabel, expiresAt | VALIDATION_FAILED, COMMERCE_RATE_PAIR_INVALID, COMMERCE_RATE_UNAVAILABLE, COMMERCE_RATE_STALE, COMMERCE_RATE_SUSPECT, COMMERCE_RATE_SIGNATURE_INVALID, DEPENDENCY_UNAVAILABLE | commerce.fx_quote.issued | yes (Idempotency-Key) |
| `commerce.fx_quote.issue_manual` | commerce.fx_quote.issue_manual | [vault command; the quote is signed by the issuer's device key so it can be embedded in statements] { base, quote, rate: {num, den}, reason, purpose?: general\|barter_normalization, validForMs? (900000..86400000) } | FxQuote labelled manual, issuerRef the local principal, issuerSigned true, sourceSigned false | VALIDATION_FAILED, COMMERCE_RATE_PAIR_INVALID | commerce.fx_quote.issued | yes (Idempotency-Key) |
| `commerce.fx_quote.relay_issue` | commerce.fx_quote.relay_issue | [relay command] signed request { base, quote, purpose?, validForMs? } over the relay API | relay-signed FxQuote (sig by relay key; asOf and expiresAt are the relay's claims) | VALIDATION_FAILED, COMMERCE_RATE_PAIR_INVALID, COMMERCE_RATE_UNAVAILABLE, COMMERCE_RATE_STALE, COMMERCE_RATE_SUSPECT, RATE_LIMITED |  | yes (Idempotency-Key) |
| `commerce.fx_quote.revoke` | commerce.fx_quote.revoke | [vault command, produces signed statement classrup.commerce.fx_quote_revocation/v1] { quoteId, expectedRevision } | { quoteId, revision, status: revoked } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | commerce.fx_quote.revoked | yes (Idempotency-Key) |
| `commerce.fx_quote.ingest_revocation` | commerce.fx_quote.ingest | [vault command, internal; receives classrup.commerce.fx_quote_revocation/v1 from the vault mailbox router] { envelope } | { outcome: applied\|buffered\|quarantined\|duplicate\|dropped, reason?: signer_not_issuer\|not_manual\|quote_unknown\|blocked } | VALIDATION_FAILED, COMMERCE_RATE_SIGNATURE_INVALID, UNSUPPORTED_SCHEMA_VERSION | commerce.fx_quote.revoked | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `commerce.fx_quote.check` | commerce.fx_quote.read | { quoteId } | { valid: boolean, status, expiresAt, msRemaining (local clock), label } | NOT_FOUND, EXPIRED |
| `commerce.fx_quote.get` | commerce.fx_quote.read | { quoteId } | FxQuote (full record) | NOT_FOUND |
| `commerce.fx_quote.verify_embedded` | commerce.fx_quote.read | { quote: classrup.commerce.fx_quote/v1, embeddingSignerId, embeddingReceivedAt, embeddingSignedAt?, reDerive?: boolean } | { sourceSigned, issuerSigned, verificationLabel, label (e.g. 'source asserted by <pseudonym>, not verifiable'), expired (local clock), skewNote?, issuerPseudonym, reDerived?: {referenceRate, deviationBps} } | VALIDATION_FAILED, COMMERCE_RATE_SIGNATURE_INVALID, COMMERCE_CURRENCY_MISMATCH, DEPENDENCY_UNAVAILABLE |
| `commerce.fx_quote.quote_label` | commerce.fx_quote.read | { quoteId } or { quote: classrup.commerce.fx_quote/v1, embeddingSignerId, embeddingReceivedAt }, pinned?: { consentCollected: boolean } (supplied by the pinning caller) | QuoteLabel { source, sourceKind, issuerDisplay (manual issuer pseudonym or signing relay display name), label?, signatureVerified, asOf, expiresAt, status: issued\|expired\|revoked (local clock), pinned?: { consentCollected } } for F14.S02.M02 formatApprox | NOT_FOUND, VALIDATION_FAILED, COMMERCE_RATE_SIGNATURE_INVALID, COMMERCE_CURRENCY_MISMATCH |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `commerce.fx_quote.issued` | P1 | { quoteId, base, quote, rate: {num, den}, source, sourceKind, purpose, issuerRef, sourceSigned, issuerSigned, expiresAt } |
| `commerce.fx_quote.revoked` | P1 | { quoteId, base, quote, issuerRef, revocationCid? } |

### Events consumed

| Type | Effect |
|---|---|
| `commerce.currency.registered` | register supported pairs for adapters and manual quotes when a new asset is added |
| `commerce.currency.status_changed` | invalidate cached provider rates and refuse quotes for disabled or retired currencies |
| `privacy.deletion.completed` | through the DeletionPort plan, replace the deleted principal's did in issuerRef and receivedFrom of retained quotes with the per-deletion pseudonym; signatures kept and flagged unverifiable-after-pseudonymization |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMERCE_RATE_PAIR_INVALID | 422 | no | base or quote is unknown, disabled or equal |
| COMMERCE_RATE_SIGNATURE_INVALID | 422 | no | relay or issuer signature failed verification, or a manual quote is attributed to an issuer who did not sign it |
| COMMERCE_RATE_UNAVAILABLE | 422 | no | no adapter or manual quote supplies this pair |
| COMMERCE_RATE_STALE | 422 | yes | provider data is older than the allowed age for this pair |
| COMMERCE_RATE_SUSPECT | 422 | no | provider rate deviates more than 50 percent from the last accepted quote |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statement registry (N2, registered in F11.S01.M01): classrup.commerce.fx_quote_revocation/v1 - signer is the issuerRef of the manual quote it names. Quotes embedded in other modules' statements (classrup.commerce.fx_quote/v1 carried as data) are signed by the relay key (relay-signed), by issuerRef (manual), or unsigned (direct provider, sourceSigned false). The revocation is not Deal-scoped, so the vault mailbox router delivers it to commerce.fx_quote.ingest_revocation rather than to the F09.S01.M01 dispatcher. Labels - relay_signed 'signed by relay <name>; its asOf and expiry are that relay's claim'; issuer_signed 'manual rate by <pseudonym>: <reason>'; fetched_here 'fetched by you from <source>'; asserted_unverified 'source asserted by <issuer pseudonym>, not verifiable'; barter_normalization quotes add 'pinned rate agreed by all parties'. ECB re-derivation fetches the ECB daily reference rate for asOf through the user's chosen source and reports the deviation; it never changes the pinned quote. ApproxFormatPort {formatApprox(money, currencyDef, quoteLabel, locale, {timeZone, now})} is injected by the vault composition and bound to F14.S02.M02; QuoteLabel mapping - signatureVerified is sourceSigned for relay quotes, issuerSigned for manual quotes and true for fetched_here, false for asserted_unverified; a quote refused by verify_embedded never yields a QuoteLabel.

### Example

```
vault command commerce.fx_quote.request (actor: unlocked local principal; command ID 0192f3a4-0000-7000-8000-0000000000d1)
{ "base": "EUR", "quote": "GBP", "purpose": "barter_normalization", "validForMs": 86400000 }
=> { "id": "0192f3a5-…", "base": "EUR", "quote": "GBP", "rate": { "num": "857", "den": "1000" }, "source": "ecb-daily",
     "sourceKind": "provider", "purpose": "barter_normalization", "issuerRef": "did:key:z6MkCoord…", "sourceSigned": false,
     "verificationLabel": "fetched_here", "asOf": "2026-11-04T09:00:00.000Z", "expiresAt": "2026-11-05T10:00:00.000Z" }
in a receiving vault: commerce.fx_quote.verify_embedded { quote, embeddingSignerId: "did:key:z6MkCoord…", reDerive: true }
=> { "sourceSigned": false, "label": "source asserted by maple-otter, not verifiable", "expired": false, "reDerived": { "deviationBps": 0 } }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-075-09.T06 | contract | PS-075-04.R01, PS-075-04.R02, PS-075-09.R02 | execute each command and query | outputs and events validate against registry schemas |
| TEST-PS-075-09.T07 | integration | PS-075-04.R03, PS-075-06.R01 | replayed request with same key | same quote ID returned; no second event |
| TEST-PS-075-09.T17 | integration | PS-075-04.R04 | vault B ingests a revocation signed by the issuer, one signed by another did, a duplicate, one naming an unknown quote and one from a blocked did | applied once; signer_not_issuer quarantined; duplicate no-op; quote_unknown buffered then dropped after 24 h; blocked dropped silently |
| TEST-PS-075-09.T23 | contract | PS-075-04.R05 | verify_embedded for relay-signed, issuer-signed, fetched and asserted quotes | outputs validate and carry the labels in the note exactly |
| TEST-PS-075-09.T24 | contract | PS-075-04.R06 | quote_label for a fetched ecb-daily quote, a verified relay quote, an issuer-signed manual quote, an asserted_unverified embedded quote, an expired and a revoked quote, and a barter_normalization quote with pinned consentCollected true and false, each rendered by the rate chip through an ApproxFormatPort double | each QuoteLabel validates against F14.S02.M02 V05 and V08; issuerDisplay present for manual and relay quotes; signatureVerified false only for asserted_unverified; status follows the local clock; pinned passed through unchanged; the chip calls formatApprox exactly once per value and never formats a rate itself |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, F11.S01.M01, F11.S01.M03, F07.S02.M01, F07.S02.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
