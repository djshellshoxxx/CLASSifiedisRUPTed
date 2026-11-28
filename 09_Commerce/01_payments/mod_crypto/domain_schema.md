# PS-068-01 — Domain schema: Crypto payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M03 Crypto payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/crypto` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-068-01.R01** A CryptoPaymentRequest stores deal and obligation refs, payee-supplied address, chain, asset, Money amount in asset minor units, validity and status, and is signed by the payee as classrup.commerce.crypto_request/v1.
- **PS-068-01.R02** A ChainObservation stores the claimed txid, the verifier used, block data, confirmations, finality flag and a match result, and is kept in the vault only; observations are local evidence and not statements about the other party.
- **PS-068-01.R03** Both entities are P2 and retained as RET-EVIDENCE; no field ever holds a private key, seed or signing material.
- **PS-068-01.R04** Each request records the chain tip height (Bitcoin) or block number (EVM) that the payee's verifier reported at creation, signed into the request, and only outputs included above it, or first seen in the mempool after the request was received, count toward the request.
- **PS-068-01.R05** A request covers its obligation amount through one or more claims; coveredAmount sums the matched receivedAmount of final claims, and the request is settled only when coveredAmount reaches the amount.

## Specification

### CryptoPaymentRequest

Schema `classrup.commerce.crypto_request/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| vaultId | uuidv7 — local vault scope (CTR-ID-001 tenant slot) |
| dealId | uuid — ref F09.S01.M01 Deal (UUIDv8) |
| obligationId | string — ref Deal.obligations; crypto must be in allowedMethods |
| contextRef | object — {type, id} copied from the Deal for event routing |
| payeeId | did — signer; supplies the address |
| payerId | did — recipient of the request |
| chainId | enum — bitcoin-mainnet \| ethereum-mainnet (other chains disabled) |
| asset | string — registry code BTC, ETH or USDC (F09.S03.M01) |
| assetDescriptor | object — F09.S03.M01 descriptor {code, kind, chainId, contract, decimals, digest} signed into the request |
| address | string — payee receiving address; bech32 or base58check for Bitcoin, 0x plus 40 hex with EIP-55 checksum for EVM |
| amount | Money — CTR-MNY-001; in the asset's minor units; > 0 |
| chainTipAtCreation? | int — Bitcoin tip height or EVM block number reported by the payee's verifier at creation; absent when no verifier was reachable, and then matching uses inclusion blocks with a timestamp at least 2 h after createdAt, labelled time-bound only |
| coveredAmount | Money — sum of matched receivedAmount of final claims; ≤ amount |
| claimIds | array — claims attached to this request, at most 10 |
| origin | enum — local (payee vault) \| peer (mirrored in the payer vault from the signed statement) |
| expiresAt | timestamp — createdAt + 7 days by default, range 1 h to 14 days |
| status | enum — open \| claimed \| settled \| cancelled \| expired |
| requestCid | string — sha256 of the signed request statement |
| peerSync | string — local_committed \| prepared \| transport_acknowledged \| peer_accepted |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC, local clock |

**Invariants**
- address is valid for chainId and unchanged after creation; a different address needs a new request.
- asset belongs to chainId in the registry; a token asset has a registered contract.
- At most one open or claimed request per (dealId, obligationId).
- In the payee vault no two open or claimed requests share an address.
- coveredAmount never exceeds amount, and status settled implies coveredAmount equals amount.

### ChainObservation

Schema `classrup.commerce.chain_observation/v1` · storage **device** · privacy **P2** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| vaultId | uuidv7 — local vault scope |
| requestId | uuidv7 — ref CryptoPaymentRequest |
| claimId | uuidv7 — ref F09.S01.M01 PaymentClaim |
| chainId | string — chain observed |
| txid | string — transaction hash as supplied by the payer (64 hex for Bitcoin, 0x plus 64 hex for EVM) |
| status | enum — watching \| pending \| confirmed \| final \| reorged \| failed \| mismatched \| stopped |
| matchResult | enum — none \| match \| underpaid \| wrong_address \| wrong_asset \| before_request \| reverted |
| receivedAmount? | Money — amount paid to the request address in asset minor units |
| blockHash? | string — inclusion block hash at last check |
| blockHeight? | int — inclusion block height at last check |
| confirmations | int — ≥ 0; Bitcoin tip minus height plus 1 |
| requiredConfirmations | int — 6 for Bitcoin; for EVM the finalized tag (stored as 0 and shown as 'awaiting finalized checkpoint', never N of 0) |
| finalityPolicy | string — btc-6-conf \| evm-finalized-tag |
| verifierId | string — endpoint adapter id and version, e.g. esplora@1.2 or evm-jsonrpc@1.0 |
| verifierTrust | enum — user-node \| user-endpoint \| relay-signed |
| observerRole | enum — payer \| payee; the party whose vault runs this observation |
| firstSeenAt? | timestamp — local clock |
| checkedAt | timestamp — local clock of last successful check |
| lastTipSeen | int — chain tip at the last per-observation check; per-transaction calls happen only when the tip moved |
| lastProgressAt | timestamp — local clock of the last confirmation increase |
| reorgCount | int — number of reorg events observed |
| disagreement | boolean — true when two endpoints disagreed at last check |
| postFinalWatchUntil? | int — block height until which a final observation is still watched (final height + 100) |
| deepReorgAlertAt? | timestamp — set when the inclusion block of a final observation was replaced during the watch |
| budgetPausedAt? | timestamp — set while the hourly poll budget defers this observation |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- status final requires matchResult match and finalityPolicy satisfied at checkedAt.
- A claim is never driven past claimed by an observation whose verifierId is empty; with no verifier no observation exists.
- One ChainObservation per (claimId, txid).
- commerce.payment.confirming is emitted only while matchResult is match.
- final is terminal; the post-final watch only sets deepReorgAlertAt.

### Storage DDL

```sql
CREATE TABLE commerce_crypto_request (
  id TEXT PRIMARY KEY, vault_id TEXT NOT NULL, deal_id TEXT NOT NULL, obligation_id TEXT NOT NULL, address TEXT NOT NULL,
  chain_id TEXT NOT NULL, status TEXT NOT NULL, expires_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX commerce_crypto_request_open ON commerce_crypto_request(vault_id, deal_id, obligation_id)
  WHERE status IN ('open','claimed');
CREATE UNIQUE INDEX commerce_crypto_request_address ON commerce_crypto_request(vault_id, chain_id, address)
  WHERE status IN ('open','claimed') AND json_extract(data, '$.origin') = 'local';
CREATE TABLE commerce_chain_observation (
  id TEXT PRIMARY KEY, vault_id TEXT NOT NULL, claim_id TEXT NOT NULL, chain_id TEXT NOT NULL, txid TEXT NOT NULL,
  status TEXT NOT NULL, checked_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX commerce_chain_observation_tx ON commerce_chain_observation(vault_id, claim_id, txid);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-068-09.T01 | unit | PS-068-01.R01, PS-068-01.R02, PS-068-02.R01 | create a request with valid and invalid addresses for each chain | valid request stored and signed; invalid returns COMMERCE_CRYPTO_ADDRESS_INVALID |
| TEST-PS-068-09.T02 | unit | PS-068-01.R03, PS-068-02.R02, PS-068-07.R02 | inputs with a WIF key, an xprv string, and a 12-word phrase in note and txRef | COMMERCE_CRYPTO_SECRET_REJECTED, nothing stored or logged |
| TEST-PS-068-09.T23 | integration | PS-068-03.R09, PS-068-01.R05 | transaction underpaid by 4 000 sats, then a claim for the received amount and a second transaction for the remainder | first claim failed underpaid; the next two claims attach to the same request; request settled only when both are final |
| TEST-PS-068-09.T24 | abuse | PS-068-01.R04, PS-068-02.R05, PS-068-07.R05 | a transaction to a reused address included before chainTipAtCreation is claimed for a new request; payee creates a second open request with an address still in use | claim fails with before_request; second request refused with COMMERCE_CRYPTO_ADDRESS_REUSED |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
