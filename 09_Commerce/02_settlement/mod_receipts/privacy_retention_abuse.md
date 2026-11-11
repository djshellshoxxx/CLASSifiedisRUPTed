# PS-071-07 — Privacy, retention and abuse: Receipts

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S02.M01 Receipts](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/settlement/receipts` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-071-07.R01** Receipts are P2 and travel only inside end-to-end encrypted envelopes to the counterparty or in files the user chooses to share.
- **PS-071-07.R02** The UI states that a receipt shows what the signer asserted and that a signed time is the signer's claim, not proof of time.
- **PS-071-07.R03** Misuse such as forced signing or fake receipts is limited by role checks, signature verification and the dispute path.

## Specification

**Data classification**
- Receipt: P2; signerId is a did:key (pseudonymous, not anonymous); text is P2 free text.

**Retention**
- RET-EVIDENCE (2 years after last related activity); exported files are outside platform control.
- On deletion: signerId replaced by a pseudonym in retained rows; signed bytes retained and flagged unverifiable-after-pseudonymization; counterparty copies unchanged.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Counterfeit receipt attributed to someone | Ed25519 signature over JCS with domain prefix; verification offline; role and claim binding by cid |
| T02 | Receipt reused for another claim | statement binds claimCid, amount and currency; mismatch rejected |
| T03 | Coerced signing under pressure | UI shows the exact sentence, no auto-sign, receipts are optional unless agreed in cash terms, dispute path preserved |
| T04 | Receipt misread as proof of delivery | mandatory disclaimer text on every receipt view and export; file contains assertion type explicitly |

**Abuse controls**
- Receipts per vault limited to 500 per day; ingest limit 20 statements per hour per sender; excess is quarantined.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-071-09.T09 | integration | PS-071-03.R02, PS-071-07.R01 | offline signing then reconnect | receipt delivered, sync state advances to peer_accepted only on signed acknowledgement |
| TEST-PS-071-09.T10 | e2e | PS-071-07.R02, PS-071-09.R03 | both parties open receipts | disclaimer shown; labels say asserted by signer; axe zero serious issues |
| TEST-PS-071-09.T11 | integration | PS-071-07.R03 | account deletion completes | signerId pseudonymized, signature flagged unverifiable-after-pseudonymization, counterparty copy unchanged |
| TEST-PS-071-09.T12 | abuse | PS-071-07.R03, PS-071-07.R01 | 21 incoming receipts in one hour from one sender | 21st quarantined |

## Dependencies

Module depends on: F09.S01.M01, F09.S03.M03, F07.S01.M01, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
