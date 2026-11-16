# PS-127-08 — Observability and performance: Secrets handling

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M02 Secrets handling](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/secrets` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-127-08.R01** Startup and reload emit one log line per secret with name, source and status but no values, per CTR-OBS-001 OBS-1.
- **PS-127-08.R02** equalConstantTime and hashToken add at most 0.05 ms p95 per call and the redaction scanner adds at most 0.2 ms per log line under 4 KiB.
- **PS-127-08.R03** The CI scan completes within 60 seconds for a diff and 10 minutes for full history of 10 000 commits.

## Specification

**Metrics**
- classrup_security_secrets_loaded{source=env|file} (gauge)
- classrup_security_secret_reload_total{outcome=ok|failed}
- classrup_security_log_redactions_total

**Logs**
- info secret.loaded {name, source, bytes} — never the value.
- error secret.invalid {name, code} — never the value.

**Budgets**
- hashToken p95 ≤ 0.05 ms; redaction ≤ 0.2 ms per line; loadSecret at startup ≤ 10 ms per secret.
- CI diff scan ≤ 60 s; full-history scan ≤ 10 minutes for 10 000 commits.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-127-09.T09 | chaos | PS-127-06.R03, PS-127-08.R01 | process killed mid-rotation; startup with one secret missing | no half-open listener; progress recorded; one log line per secret without values |
| TEST-PS-127-09.T10 | load | PS-127-08.R02, PS-127-08.R03 | 100 000 hashToken calls and 100 000 log lines; scan of 10 000-commit repository | latency budgets met; full-history scan ≤ 10 minutes |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-CAP-001. Predecessor: [domain_schema.md](domain_schema.md).
