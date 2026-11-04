# PS-086-04 — Commands, queries and events: Federated conflicts

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S02.M03 Federated conflicts](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/relay_sync/conflicts` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-086-04.R01** The module exposes detect, resolve and read operations; detect is an internal vault or relay command and resolve is a review action.
- **PS-086-04.R02** Each command emits its events in the same local transaction as the state change.
- **PS-086-04.R03** The module consumes account move events to re-evaluate origin-wins bindings.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `federation.conflict.detect` | federation.conflict.detect | [vault-local or relay-local command, called by F11.S01.M02] { kind, author, seq?, subjectRef?, candidates: Envelope[2..5], statementClass } | { conflictId, status: open, freezeScope } | FED_SIGNATURE_INVALID, VALIDATION_FAILED, CONFLICT_STATE | federation.conflict.detected | yes (Idempotency-Key) |
| `federation.conflict.resolve` | federation.conflict.resolve | [vault-local command in the vault; relay command under relay policy] { conflictId, expectedRevision, decision: keep\|drop_all\|superseded, keptCid?, supersededByCid?, note? ≤ 280 } | { conflictId, revision, status } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, FEDERATION_CONFLICT_INVALID_RESOLUTION, FEDERATION_CONFLICT_NOT_AUTO_RESOLVABLE | federation.conflict.resolved | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `federation.conflict.list` | federation.conflict.read | { status?: open\|all, statementClass?, cursor?, limit ≤ 50 } | { items: ConflictRecord[], nextCursor? } |  |
| `federation.conflict.get` | federation.conflict.read | { conflictId } | { conflict: ConflictRecord, diff: FieldDiff[] } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `federation.conflict.detected` | P1 | { conflictId, kind, statementClass, author, seq?, candidateCids, freezeScope } |
| `federation.conflict.resolved` | P1 | { conflictId, decision, keptCid?, decidedBy, supersededByCid? } |

### Events consumed

| Type | Effect |
|---|---|
| `federation.account.moved` | recompute the bound origin for open public_projection conflicts of that author before auto-resolution |
| `federation.peer.suspended` | extend the 7-day review window of public_projection conflicts whose candidates came from that peer by 7 days |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| FEDERATION_CONFLICT_INVALID_RESOLUTION | 422 | no | decision does not match the candidates or lacks a verified superseding statement |
| FEDERATION_CONFLICT_NOT_AUTO_RESOLVABLE | 409 | no | commitments need a person or a renegotiated signed statement |
| FED_SIGNATURE_INVALID | 400 | no | a candidate signature failed verification |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
federation.conflict.detect { kind: "fork_seq", author: "did:key:z6Mk...", seq: 7, statementClass: "public_projection", candidates: [env1, env2] }
-> { conflictId: "0192f3b0-...", status: "open", freezeScope: [] }   emits federation.conflict.detected
federation.conflict.resolve { conflictId: "0192f3b0-...", expectedRevision: 1, decision: "keep", keptCid: "sha256-Qm..." }
-> { conflictId: "0192f3b0-...", revision: 2, status: "resolved" }   emits federation.conflict.resolved
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-086-09.T04 | integration | PS-086-03.R02, PS-086-04.R03, PS-086-07.R02 | public conflict untouched for 7 days with a bound origin | auto_resolved origin_wins keeps the first-received-from-origin cid; event emitted |
| TEST-PS-086-09.T06 | integration | PS-086-03.R03, PS-086-04.R01 | author publishes E8 with ext.supersedes naming both cids | conflict superseded with supersededByCid; resolved event emitted |
| TEST-PS-086-09.T07 | contract | PS-086-04.R01, PS-086-04.R02, PS-086-09.R02 | detect and resolve | outputs and events validate against registry schemas |
| TEST-PS-086-09.T08 | integration | PS-086-04.R03 | account moved event for the author while a conflict is open | origin binding recomputed before the 7-day decision |

## Dependencies

Module depends on: F11.S02.M02, F11.S01.M03, F11.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
