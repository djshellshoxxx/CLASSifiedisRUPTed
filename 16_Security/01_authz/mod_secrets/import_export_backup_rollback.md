# PS-127-10 — Import, export, backup and rollback: Secrets handling

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M02 Secrets handling](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/secrets` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-127-10.R01** Operator configuration exports contain secret names, sources and rotation dates but never values, and backups never contain secret files.
- **PS-127-10.R02** Restoring a relay from backup requires the operator to provide secrets again, including every data-key version that still wraps restored objects, and the relay refuses to start without them.
- **PS-127-10.R03** Scanner rules and the secret manifest are versioned; rule changes keep the previous rule set available for 180 days for comparison.

## Specification

- **export:** Relay configuration export lists the secret manifest (name, purpose, kind, minimum size, source kind, last rotation date, objects per data-key version); values are never included.
- **import:** Manifest import validates names and minimums; unknown or malformed entries are rejected with VALIDATION_FAILED at configuration load.
- **backup:** Secrets are excluded from relay backups by design (CTR-IOX-001 IOX-3 covers data, not credentials); operators back up secrets, including old data-key versions until verify-rewrap reports zero, in their own secret store.
- **migration rollback:** Manifest changes are additive; rollback to the previous release ignores new optional secrets; removing a secret requires a documented deprecation of one release; the variable prefix is RELAY_SECRET_ to match the RELAY_* configuration of F15.S02.M01.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-127-09.T12 | integration | PS-127-10.R01, PS-127-10.R02, PS-127-10.R03 | export operator configuration, import to fresh relay, restore backup | exports contain secret names and sources but no values; restore requires secrets re-provided |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-CAP-001. Predecessor: [domain_schema.md](domain_schema.md).
