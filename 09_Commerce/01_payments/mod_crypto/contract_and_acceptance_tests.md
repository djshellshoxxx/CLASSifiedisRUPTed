# PS-068-09 — Contract and acceptance tests: Crypto payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M03 Crypto payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/crypto` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-068-09.R01** Every requirement is covered by at least one automated test.
- **PS-068-09.R02** Adapter behavior is tested against recorded Esplora and EVM JSON-RPC fixtures with no network access in CI.
- **PS-068-09.R03** Reorg, underpayment, wrong asset and no-verifier scenarios are covered deterministically.

## Specification

See the module test table below (all processes).

**Fixtures:** Recorded fixtures: Bitcoin tx with 0, 1, 2, 3, 5, 6 confirmations, an orphaned block and a block replaced 40 blocks after final; a transaction to the request address included before chainTipAtCreation; EVM tx pre-finalized and finalized, reverted tx, USDC transfer from correct and wrong contract; two-vault setup (payer A, payee B) with a relay double and verifier doubles that record every request; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-068-09.T01 | unit | PS-068-01.R01, PS-068-01.R02, PS-068-02.R01 | create a request with valid and invalid addresses for each chain | valid request stored and signed; invalid returns COMMERCE_CRYPTO_ADDRESS_INVALID |
| TEST-PS-068-09.T02 | unit | PS-068-01.R03, PS-068-02.R02, PS-068-07.R02 | inputs with a WIF key, an xprv string, and a 12-word phrase in note and txRef | COMMERCE_CRYPTO_SECRET_REJECTED, nothing stored or logged |
| TEST-PS-068-09.T03 | unit | PS-068-02.R03, PS-068-03.R02 | no verifier configured and a crypto claim made | claim stays claimed, verification.source self, no observation, COMMERCE_CRYPTO_NO_VERIFIER on refresh |
| TEST-PS-068-09.T04 | integration | PS-068-02.R03, PS-068-03.R05 | underpaid, wrong address, wrong token contract and reverted transactions | matchResult recorded; no commerce.payment.confirming emitted; commerce.payment.failed with the matching reason; claim never confirmed |
| TEST-PS-068-09.T05 | property | PS-068-03.R01 | random verifier answer sequences | only declared transitions occur; final is never followed by another state |
| TEST-PS-068-09.T06 | integration | PS-068-03.R03 | Bitcoin block orphaned at 2 confirmations then transaction re-included; and absent for 24 h | reorged then pending then confirmed; second case ends failed |
| TEST-PS-068-09.T07 | integration | PS-068-03.R02, PS-068-03.R04 | Bitcoin at 5 then 6 confirmations; EVM below then at finalized tag; claim expiry at 14 days | finalized only at 6 and finalized tag; observation stopped at expiry |
| TEST-PS-068-09.T08 | contract | PS-068-04.R01, PS-068-04.R02, PS-068-09.R02 | execute each command and run an observation to final | outputs, envelopes and events validate against registry schemas |
| TEST-PS-068-09.T09 | integration | PS-068-04.R03, PS-068-06.R01 | consumed events delivered twice; same command ID replayed | one request and one observation; original result returned |
| TEST-PS-068-09.T10 | abuse | PS-068-05.R01, PS-068-05.R02, PS-068-05.R03 | request signed by the payer; third-party statement; relay inspects traffic | quarantined or FORBIDDEN; relay sees only ciphertext |
| TEST-PS-068-09.T11 | chaos | PS-068-06.R02, PS-068-06.R03 | endpoint timeouts, two endpoints disagreeing, endpoint returning lower height | claim status unchanged, disagreement flagged, no progress applied |
| TEST-PS-068-09.T12 | integration | PS-068-07.R01 | inspect outbound endpoint requests and local logs | only txid or address lookups to the configured endpoint; no addresses or amounts in logs |
| TEST-PS-068-09.T13 | abuse | PS-068-08.R04 | 4 refreshes in one minute | 4th returns RATE_LIMITED |
| TEST-PS-068-09.T14 | integration | PS-068-08.R02 | app closed for 3 days with the transaction finalized meanwhile | on open the observation catches up within one poll interval and reaches final with checkedAt updated |
| TEST-PS-068-09.T15 | load | PS-068-08.R01, PS-068-08.R02 | 20 active observations polled for 10 minutes | commit p95 ≤ 100 ms, poll cycle ≤ 3 s, no telemetry sent |
| TEST-PS-068-09.T16 | unit | PS-068-09.R01, PS-068-09.R03 | traceability tool run and fixture coverage check | every PS-068 requirement maps to a passing test |
| TEST-PS-068-09.T17 | integration | PS-068-10.R01, PS-068-10.R02, PS-068-10.R03 | export, import to fresh vault, roll back one release | requests and observations round-trip; imported open observations restart as watching |
| TEST-PS-068-09.T18 | unit | PS-068-02.R04, PS-068-04.R06 | with a verifier configured, claim with a 0x plus 64-hex value the verifier never finds, then with a real txid; without a verifier, claim without and with txidAttested | first held with sendHold txid_lookup_pending, never signed into a claim or sent to the payee, discarded after 24 h; real txid released and sent; without verifier refused with COMMERCE_CLAIM_METHOD_RULE until attested |
| TEST-PS-068-09.T19 | integration | PS-068-03.R05, PS-068-02.R03 | each matchResult underpaid, wrong_address, wrong_asset, before_request and reverted, from watching, pending and reorged | observation mismatched or failed; commerce.payment.failed carries the reason; label 'transaction does not match request'; no confirming event |
| TEST-PS-068-09.T20 | integration | PS-068-03.R06 | Bitcoin confirmations 1, 2, 3 then 6; EVM transaction before and at the finalized tag | confirming emitted at each increase with confirmations and requiredConfirmations and lastProgressAt refreshed; EVM label 'awaiting finalized checkpoint', never 'N of 0' |
| TEST-PS-068-09.T21 | integration | PS-068-03.R07 | vaults A and B with a verifier only in payer vault A; later B configures one | A reads 'final per your verifier; payee has not confirmed' and its request stays claimed; after B finalizes, F09.S01.M01 in B signs payment_ack with source chain and both vaults settle the request and complete the Deal |
| TEST-PS-068-09.T22 | integration | PS-068-03.R08 | transaction final at 6 confirmations, inclusion block replaced 40 blocks later, then 100 blocks pass | observation stays final, deepReorgAlertAt set and shown, claim not regressed; watch ends after 100 blocks |
| TEST-PS-068-09.T23 | integration | PS-068-03.R09, PS-068-01.R05 | transaction underpaid by 4 000 sats, then a claim for the received amount and a second transaction for the remainder | first claim failed underpaid; the next two claims attach to the same request; request settled only when both are final |
| TEST-PS-068-09.T24 | abuse | PS-068-01.R04, PS-068-02.R05, PS-068-07.R05 | a transaction to a reused address included before chainTipAtCreation is claimed for a new request; payee creates a second open request with an address still in use | claim fails with before_request; second request refused with COMMERCE_CRYPTO_ADDRESS_REUSED |
| TEST-PS-068-09.T25 | integration | PS-068-07.R04, PS-068-05.R04 | inspect every verifier request (own node, direct endpoint, relay endpoint) with chain_lookup consent granted and then withdrawn | no DID, device-key signature, relay access token or cookie; connection separate from mailbox traffic; with consent withdrawn no lookup happens and refresh returns PRECONDITION_FAILED |
| TEST-PS-068-09.T26 | load | PS-068-08.R04 | 60 active observations with two endpoints per chain for one hour | at most 900 endpoint calls; observations closest to finality checked first; deferred ones show 'verification paused - check budget reached'; tip polls continue |
| TEST-PS-068-09.T27 | integration | PS-068-04.R04 | payer vault ingests a crypto_request signed by the payee, one signed by the payer, one with an invalid address, one with an 18-decimal USDC descriptor, a duplicate and one from a blocked did | first stored with origin peer and its address; then signer_not_payee, address_invalid and asset_mismatch (COMMERCE_CURRENCY_MISMATCH) quarantined; duplicate no-op; blocked dropped silently |
| TEST-PS-068-09.T28 | contract | PS-068-04.R05 | assert every produced event against the expectations of F09.S01.M01, F01.S01.M03, F05.S01.M02, F03.S02.M02, F02.S04.M01 and F13.S01.M03 | each commerce.payment.* event carries contextRef, obligationId, payerId and payeeId; commerce.payment.finalized carries the obligationId of the claim's Deal obligation |
| TEST-PS-068-09.T29 | integration | PS-068-07.R06 | export, deletion and retention purge driven by F10 | section commerce.crypto exported without verifier settings; DeletionPort pseudonymizes the principal; RetentionPurgePort purges after RET-EVIDENCE; every field carries an F10.S02.M02 class |
| TEST-PS-068-09.T30 | abuse | PS-068-07.R07 | 10 000 fresh dids send crypto_request statements to vault A; blocked payee sends one | quarantine stays within 500 entries or 5 MiB; non-party statements dropped once full; blocked statement dropped silently |
| TEST-PS-068-09.T31 | unit | PS-068-08.R03 | two endpoints disagree twice and one reorg and one deep reorg occur; diagnostics opened | commerce.crypto_observation.diagnostics and the verification panel show 2 disagreements, 1 reorg and 1 deep-reorg alert |
| TEST-PS-068-09.T32 | e2e | PS-068-07.R03 | open verifier settings and trigger the first lookup | disclosure 'This endpoint learns which transactions and addresses you look up' shown before the lookup; own node or direct endpoint preselected; axe zero serious issues |

## Acceptance criteria

- All tests T01 to T32 pass in CI.
- With no verifier configured, no crypto claim ever leaves claimed.
- Recognizable secret formats (WIF, xprv, BIP39 phrases) are rejected before storage or logging, and a value in txid format is never signed into a claim or sent to the payee until a verifier found it on chain or the payer attested it is a public transaction ID; the residual risk that the lookup discloses a mistyped key to the user's chosen verifier is stated in the UI.
- final is set only when the finality policy is met; a reorg before final is always visible, and a reorg after final raises a deep-reorg alert without regressing state.
- No transaction that does not match its request ever produces a confirming label.
- Crypto observation status is per vault and labelled according to that vault's verifier, and crypto-driven completion converges through the payee's signed chain acknowledgement.

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
