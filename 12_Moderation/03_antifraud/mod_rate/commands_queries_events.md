# PS-099-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_rate. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-EVT-001 (policy events only), CTR-SCH-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-099-04.R01 | The only runtime operation is `rate.consume`, an internal in-process or service-to-service call. No public endpoint exists. | MVP |
| PS-099-04.R02 | `rate.consume` p95 ≤ 5 ms in-process; ≤ 10 ms via internal RPC; timeout 50 ms. | MVP |
| PS-099-04.R03 | Consume decisions produce no events (high volume). Policy changes produce events. | MVP |
| PS-099-04.R04 | Policy events are `rate.<past-tense verb>` (CTR-EVT-001 R10) with payloads of version and counts of classes only. | MVP |

## Data / schema
| Operation | Input | Output |
|---|---|---|
| `rate.consume` (internal) | `class_id`, `subject_token`, `cost`, `now_ms` (optional, for tests) | `{allowed: bool, retry_after_ms?: int, policy_version: semver}` |
| `rate.policy_load` (F16 signed artifact) | signed policy file | event `rate.policy_loaded` or `rate.policy_rejected` |

Policy events payload: `policy_version`, `class_count`, `signature_key_id`, `reason_code` (rejections).

## Commands / queries / events
Example internal call:
```json
{"class_id": "msg.send", "subject_token": "b64url-43chars...", "cost": 1}
→ {"allowed": false, "retry_after_ms": 1800, "policy_version": "1.2.0"}
```
Denied calls are reported to the caller as `RATE.LIMITED` (429) at the edge.

## States & transitions
Policy events map to PS-099-03.

## Validation & errors
Codes in [PS-099-02](validation_rules.md).

## Authorization
Caller must be a registered internal service (`sys_`); see [PS-099-05](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
`rate.consume` is not idempotent by design: each call consumes tokens. Retries must not be sent for a request that already consumed; the edge uses a request-scoped flag so retries of the same request do not re-consume (ASSUMPTION; PS-099-06 specifies).

## Privacy, retention, abuse
Policy events do not include class lists beyond counts.

## Observability & budgets
Span only on denials (sampling 1 % for allowed) to keep overhead low.

## Tests
- `TEST-PS-099-04-01` contract: `rate.consume` response schema validated.
- `TEST-PS-099-04-02` integration: edge retry with same request ID consumes once.
- `TEST-PS-099-04-03` contract: policy events contain no class-level subject data.
- `TEST-PS-099-04-04` latency: consume p95 ≤ 5 ms in-process at 50 000 calls/s.

## Acceptance criteria
1. No public endpoint exposes `rate.consume`.
2. Edge retry idempotency verified.
3. Latency budget met in benchmark.

## Assumptions & open decisions
- ASSUMPTION: edge request IDs are `req_` IDs from CTR-ERR-001 (opaque) and are retained 60 s for dedupe (ASSUMPTION).
- D01 (federated protocol), PROVISIONAL default: `rate.consume` per peer used for CTR-FED-001 R11 (unapproved).
