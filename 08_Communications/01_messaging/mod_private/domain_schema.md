# PS-060-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/01_messaging/mod_private. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001 (`thr`, `msg` opaque, F08), CTR-PRV-001 (PRIVATE_PERSONAL: messages; RET-PRIV), CTR-SCH-001, CTR-CAP-001 (R04 participant), CTR-FED-001 (never federated).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-060-01.R01 | A thread has exactly two participant `prf_` IDs (distinct); participant pair is immutable after creation. | MVP |
| PS-060-01.R02 | A message belongs to exactly one thread and has one sender `prf_` that is a participant. | MVP |
| PS-060-01.R03 | Message body ≤ 2,000 code points, NFC. No other content type in MVP besides attachment references (mod_attachments). | MVP |
| PS-060-01.R04 | Per-participant thread state (`archived`, `muted`, `read_marker`) stored separately from shared thread record. | MVP |
| PS-060-01.R05 | Schema `messaging.message` 1.0.0 and `messaging.thread` 1.0.0 registered in CTR-SCH-001. | MVP |
| PS-060-01.R06 | Group threads of three or more participants. | Future (needs cycle and group policy decisions) |

## Data / schema
| Field | Type | Constraint | Class |
|---|---|---|---|
| `thread_id` | string(30) | prefix `thr`, opaque | PRIVATE_PERSONAL |
| `participant_a`, `participant_b` | string(30) | prefix `prf`, distinct, immutable | PSEUDONYMOUS, participant |
| `created_at` | timestamp | ms | PRIVATE_PERSONAL |
| `msg_id` | string(30) | prefix `msg`, opaque | PRIVATE_PERSONAL |
| `sender_prf_id` | string(30) | prefix `prf` | PSEUDONYMOUS, participant |
| `body` | string(0–2000) | NFC | PRIVATE_PERSONAL |
| `sent_at` | timestamp | ms, server-assigned | PRIVATE_PERSONAL |
| `deleted_for_all_at` | timestamp or null | set once | PRIVATE_PERSONAL |
| `purged_at` | timestamp or null | set once | internal |
| `revision` | int | ≥ 1, per thread | internal |
| `schema_version` | semver | `1.0.0` | — |

Per-participant table `thread_state`: `thread_id`, `prf_id`, `archived_at`, `muted_until`, `read_marker_msg_id`, `deleted_for_me_upto` — PRIVATE_PERSONAL, owner-only.

## Commands / queries / events
Schema reference; see [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Thread and message lifecycle in [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
[validation_rules.md](validation_rules.md).

## Authorization
Participant-only reads (PS-060-05).

## Failure, idempotency, concurrency, offline
Sends are idempotent per client key; ordering per thread by server `revision`; see PS-060-06.

## Privacy, retention, abuse
Class PRIVATE_PERSONAL; retention RET-PRIV (365 days after last access or deletion). Not stored: typing indicators, device IDs, IP addresses. See PS-060-07.

## Observability & budgets
Counts per day only. See PS-060-08.

## Tests
- TEST-PS-060-01-01 (unit): two distinct participants; third participant rejected.
- TEST-PS-060-01-02 (unit): body length and NFC rules.
- TEST-PS-060-01-03 (contract): schema digests registered.
- TEST-PS-060-01-04 (privacy): no device or IP fields exist in schema (lint).

## Acceptance criteria
1. Thread and message invariants enforced in database.
2. No device or IP field exists.
3. Per-participant state never leaks to the other participant.
4. Schemas registered.

## Assumptions & open decisions
- ASSUMPTION: 2,000 code points maximum body length.
- PROVISIONAL (D10 default, unapproved): server-side encryption at rest in MVP; end-to-end encryption deferred until key design approved.
