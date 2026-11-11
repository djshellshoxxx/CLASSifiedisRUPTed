# PS-121-10 — Import, export, backup and rollback: Observability

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M01 Observability](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/observability` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-121-10.R01** The vault diagnostics buffer exports as JSON Lines of already-redacted records on explicit user request only.
- **PS-121-10.R02** The log line format is versioned by field names; additions are additive and ts, level and msg always come first so N-1 parsers keep working.
- **PS-121-10.R03** Metric registration is idempotent for identical definitions so restarts and hot reloads do not duplicate series, and conflicting re-definitions fail fast.

## Specification

- **export:** Vault: ring buffer export as JSON Lines (user-initiated, already redacted). Relay: no user export; logs belong to the operator.
- **import:** Nothing is imported; diagnostics are not restored.
- **backup:** Metrics and logs are not part of relay or vault backups; relay logs follow the operator's RET-AUDIT pipeline.
- **migration rollback:** Metric names are stable; renaming a metric keeps the old name registered for one release so dashboards survive a rollback.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-121-09.T03 | unit | PS-121-01.R01, PS-121-04.R01, PS-121-08.R01, PS-121-10.R02 | child loggers with module and correlationId log one line | exact JSON with ts, level, msg, correlationId, module, code, durationMs first; note dropped |
| TEST-PS-121-09.T05 | unit | PS-121-01.R02, PS-121-02.R01, PS-121-05.R03, PS-121-10.R03 | bad names, reserved suffixes, userId label, duplicate and conflicting registration | registration throws; identical re-registration shares the series; conflicting one throws |
| TEST-PS-121-09.T11 | unit | PS-121-04.R03, PS-121-07.R03, PS-121-10.R01 | ring buffer of 3 receives 5 lines with an email field, export and clear | last 3 lines kept; JSON Lines export without the email; empty after clear |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-CAP-001, CTR-ERR-001, CTR-TST-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
