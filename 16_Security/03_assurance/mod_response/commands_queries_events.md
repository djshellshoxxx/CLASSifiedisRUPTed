# PS-132-04 — Commands, queries and events: Incident response

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M03 Incident response](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/response` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-132-04.R01** The relay CLI exposes classrup-relay containment read-only on|off --reason and classrup-relay containment federation on|off --reason, which call security.containment.set with a request signed by the operator's device key, or with --local write the sentinel directly when the database is unavailable; both write an audit entry (F16.S01.M01), the local path at the next start.
- **PS-132-04.R02** The command bus honors the read-only sentinel by returning SECURITY_READ_ONLY_MODE for non-exempt mutating commands (implemented by F15.S02.M02), and the federation sentinel is honored by the F11.S01.M02 inbox for peer relay requests and by F11.S02.M01 outbound delivery.
- **PS-132-04.R03** The linter pnpm security:runbooks:check validates structure, references, drill dates, forbidden claims, template fields and the RB-02 inventory, and exits non-zero on any error.
- **PS-132-04.R04** security.containment.get_status reports both switches with since-time, actor and the last propagation check.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `security.containment.set` | security.containment.set | { switch: read_only\|federation, state: on\|off, reason (10..500 code points) } | { switch, state, changed: boolean, since, auditSeq, propagationMs } | VALIDATION_FAILED, FORBIDDEN, RATE_LIMITED |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `security.containment.get_status` | security.containment.read | { includeHistory?: boolean (last 20 changes) } | { readOnly: { state, since, changedBy, viaHost }, federation: { state, since, changedBy, viaHost }, lastPropagationCheck: { switch, ms, at } } |  |

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| SECURITY_READ_ONLY_MODE | 503 | yes | the relay is in read-only mode; retry after the Retry-After interval |
| SECURITY_RUNBOOK_INCOMPLETE | 422 | no | a runbook or template lacks a required section or field |
| SECURITY_RUNBOOK_DANGLING_REFERENCE | 422 | no | a runbook references a missing capability, command, error code or module |
| SECURITY_RUNBOOK_DRILL_STALE | 422 | no | last drill older than 6 months |
| SECURITY_RUNBOOK_FORBIDDEN_CLAIM | 422 | no | a document claims audit, certification or guaranteed security |
| SECURITY_RUNBOOK_INVENTORY_MISMATCH | 422 | no | the RB-02 notice inventory differs from the relay storage declared in the module specs |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Operators use security.containment.set through the relay CLI and existing commands (F16.S03.M02, F16.S02.M02, F16.S01.M01, F15.S02.M01, F07.S01.M01); the lint is pnpm security:runbooks:check and the inventory is pnpm security:runbooks:inventory.

### Example

```
$ classrup-relay containment read-only on --reason "suspected relay breach, incident 0192f440" --key ~/.classrup/operator-device.key
-> security.containment.set accepted (relay_operator R1); sentinel written; bus rejecting non-exempt writes after 2.1 s; audit entry seq 5120
POST /api/v1/cmd/bazaar.listing.publish  -> 503 { "code": "SECURITY_READ_ONLY_MODE", "retryable": true, "retryAfterMs": 300000 }
POST /api/v1/cmd/identity.session.revoke -> 200 (exempt)
$ classrup-relay containment federation off --reason "peer flood, incident 0192f441" --local   (database down)
-> sentinel written by OS user classrup; audit entry queued for next start
$ pnpm security:runbooks:check
runbooks: 7; incomplete: 0; dangling references: 0; inventory: matches (38 relay-stored entities); last drill: 2026-10-20; exit 0
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-132-09.T01 | unit | PS-132-01.R01, PS-132-02.R01, PS-132-02.R03, PS-132-04.R03, PS-132-09.R03 | lint the seven runbooks and each broken fixture | valid passes; each broken fixture yields its SECURITY_RUNBOOK_* code with runbook ID |
| TEST-PS-132-09.T03 | integration | PS-132-01.R02, PS-132-01.R04, PS-132-03.R04, PS-132-04.R02, PS-132-09.R02 | set read-only; submit listing publish, offer make, identity.session.revoke, security.keyrecord.revoke, security.incident.open, security.roleassignment.revoke, platform.relay_identity.revoke, federation.peer.suspend and several queries | non-exempt commands return SECURITY_READ_ONLY_MODE within 5 s with retryAfterMs 300000; every exempt command ID succeeds; queries unaffected |
| TEST-PS-132-09.T15 | integration | PS-132-04.R01, PS-132-04.R04, PS-132-07.R03 | CLI containment read-only on signed with R1's device key; get_status | sentinel written; audit entry with reason and actor; rate limit counted; status shows since-time, actor and propagation result |

## Dependencies

Module depends on: F16.S03.M02, F16.S03.M01, F16.S02.M02, F16.S01.M01, F11.S03.M01, CTR-CAP-001, CTR-FLG-001, CTR-ERR-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
