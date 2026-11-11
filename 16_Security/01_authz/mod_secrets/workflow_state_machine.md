# PS-127-03 — Workflow state machine: Secrets handling

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M02 Secrets handling](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/secrets` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-127-03.R01** Startup is all-or-nothing, so if any required secret fails validation the relay does not open its listener.
- **PS-127-03.R02** Reload on SIGHUP loads new values atomically and keeps the previous value of a comparison secret valid for the configured overlap of at most 300 seconds; data-wrapping keys are exempt from this overlap.
- **PS-127-03.R03** Rotation of the relay data key re-wraps stored per-object keys in batches of 1 000 and records progress so it is resumable, and the previous data-key version stays loaded until a verify pass reports zero objects left on it.
- **PS-127-03.R04** A data-key version may be removed only after the verify pass reports zero objects on it, re-wrapping must finish within 30 days of rotation (after which startup warns daily), and startup refuses with SECURITY_SECRET_MISSING if a version still in use was removed early.

## Specification

**Note:** No entity lifecycle. Secret loading is a startup and reload procedure, not a stateful entity; data-key rotation is a resumable batch procedure.

### Timeouts and scheduled transitions

- Overlap window for comparison secrets after reload: configurable 0..300 s, default 120 s; not applied to data-wrapping keys.
- Data-key re-wrap target: complete within 30 days of rotation; the old version is kept until the verify pass reports zero objects.
- Weekly full-history secret scan every Monday 02:00 UTC in CI.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-127-09.T06 | integration | PS-127-03.R02, PS-127-06.R01, PS-127-06.R02 | SIGHUP reload of SMTP_PASSWORD with overlap 120 s; failed reload | atomic swap; old value valid within overlap only; failed reload keeps previous values |
| TEST-PS-127-09.T09 | chaos | PS-127-03.R01, PS-127-06.R03, PS-127-08.R01, PS-127-07.R02 | process killed mid-rotation; startup with one secret missing | no half-open listener; progress recorded; resumed run skips finished objects; one log line per secret without values |
| TEST-PS-127-09.T13 | integration | PS-127-03.R03, PS-127-03.R04, PS-127-04.R04 | rotate data key with 2 000 objects, interrupt at 1 200, SIGHUP after 301 s, remove v1 before verify reports zero, finish and verify | v1 stays loaded beyond 300 s; startup refuses with SECURITY_SECRET_MISSING naming v1 and 800 objects; verify-rewrap exits 1 then 0; v1 removable afterwards |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-CAP-001. Predecessor: [domain_schema.md](domain_schema.md).
