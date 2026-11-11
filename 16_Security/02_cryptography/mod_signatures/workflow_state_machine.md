# PS-130-03 — Workflow state machine: Signatures

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M03 Signatures](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/signatures` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-130-03.R01** Verification is a pure function of the envelope, the payload, the expectations, the caller-supplied key status and the verifier receipt time, and has no side effects.
- **PS-130-03.R02** The verifier's own first-seen time is the only time used for revocation decisions, and the signedAt claim never extends or shortens a key's validity.
- **PS-130-03.R03** A result with freshness stale or unknown is returned to the caller and never upgraded to fresh by the library.

## Specification

**Note:** Stateless helpers; a verification has a result but no lifecycle.

### Timeouts and scheduled transitions

- Key status passed to verify must be at most 60 seconds old on a relay; vaults pass the status with its true freshness.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-130-09.T06 | integration | PS-130-03.R01, PS-130-03.R02, PS-130-03.R03 | key status inputs active-fresh, revoked before first sight, active with freshness unknown after 9 days, unknown key; backdated signedAt | accepted; SECURITY_KEY_REVOKED; accepted with freshness unknown never upgraded; SECURITY_SIGNER_UNKNOWN; clock claim flagged without changing key status |
| TEST-PS-130-09.T19 | unit | PS-130-02.R04, PS-130-03.R01 | statement c1 by key K1 verified with status revoked and finalListed true; statement c3 by K1 with status revoked and finalListed false; status active with finalListed true | accepted true with flag finalStatement; accepted false with SECURITY_KEY_REVOKED; accepted true without the flag |

## Dependencies

Module depends on: F11.S01.M03, CTR-FED-001, CTR-ID-001, CTR-ERR-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
