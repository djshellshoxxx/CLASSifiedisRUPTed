# PS-075-01 — Domain schema: FX rates and quotes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M02 FX rates and quotes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/rates` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-075-01.R01** An FxQuote stores base, quote, rational rate {num, den}, source, sourceKind, asOf, expiresAt, issuer reference and optional source signature per MNY-4, in the principal's vault.
- **PS-075-01.R02** Quotes are P1 reference data (the issuer's did is the only identity) and retained as RET-EVIDENCE in the vault because proposals pin them; a quote embedded in a signed statement is carried in full.
- **PS-075-01.R03** A quote is immutable after issue except for revocation of manual quotes.
- **PS-075-01.R04** Every FxQuote records purpose (general or barter_normalization) and sourceSigned; issuerRef is mandatory (the fetching principal's did for direct-provider quotes, the issuing principal's did for manual quotes, the relay key id for relay-signed quotes), and only a relay-signed quote whose relay signature verifies has sourceSigned true; a manual quote signed by its issuer has issuerSigned true, which proves who asserted the rate, not its origin, and keeps sourceSigned false (F02.S04.M02 V07).
- **PS-075-01.R05** A quote received inside a peer statement is stored with receivedFrom (the embedding statement's signer), the local receivedAt, its verification label and, when re-derived, the reference rate and deviation.

## Specification

### FxQuote

Schema `classrup.commerce.fx_quote/v1` · storage **device** · privacy **P1** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key; pinned by consumers |
| vaultId | uuidv7 — local vault scope (CTR-ID-001 tenant slot) |
| base | string — currency code, must be active in the registry |
| quote | string — currency code, differs from base |
| rateNum | string — positive integer, ≤ 40 digits |
| rateDen | string — positive integer, ≤ 40 digits; num/den reduced by gcd |
| source | string — adapter ID such as ecb-daily, or manual:<issuer did> |
| sourceKind | enum — provider \| manual \| derived |
| purpose | enum — general \| barter_normalization; set at request time and immutable |
| label? | string — shown for manual quotes, e.g. Manual rate by <issuer pseudonym>; reason ≤ 200 chars |
| asOf | timestamp — time the rate was observed at the source, as stated by the issuer (a claim) |
| expiresAt | timestamp — issuedAt + 1..60 min (provider, purpose general), up to 24 h (provider with purpose barter_normalization, or manual); evaluated on the checking vault's local clock |
| status | enum — issued \| expired \| revoked |
| derivedFrom? | uuidv7[] — quote IDs when triangulated via EUR |
| issuerRef | string — mandatory; did of the fetching principal (direct provider), of the issuing principal (manual), or relay key id (relay-signed) |
| sig? | string — base64url Ed25519 FED-2 signature over JCS(quote minus sig) by the relay key (relay-signed) or by issuerRef (manual); absent for direct-provider quotes |
| sourceSigned | boolean — true only when sig verifies under a trusted relay key; manual and direct-provider quotes are always false (F02.S04.M02 V07) |
| issuerSigned | boolean — true when a manual quote's sig verifies under issuerRef's active device key; proves attribution, not origin |
| verificationLabel | enum — relay_signed \| issuer_signed \| fetched_here \| asserted_unverified |
| receivedFrom? | did — signer of the peer statement that embedded this quote |
| receivedAt? | timestamp — local clock when an embedded quote was stored |
| reDerived? | object — {referenceRate {num, den}, referenceSource: ecb-daily, deviationBps, checkedAt} for reproducible sources |
| assetDescriptors? | array — F09.S03.M01 descriptors for crypto or non-snapshot base or quote currencies |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC, local clock |

**Invariants**
- num and den are positive and coprime.
- expiresAt is after createdAt and not more than 24 h later.
- sourceKind manual implies label is set.
- sourceKind provider with purpose general implies expiresAt is at most 60 min after createdAt.
- sourceSigned true implies a relay signature verifies; manual and direct-provider quotes are never sourceSigned.

### Storage DDL

```sql
CREATE TABLE commerce_fx_quote (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL /* vault id */, base TEXT NOT NULL, quote TEXT NOT NULL,
  rate_num TEXT NOT NULL, rate_den TEXT NOT NULL, source TEXT NOT NULL, source_kind TEXT NOT NULL, purpose TEXT NOT NULL,
  as_of TEXT NOT NULL, expires_at TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE INDEX commerce_fx_pair ON commerce_fx_quote(tenant_id, base, quote, created_at DESC);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-075-09.T01 | unit | PS-075-01.R01, PS-075-01.R03, PS-075-02.R02 | request EUR/USD with the fixture 1.0870 token | stored rate 1087/1000, no float used, source ecb-daily |
| TEST-PS-075-09.T03 | property | PS-075-01.R01, PS-075-02.R02 | random decimal strings up to 18 fractional digits | num and den coprime and num/den equals the decimal exactly |
| TEST-PS-075-09.T04 | unit | PS-075-03.R01, PS-075-03.R02, PS-075-01.R03 | no relay configured; the vault clock is advanced to expiresAt and to one second before | check evaluates the local clock only - valid then EXPIRED - and the quote is never extended |
| TEST-PS-075-09.T10 | integration | PS-075-07.R01, PS-075-01.R02 | inspect outbound provider request and a statement embedding a relay-signed and a direct-provider quote | request contains only the pair and no client identifiers; the relay-signed quote is carried with its relay signature; the direct-provider quote is carried in full with sourceSigned false |
| TEST-PS-075-09.T14 | abuse | PS-075-01.R04, PS-075-01.R05, PS-075-02.R04, PS-075-07.R05 | vault A embeds a forged {source ecb-daily} quote with an invented rate in a statement to vault B; B calls verify_embedded with reDerive | B shows 'source asserted by <A pseudonym>, not verifiable', sourceSigned false, stores receivedFrom and the ECB deviation; nothing reads as ECB-sourced |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, F11.S01.M01, F11.S01.M03, F07.S02.M01, F07.S02.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001, CTR-FED-001, CTR-PRV-001. Predecessor: [module SPEC](SPEC.md).
