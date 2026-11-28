# PS-085-03 — Workflow state machine: Envelope signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M03 Envelope signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-085-03.R01** The library is stateless and every call is a pure function of its arguments and an injected clock.
- **PS-085-03.R02** Verification is a fixed pipeline with no hidden state, so the same input always yields the same Result.
- **PS-085-03.R03** There is no lifecycle to model, so no machine is declared.

## Specification

**Note:** Stateless library; no entity lifecycle. The (keyid, nonce) replay memory is an injected NonceStore owned by the caller (relay inbox or vault sync engine) with 600 s expiry.

### Timeouts and scheduled transitions

_None._

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-085-09.T10 | unit | PS-085-01.R01, PS-085-03.R01, PS-085-03.R02, PS-085-03.R03, PS-085-04.R01, PS-085-04.R03, PS-085-05.R01, PS-085-05.R03 | call every function twice with identical input and inspect module for I/O and key-store access | identical outputs, no network or filesystem access, no event emitted, private keys only received as call arguments |

## Dependencies

Module depends on: CTR-FED-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
