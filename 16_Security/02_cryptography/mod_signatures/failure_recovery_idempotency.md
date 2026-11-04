# PS-130-06 — Failure recovery and idempotency: Signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M03 Signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-130-06.R01** sign and verify are deterministic and idempotent, since Ed25519 signatures are deterministic for the same key and bytes.
- **PS-130-06.R02** A failure in registry lookup produces freshness unknown rather than a valid-fresh result.
- **PS-130-06.R03** Canonicalization is total and returns an error value instead of throwing on hostile input.

## Specification

- **idempotency:** Signing the same payload and context with the same key yields the identical envelope bytes; callers deduplicate on content ID.
- **concurrency:** Pure functions with no shared state; the context registry is an immutable frozen table.
- **retries:** No retries inside the library; callers retry the surrounding network operations under CTR-IDM-001.
- **offline:** Everything works offline; only the freshness of revocation knowledge depends on connectivity, and it is reported in the result.
- **partial failure:** If the key registry is unavailable, verify returns the cryptographic result plus keyStatus unknown and freshness unknown, never an unqualified valid.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-130-09.T08 | chaos | PS-130-06.R01, PS-130-06.R02, PS-130-06.R03, PS-130-03.R03 | registry lookup throws or times out | result valid cryptographically with keyStatus unknown and freshness unknown; never plain valid-fresh |
| TEST-PS-130-09.T09 | integration | PS-130-06.R01, PS-130-07.R02 | sign same payload twice; verify embedded envelopes in a stored consent | identical envelope bytes; library writes nothing |

## Dependencies

Module depends on: F16.S02.M02, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
