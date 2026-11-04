# PS-075-01 — Domain schema: FX rates and quotes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M02 FX rates and quotes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/rates` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-075-01.R01** An FxQuote stores base, quote, rational rate {num, den}, source, sourceKind, asOf, expiresAt, issuer reference and optional source signature per MNY-4, in the principal's vault.
- **PS-075-01.R02** Quotes are P1 reference data (the issuer's did is the only identity) and retained as RET-EVIDENCE in the vault because proposals pin them; a quote embedded in a signed statement is carried in full.
- **PS-075-01.R03** A quote is immutable after issue except for revocation of manual quotes.

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
| source | string — adapter ID such as ecb-daily, or manual:<operatorId> |
| sourceKind | enum — provider \| manual \| derived |
| label? | string — shown for manual quotes, e.g. Manual operator rate; reason ≤ 200 chars |
| asOf | timestamp — time the rate was observed at the source |
| expiresAt | timestamp — issuedAt + 1..60 min (provider) or up to 24 h (manual) |
| status | enum — issued \| expired \| revoked |
| derivedFrom? | uuidv7[] — quote IDs when triangulated via EUR |
| issuerRef | string — did:key of the local principal for manual quotes, or relay key id for relay-signed quotes |
| sig? | string — base64url Ed25519 over JCS(quote minus sig) by the source; required when sourceKind is provider via relay or when issued by a relay |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |

**Invariants**
- num and den are positive and coprime.
- expiresAt is after createdAt and not more than 24 h later.
- sourceKind manual implies label is set.

### Storage DDL

```sql
CREATE TABLE commerce_fx_quote (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL /* vault id */, base TEXT NOT NULL, quote TEXT NOT NULL,
  rate_num TEXT NOT NULL, rate_den TEXT NOT NULL, source TEXT NOT NULL, source_kind TEXT NOT NULL,
  as_of TEXT NOT NULL, expires_at TEXT NOT NULL, status TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE INDEX commerce_fx_pair ON commerce_fx_quote(tenant_id, base, quote, created_at DESC);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-075-09.T01 | unit | PS-075-01.R01, PS-075-01.R03, PS-075-02.R02 | request EUR/USD with the fixture 1.0870 token | stored rate 1087/1000, no float used, source ecb-daily |
| TEST-PS-075-09.T03 | property | PS-075-01.R01, PS-075-02.R02 | random decimal strings up to 18 fractional digits | num and den coprime and num/den equals the decimal exactly |
| TEST-PS-075-09.T04 | unit | PS-075-03.R01, PS-075-03.R02, PS-075-01.R03 | clock advanced to expiresAt and one second before | check returns valid then EXPIRED; quote never extended |
| TEST-PS-075-09.T10 | integration | PS-075-07.R01, PS-075-07.R03, PS-075-01.R02 | inspect outbound provider request and a statement embedding a quote | request contains only the pair and no client identifiers; embedded quote carries its source signature |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
