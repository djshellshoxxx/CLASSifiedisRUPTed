# PS-071-07 — Privacy, retention and abuse: Receipts

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M01 Receipts](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/receipts` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-071-07.R01** Receipts are P2 and travel only inside end-to-end encrypted envelopes to the counterparty or in files the user chooses to share.
- **PS-071-07.R02** The UI states that a receipt shows what the signer asserted and that a signed time is the signer's claim, not proof of time.
- **PS-071-07.R03** Misuse such as forced signing or fake receipts is limited by role checks, signature verification and the dispute path.
- **PS-071-07.R04** The module registers ExportSectionPort (section commerce.receipts), DeletionPort (pseudonymization of signerId) and RetentionPurgePort (RET-EVIDENCE) with F10 (N6), annotates every Receipt field with its F10.S02.M02 class, and consumes privacy.deletion.completed.
- **PS-071-07.R05** Receipts from blocked dids are dropped silently (N7, F07.S02.M02) unless the claim's Deal has an open dispute case, and ingest uses the bounded quarantine of F09.S01.M01 (500 entries or 5 MiB, oldest-first eviction), dropping receipts from dids that are party to no known Deal once it is full.

## Specification

**Data classification**
- Receipt: P2; signerId is the party's principal did:key (pseudonymous, not anonymous); signingKeyId and keyLink are P2; text is P2 free text; field classes annotated per F10.S02.M02.

**Retention**
- RET-EVIDENCE (2 years after last related activity) through the RetentionPurgePort; exported files are outside platform control.
- On deletion: signerId replaced by a pseudonym in retained rows; signed bytes retained and flagged unverifiable-after-pseudonymization; counterparty copies unchanged.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Counterfeit receipt attributed to someone | Ed25519 signature under context classrup/receipt/v1; verification offline; role and claim binding by cid; party binding through the device-link chain |
| T02 | Receipt reused for another claim | statement binds claimCid, amount and currency; mismatch rejected |
| T03 | Coerced signing under pressure | UI shows the exact sentence, no auto-sign, receipts are optional unless agreed in cash terms, dispute path preserved |
| T04 | Receipt misread as proof of delivery | mandatory disclaimer text on every receipt view and export; file contains assertion type explicitly |
| T05 | Stolen, revoked key signs receipts with a backdated signedAt | key status from the trusted receipt time and the revocation's effective-from time; revoked_before_receipt quarantined with COMMERCE_RECEIPT_KEY_REVOKED |
| T06 | Self-generated key presented as a party's signature in an offline file | partyBinding requires a root-signed device-link chain to the claim party; otherwise 'Signature valid - party not proven' |
| T07 | Sybil flood of receipts from fresh dids | shared bounded quarantine; non-party receipts dropped once full; blocked senders dropped silently |

**Abuse controls**
- Receipts per vault limited to 500 per day; ingest limit 20 statements per hour per known party; receipts from unknown dids share the bounded quarantine of F09.S01.M01 and are dropped once it is full.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-071-09.T09 | integration | PS-071-03.R02, PS-071-07.R01 | offline signing then reconnect | receipt delivered, sync state advances to peer_accepted only on signed acknowledgement |
| TEST-PS-071-09.T10 | e2e | PS-071-07.R02 | both parties open receipts | disclaimer shown; labels say asserted by signer; axe zero serious issues |
| TEST-PS-071-09.T11 | integration | PS-071-07.R03 | account deletion completes | signerId pseudonymized, signature flagged unverifiable-after-pseudonymization, counterparty copy untouched |
| TEST-PS-071-09.T12 | abuse | PS-071-07.R03, PS-071-07.R01 | 21 incoming receipts in one hour from one known party | 21st quarantined |
| TEST-PS-071-09.T20 | integration | PS-071-07.R04 | export, deletion and retention purge driven by F10 | section commerce.receipts exported; DeletionPort pseudonymizes signerId; RetentionPurgePort purges after RET-EVIDENCE; every field carries an F10.S02.M02 class |
| TEST-PS-071-09.T21 | abuse | PS-071-07.R05 | blocked payee sends a receipt, then one on a Deal with an open dispute case; 10 000 fresh dids each send one receipt | first dropped silently; second stored as evidence with notification suppressed; quarantine stays within 500 entries or 5 MiB and non-party receipts are dropped once full |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F16.S02.M03, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
