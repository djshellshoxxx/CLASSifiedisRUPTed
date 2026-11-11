# PS-069-02 — Validation rules: Noncustodial payment claims

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M01 Noncustodial payment claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/noncustodial` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-069-02.R01** Every command input is validated strictly against the schema; unknown fields are rejected with VALIDATION_FAILED.
- **PS-069-02.R02** Incoming signed statements are verified for envelope shape, Ed25519 signature over JCS bytes (FED-2), signer role and chain position before any state change.
- **PS-069-02.R03** Every violation maps to exactly one stable error code with a localized message key.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | contextRef.type is a registered context type and the context statement cid resolves in the local vault | COMMERCE_CONTEXT_UNKNOWN |
| V02 | 1 to 10 obligations, each amount positive within 38 digits and currency active in the registry | VALIDATION_FAILED |
| V03 | payerId differs from payeeId and both are listed parties | COMMERCE_DEAL_PARTY_INVALID |
| V04 | a Deal for this contextRef with different terms does not already exist | COMMERCE_DEAL_CONTEXT_CONFLICT |
| V05 | claim amount currency equals the obligation currency and the method is in allowedMethods | COMMERCE_CLAIM_METHOD_NOT_ALLOWED |
| V06 | method rule from the MethodRulePort passes (cash, crypto or external) | COMMERCE_CLAIM_METHOD_RULE |
| V07 | actor is the obligation payer for claim, the payee for acknowledge or dispute | FORBIDDEN |
| V08 | statement signature is valid and signer is authorized for the role in the Deal | COMMERCE_STATEMENT_INVALID |
| V09 | statement prev equals the current head of the claim chain | COMMERCE_STATEMENT_FORK |
| V10 | neither party has blocked the other locally | BLOCKED_PARTY |
| V11 | Deal is open and not expired when a claim is made | CONFLICT_STATE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-069-09.T01 | unit | PS-069-01.R01, PS-069-01.R02, PS-069-02.R02 | open a Deal in vault A twice for the same contextRef | one Deal, same dealId derived deterministically, second call returns the existing Deal |
| TEST-PS-069-09.T02 | unit | PS-069-01.R02, PS-069-02.R03 | schema inspection and attempts to set a paid field | no paid field exists; unknown field rejected with VALIDATION_FAILED |
| TEST-PS-069-09.T03 | unit | PS-069-02.R01, PS-069-02.R03 | each rule V01 to V06 and V10 to V11 violated in turn | documented error code returned and nothing stored |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
