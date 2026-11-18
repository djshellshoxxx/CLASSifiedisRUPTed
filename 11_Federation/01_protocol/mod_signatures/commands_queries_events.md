# PS-085-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_signatures. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (R03 idempotency, R05 signing, R13 export re-keying), CTR-FED-001 (verification order, `fed.*` errors), CTR-ERR-001, CTR-SCH-001 (R01 registry), CTR-CAP-001 (R08 audit).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-085-04.R01 | All operations are internal. None is exposed on a public route. | MVP |
| PS-085-04.R02 | Each operation has a version `1.0.0` in the registry and an explicit input and output schema. | MVP |
| PS-085-04.R03 | `signing.sign_event` is deterministic: the same event bytes and key produce the same `value`. Its idempotency key is `event_id`. | MVP |
| PS-085-04.R04 | `signing.verify_event` is pure. It performs no database write. | MVP |
| PS-085-04.R05 | Every error returned by these operations is in the CTR-FED-001 table or the PS-085-02 table. No new code is minted here. | MVP |

## Commands / queries / events
| Operation | Signature (logical) | Idempotency key | Version | Errors |
|---|---|---|---|---|
| `signing.sign_event` | `(event_id, envelope_without_signature, key_id) → signature` | `event_id` | 1.0.0 | `EVT.SIGNATURE_REQUIRED` if signing fails (producer side); event is not exported |
| `signing.verify_event` | `(envelope, key_projection_row) → {valid, marker?}` or one FED code | none (pure) | 1.0.0 | `FED.ENVELOPE_MALFORMED`, `FED.VERSION_UNSUPPORTED`, `FED.KEY_REVOKED`, `FED.SIGNATURE_INVALID` |
| `key.lookup` | `(key_id) → key_projection_row` | none (read) | 1.0.0 | `FED.KEY_UNKNOWN` |

Events: this module emits none on the event bus. Key lifecycle events are emitted by F16 (PENDING F16 registry). When a historical event is accepted with the compromised marker, an `aud_` record is written (CTR-CAP-001 R08 pattern) with `event_id`, `key_id` and the marker. No content.

## Example (shape)
Request to `signing.sign_event`: `{"event_id":"evt_<26>","key_id":"key_<26>","envelope":{...}}`. Response: `{"signature":{"alg":"ed25519","key_id":"key_<26>","value":"<86>"}}`. Values are placeholders.

## States & transitions
Not applicable to operations. Key states in PS-085-03.

## Validation & errors
Input validation follows PS-085-02. Output schema validation is run before return.

## Authorization
Capabilities per PS-085-05.

## Failure, idempotency, concurrency, offline
A repeat `signing.sign_event` with the same `event_id` returns the identical signature. A different envelope under the same `event_id` returns `EVT.IDEMPOTENCY_KEY_REUSED` (CTR-EVT-001 R03). See PS-085-06.

## Privacy, retention, abuse
Operation logs carry operation name, event ID, key ID and code only.

## Observability & budgets
Latency per operation in PS-085-08.

## Tests
- TEST-PS-085-04-01 (contract): sign then verify round-trip for every `alg` in the enum.
- TEST-PS-085-04-02 (contract): sign twice with the same `event_id` yields byte-identical signatures.
- TEST-PS-085-04-03 (integration): `verify_event` causes zero database writes (write-spy).
- TEST-PS-085-04-04 (contract): every operation's error set is a subset of the CTR-FED-001 and PS-085-02 tables.

## Acceptance criteria
1. Operation schemas are published at version 1.0.0; TEST-PS-085-04-01 passes.
2. Determinism holds; TEST-PS-085-04-02 passes.
3. Verification is side-effect free; TEST-PS-085-04-03 passes.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md).
- PENDING CTR-SCH-001: operation schema IDs `signing.sign_event`, `signing.verify_event`, `key.lookup`.
- OPEN: whether `event_type` is a registry entry (CTR-EVT-001 open item).
- PROVISIONAL (D01 default, unapproved): signed envelopes.
