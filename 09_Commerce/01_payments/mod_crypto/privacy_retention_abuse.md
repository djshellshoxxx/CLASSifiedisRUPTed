# PS-068-07 — Privacy, retention and abuse: Crypto payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M03 Crypto payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/crypto` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-068-07.R01** Receiving addresses, txids and observations are P2 and never appear in public projections, logs at P2 detail or notifications; addresses are shared only inside end-to-end encrypted envelopes to the payer.
- **PS-068-07.R02** The module never requests, derives, stores or logs private keys, seed phrases or signatures that authorize spending; secret-looking input is rejected and discarded.
- **PS-068-07.R03** A user-configured verifier endpoint learns which transactions and addresses the user queries; the UI says so before the first lookup and defaults to the user's own node or a direct endpoint, with a relay endpoint only as an explicit choice.
- **PS-068-07.R04** Verifier lookups are an explicit third-party disclosure gated by privacy.consent.check purpose chain_lookup; requests are unauthenticated and unlinkable (no DID, device-key signature, relay access token or cookie) and use a connection separate from mailbox traffic (PRV-5).
- **PS-068-07.R05** Replay of an older or third-party transaction is blocked by the chain tip signed into each request and by refusing an address still used by another open or claimed request in the vault.
- **PS-068-07.R06** The module registers ExportSectionPort (section commerce.crypto), DeletionPort (pseudonymization of retained requests and observations) and RetentionPurgePort (RET-EVIDENCE with 90-day observation compaction) with F10 (N6), annotates every field with its F10.S02.M02 class, and consumes privacy.deletion.completed.
- **PS-068-07.R07** Request statements from blocked dids are dropped silently (N7, F07.S02.M02), and ingest uses the bounded quarantine of F09.S01.M01 (500 entries or 5 MiB, oldest-first eviction), dropping statements from dids that are party to no known Deal once it is full.

## Specification

**Data classification**
- CryptoPaymentRequest and ChainObservation: P2 (parties). Verifier endpoint URLs: P3; API keys: P4 held in the vault key store; field classes annotated per F10.S02.M02.
- On-chain data is public; linking a pseudonym to an address is the sensitive part, so addresses are never published and verifier lookups never carry identity.

**Retention**
- RET-EVIDENCE (2 years after last related activity) through the RetentionPurgePort; observations may be compacted after 90 days to the final status, txid, block hash and verifier ID.
- On deletion: did pseudonymized in retained records; chain data cannot be erased and the UI says so.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Payee address swapped by an attacker in transit | address inside a signed statement over JCS; payer UI shows the address checksum groups and asks to compare the first and last 6 characters |
| T02 | Payer sends a fake txid to get a completed state | claim stays claimed until a configured verifier matches address, amount and asset; wrong or absent data never confirms |
| T03 | Malicious or compromised verifier endpoint reports false finality | trust label shows endpoint; optional 2-of-2 quorum; relay-signed observations are labelled; completion needs the payee's own verifier; payee can always dispute |
| T04 | Reorg after the goods were released | reorged state is shown; UI warns not to release goods before final; Bitcoin 6 confirmations and EVM finalized tag are defaults; deep-reorg alert during the 100-block watch |
| T05 | Social engineering to reveal a seed phrase | validation rejects secret patterns; copy states the app never asks for keys |
| T06 | Address reuse links a payee's deals or lets an old payment be replayed | fresh address hint; an address still used by an open or claimed request is refused |
| T07 | Payer claims an older or third-party transaction to a reused address | chainTipAtCreation signed into the request; outputs at or below it fail with before_request |
| T08 | A raw private key pasted as a txid would be signed and sent | claim held unsigned and unsent until the verifier finds the txid or the payer attests it is public; residual disclosure to the chosen verifier stated in the UI |
| T09 | A relay verifier links the principal's DID to on-chain addresses | chain_lookup consent, unauthenticated requests on a separate connection, own node or direct endpoint by default |
| T10 | Sybil flood of request statements from fresh dids | shared bounded quarantine; non-party statements dropped once full; blocked senders dropped silently |

**Abuse controls**
- Manual refresh limit of 3 per minute per observation and a poll budget of 900 endpoint calls per hour per vault, with priority to observations closest to finality.
- Request creation limit of 20 per day per vault; ingest limit 20 statements per hour per known party, bounded shared quarantine for unknown senders.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-068-09.T02 | unit | PS-068-01.R03, PS-068-02.R02, PS-068-07.R02 | inputs with a WIF key, an xprv string, and a 12-word phrase in note and txRef | COMMERCE_CRYPTO_SECRET_REJECTED, nothing stored or logged |
| TEST-PS-068-09.T12 | integration | PS-068-07.R01 | inspect outbound endpoint requests and local logs | only txid or address lookups to the configured endpoint; no addresses or amounts in logs |
| TEST-PS-068-09.T24 | abuse | PS-068-01.R04, PS-068-02.R05, PS-068-07.R05 | a transaction to a reused address included before chainTipAtCreation is claimed for a new request; payee creates a second open request with an address still in use | claim fails with before_request; second request refused with COMMERCE_CRYPTO_ADDRESS_REUSED |
| TEST-PS-068-09.T25 | integration | PS-068-07.R04, PS-068-05.R04 | inspect every verifier request (own node, direct endpoint, relay endpoint) with chain_lookup consent granted and then withdrawn | no DID, device-key signature, relay access token or cookie; connection separate from mailbox traffic; with consent withdrawn no lookup happens and refresh returns PRECONDITION_FAILED |
| TEST-PS-068-09.T29 | integration | PS-068-07.R06 | export, deletion and retention purge driven by F10 | section commerce.crypto exported without verifier settings; DeletionPort pseudonymizes the principal; RetentionPurgePort purges after RET-EVIDENCE; every field carries an F10.S02.M02 class |
| TEST-PS-068-09.T30 | abuse | PS-068-07.R07 | 10 000 fresh dids send crypto_request statements to vault A; blocked payee sends one | quarantine stays within 500 entries or 5 MiB; non-party statements dropped once full; blocked statement dropped silently |
| TEST-PS-068-09.T32 | e2e | PS-068-07.R03 | open verifier settings and trigger the first lookup | disclosure 'This endpoint learns which transactions and addresses you look up' shown before the lookup; own node or direct endpoint preselected; axe zero serious issues |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
