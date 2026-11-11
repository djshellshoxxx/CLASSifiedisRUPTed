# PS-069-01 — Domain schema: Noncustodial payment claims

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M01 Noncustodial payment claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/noncustodial` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-069-01.R01** A Deal stores contextRef {type, id}, the context statement cid, parties with roles, 1 to 10 obligations (payer, payee, Money amount, purpose), status, open case ids, expiry and revision; its dealId is a UUIDv8 (RFC 9562 section 5.8) made from the first 16 bytes of sha256 over JCS {contextRef, contextCid} with version and variant bits set, an explicit exception to CTR-ID-001 ID-1, so every vault derives the same ID and a new context statement such as an auction second-chance offer yields a new Deal.
- **PS-069-01.R02** A PaymentClaim stores exactly the COM-2 fields plus dealId, obligationId, the method reference signed into the claim (cash termsCid or crypto request cid), verification per COM-4, statement cids and local receivedAt; there is no paid boolean anywhere in the schema.
- **PS-069-01.R03** Deals and claims are P2 (parties only), kept by each party (a vault, or the relay for a listing_fee Deal whose payee is that relay's operator) as RET-EVIDENCE, and travel only as end-to-end encrypted signed envelopes between the parties (PRV-5).
- **PS-069-01.R04** dealCid is the cid of JCS {contextRef, contextCid, parties, obligations}, so independent opens of the same terms converge on one dealCid, and completionCid is the cid of the completion body {dealId, dealCid, outcome: completed} that every party signs as classrup.commerce.deal_completion/v1.
- **PS-069-01.R05** Money in a Deal or claim whose currency is crypto or outside the bundled ISO snapshot carries the F09.S03.M01 asset descriptor {code, chainId, contract, decimals, digest}, so every vault reads the same minor units.

## Specification

### Deal

Schema `classrup.commerce.deal/v1` · storage **relay+device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuid — UUIDv8 (RFC 9562 §5.8) from sha256(JCS {contextRef, contextCid}); explicit CTR-ID-001 ID-1 exception; primary key |
| vaultId | uuidv7 — local vault scope (CTR-ID-001 tenant slot); the relay instance id for a relay-held listing_fee Deal |
| contextRef | object — {type, id: uuid}; type is a registered context type: core N5 types offer (id offerId; the root offerId for a Deal negotiated through F01.S04.M02) \| auction_result (id the auction result id; for a second-chance Deal the id F04.S01.M03 derives as the first 16 bytes of sha256(second_chance_offer cid) formatted as a UUID) \| cycle_compensation (id the cycle id, or recoveryCaseId for a recovery compensation) \| service_milestone (id milestoneId) \| rental_deposit (id depositId) \| rental_damage (id claimId) \| listing_fee (id publicationId), plus types a context module registers through ContextTermsPort (N5a: rental_reservation {id reservationId} and rental_cancellation_fee {id reservationId} by F05.S01.M01, rental_deposit_release {id depositId} by F05.S01.M02, rental_late_fee {id returnId} by F05.S02.M02); rental_deposit is implemented by F05.S01.M02 and rental_damage by F05.S02.M03 |
| contextCid | string — sha256 cid of the signed context statement: offerCid (offer), auction result or, for a second-chance Deal, the second_chance_response cid (auction_result), committed cycle revision or the accepting classrup.mutiny.recovery_action/v1 cid (cycle_compensation), milestone approvalCid (service_milestone), reservation requestCid (rental_reservation), the renter's cancellation cid (rental_cancellation_fee), deposit agreementCid (rental_deposit), release attestation cid (rental_deposit_release), return attestation or receipt cid (rental_late_fee), damage acceptance, counter acceptance or F09.S02.M02 dispute outcomeCid (rental_damage), publication statementCid (listing_fee) |
| parties | array — 2..20 entries {did (principal DID), role: payer\|payee\|both} |
| openerRole | string — role in the context that signs the deal statement, resolved by ContextTermsPort.openerRole (for example listing author for offer) |
| obligations | array — 1..10 entries {obligationId, payerId, payeeId, amount: Money, asset?: AssetDescriptor (F09.S03.M01), purpose: goods\|service\|deposit\|compensation\|rent\|damage\|listing_fee\|other, allowedMethods: cash\|crypto\|external subset} |
| status | enum — open \| disputed \| completed \| cancelled \| expired |
| openCaseIds | array — ids of non-terminal F09.S02.M02 cases on this Deal or one of its claims; a non-terminal Deal is disputed exactly when this is non-empty |
| disputeFlag | boolean — a case was opened after the Deal became terminal; no state change |
| expiresAt | timestamp — openedAt + 30 days by default, range 1..90 days |
| dealCid | string — cid of JCS {contextRef, contextCid, parties, obligations}; equal in every vault for the same terms |
| peerSync | object — per party sync state: local_committed \| prepared \| transport_acknowledged \| peer_accepted |
| cancelSigners | array — parties whose deal_cancel statement is held |
| cancellation? | object — {mode: mutual\|unilateral, reason: mutual\|context_voided\|withdrawn_before_accept\|non_payment\|buyer_timeout\|conflict_resolved\|expired\|expired_partial, byDid?, cancelCids[]} |
| completion? | object — {completionCid, signedBy: dids[], completedAt (local clock)} |
| frozen? | object — {reason: inventory_conflict, since (local clock), holdIds[]}; set from bazaar.inventory.conflict_detected in the vault that detected the fork; a local flag, never a status and never sent |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC, local clock |
| updatedAt | timestamp — RFC 3339 UTC, local clock |

**Invariants**
- Every obligation amount is positive and its currency is active in the local registry (F09.S03.M01), with an equal asset descriptor when the currency is crypto or outside the bundled snapshot.
- payerId differs from payeeId in every obligation and both are parties.
- status completed implies every obligation is covered by claims holding a payee-signed acknowledgement (source counterparty for cash or external, source chain for crypto) summing to at least its amount, and completion.completionCid is set.
- id equals the UUIDv8 derivation of (contextRef, contextCid); one Deal per (vaultId, contextRef, contextCid), and a later Deal for the same contextRef needs a new context statement.
- A relay holds a Deal only for a listing_fee context whose payee is that relay's operator DID.
- A Deal with frozen set is never completed and no acknowledgement is signed for its claims in this vault until DealPort.unfreeze clears the flag or the Deal is cancelled.

### PaymentClaim

Schema `classrup.commerce.payment_claim/v1` · storage **relay+device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key, chosen by the payer vault |
| vaultId | uuidv7 — local vault scope |
| dealId | uuid — ref Deal |
| obligationId | string — ref Deal.obligations |
| contextRef | object — {type, id} copied from the Deal (COM-2) |
| method | enum — cash \| crypto \| external |
| amount | Money — CTR-MNY-001; > 0; same currency as the obligation |
| methodRef? | object — {termsCid} for cash (F09.S01.M02) or {requestId, requestCid} for crypto (F09.S01.M03), returned by MethodRulePort and signed into the claim |
| payerId | did — signer of the claim |
| payeeId | did — signer of acknowledgement or dispute |
| claimedAt | timestamp — payer's claim of when they paid (a claim, not evidence) |
| receivedAt | timestamp — local clock when this vault stored it |
| txRef? | string — ≤ 140 chars for external; transaction id for crypto |
| note? | string — ≤ 280 code points plain text |
| status | enum — claimed \| acknowledged \| disputed \| pending_confirmation \| confirmed \| final \| reorged \| failed \| expired |
| failureReason? | enum — absent \| reverted \| underpaid \| wrong_address \| wrong_asset \| before_request |
| verification | object — {source: self\|counterparty\|chain\|provider, chainId?, confirmations?, requiredConfirmations?, finalityPolicy?, checkedAt?, verifierVersion?} (COM-4); this vault's own observation |
| sendHold? | enum — txid_lookup_pending (a crypto claim without a verifier and without txidAttested is refused instead); while set the claim is local only, unsigned and unsent |
| lastProgressAt | timestamp — local clock; basis of the 14-day expiry |
| claimCid? | string — sha256 of the signed claim statement; absent while sendHold is set |
| ackCid? | string — cid of the payee-signed payment_ack (verification.source counterparty for cash or external, chain for crypto) |
| disputeCid? | string — cid of the payee dispute statement |
| seq | int — author's sequence number on this Deal, starting at 1 (FED-3) |
| prev? | string — cid of the author's previous statement on this Deal (per-author seq and prev chain, FED-3) |
| forkDetected | boolean — true when two different statements by the same author share the same prev or seq; claim is frozen |
| peerSync | string — local_committed \| prepared \| transport_acknowledged \| peer_accepted |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- No field named paid exists; completion evidence is only a payee-signed acknowledgement (ackCid), source counterparty for cash or external and source chain for crypto.
- A claim in status final has method crypto and verification.source chain; final reflects this vault's own verifier only.
- forkDetected true blocks all transitions except opening a dispute.
- At most 10 claims per obligation and at most 1 000 per vault per day.
- A claim with sendHold set has no claimCid and is never in the sync outbox.

### Storage DDL

```sql
CREATE TABLE commerce_deal (
  id TEXT PRIMARY KEY, vault_id TEXT NOT NULL, context_type TEXT NOT NULL, context_id TEXT NOT NULL,
  context_cid TEXT NOT NULL, status TEXT NOT NULL, expires_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX commerce_deal_context ON commerce_deal(vault_id, context_type, context_id, context_cid);
CREATE TABLE commerce_payment_claim (
  id TEXT PRIMARY KEY, vault_id TEXT NOT NULL, deal_id TEXT NOT NULL, obligation_id TEXT NOT NULL,
  method TEXT NOT NULL, status TEXT NOT NULL, last_progress_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE INDEX commerce_claim_deal ON commerce_payment_claim(vault_id, deal_id, status);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-069-09.T01 | unit | PS-069-01.R01 | open a Deal in vault A twice for the same contextRef and contextCid | one Deal; dealId is the UUIDv8 derived from JCS {contextRef, contextCid}; second call returns the existing Deal |
| TEST-PS-069-09.T02 | unit | PS-069-01.R02, PS-069-02.R03 | schema inspection and attempts to set a paid field | no paid field exists; unknown field rejected with VALIDATION_FAILED |
| TEST-PS-069-09.T11 | contract | PS-069-05.R03, PS-069-01.R03 | inspect relay double traffic | only ciphertext and routing metadata observed |
| TEST-PS-069-09.T21 | integration | PS-069-01.R01, PS-069-01.R04 | vaults A and B open the same accepted offer independently; an auction second-chance Deal opens with a new offer statement cid | A and B hold the same dealId and dealCid; the second-chance Deal has its own dealId; both vaults compute the same completionCid |
| TEST-PS-069-09.T33 | unit | PS-069-01.R05, PS-069-02.R06 | USDC obligation whose asset descriptor states 18 decimals while the local registry has 6; matching descriptor | mismatch quarantined with COMMERCE_CURRENCY_MISMATCH; matching descriptor accepted |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
