# PS-069-09 — Contract and acceptance tests: Noncustodial payment claims

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M01 Noncustodial payment claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/noncustodial` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-069-09.R01** Every requirement is covered by at least one automated test.
- **PS-069-09.R02** Contract tests validate command outputs, statement envelopes and event payloads against the schema registry.
- **PS-069-09.R03** Fork, quarantine and idempotent open scenarios are covered by deterministic two-vault integration tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Two in-memory vaults A (buyer, payer) and B (seller, payee) with a test relay double; Deal for EUR 45.00 from an accepted offer; a USDC obligation fixture; context-module stubs implementing ContextTermsPort; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-069-09.T01 | unit | PS-069-01.R01 | open a Deal in vault A twice for the same contextRef and contextCid | one Deal; dealId is the UUIDv8 derived from JCS {contextRef, contextCid}; second call returns the existing Deal |
| TEST-PS-069-09.T02 | unit | PS-069-01.R02, PS-069-02.R03 | schema inspection and attempts to set a paid field | no paid field exists; unknown field rejected with VALIDATION_FAILED |
| TEST-PS-069-09.T03 | unit | PS-069-02.R01, PS-069-02.R03 | each rule V01 to V06, V10 to V11 and V14 to V16 violated in turn | documented error code returned and nothing stored |
| TEST-PS-069-09.T04 | property | PS-069-03.R01 | random command and event sequences on a claim | only declared transitions succeed; others return CONFLICT_STATE |
| TEST-PS-069-09.T05 | unit | PS-069-03.R02 | try to move a claim to confirmed or final through user input | refused; only crypto events can set it |
| TEST-PS-069-09.T06 | integration | PS-069-03.R03 | clock advanced 14 days without progress | claimed, disputed, pending_confirmation, confirmed and reorged claims without a payee acknowledgement become expired and emit commerce.payment.expired; a claim holding the payee's chain acknowledgement does not expire |
| TEST-PS-069-09.T07 | integration | PS-069-03.R04 | two cases opened on one Deal; the first resolved with a refund-claimed outcome, then the second withdrawn | Deal stays disputed after the first and returns to open only after the second; no claim status changed; no money movement API invoked |
| TEST-PS-069-09.T08 | contract | PS-069-04.R01, PS-069-04.R02, PS-069-09.R02 | execute each command in vault A and ingest in vault B | outputs, envelopes and events validate against registry schemas; commerce.deal.completed carries dealId, contextRef, contextId, completionCid, parties with roles and completedAt |
| TEST-PS-069-09.T09 | integration | PS-069-04.R03 | deliver crypto events and commerce.dispute.opened, resolved and withdrawn | claim and Deal statuses follow the machine |
| TEST-PS-069-09.T10 | abuse | PS-069-05.R01, PS-069-05.R02, PS-069-07.R01, PS-069-02.R02 | forged statement, wrong-role signer, signing key not active in the signer's identity document, third party reading | statement quarantined with reason, no state change, NOT_FOUND for non-parties, no deal data in public payloads |
| TEST-PS-069-09.T11 | contract | PS-069-05.R03, PS-069-01.R03 | inspect relay double traffic | only ciphertext and routing metadata observed |
| TEST-PS-069-09.T12 | integration | PS-069-06.R01, PS-069-06.R02 | same command ID replayed; delivery interrupted at each sync state | original result returned; UI state equals the highest sync state reached |
| TEST-PS-069-09.T13 | chaos | PS-069-06.R03, PS-069-07.R03, PS-069-09.R03, PS-069-02.R02, PS-069-02.R05 | vault B receives two different claims by the payer with the same prev | claim frozen with COMMERCE_STATEMENT_FORK, both retained, no auto-resolution; flood of 21 statements in an hour from a known party quarantines the 21st |
| TEST-PS-069-09.T14 | integration | PS-069-07.R02 | principal deletion completes | retained records carry the pseudonym, signatures flagged unverifiable-after-pseudonymization, counterparty copy untouched |
| TEST-PS-069-09.T15 | load | PS-069-08.R02 | 10 000 claims and a batch of 100 statements | p95 ≤ 120 ms commit; batch ≤ 2 s; sweep ≤ 1 s |
| TEST-PS-069-09.T16 | integration | PS-069-08.R01, PS-069-09.R01 | local diagnostics and traceability run | no network telemetry sent; every PS-069 requirement maps to a passing test |
| TEST-PS-069-09.T17 | e2e | PS-069-03.R09 | buyer claims cash payment, seller acknowledges on another device, both screens checked; crypto claim shown at 2 of 6 and final in the payer vault | labels read claimed (unverified) then acknowledged by payee; crypto reads confirmed 2 of 6 per your verifier then final per your verifier, payee has not confirmed; Deal completed only after acknowledgement; axe zero serious issues |
| TEST-PS-069-09.T18 | integration | PS-069-10.R01, PS-069-10.R02, PS-069-10.R03 | export vault A, import into fresh vault, roll back one release | Deals and claims round-trip identical; open Deals import as open with sync state local_committed; conflicting IDs rejected |
| TEST-PS-069-09.T19 | contract | PS-069-04.R04 | assert every produced event payload against the consumer expectations of F07.S03.M01, F13.S01.M03, F02.S04.M01, F03.S02.M02, F05.S01.M02 and F01.S01.M03 | payment events carry contextRef, payerId, payeeId and parties; deal.opened and deal.cancelled carry parties; deal.completed carries contextId and completionCid |
| TEST-PS-069-09.T20 | abuse | PS-069-02.R04 | vault B ingests a deal statement whose obligation is inflated above the accepted offer, and one signed by the buyer instead of the listing author | both quarantined with COMMERCE_DEAL_CONTEXT_CONFLICT or COMMERCE_STATEMENT_INVALID; no Deal mirrored |
| TEST-PS-069-09.T21 | integration | PS-069-01.R01, PS-069-01.R04 | vaults A and B open the same accepted offer independently; an auction second-chance Deal opens with a new offer statement cid | A and B hold the same dealId and dealCid; the second-chance Deal has its own dealId; both vaults compute the same completionCid |
| TEST-PS-069-09.T22 | integration | PS-069-03.R05, PS-069-05.R04 | context owner voids an open Deal through DealPort.cancel; a non-owner tries; the owner tries after a claim was acknowledged | one-sided cancel applied in the other vault and labelled one-sided; non-owner FORBIDDEN or quarantined; CONFLICT_STATE after acknowledgement |
| TEST-PS-069-09.T23 | integration | PS-069-03.R06 | two vaults with a verifier only in the payer vault; crypto claim reaches final there; later the payee configures a verifier | payer reads final per your verifier, payee has not confirmed, and its Deal neither completes nor expires; after the payee vault signs its chain acknowledgement both Deals complete with the same completionCid |
| TEST-PS-069-09.T24 | integration | PS-069-03.R07 | Deal with two obligations, one acknowledged, passes expiresAt; disputed Deal 30 days past expiresAt; case opened on a completed Deal | first expires with reason expired_partial; disputed Deal expires then; completed Deal only gets disputeFlag |
| TEST-PS-069-09.T25 | integration | PS-069-03.R08 | disputed crypto claim receives confirming; mismatched transaction reported as failed; finalized event for a failed claim | disputed to pending_confirmation with the dispute statement kept; claimed to failed with its reason; late event only updates verification fields and is acknowledged |
| TEST-PS-069-09.T26 | unit | PS-069-02.R05 | dispute and acknowledgement delivered in reverse order; two sequential partial claims by the payer | reversed delivery buffered then applied in order; both partial claims applied; no fork reported |
| TEST-PS-069-09.T27 | integration | PS-069-04.R05 | ingest cash_terms, crypto_request, receipt and dispute statements, an fx_quote_revocation and an unregistered commerce statement type | the first four dispatched to their registered handlers with signer-role checks; the revocation is not handled here; unregistered type quarantined with reason type_unregistered |
| TEST-PS-069-09.T28 | integration | PS-069-04.R06 | crypto claim whose txid the verifier has not found; crypto claim without a verifier and without txidAttested | first stays local with sendHold txid_lookup_pending, no claimCid and no outbox row until released; second refused with COMMERCE_CLAIM_METHOD_RULE |
| TEST-PS-069-09.T29 | integration | PS-069-05.R03, PS-069-04.R01 | listing_fee Deal on relay R - claim delivered to the operator mailbox, operator acknowledges through the relay command, then a moderator of R and the operator of another relay try | ack signed by the operator DID from R's signed policy document and applied in the seller vault; the other attempts FORBIDDEN |
| TEST-PS-069-09.T30 | abuse | PS-069-07.R05 | 10 000 fresh dids each send one statement to vault B | quarantine never exceeds 500 entries or 5 MiB; oldest evicted first; once full, statements from non-parties are dropped; known parties' statements still applied |
| TEST-PS-069-09.T31 | integration | PS-069-07.R04 | export, deletion and retention purge driven by F10 | section commerce.deals exported; DeletionPort plan pseudonymizes the principal; RetentionPurgePort purges records past RET-EVIDENCE; every field carries an F10.S02.M02 class |
| TEST-PS-069-09.T32 | integration | PS-069-08.R03 | quarantined, buffered and forked statements produced, then diagnostics opened | commerce.statement.diagnostics and the diagnostics screen show counts by reason |
| TEST-PS-069-09.T33 | unit | PS-069-01.R05, PS-069-02.R06 | USDC obligation whose asset descriptor states 18 decimals while the local registry has 6; matching descriptor | mismatch quarantined with COMMERCE_CURRENCY_MISMATCH; matching descriptor accepted |
| TEST-PS-069-09.T34 | integration | PS-069-07.R06 | blocked counterparty sends a claim, and an acknowledgement on a Deal with an open dispute case | first dropped silently with no signal; second stored as evidence with notification suppressed |

## Acceptance criteria

- All tests T01 to T34 pass in CI.
- No state or label ever shows a payment as completed on the strength of a payer claim alone.
- Two independent vaults converge on the same Deal status and on the statement-driven claim statuses (cash and external claims and the claim, acknowledgement and dispute chain) after exchanging the same signed statements in any order; crypto observation statuses are per vault and labelled according to your verifier, and crypto-driven completion converges through the payee's signed chain acknowledgement.
- A forked claim is frozen and never silently resolved.
- A Deal statement whose parties or obligations differ from the signed context is never mirrored.

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
