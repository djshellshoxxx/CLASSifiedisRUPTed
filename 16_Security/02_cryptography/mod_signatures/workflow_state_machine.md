# PS-130-03 — Workflow state machine: Signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M03 Signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-130-03.R01** Verification is a pure function of the envelope, expected context, registry status snapshot and verifier receipt time, and has no side effects.
- **PS-130-03.R02** The verifier's own receipt time is the only time used for revocation decisions, and the signedAt claim never extends or shortens a key's validity.
- **PS-130-03.R03** A result with freshness stale or unknown is returned to the caller and never upgraded to valid-fresh by the library.

## Specification

**Note:** Stateless helpers; a verification has a result but no lifecycle.

### Timeouts and scheduled transitions

- Registry status snapshot passed to verify must be at most 60 seconds old on a relay; vaults pass the status with its true freshness.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-130-09.T04 | unit | PS-130-02.R01, PS-130-02.R03, PS-130-03.R02 | floats, duplicate keys, unsorted keys, lone surrogates, 65 KiB payload, RFC 8785 vectors | rejected with documented codes; canonical forms match vectors |
| TEST-PS-130-09.T06 | integration | PS-130-03.R01, PS-130-03.R02, PS-130-03.R03 | registry snapshots active-fresh, revoked, stale 9 days, unknown, backdated signedAt | results valid-fresh, SECURITY_KEY_REVOKED, valid with freshness unknown, SECURITY_SIGNER_UNKNOWN, claim flagged |
| TEST-PS-130-09.T08 | chaos | PS-130-06.R01, PS-130-06.R02, PS-130-06.R03, PS-130-03.R03 | registry lookup throws or times out | result valid cryptographically with keyStatus unknown and freshness unknown; never plain valid-fresh |

## Dependencies

Module depends on: F16.S02.M02, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
