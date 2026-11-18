# PS-056-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/02_profiles/mod_profiles. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (envelope, R03 idempotency), CTR-ERR-001, CTR-SCH-001, CTR-CAP-001 (`profile.*` actions), CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-056-04.R01 | Every write carries `idempotency_key` (26-char ULID) and `expected_revision`. | MVP |
| PS-056-04.R02 | `UpdateProfile` p95 ≤ 300 ms server-side; response returns new `revision`. | MVP |
| PS-056-04.R03 | Public query `GetPublicProfile(prf_id)` returns public-visibility fields only; absent fields omitted (CTR-CAP-001 R10). | MVP |
| PS-056-04.R04 | Event payloads carry field names changed, never field values, except `profile.updated` with `public` field names only. | MVP |
| PS-056-04.R05 | Schema IDs `profile.updated`, `profile.visibility_changed`, `profile.frozen`, `profile.disclosure_granted`, `profile.disclosure_revoked`, `profile.private_purged`, version 1.0.0. | MVP |
| PS-056-04.R06 | Bulk profile import. | Future |

## Data / schema
| Command | Payload | Error codes |
|---|---|---|
| `UpdateProfile` | `prf_id`, `patch` (subset of public and private fields), `expected_revision`, `idempotency_key` | `PROF.BIO_*`, `LANGUAGE_INVALID`, `REGION_UNAVAILABLE`, `CONTACT_*`, `PROFILE_FROZEN`, `EVT.REVISION_CONFLICT` |
| `SetFieldVisibility` | `prf_id`, `field`, `visibility`, `expected_revision` | `CONTACT_NOT_PUBLIC`, `PROFILE_FROZEN` |
| `DisclosePrivateField` | `prf_id`, `counterparty_ref` (`prf_` or `acc_`), `fields[]`, `expires_at` | `DISCLOSURE_NOT_ALLOWED`, `PROFILE_FROZEN` |
| `RevokeDisclosure` | `grant_id`, `expected_revision` | `SYS.NOT_FOUND` |

Queries: `GetPublicProfile(prf_id)`; `GetOwnProfile(prf_id)` (owner, all fields); `GetCounterpartyView(prf_id, relation_ref)` (participant; granted fields only).

## States & transitions
Events map to [workflow_state_machine.md](workflow_state_machine.md). Consumed events: `pseudonym.created`, `pseudonym.retired`.

## Validation & errors
Field rules in [validation_rules.md](validation_rules.md). Error envelope per CTR-ERR-001.

## Authorization
Actions: `profile.read`, `profile.update`, `profile.set_visibility`, `profile.disclose`, `profile.revoke_disclosure`. Matrix in [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
- Same key and digest → original result, no new event (CTR-EVT-001 R03).
- Offline edits queued (D08 PROVISIONAL) and replayed with original `expected_revision`; conflicts become `not_applied` with user message.

## Privacy, retention, abuse
`actor_ref` is `acc_`; no `acc_` in profile events. Counterparty views logged to `aud_` with `prf_id` and grant ID only.

## Observability & budgets
`prof_cmd_total{command,result}`; no field values as labels.

## Tests
- TEST-PS-056-04-01 (contract): payload schemas for all commands and events.
- TEST-PS-056-04-02 (integration): duplicate `UpdateProfile` returns same revision; one event.
- TEST-PS-056-04-03 (contract): `profile.updated` contains no private values (fixture).
- TEST-PS-056-04-04 (negative): `GetPublicProfile` for a private-only field returns field absent, not null.

## Acceptance criteria
1. All commands, queries and events implemented with listed payloads.
2. Idempotency and revision rules tested.
3. Event payload lint passes CTR-EVT-001.
4. Public query never returns non-public fields.

## Assumptions & open decisions
- ASSUMPTION: aggregate type `profile` registered in CTR-SCH-001.
- PROVISIONAL (D08 default, unapproved): offline queue until relay acknowledgment.
