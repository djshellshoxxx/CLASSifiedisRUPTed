# PS-088-07 — Privacy, retention and abuse: Relay delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M01 Relay delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/delivery` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-088-07.R01** Only the audience declared by the owner is delivered; participant statements travel only as sealed wrappers to listed mailboxes and public statements only if the owner opted in at L2 or coarser.
- **PS-088-07.R02** Delivery metadata leaks as little as possible, so batches contain no reader or device identifiers, relay-to-relay pushes add 0 to 5 s random delay, sealed wrappers carry no author, type or seq, and logs hold cid prefixes only.
- **PS-088-07.R03** The UI states before a delivered statement is withdrawn that tombstoning it cannot recall copies already fetched (PRV-6).
- **PS-088-07.R04** The module registers the N6 ports (ExportSectionPort for relay operator export of PeerOutbox and the vault's recipient routes, DeletionPort that cancels routes of a deleted principal, RetentionPurgePort for terminal entries) and classifies fields with F10.S02.M02.

## Specification

**Data classification**
- PeerOutbox: P1 relay operational data (which public statement went to which peer).
- Vault recipient routes on F15 entries: P2 (who a participant statement is addressed to).
- Receipts and acknowledgements: P2 signed evidence kept with the statement.
- Sealed participant wrappers on relays: F08.S01.M01 MailboxEnvelope holding only {v, mailboxId, ciphertext, size, sentAt}; deleted after fetch and acknowledgement or after RET-SHORT 30 days.

**Retention**
- PeerOutbox entries RET-SHORT (30 days after reaching delivered, failed or cancelled); receipts and acks are kept with the statement under its own retention; vault entries follow F15.S01.M01.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Flood a peer with traffic through delivery | per-destination quota 6000 envelopes/hour and 10 batches/minute; batch ≤ 100; backoff with full jitter |
| T02 | Relay lies that a recipient accepted | peer_accepted requires an ack signed by a recipient named in the statement; a relay receipt only yields transport_acknowledged and, for public statements, 'Relay received' |
| T03 | Replay of captured batches | cid dedup at receiver, RFC 9421 created window 300 s and nonce = batchId, Idempotency-Key |
| T04 | Metadata leakage to destination (timing correlation, IP of user, who writes to whom) | random 0-5 s delay on relay pushes, no client IP forwarded by relays, vault connects only to user-selected relays, sealed-sender mailbox wrappers |
| T05 | Participant statement pushed to a public peer or relay inbox by mistake | V03 and V11 refuse it; contract test enforces it |
| T06 | Forwarding loops or amplification between relays | one hop only: records received from a peer are never queued to a peer |

**Abuse controls**
- A relay queues at most 50 000 active PeerOutbox entries per peer; further entries return RATE_LIMITED.
- Relays cap queued public entries originating from one hosted vault at 5000.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-088-09.T03 | abuse | PS-088-02.R02, PS-088-07.R01 | relay returns a forged receipt and a forged acknowledgement signed by a non-recipient | FEDERATION_RECEIPT_INVALID; state does not advance |
| TEST-PS-088-09.T13 | abuse | PS-088-07.R02, PS-088-07.R01 | inspect outgoing request, logs and a sealed wrapper; offer a participants statement to a relay inbox | no IP, reader or device identifiers; wrapper holds only {v, mailboxId, ciphertext, size, sentAt}; FEDERATION_DESTINATION_INVALID; relay push delay within 0-5 s |
| TEST-PS-088-09.T21 | e2e | PS-088-07.R03 | user withdraws a statement already relay received | the no-recall notice is shown before the tombstone is signed and confirmed by the user |
| TEST-PS-088-09.T24 | unit | PS-088-07.R04 | export, deletion and retention ports called by F10; field classification annotations | operator export section, deletion plan cancelling the principal's routes, terminal entries purged after 30 days |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F15.S04.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-IDM-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
