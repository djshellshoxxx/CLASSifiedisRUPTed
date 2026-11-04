# PS-127-06 — Failure recovery and idempotency: Secrets handling

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M02 Secrets handling](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/secrets` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-127-06.R01** loadSecret is idempotent and side-effect free apart from caching the loaded value in memory.
- **PS-127-06.R02** Reload is atomic; a failed reload keeps the previous values and logs SECURITY_SECRET_MISSING or PERMISSIONS without values.
- **PS-127-06.R03** Data-key rotation is resumable and idempotent per object.

## Specification

- **idempotency:** loadSecret and hashToken are pure given the same environment; key re-wrapping records (objectId, keyVersion) so repeated runs skip finished objects.
- **concurrency:** Secret cache is swapped by replacing one immutable object reference, so readers see either the old or the new set; rotation batches use transactions of 1 000 objects.
- **retries:** File reads retry up to 3 times with 100 ms spacing for transient IO errors; permission and ambiguity errors are never retried.
- **offline:** Not applicable to vaults; relay secrets load from local files and need no network.
- **partial failure:** If rotation stops midway, objects wrapped under either key version stay readable because both versions are kept until the rotation completes and a verify pass reports zero remaining on the old version.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-127-09.T06 | integration | PS-127-03.R01, PS-127-03.R02, PS-127-03.R03, PS-127-06.R01, PS-127-06.R02 | SIGHUP reload with overlap 120 s; failed reload; key rotation interrupted and resumed | atomic swap; old value valid within overlap only; failed reload keeps previous; rotation resumes without double work |
| TEST-PS-127-09.T09 | chaos | PS-127-06.R03, PS-127-08.R01 | process killed mid-rotation; startup with one secret missing | no half-open listener; progress recorded; one log line per secret without values |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-CAP-001. Predecessor: [domain_schema.md](domain_schema.md).
