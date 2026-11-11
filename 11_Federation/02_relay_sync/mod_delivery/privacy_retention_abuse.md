# PS-088-07 — Privacy, retention and abuse: Relay delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M01 Relay delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/delivery` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-088-07.R01** Only the audience declared by the owner is delivered; participant statements travel as ciphertext to listed mailboxes and public statements only if the owner opted in at L2 or coarser.
- **PS-088-07.R02** Delivery metadata leaks as little as possible, so batches contain no reader or device identifiers, relay-to-relay pushes add 0 to 5 s random delay, and logs hold cid prefixes only.
- **PS-088-07.R03** The UI states that delivering a statement and later tombstoning it cannot recall copies already fetched (PRV-6).

## Specification

**Data classification**
- PeerOutbox: P2 (who sent which statement to which destination).
- Receipts and acknowledgements: P2 signed evidence.

**Retention**
- Entries RET-SHORT (30 days after reaching a terminal state); receipts and acks are kept with the statement under its own retention.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Flood a peer with traffic through delivery | per-destination quota 6000 envelopes/hour and 10 batches/minute; batch ≤ 100; backoff with full jitter |
| T02 | Relay lies that a recipient accepted | peer_accepted requires a signature by the recipient's key; a relay receipt only yields transport_acknowledged |
| T03 | Replay of captured batches | cid dedup at receiver, request Date window 300 s, Idempotency-Key |
| T04 | Metadata leakage to destination (timing correlation, IP of user) | random 0-5 s delay on relay pushes, no client IP forwarded by relays, vault connects only to user-selected relays |
| T05 | Participant statement pushed to a public peer by mistake | V03 refuses participants audience for peer_relay destinations; contract test enforces it |

**Abuse controls**
- A vault queues at most 1000 active entries per destination; the 1001st returns RATE_LIMITED.
- Relays cap queued public entries per hosted vault at 5000.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-088-09.T03 | abuse | PS-088-02.R02, PS-088-03.R01, PS-088-07.R01 | relay returns a forged receipt and a forged peer ack | FEDERATION_RECEIPT_INVALID; state does not advance |
| TEST-PS-088-09.T13 | abuse | PS-088-07.R01, PS-088-07.R02 | inspect outgoing request and logs for IP, reader or device identifiers; participants audience to public peer | none present; refused by V03; relay push delay within 0-5 s |
| TEST-PS-088-09.T14 | abuse | PS-088-07.R03, PS-088-07.R01 | 1001 queued entries to one destination | 1001st RATE_LIMITED |

## Dependencies

Module depends on: F11.S01.M02, F11.S01.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F15.S01.M01, F15.S04.M02, CTR-FED-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
