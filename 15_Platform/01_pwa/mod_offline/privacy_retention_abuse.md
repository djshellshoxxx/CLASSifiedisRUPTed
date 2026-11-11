# PS-116-07 — Privacy, retention and abuse: Offline outbox

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M01 Offline outbox](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/offline` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-116-07.R01** Queued payloads are signed statements or relay commands that can contain P2 content; they stay in the vault, and enqueue enforces PRV-5 by rule V10 (P2 to a relay only as an end-to-end encrypted envelope for the recipient's mailbox keys) and V11 (P3/P4 never queued), using the statement registry and F10.S02.M02 field classes.
- **PS-116-07.R02** Unsent entries expire after 7 days with a prompt and entries awaiting an acknowledgement at createdAt + 30 days; the payload is erased at expiry, expired entries are never sent, and no row outlives createdAt + 30 days + 24 h.
- **PS-116-07.R03** A hostile page script or another principal on a shared browser profile must not be able to read or send a principal's entries, and the PWA sends no telemetry (CTR-OBS-001 OBS-7).
- **PS-116-07.R04** The module registers ExportSectionPort, DeletionPort and RetentionPurgePort for F10.S01.M03, F10.S01.M04 and F10.S01.M02 through the kernel port registry (inverted dependency, because F10.S01.M01 and F10.S01.M04 depend on this module), annotates every OutboxEntry field with its F10.S02.M02 class, and consumes privacy.deletion.completed (N6).

## Specification

**Data classification**
- OutboxEntry: P2 vault-local entity; field classes per F10.S02.M02: payload at the registered class of its schema (P0 to P2, never P3/P4), recipientDid, destination and relayReceipt P2 (they reveal whom the principal talks to), bookkeeping fields (state, attempts, timestamps, seq) P1; never private keys, relay tokens or P3 exact home address.
- Outbox meta rows (seqCounter, storageMarker, lastExportAt, relayView): P1 local bookkeeping.
- relayReceipt.receivedAt: relay-clock evidence only, not a trusted timestamp.

**Retention**
- peer_accepted entries: deleted 60 s after the state is reached (the domain record keeps its own provenance); transport_acknowledged entries with acknowledger none: kept with their receipt until createdAt + 30 d so a restore announcement can still return them, then deleted; discarded: deleted immediately (the replacement entry keeps supersedes); expired: payload erased at expiresAt, payload-free stub shown for 24 h then deleted. No payload outlives createdAt + 30 d (RET-SHORT) and no stub outlives createdAt + 30 d + 24 h.
- Locking keeps entries so queued work is not lost; 'Erase vault' and F10.S01.M04 deletion (DeletionPort) remove all entries of the principal; the RetentionPurgePort runs the rules above at app start and every 60 s while the app is open.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Shared browser profile: another principal reads or sends a previous principal's queued statements | entries bound to principal DID; list and delivery filter by the unlocked principal; vault locked by default after 5 minutes idle |
| T02 | Stale destructive intent delivered weeks later | 7-day expiry with day-6 prompt; 23 h replay-safety rule V13 for relay commands; expectedRevision conflict detection; statements carry their own validity expiry checked by the receiver |
| T03 | Queue growth fills device storage or causes local denial of service | caps of 200 entries (or the lower local limit), 262144 bytes per payload and 5 MiB per principal; PLATFORM_OUTBOX_FULL shown to user |
| T04 | Script injection reads IndexedDB | strict CSP (script-src 'self', no inline scripts, no third-party scripts); payloads contain no private keys or tokens so impact is limited to the user's own queued content |
| T05 | Relay lies about delivery or peer acceptance | transport_acknowledged needs a receipt verified against the relay key set and bound to destination and sent digest (V14); peer_accepted needs an acknowledgement of the exact cid by the registered acknowledger key (V09); relay receipt time is never trusted as event time |
| T06 | Forked vault produces two conflicting signed promises | receiving module detects the fork, outbox entry becomes conflict, coordination is frozen for renegotiation and nothing is merged by last-writer-wins |
| T07 | Replayed acknowledgement for a superseded cid or from another key in the same role | V09 binds the ack to entry.cid, entry.recipientDid and a key active for that DID at verification time |
| T08 | Domain-module bug sends a plaintext P2 offer, cycle composition or a P3 address to a relay | V10 and V11 refuse at enqueue; nothing is stored or sent |
| T09 | Relay key compromise or equivocating identity | receipts verified against the published key history; revoked keys accepted only for receipts stored before revocation; two rotations with the same prevKeyId freeze delivery (V15) |
| T10 | Restored relay silently lost receipted data | signed restore announcement returns covered entries to prepared and they are resent |

**Abuse controls**
- Relays rate limit written commands under their own policy (RATE_LIMITED is retryable with retryAfterMs); the outbox honors it and cannot bypass limits.
- The client never retries after a non-retryable error, which prevents hammering a relay with a failing entry.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-116-09.T10 | abuse | PS-116-05.R01, PS-116-07.R03 | principal P2 unlocks a vault profile holding P1 entries | list and delivery return none of P1's entries; P1 entries keep their state |
| TEST-PS-116-09.T12 | integration | PS-116-07.R02 | clock advanced 6 d, 7 d, then a transport_acknowledged entry advanced to createdAt + 30 d | day-6 prompt; unsent entry expired at 7 d and never sent; unconfirmed entry expired at createdAt + 30 d with its payload erased |
| TEST-PS-116-09.T13 | abuse | PS-116-08.R01, PS-116-07.R03 | inspect network traffic and script injection under CSP during a full session | no telemetry request; inline script blocked; diagnostics stay in the vault and are exportable |
| TEST-PS-116-09.T22 | integration | PS-116-01.R02, PS-116-01.R03, PS-116-07.R02 | entry reaches peer_accepted; another expires; clock advanced 60 s, 24 h and 31 d; every command tried on a stored payload | peer_accepted row deleted after 60 s; expired payload erased at expiry and stub deleted after 24 h; no row older than createdAt + 30 d + 24 h and no payload older than createdAt + 30 d; payload and cid never changed |
| TEST-PS-116-09.T24 | abuse | PS-116-02.R04, PS-116-07.R01 | enqueue a plaintext P2 offer for a relay mailbox, an E2E envelope whose recipients differ from the seller's mailbox keys, a statement with a P3 address field, and a correct E2E envelope | PLATFORM_OUTBOX_NOT_DELIVERABLE, PLATFORM_OUTBOX_NOT_DELIVERABLE, PLATFORM_OUTBOX_CLASS_FORBIDDEN, nothing stored for those; the correct envelope is stored |
| TEST-PS-116-09.T32 | integration | PS-116-07.R04, PS-116-04.R06 | export section, deletion plan and retention purge through the F10 ports, then privacy.deletion.completed for P1 | section platform.outbox lists counts only with field classes; deletion plan lists P1's entries and execution removes them; purge applies the retention rules; no P1 row remains |

## Dependencies

Module depends on: F15.S02.M02, F15.S02.M03, F15.S02.M01, F15.S04.M03, F11.S01.M01, F10.S02.M02, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-PRV-001, CTR-UX-001, CTR-OBS-001, CTR-CAP-001, CTR-FED-001, CTR-IOX-001, CTR-EVT-001. Predecessor: [domain_schema.md](domain_schema.md).
