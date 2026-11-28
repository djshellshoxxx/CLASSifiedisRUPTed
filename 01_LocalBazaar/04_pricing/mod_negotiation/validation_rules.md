# PS-010-02 — Validation rules: Price negotiation

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M02 Price negotiation](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/negotiation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-010-02.R01** Every outgoing command and every incoming statement is validated for roles, turn, convergence, currency, listing revision and expiry before it changes state, in the vault each rule names: the buyer vault against the verified listing projection (F11.S01.M02 mirror view), the seller vault against its own listing and sell terms.
- **PS-010-02.R02** Statements that fail verification are quarantined with a reason and never change a negotiation.
- **PS-010-02.R03** Every violation maps to one stable error code.
- **PS-010-02.R04** A round in another currency or quantity than the root offer is refused with VALIDATION_FAILED.
- **PS-010-02.R05** Before counter, accept, reject, withdraw, discard_frozen and keep_frozen, and before applying an inbound round, close, confirmation or acceptance consent, the vault calls federation.conflict.is_frozen (F11.S02.M03) synchronously for consent:bazaar_negotiation:<negotiationId>; frozen refuses with CONFLICT_STATE (params.state frozen) except for discard_frozen and keep_frozen, and a store that cannot answer refuses with DEPENDENCY_UNAVAILABLE.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | both vaults: signature verifies over JCS bytes, author is the stated buyer or seller key, schema version supported | VALIDATION_FAILED |
| V02 | both vaults: it is the actor's turn (awaiting equals the actor) and status is open | CONFLICT_STATE |
| V03 | both vaults: roundNo = lastRoundNo + 1 and roundNo <= 10 | BAZAAR_NEGOTIATION_ROUND_LIMIT |
| V04 | both vaults: seller counter amount >= buyer's previous amount and <= seller's previous amount (or asking price at round 1); buyer counter symmetric; amounts compared in the chain currency | BAZAAR_NEGOTIATION_NOT_CONVERGING |
| V05 | amount is a positive integer string <= maxAmount(currency) in a currency the listing accepts (seller vault: bazaar.sell_terms.accepts; buyer vault: acceptedCurrencies of the verified projection) | VALIDATION_FAILED |
| V06 | listing is negotiable and published (seller vault: own Listing and SellTerms; buyer vault: verified projection, not tombstoned), and the cited listingRevision equals the current revision for accept | BAZAAR_NEGOTIATION_LISTING_CHANGED |
| V07 | round expiry between 1 h and 7 days and not later than hardDeadline | VALIDATION_FAILED |
| V08 | seller vault: accept or acceptance consent is applied before the round expiresAt according to the seller's clock; buyer vault: a confirmation is applied until expiresAt + 24 h on the buyer's clock | EXPIRED |
| V09 | both vaults: neither party blocks the other (F07.S02.M02 isBlockedEither); statements from blocked DIDs are dropped silently (N7) | BLOCKED_PARTY |
| V10 | note <= 280 code points | VALIDATION_FAILED |
| V11 | seller vault: inventory check (bazaar.inventory.check) succeeds before confirmation | BAZAAR_NEGOTIATION_HOLD_FAILED |
| V12 | expectedRevision matches | CONFLICT_REVISION |
| V13 | both vaults: round currency equals Negotiation.currency and quantity equals Negotiation.quantity (the root offer's) | VALIDATION_FAILED |
| V14 | both vaults: an acceptance counts only when comms.consent.verify returns valid for the accepting party (signerDid = buyer or seller as stated) over subjectRevisionHash = the round statementCid (ID-3 cid of ConsentSubjectPort.canonicalBytes) under statementKey consent.bazaar.negotiation.accept.v1; conflicted freezes the chain | VALIDATION_FAILED |
| V15 | both vaults: a close or confirmation binds the negotiationId and the cid of the round it answers | VALIDATION_FAILED |
| V16 | both vaults: federation.conflict.is_frozen({subjectRef: consent:bazaar_negotiation:<negotiationId>}) returns frozen false, except for discard_frozen and keep_frozen | CONFLICT_STATE |
| V17 | both vaults: federation.conflict.is_frozen answers; a store that cannot be read refuses the action (fail closed) | DEPENDENCY_UNAVAILABLE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-010-09.T01 | unit | PS-010-01.R01, PS-010-01.R03, PS-010-02.R01 | S counters EUR 48.00 then B counters EUR 44.00 | rounds stored immutable with prev chain; ordering by roundNo not clock |
| TEST-PS-010-09.T03 | unit | PS-010-02.R02, PS-010-02.R03 | violate each rule V01-V17 in turn in the vault the rule names | documented error code returned or statement quarantined with reason; state unchanged |
| TEST-PS-010-09.T07 | integration | PS-010-03.R02, PS-010-02.R03 | last unit held for B2 while B's acceptance is in transit | S sends signed close superseded; B shows rejected superseded; no double hold |
| TEST-PS-010-09.T14 | abuse | PS-010-02.R03 | 21 counters in an hour; 11th round | RATE_LIMITED; BAZAAR_NEGOTIATION_ROUND_LIMIT |
| TEST-PS-010-09.T21 | unit | PS-010-01.R04, PS-010-02.R04 | EUR root offer, then a USD counter, then a EUR counter with quantity 2 | both refused with VALIDATION_FAILED; chain currency and quantity unchanged |
| TEST-PS-010-09.T29 | integration | PS-010-02.R05 | federation.conflict.detected freezes consent:bazaar_negotiation for an open chain, then counter, accept and an inbound round are attempted, then discard_frozen; a second chain while the conflict store fails; a third chain frozen and resolved drop_all | CONFLICT_STATE for counter, accept and the inbound round, discard_frozen allowed; DEPENDENCY_UNAVAILABLE with the failing store; drop_all closes the chain frozen_discarded |

## Dependencies

Module depends on: F01.S04.M01, F01.S03.M01, F01.S01.M01, F01.S02.M01, F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F08.S02.M02, F11.S01.M01, F11.S01.M02, F11.S02.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
