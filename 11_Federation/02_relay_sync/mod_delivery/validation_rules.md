# PS-088-02 — Validation rules: Relay delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M01 Relay delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/delivery` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-088-02.R01** An entry is created only for an envelope that exists locally with a valid signature and an audience matching the destination kind.
- **PS-088-02.R02** Receipts and acknowledgements are verified before they change state, so a relay cannot claim peer acceptance.
- **PS-088-02.R03** Each rule violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | cid exists in F11.S01.M02 with status accepted and a verified signature | NOT_FOUND |
| V02 | destination is a selected relay, a recipient mailbox listed in the recipient's portable document, or an active allowlisted peer relay | FEDERATION_PEER_NOT_ALLOWED |
| V03 | audience participants is never queued for a peer_relay destination; audience public queued for peer_relay only when flag F11 is on | FEDERATION_DESTINATION_INVALID |
| V04 | batch has ≤ 100 envelopes and body ≤ 4194304 bytes | FEDERATION_BATCH_TOO_LARGE |
| V05 | transport receipt signature verifies against the relay key and cid matches | FEDERATION_RECEIPT_INVALID |
| V06 | peer acknowledgement is signed by the recipient did named in the statement and references the cid | FEDERATION_RECEIPT_INVALID |
| V07 | destination quota available (6000 envelopes/hour, 10 batches/minute default) | FEDERATION_QUOTA_EXCEEDED |
| V08 | destination is not blocked by an active block rule | FEDERATION_NOT_ACCEPTED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-088-09.T02 | unit | PS-088-02.R01, PS-088-02.R03 | enqueue with unknown cid, invalid destination, participants audience to peer_relay | NOT_FOUND, FEDERATION_PEER_NOT_ALLOWED, FEDERATION_DESTINATION_INVALID |
| TEST-PS-088-09.T03 | abuse | PS-088-02.R02, PS-088-03.R01, PS-088-07.R01 | relay returns a forged receipt and a forged peer ack | FEDERATION_RECEIPT_INVALID; state does not advance |

## Dependencies

Module depends on: F11.S01.M02, F11.S01.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F15.S01.M01, F15.S04.M02, CTR-FED-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
