# PS-085-06 — Failure recovery and idempotency: Envelope signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M03 Envelope signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-085-06.R01** All functions are deterministic and side-effect free, so repeating a call is always safe.
- **PS-085-06.R02** Verification never partially succeeds; a Result is either Ok with the verified cid, author and signer key or Err with one code.
- **PS-085-06.R03** Clock skew handling is explicit through an injected now parameter and a fixed 300 s tolerance for request created times.

## Specification

- **idempotency:** Pure functions; the same input yields the same output. Ed25519 signing is deterministic (RFC 8032), so repeated signing is byte-identical. verifyRequest records (keyid, nonce) in the injected NonceStore and reports a repeat inside 600 s as Err with params.reason = replay; the caller answers such a repeat from its Idempotency-Key store (same batchId) when a stored response exists and refuses it otherwise, so a sender retry after a lost response gets the original results and a captured request is never processed twice.
- **concurrency:** No shared mutable state beyond the injected NonceStore (atomic insert-if-absent); safe to call from workers. Verification may run in a pool of at most 4 worker threads on the relay.
- **retries:** None; failures are deterministic and must not be retried with the same input.
- **offline:** Fully offline capable; no network access; runs in the browser, service worker and Node.
- **partial failure:** Not applicable; a failed verification produces no output and no side effect other than the nonce record of a request that passed every other check.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-085-09.T03 | property | PS-085-06.R01, PS-085-06.R02, PS-085-09.R03 | random envelopes: sign then verify; flip one random bit in payload, cid or sig; sign twice | round trip Ok; mutated input Err with one code; repeated signatures byte-identical |
| TEST-PS-085-09.T09 | unit | PS-085-02.R04, PS-085-06.R03 | RFC 9421 appendix B ed25519 vectors; request with created 301 s old; wrong Content-Digest; unknown keyid; same (keyid, nonce) twice within 600 s; request signed for relay A sent to relay B; device-key keyid resolved through the portable document stub | FEDERATION_REQUEST_SIGNATURE_INVALID for each failure; vectors and a 299 s old request verify; the replay is accepted again after 601 s |

## Dependencies

Module depends on: CTR-FED-001, CTR-ERR-001, CTR-ID-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
