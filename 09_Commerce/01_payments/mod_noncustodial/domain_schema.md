# PS-069-01 — Domain schema: Noncustodial payment claims

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M01 Noncustodial payment claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/noncustodial` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-069-01.R01** A Deal stores contextRef {type, id}, the context statement cid, parties with roles, 1 to 10 obligations (payer, payee, Money amount, purpose), status, expiry and revision, and its dealId is the first 16 bytes of sha256 of the string type:id formatted as a uuid so both vaults derive the same ID.
- **PS-069-01.R02** A PaymentClaim stores exactly the COM-2 fields plus dealId, obligationId, verification per COM-4, statement cids and local receivedAt; there is no paid boolean anywhere in the schema.
- **PS-069-01.R03** Deals and claims are P2 (parties only), kept in each party's vault as RET-EVIDENCE, and travel only as end-to-end encrypted signed envelopes between the parties (PRV-5).

## Specification

### Deal

Schema `classrup.commerce.deal/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuid — deterministic from contextRef type and id; primary key |
| vaultId | uuidv7 — local vault scope (CTR-ID-001 tenant slot) |
| contextRef | object — {type: offer\|auction_result\|cycle_compensation\|milestone\|rental_deposit\|listing_fee\|other, id: uuid} |
| contextCid | string — sha256 cid of the signed context statement (for example the accepted offer) both parties hold |
| parties | array — 2..20 entries {did, role: payer\|payee\|both} |
| obligations | array — 1..10 entries {obligationId, payerId, payeeId, amount: Money, purpose: goods\|service\|deposit\|compensation\|listing_fee\|other, allowedMethods: cash\|crypto\|external subset} |
| status | enum — open \| disputed \| completed \| cancelled \| expired |
| expiresAt | timestamp — openedAt + 30 days by default, range 1..90 days |
| dealCid | string — sha256 of JCS(deal statement), shared by all parties |
| peerSync | object — per party sync state: local_committed \| prepared \| transport_acknowledged \| peer_accepted |
| cancelSigners | array — parties whose deal_cancel statement is held |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC, local clock |
| updatedAt | timestamp — RFC 3339 UTC, local clock |

**Invariants**
- Every obligation amount is positive and its currency is active in the local registry (F09.S03.M01).
- payerId differs from payeeId in every obligation and both are parties.
- status completed implies every obligation has acknowledged or final claims summing to at least its amount.
- id equals the deterministic derivation of contextRef; one Deal per (vaultId, contextRef).

### PaymentClaim

Schema `classrup.commerce.payment_claim/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key, chosen by the payer vault |
| vaultId | uuidv7 — local vault scope |
| dealId | uuid — ref Deal |
| obligationId | string — ref Deal.obligations |
| contextRef | object — {type, id} copied from the Deal (COM-2) |
| method | enum — cash \| crypto \| external |
| amount | Money — CTR-MNY-001; > 0; same currency as the obligation |
| payerId | did — signer of the claim |
| payeeId | did — signer of acknowledgement or dispute |
| claimedAt | timestamp — payer's claim of when they paid (a claim, not evidence) |
| receivedAt | timestamp — local clock when this vault stored it |
| txRef? | string — ≤ 140 chars for external; transaction id for crypto |
| note? | string — ≤ 280 code points plain text |
| status | enum — claimed \| acknowledged \| disputed \| pending_confirmation \| confirmed \| final \| reorged \| failed \| expired |
| verification | object — {source: self\|counterparty\|chain\|provider, chainId?, confirmations?, finalityPolicy?, checkedAt?, verifierVersion?} (COM-4) |
| lastProgressAt | timestamp — local clock; basis of the 14-day expiry |
| claimCid | string — sha256 of the signed claim statement |
| ackCid? | string — cid of the payee acknowledgement or dispute statement |
| prev? | string — cid of the previous statement in this claim's chain |
| forkDetected | boolean — true when two statements share the same prev; claim is frozen |
| peerSync | string — local_committed \| prepared \| transport_acknowledged \| peer_accepted |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- No field named paid exists; the only completion evidence is status acknowledged (cash, external) or final (crypto).
- A claim in status final has method crypto and verification.source chain.
- forkDetected true blocks all transitions except opening a dispute.
- At most 10 claims per obligation and at most 1 000 per vault per day.

### Storage DDL

```sql
CREATE TABLE commerce_deal (
  id TEXT PRIMARY KEY, vault_id TEXT NOT NULL, context_type TEXT NOT NULL, context_id TEXT NOT NULL,
  status TEXT NOT NULL, expires_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX commerce_deal_context ON commerce_deal(vault_id, context_type, context_id);
CREATE TABLE commerce_payment_claim (
  id TEXT PRIMARY KEY, vault_id TEXT NOT NULL, deal_id TEXT NOT NULL, obligation_id TEXT NOT NULL,
  method TEXT NOT NULL, status TEXT NOT NULL, last_progress_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE INDEX commerce_claim_deal ON commerce_payment_claim(vault_id, deal_id, status);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-069-09.T01 | unit | PS-069-01.R01, PS-069-01.R02, PS-069-02.R02 | open a Deal in vault A twice for the same contextRef | one Deal, same dealId derived deterministically, second call returns the existing Deal |
| TEST-PS-069-09.T02 | unit | PS-069-01.R02, PS-069-02.R03 | schema inspection and attempts to set a paid field | no paid field exists; unknown field rejected with VALIDATION_FAILED |
| TEST-PS-069-09.T11 | contract | PS-069-05.R03, PS-069-01.R03 | inspect relay double traffic | only ciphertext and routing metadata observed |
| TEST-PS-069-09.T17 | e2e | PS-069-01.R03, PS-069-03.R03 | buyer claims cash payment, seller acknowledges on another device, both screens checked | labels read claimed (unverified) then acknowledged by payee; Deal completed; axe zero serious issues |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
