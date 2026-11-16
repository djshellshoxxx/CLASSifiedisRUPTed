# PS-116-07 — Privacy, retention and abuse: Offline outbox

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M01 Offline outbox](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/offline` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-116-07.R01** Queued payloads are signed statements or relay commands that can contain P2 content; they stay in the vault, P2 statements are sent only as end-to-end encrypted envelopes to the listed participants (CTR-PRV-001 PRV-5), and P3/P4 data is never queued.
- **PS-116-07.R02** Unsent entries expire after 7 days with a prompt, entries awaiting a peer after 30 days; expired entries are not sent.
- **PS-116-07.R03** A hostile page script or another principal on a shared browser profile must not be able to read or send a principal's entries, and the PWA sends no telemetry (CTR-OBS-001 OBS-7).

## Specification

**Data classification**
- OutboxEntry: P2 vault-local; contains signed statements or relay command inputs but never private keys, relay tokens or P3 exact home address.
- meta.storageMarker and lastExportAt: P0 local bookkeeping.
- relayReceipt.relayTime: relay-clock evidence only, not a trusted timestamp.

**Retention**
- completed and peer_accepted entries: deleted 60 s after the state is reached (the domain record keeps its own provenance); discarded: immediately; expired: shown for 24 h then deleted; absolute maximum 30 days plus 24 h on the device.
- Locking or signing out keeps entries so queued work is not lost; 'Erase vault' and F10.S01.M04 deletion remove all entries of the principal.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Shared browser profile: another principal reads or sends a previous principal's queued statements | entries bound to principal DID; list and delivery filter by the unlocked principal; vault locked by default after 5 minutes idle |
| T02 | Stale destructive intent delivered weeks later | 7-day expiry with day-6 prompt; expectedRevision conflict detection for relay commands; statements carry their own validity expiry checked by the receiver |
| T03 | Queue growth fills device storage or causes local denial of service | caps of 200 entries, 262144 bytes per payload and 5 MiB per principal; PLATFORM_OUTBOX_FULL shown to user |
| T04 | Script injection reads IndexedDB | strict CSP (script-src 'self', no inline scripts, no third-party scripts); payloads contain no private keys or tokens so impact is limited to the user's own queued content |
| T05 | Relay lies about delivery or peer acceptance | transport_acknowledged is only a relay receipt; peer_accepted requires a verified signed acknowledgement by the counterparty key; relay receipt time is never trusted as event time |
| T06 | Forked vault produces two conflicting signed promises | receiving module detects the fork, outbox entry becomes conflict, coordination is frozen for renegotiation and nothing is merged by last-writer-wins |

**Abuse controls**
- Relays rate limit written commands under their own policy (RATE_LIMITED is retryable with retryAfterMs); the outbox honors it and cannot bypass limits.
- The client never retries after a non-retryable error, which prevents hammering a relay with a failing entry.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-116-09.T10 | abuse | PS-116-05.R01, PS-116-07.R03 | principal P2 unlocks a vault profile holding P1 entries | list and delivery return none of P1's entries; P1 entries keep their state |
| TEST-PS-116-09.T12 | integration | PS-116-07.R01, PS-116-07.R02 | clock advanced 6 d, 7 d, then a transport_acknowledged entry advanced 30 d | day-6 prompt; unsent entry expired at 7 d and never sent; unconfirmed entry expired at 30 d |
| TEST-PS-116-09.T13 | abuse | PS-116-07.R01, PS-116-07.R03 | inspect network traffic and script injection under CSP during a full session | no telemetry request; inline script blocked; P3/P4 fields rejected at enqueue |
| TEST-PS-116-09.T16 | integration | PS-116-04.R01, PS-116-07.R03, PS-116-03.R03 | two vaults send conflicting acceptances for one reservation; receiving module reports the fork | entry becomes conflict, affected coordination frozen, no winner chosen |

## Dependencies

Module depends on: F15.S02.M02, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-PRV-001, CTR-UX-001, CTR-OBS-001, CTR-CAP-001, CTR-FED-001, CTR-IOX-001, CTR-EVT-001. Predecessor: [domain_schema.md](domain_schema.md).
