# PS-143-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 17_Quality/03_release/mod_gates. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-143-04.R01 | State-changing commands carry `idempotency_key` and `expected_revision`. | MVP |
| PS-143-04.R02 | Commands are `v1`; breaking changes need a new name. | MVP |
| PS-143-04.R03 | Queries paginate at max 100 and return evidence IDs and digests, not evidence bodies. | MVP |

## Commands
| Command (v1) | Signature | Idempotency key | Emits | Errors |
|---|---|---|---|---|
| DefineReleaseGate | `(gate: release_gate, governance_approval_id?)` | `gate_key` + `version` | `release_gate.defined` | GATES.EVIDENCE_MISSING, GATES.INVALID_TRANSITION, SYS.FORBIDDEN |
| EvaluateGates | `(gate_key, commit_sha)` | `gate_key` + `commit_sha` + `gate_version` | `gate_decision.recorded` | GATES.EVIDENCE_STALE, SYS.NOT_FOUND |
| GrantGateWaiver | `(decision_id, reason_key, expires_at, approved_by)` | `decision_id` + `reason_key` | `gate_waiver.granted` | GATES.SELF_APPROVAL_FORBIDDEN, GATES.WAIVER_TOO_LONG, SYS.CONFLICT |

## Queries
| Query (v1) | Input | Output | Errors |
|---|---|---|---|
| GetGateDecision | `decision_id` | outcome, evidence refs | SYS.NOT_FOUND |
| ListOpenWaivers | cursor, limit ≤ 100 | waiver summaries | SYS.REQUEST_MALFORMED |

## Events
| event_type | aggregate_type | max_data_class | Payload (summary) |
|---|---|---|---|
| release_gate.defined | release_gate | PUBLIC | gate_key, version |
| gate_decision.recorded | gate_decision | PUBLIC | decision_id, outcome, commit_sha |
| gate_waiver.granted | gate_waiver | PUBLIC | waiver_id, gate_key, expires_at |

Envelope per CTR-EVT-001; `actor_ref` is an `acc_` or `sys_` ID.

## Assumptions & open decisions
- ASSUMPTION: promotion tooling subscribes to `gate_decision.recorded`.
- No Dxx decision governs these commands directly: D07 applies to decision retention: PROVISIONAL (D07 default, unapproved).
