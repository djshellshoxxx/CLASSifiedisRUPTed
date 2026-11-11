# PS-127-04 — Commands, queries and events: Secrets handling

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M02 Secrets handling](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/secrets` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-127-04.R01** loadSecret returns a Secret or a typed error and never returns the raw string to callers outside reveal().
- **PS-127-04.R02** equalConstantTime compares byte arrays of equal length in time independent of content and returns false immediately only for length mismatch.
- **PS-127-04.R03** The scanner CLI exits 0 with no findings and 1 with findings, printing rule ID, path and line but not the matched value.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| SECURITY_SECRET_MISSING | 500 | no | a required secret is not configured; relay refuses to start |
| SECURITY_SECRET_AMBIGUOUS | 500 | no | both environment and file forms are set for one secret |
| SECURITY_SECRET_PERMISSIONS | 500 | no | secret file permissions, ownership or type are unsafe |
| SECURITY_SECRET_WEAK | 500 | no | secret shorter than the manifest minimum |
| SECURITY_SECRET_LEAK_DETECTED | 500 | no | CI scan found a secret-like value in the change set |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Library module with no commands, queries or events. API is loadSecret, Secret.reveal, equalConstantTime, hashToken, redact and the CI scanner CLI.

### Example

```
CLASSRUP_SECRET_RELAY_SIGNING_KEY_FILE=/run/secrets/relay_signing_key node apps/relay/dist/main.js
-> startup: relay_signing_key loaded (file, 32 bytes)   [value never printed]
logger.info("session", { token: secret })           -> {"msg":"session","token":"[REDACTED]"}
pnpm secrets:scan  -> SECURITY_SECRET_LEAK_DETECTED rule=classrup-secret-literal path=apps/relay/.env.example line=3 fingerprint=4f2a
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-127-09.T04 | unit | PS-127-03.R02, PS-127-04.R01, PS-127-04.R02 | equalConstantTime across equal, different and length-mismatched inputs; timing harness over 100 000 runs | correct results; no statistically significant timing difference between early and late mismatch |
| TEST-PS-127-09.T07 | integration | PS-127-04.R03, PS-127-02.R02, PS-127-09.R02 | scanner on corpus and on a pull request adding a key | exit 1 with rule, path, line and no value on positives; exit 0 on negatives; allow-list requires reviewed file |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-CAP-001. Predecessor: [domain_schema.md](domain_schema.md).
