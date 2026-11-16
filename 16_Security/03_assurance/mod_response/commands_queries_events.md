# PS-132-04 — Commands, queries and events: Incident response

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M03 Incident response](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/response` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-132-04.R01** The relay CLI exposes classrup-relay containment read-only on|off --reason and classrup-relay containment federation on|off --reason, which write the sentinel or flag and an audit entry (F16.S01.M01).
- **PS-132-04.R02** The command bus honors the read-only sentinel by returning SECURITY_READ_ONLY_MODE for non-exempt mutating commands; the contract is specified here and implemented by F15.S02.M02.
- **PS-132-04.R03** The linter pnpm security:runbooks:check validates structure, references, drill dates and forbidden claims and exits non-zero on any error.

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
| SECURITY_READ_ONLY_MODE | 503 | yes | the relay is in read-only mode; retry after the Retry-After interval |
| SECURITY_RUNBOOK_INCOMPLETE | 422 | no | a runbook lacks a required section |
| SECURITY_RUNBOOK_DANGLING_REFERENCE | 422 | no | a runbook references a missing capability, flag, error code or module |
| SECURITY_RUNBOOK_DRILL_STALE | 422 | no | last drill older than 6 months |
| SECURITY_RUNBOOK_FORBIDDEN_CLAIM | 422 | no | a document claims audit, certification or guaranteed security |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Documentation and tooling module with no bus commands, queries or events. Operators use existing commands (F16.S03.M02, F15.S04.M02, F16.S02.M02) and the relay CLI; the lint is pnpm security:runbooks:check.

### Example

```
$ classrup-relay containment read-only on --reason "suspected relay breach, incident 0192f440"
-> read-only sentinel written; propagation check: bus rejecting non-exempt writes after 2.1 s; audit entry seq 5120
POST /api/v1/cmd/bazaar.listing.publish  -> 503 { "code": "SECURITY_READ_ONLY_MODE", "retryable": true, "retryAfterMs": 300000 }
$ pnpm security:runbooks:check
runbooks: 7; incomplete: 0; dangling references: 0; last drill: 2026-10-20; exit 0
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-132-09.T01 | unit | PS-132-01.R01, PS-132-01.R02, PS-132-02.R01, PS-132-04.R01, PS-132-04.R03, PS-132-09.R02 | lint the seven runbooks and each broken fixture | valid passes; each broken fixture yields its SECURITY_RUNBOOK_* code with runbook ID |
| TEST-PS-132-09.T03 | integration | PS-132-03.R04, PS-132-04.R02 | set read-only; submit listing publish, offer make, session revoke, key revoke, incident open | non-exempt return SECURITY_READ_ONLY_MODE within 5 s with retryAfterMs 300000; exempt succeed |

## Dependencies

Module depends on: F16.S03.M02, F16.S03.M01, F16.S02.M02, F15.S04.M02, CTR-CAP-001, CTR-FLG-001, CTR-ERR-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
