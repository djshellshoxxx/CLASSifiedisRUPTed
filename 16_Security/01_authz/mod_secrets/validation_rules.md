# PS-127-02 — Validation rules: Secrets handling

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M02 Secrets handling](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/secrets` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-127-02.R01** Startup validates that every secret in the manifest is present exactly once with correct size and permissions.
- **PS-127-02.R02** Token and secret formats are validated before use, and failures return generic errors that do not reveal which character differed.
- **PS-127-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | each required secret in the manifest is present and non-empty | SECURITY_SECRET_MISSING |
| V02 | not both the variable and the _FILE form are set | SECURITY_SECRET_AMBIGUOUS |
| V03 | secret file mode is 0400 or 0600, owner is the process user, not a symlink, size at most 4096 bytes | SECURITY_SECRET_PERMISSIONS |
| V04 | secret length meets manifest minimum (32 bytes for keys, 16 characters for passwords) | SECURITY_SECRET_WEAK |
| V05 | relay access token is exactly 43 base64url characters (256 bits) before hashing | UNAUTHENTICATED |
| V06 | CI scanner finds no unallowed secret pattern in the diff or history | SECURITY_SECRET_LEAK_DETECTED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-127-09.T01 | unit | PS-127-01.R01, PS-127-02.R01, PS-127-02.R03 | manifest with all secrets present once | all loaded; names match pattern; minimum sizes enforced |
| TEST-PS-127-09.T02 | unit | PS-127-02.R01, PS-127-02.R02 | missing, ambiguous, permissive, symlinked, short secrets | documented SECURITY_SECRET_* code each; relay does not start |
| TEST-PS-127-09.T05 | unit | PS-127-01.R03, PS-127-02.R03 | hashToken for 43-character token and malformed tokens | SHA-256 of decoded bytes for valid; UNAUTHENTICATED for malformed |
| TEST-PS-127-09.T07 | integration | PS-127-04.R03, PS-127-02.R02, PS-127-09.R02 | scanner on corpus and on a pull request adding a key | exit 1 with rule, path, line and no value on positives; exit 0 on negatives; allow-list requires reviewed file |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-CAP-001. Predecessor: [domain_schema.md](domain_schema.md).
