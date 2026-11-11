# PS-069-02 — Validation rules: Noncustodial payment claims

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M01 Noncustodial payment claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/noncustodial` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-069-02.R01** Every command input is validated strictly against the schema; unknown fields are rejected with VALIDATION_FAILED.
- **PS-069-02.R02** Incoming signed statements are verified for envelope shape, Ed25519 signature over JCS bytes (FED-2), signer role and chain position before any state change.
- **PS-069-02.R03** Every violation maps to exactly one stable error code with a localized message key.
- **PS-069-02.R04** Deal statements are checked against the signed context - ContextTermsPort recomputes parties and obligations from the verified context statement, the signer must hold the opener role the context type requires, and any mismatch is quarantined with COMMERCE_DEAL_CONTEXT_CONFLICT.
- **PS-069-02.R05** Ordering follows the per-author seq and prev chain (FED-3); an unknown prev is buffered for up to 24 h, and only two different statements by the same author with the same prev or seq count as a fork, so reordered delivery and sequential partial claims are never frozen.
- **PS-069-02.R06** Statements whose Money uses a crypto or non-snapshot currency are accepted only when the embedded asset descriptor equals the local CurrencyDef; a mismatch is quarantined with COMMERCE_CURRENCY_MISMATCH.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | contextRef.type is a core N5 type or a type registered through ContextTermsPort, and the context statement cid resolves in the local vault | COMMERCE_CONTEXT_UNKNOWN |
| V02 | 1 to 10 obligations, each amount positive within 38 digits and currency active in the registry | VALIDATION_FAILED |
| V03 | payerId differs from payeeId and both are listed parties | COMMERCE_DEAL_PARTY_INVALID |
| V04 | a Deal for this contextRef and contextCid with a different dealCid does not already exist | COMMERCE_DEAL_CONTEXT_CONFLICT |
| V05 | claim amount currency equals the obligation currency and the method is in allowedMethods | COMMERCE_CLAIM_METHOD_NOT_ALLOWED |
| V06 | method rule from the MethodRulePort passes (cash terms in force, crypto request open with the txid found by a verifier or attested by the payer, external reference format) | COMMERCE_CLAIM_METHOD_RULE |
| V07 | actor is the obligation payer for claim and the payee for acknowledge or dispute; acknowledge applies to cash and external claims only | FORBIDDEN |
| V08 | statement signature is valid under FED-2 (F11.S01.M03), the signing device key is active in the signer's portable identity document at local receipt time (KeyStatusPort, F07.S02.M01), and the signer holds the role the F11.S01.M01 registry names for the statement type | COMMERCE_STATEMENT_INVALID |
| V09 | statement seq and prev continue the author's chain on this Deal; an unknown prev is buffered up to 24 h, and two different statements by the same author with the same prev or seq are a fork | COMMERCE_STATEMENT_FORK |
| V10 | neither party has blocked the other (F07.S02.M02 isBlockedEither); commands return BLOCKED_PARTY and ingest drops statements from a blocked did silently unless they belong to a Deal with an open dispute case | BLOCKED_PARTY |
| V11 | Deal is open and not expired when a claim is made | CONFLICT_STATE |
| V12 | ContextTermsPort.verify(contextRef, contextCid, parties, obligations) confirms the parties, roles and obligations equal those derived from the verified context statement, on open and on ingest | COMMERCE_DEAL_CONTEXT_CONFLICT |
| V13 | a deal statement is signed by the opener role of its context type, a unilateral deal_cancel by the context owner role, and a deal_completion by a party | COMMERCE_STATEMENT_INVALID |
| V14 | a unilateral cancel happens only while no claim of the Deal is acknowledged or final and names reason context_voided, withdrawn_before_accept or non_payment | CONFLICT_STATE |
| V15 | a listing_fee Deal names as payee the operator DID in the relay's signed policy document for that relay and allows only crypto or external methods | COMMERCE_DEAL_PARTY_INVALID |
| V16 | every crypto or non-snapshot currency carries an asset descriptor equal to the local CurrencyDef (F09.S03.M01) | COMMERCE_CURRENCY_MISMATCH |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-069-09.T02 | unit | PS-069-01.R02, PS-069-02.R03 | schema inspection and attempts to set a paid field | no paid field exists; unknown field rejected with VALIDATION_FAILED |
| TEST-PS-069-09.T03 | unit | PS-069-02.R01, PS-069-02.R03 | each rule V01 to V06, V10 to V11 and V14 to V16 violated in turn | documented error code returned and nothing stored |
| TEST-PS-069-09.T10 | abuse | PS-069-05.R01, PS-069-05.R02, PS-069-07.R01, PS-069-02.R02 | forged statement, wrong-role signer, signing key not active in the signer's identity document, third party reading | statement quarantined with reason, no state change, NOT_FOUND for non-parties, no deal data in public payloads |
| TEST-PS-069-09.T13 | chaos | PS-069-06.R03, PS-069-07.R03, PS-069-09.R03, PS-069-02.R02, PS-069-02.R05 | vault B receives two different claims by the payer with the same prev | claim frozen with COMMERCE_STATEMENT_FORK, both retained, no auto-resolution; flood of 21 statements in an hour from a known party quarantines the 21st |
| TEST-PS-069-09.T20 | abuse | PS-069-02.R04 | vault B ingests a deal statement whose obligation is inflated above the accepted offer, and one signed by the buyer instead of the listing author | both quarantined with COMMERCE_DEAL_CONTEXT_CONFLICT or COMMERCE_STATEMENT_INVALID; no Deal mirrored |
| TEST-PS-069-09.T26 | unit | PS-069-02.R05 | dispute and acknowledgement delivered in reverse order; two sequential partial claims by the payer | reversed delivery buffered then applied in order; both partial claims applied; no fork reported |
| TEST-PS-069-09.T33 | unit | PS-069-01.R05, PS-069-02.R06 | USDC obligation whose asset descriptor states 18 decimals while the local registry has 6; matching descriptor | mismatch quarantined with COMMERCE_CURRENCY_MISMATCH; matching descriptor accepted |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
