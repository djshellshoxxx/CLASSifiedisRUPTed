# PS-130-06 — Failure recovery and idempotency: Signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M03 Signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-130-06.R01** sign and verify are deterministic and idempotent, since Ed25519 signatures are deterministic for the same key and bytes.
- **PS-130-06.R02** A missing or failed key status input produces keyStatus unknown and accepted false, never an accepted result.
- **PS-130-06.R03** Canonicalization errors from F11.S01.M03 are returned as error values and verify never throws on hostile input.

## Specification

- **idempotency:** Signing the same payload, context and signedAt with the same key yields identical envelope bytes; callers deduplicate on content ID.
- **concurrency:** Pure functions with no shared state; the inventory is an immutable frozen table.
- **retries:** No retries inside the library; callers retry the surrounding network operations under CTR-IDM-001.
- **offline:** Everything works offline; only the freshness of the caller-supplied key status depends on connectivity, and it is reported in the result.
- **partial failure:** If the caller cannot obtain key status, verify returns signatureValid with keyStatus unknown and accepted false, never an unqualified acceptance.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-130-09.T08 | chaos | PS-130-06.R01, PS-130-06.R02, PS-130-06.R03 | key status input missing, throwing or late; hostile envelope bytes | accepted false with keyStatus unknown, never accepted; no exception |
| TEST-PS-130-09.T09 | integration | PS-130-06.R01, PS-130-07.R02 | sign the same payload twice; verify embedded envelopes in a stored consent | identical envelope bytes; library writes nothing |

## Dependencies

Module depends on: F11.S01.M03, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
