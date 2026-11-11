# PS-067-01 — Domain schema: Cash payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M02 Cash payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/cash` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-067-01.R01** CashTerms stores dealId, obligationId, receiptRequired, handoverHint, proposer, status and signed statement cids per CTR-ID-001, in both parties' vaults.
- **PS-067-01.R02** CashTerms are P2 and retained as RET-EVIDENCE because they bound what each party agreed when the claim was made.
- **PS-067-01.R03** acknowledgementRequired is a constant true; the schema has no field that could mark cash as verified.

## Specification

### CashTerms

Schema `classrup.commerce.cash_terms/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| vaultId | uuidv7 — local vault scope (CTR-ID-001 tenant slot) |
| dealId | uuid — ref F09.S01.M01 Deal |
| obligationId | string — ref Deal.obligations; cash must be in allowedMethods |
| acknowledgementRequired | boolean — always true |
| receiptRequired | boolean — payee asks for a bilateral signed receipt (F09.S02.M01) |
| handoverHint? | string — ≤ 120 code points, public place suggestion only |
| safetyLevel | enum — standard \| elevated; elevated when amount ≥ 100 000 minor units of a 2-decimal currency equivalent (scaled by decimals) |
| proposerId | did — payee of the obligation |
| status | enum — proposed \| accepted \| superseded \| expired |
| termsCid | string — sha256 of the signed cash_terms statement |
| acceptCid? | string — cid of the payer acceptance statement |
| expiresAt | timestamp — proposedAt + 7 days |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC, local clock |

**Invariants**
- At most one CashTerms with status accepted per (dealId, obligationId).
- acknowledgementRequired is true in every row.
- proposerId is the payee of the obligation.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-067-09.T01 | unit | PS-067-01.R01, PS-067-01.R03, PS-067-02.R01 | propose valid terms | row stored with acknowledgementRequired true, status proposed, signed statement created |
| TEST-PS-067-09.T06 | integration | PS-067-04.R03, PS-067-01.R02 | commerce.deal.opened delivered twice | exactly one default terms row per cash obligation |
| TEST-PS-067-09.T11 | e2e | PS-067-01.R03, PS-067-09.R03 | claim cash then acknowledge on second device | labels read claimed (unverified) then acknowledged by payee; never confirmed; axe zero serious issues |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M03, F18.S01.M01, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [module SPEC](SPEC.md).
