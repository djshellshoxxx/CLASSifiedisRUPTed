# PS-060-08 — Observability and performance: Private messages

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M01 Private messages](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/private` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-060-08.R01** Relay mailbox commands are measured per CTR-OBS-001 without logging beyond correlationId and sizes; the PWA records only local diagnostics (OBS-7).
- **PS-060-08.R02** Mailbox put meets the write budget p95 ≤ 300 ms at 100 puts per second and fetch of 100 envelopes meets p95 ≤ 150 ms.
- **PS-060-08.R03** Vault encrypt-and-sign meets a device budget and the relay expiry sweep lag is bounded.

## Specification

**Metrics**
- classrup_comms_mailbox_puts_total{outcome=ok|full|rate_limited|rejected} (relay)
- classrup_comms_mailbox_depth (gauge, relay, per bucket of mailbox size)
- classrup_comms_mailbox_envelope_bytes (histogram, relay)
- classrup_comms_mailbox_expiry_lag_ms (gauge, relay)
- vault diagnostics counters: outbound_by_sync_state, inbound_quarantined, decrypt_failures (local only)

**Logs**
- relay info mailbox.put {mailboxIdHash, size, correlationId} — no sender, blob or plaintext.
- vault warn message.quarantined {messageId, reason} — local diagnostics only.

**Budgets**
- Relay put p95 ≤ 300 ms at 100 req/s; fetch 100 envelopes p95 ≤ 150 ms; sweep deletes 50 000 expired envelopes in ≤ 30 s.
- Vault compose, encrypt, wrap for 12 devices and sign ≤ 150 ms on a mid-range phone (Moto G class).
- Each per-recipient blob ≤ 16 384 bytes including at most 5 wrapped keys for that recipient's devices.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-060-09.T14 | load | PS-060-08.R01, PS-060-08.R02, PS-060-08.R03 | 100 puts per second for 5 minutes then fetch of 100 envelopes then sweep of 50 000 | p95 within budgets, metrics exported |

## Dependencies

Module depends on: F08.S01.M02, F07.S01.M01, F07.S02.M02, F16.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FED-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
