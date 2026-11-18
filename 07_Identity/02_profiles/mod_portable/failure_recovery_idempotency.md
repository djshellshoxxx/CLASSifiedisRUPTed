# PS-055-06 — failure, recovery and idempotency
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/02_profiles/mod_portable. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-055-06.R01 | Import apply is atomic: profile creation, `imj_` state and outbox row commit together, or none does. | MVP |
| PS-055-06.R02 | Export generation writes the file to a temp location, then renames on success. Partial files are never downloadable. | MVP |
| PS-055-06.R03 | Storage failure during export: state stays absent; client receives `SYS.UNAVAILABLE` (retryable). | MVP |
| PS-055-06.R04 | Two concurrent applies of the same `imj_`: one applies, the other returns `SYS.CONFLICT`. | MVP |
| PS-055-06.R05 | Schema upgrade on import: a bundle with an older MINOR is upcast on read; original bytes stored (CTR-SCH-001 R07). | MVP |

## Data / schema
Temp export path not addressable by clients. Outbox row per apply (profile-created event).

## Commands / queries / events
Export and apply responses are replay-safe per PS-055-04.

## States & transitions
Failure outcomes per [workflow_state_machine](workflow_state_machine.md).

## Validation & errors
`SYS.UNAVAILABLE` on storage; `SYS.CONFLICT` on concurrent apply.

## Authorization
Authorization checked before storage writes.

## Failure, idempotency, concurrency, offline
- Crash mid-export: temp file swept after 1 h; no `bnd_` row without file.
- Crash mid-apply: transaction rolled back; retry safe.
- Offline: user can prepare a file locally but cannot apply offline (R05 of PS-055-04).

## Privacy, retention, abuse
Temp files encrypted at rest and swept after 1 h.

## Observability & budgets
`portable_partial_files_swept_total` should trend to zero.

## Tests
TEST-PS-055-11 (fault injection during export), TEST-PS-055-12 (apply crash), TEST-PS-055-13 (concurrent apply).

## Acceptance criteria
1. Fault-injection shows no downloadable partial file.
2. Crash during apply leaves zero profiles and `imj_` in `staged`.

## Assumptions & open decisions
- ASSUMPTION: 1 h temp sweep.
