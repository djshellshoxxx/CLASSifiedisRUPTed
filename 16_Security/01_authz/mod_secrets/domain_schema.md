# PS-127-01 — Domain schema: Secrets handling

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M02 Secrets handling](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/secrets` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-127-01.R01** The module owns no persistent entities and never writes secret values to the database, to logs or to exports.
- **PS-127-01.R02** Token hashes use SHA-256 over 256-bit random tokens, which is sufficient because the input has full entropy; low-entropy secrets are never accepted as tokens.
- **PS-127-01.R03** Secret names follow RELAY_SECRET_[A-Z0-9_]+ and each has a declared purpose, kind (comparison or data-wrapping), minimum length and rotation period in the secret manifest - DATA_KEY (data-wrapping), AUDIT_PEPPER, VAPID_PRIVATE_KEY and SMTP_PASSWORD (comparison or signing) - and the relay signing key is not in the manifest because F15.S02.M01 owns its key file.

## Specification

**Note:** No catalog entities. Secrets are process configuration and are never persisted by the product. Relay access tokens are hashed by this module's helper and stored by the owning session module, not here. The data-key re-wrap progress is a relay-local table (security_rewrap_progress: objectId, keyVersion) of the owning storage, not a catalog entity.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-127-09.T01 | unit | PS-127-01.R01, PS-127-01.R03, PS-127-02.R01 | manifest with all secrets present once | all loaded; names match RELAY_SECRET_ pattern; relay signing key absent from the manifest; nothing written to the database |
| TEST-PS-127-09.T03 | property | PS-127-01.R02, PS-127-07.R01, PS-127-07.R03 | random secrets interpolated into logs, errors, JSON and inspect output | output never contains the secret or its base64url or hex forms |
| TEST-PS-127-09.T05 | unit | PS-127-01.R02, PS-127-02.R02 | hashToken for 43-character token and malformed tokens | SHA-256 of decoded bytes for valid; UNAUTHENTICATED for malformed |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-CAP-001. Predecessor: [module SPEC](SPEC.md).
