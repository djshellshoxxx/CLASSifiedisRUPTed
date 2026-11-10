# PS-029-04 — commands queries events

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-029-04. **Owner:** [03_Services/01_service_catalog/mod_skills](SPEC.md). **Implementing module:** 03_Services/01_service_catalog/mod_skills (module ID F03.S01.M01). **Consumers:** shared F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); module-level notifications, evidence, moderation and observability per [module SPEC](SPEC.md).

## Purpose and scope
Defines the versioned command, query and event contracts for skill offers. Entity fields are in [domain_schema.md](domain_schema.md). Lifecycle rules are in [workflow_state_machine.md](workflow_state_machine.md). Envelope fields follow CTR-EVT-001 and error envelopes follow CTR-ERR-001 (owner F15, see [CONTRACTS](../../../planning/CONTRACTS.md)).

Exclusions: no command creates a booking, quote, payment or agreement. No query returns draft content to anyone but the owner. Cross-participant import is not part of this interface.

## Requirements
- PS-029-04.R01: Business outcome: clients can create, edit, publish, pause, resume, renew and retire offers, and read them through stable, versioned contracts. Actors: owner client (PWA), public search client, moderation service, scheduler. Exclusions as above.
- PS-029-04.R02: Case coverage: create then publish; stale `expected_revision`; duplicate delivery of the same command; invalid payload with unknown field; query for another participant's draft (returns `SKILLS_NOT_FOUND`); search with a bad cursor; offline replay after server already applied the change.
- PS-029-04.R03: Accessibility and budgets: list responses are paginated with a maximum page of 50; responses include a `label_key` for each state so the client can show localized text without parsing; latency budgets are in [observability_performance.md](observability_performance.md).
- PS-029-04.R04: Every state-changing command requires `idempotency_key`, `schema_version` and `expected_revision` (except create). Missing or malformed fields are rejected before any write.
- PS-029-04.R05: Events carry no personal data beyond the pseudonymous IDs in the envelope. `SkillOfferUpdated` lists changed field names only, never values.
- PS-029-04.R06: Schema versions are per message. A consumer must reject an event whose `schema_version` it does not know and must not guess.

## Command envelope (all state-changing commands)
Signature (pseudocode): `command(name, idempotency_key: string[26..64], schema_version: 1, expected_revision?: int, payload: object) -> Result<SkillOfferView, SkillsError>`

- `idempotency_key`: 26 to 64 characters from `[A-Za-z0-9_-]`. Recommended: a new ULID per user action. Retained for 24 hours (A-skills-16).
- The caller identity comes from the authenticated session token, never from the body. A `participant_id` in the body is rejected (`SKILLS_PAYLOAD_UNKNOWN_FIELD`).
- Responses include `skill_id`, `state`, `revision`, `result` (`applied` or `replayed`).

## Commands
| Command | Signature (payload fields) | Allowed from state | Requires `expected_revision` | Emits event | Capability (see [authorization](authorization_capabilities.md)) |
|---|---|---|---|---|---|
| `skills.offer.create` | `category_code, taxonomy_version?, title, description?, proficiency?, tags?, rate?, discovery_region_code?` | none (creates draft) | no | `SkillOfferCreated` | `skills.offer.write` |
| `skills.offer.update` | `skill_id, patch` (any editable field) | draft, published, paused, expired | yes | `SkillOfferUpdated` | `skills.offer.write` |
| `skills.offer.publish` | `skill_id` | draft | yes | `SkillOfferPublished` | `skills.offer.write` |
| `skills.offer.pause` | `skill_id` | published | yes | `SkillOfferPaused` | `skills.offer.write` |
| `skills.offer.resume` | `skill_id` | paused | yes | `SkillOfferResumed` | `skills.offer.write` |
| `skills.offer.renew` | `skill_id` | expired | yes | `SkillOfferRenewed` | `skills.offer.write` |
| `skills.offer.retire` | `skill_id, reason_code` (owner: `owner_withdrew` only) | draft, published, paused, expired | yes | `SkillOfferRetired` | `skills.offer.write` |
| `skills.offer.moderate_remove` | `skill_id, reason_code = moderation_removed, case_ref` | draft, published, paused, expired | yes | `SkillOfferRetired` | `skills.offer.moderate` |

System sweeps use the same transitions with `actor_ref = system:<sweep_name>`: `skills.sweep.expire` (published to expired, emits `SkillOfferExpired`) and `skills.sweep.draft_inactive` (draft to retired, emits `SkillOfferRetired`). Sweep idempotency key is `<sweep_run_id>:<skill_id>`.

## Queries
| Query | Signature | Returns | Auth |
|---|---|---|---|
| `skills.offer.get` | `get(skill_id) -> SkillOfferOwnerView` | Full record including draft fields, revision, timestamps | owner only; other callers get `SKILLS_NOT_FOUND` |
| `skills.offer.list_own` | `list_own(state_filter?, cursor?, limit<=50)` | Owner's non-retired offers | owner |
| `skills.offer.search` | `search(discovery_region_code, category_code?, tags_any?, proficiency?, cursor?, limit<=50) -> Page<SkillOfferPublicView>` | Published offers in one region only | public, rate-limited (A-skills-20) |

`discovery_region_code` is required for search. Search never returns drafts, paused, expired or retired offers. `cursor` is opaque, signed, and valid for 10 minutes.

## Events
Envelope (CTR-EVT-001 fields): `event_id` (ULID), `event_type`, `aggregate_type = skill_offer`, `aggregate_id = skill_id`, `revision`, `actor_ref`, `occurred_at`, `correlation_id`, `causation_id`, `schema_version`, `payload`. Server-emitted events are not signed (A-skills-13).

Topic name: `service_catalog.skills.skill_offer.<past_tense>.v1` (A-skills-12).

| Event | Payload |
|---|---|
| `SkillOfferCreated` | `category_code, taxonomy_version, proficiency, state=draft` |
| `SkillOfferUpdated` | `changed_fields: string[]` (names only) |
| `SkillOfferPublished` | `discovery_region_code, expires_at, category_code` |
| `SkillOfferPaused` / `SkillOfferResumed` | `expires_at` |
| `SkillOfferRenewed` | `expires_at` |
| `SkillOfferExpired` | `expires_at` |
| `SkillOfferRetired` | `reason_code` (no moderator identity) |

## Example: create request and response
Request:
```json
{
  "command": "skills.offer.create",
  "idempotency_key": "01J9T5MK2A7WQ3ZVXB0ND8RHEY",
  "schema_version": 1,
  "payload": {
    "category_code": "repair.bicycle",
    "title": "Bicycle tune-up and brake adjustment",
    "description": "Tune-up for road and hybrid bikes; parts extra.",
    "proficiency": "advanced",
    "tags": ["bike", "brakes"],
    "rate": { "amount_minor": 4500, "currency_code": "EUR", "unit": "per_hour" }
  }
}
```
Response (201):
```json
{
  "skill_id": "01J9S0KA0000000000000000A1",
  "state": "draft",
  "revision": 1,
  "result": "applied",
  "schema_version": 1
}
```

## Example: publish with stale revision
Request: `{"command":"skills.offer.publish","idempotency_key":"01J9T6P0C3HVR9ZKE2WMX7BQ5N","schema_version":1,"expected_revision":1,"payload":{"skill_id":"01J9S0KA0000000000000000A1"}}`

Response (409):
```json
{
  "error": {
    "code": "SKILLS_REVISION_CONFLICT",
    "retryable": false,
    "action": "reread",
    "http_status": 409,
    "correlation_id": "01J9T6Q8F1RN5XW0ZD4TBK2MCE"
  }
}
```

## Schema versioning
- A-skills-14: Additive optional fields are allowed within version 1. Removing or renaming a field, or changing a type, requires `v2` with dual support for six months. Final rules depend on CTR-SCH-001 (owner F15).
- Unknown `schema_version` is rejected with `SKILLS_SCHEMA_VERSION_UNSUPPORTED`.

## Assumptions
- A-skills-12: Event names and topic pattern as above. Envelope follows CTR-EVT-001; field names are provisional until that contract is final.
- A-skills-13: Server-emitted events are attested by the server and are not signed. Signed client requests are out of scope.
- A-skills-14: Schema versioning as stated above.

## Open decisions
- CTR-ID-001 (ID format) affects `idempotency_key` format and event IDs. The 26-char minimum here matches ULID.
- Whether `SkillOfferUpdated` should include new values for consumers that need them. Default here: names only, to minimize data flow.

## Testing
- TEST-PS-029-04-T01: Each command in the table, with a valid payload from its allowed state, returns `applied` with revision incremented by 1. Pass when the response and stored revision match.
- TEST-PS-029-04-T02: Same command and idempotency key sent twice returns `replayed` with the identical response and writes one transition row. Pass when row count is 1.
- TEST-PS-029-04-T03: Request body containing `participant_id` is rejected with `SKILLS_PAYLOAD_UNKNOWN_FIELD`. Pass when rejected with no write.
- TEST-PS-029-04-T04: Query for a draft owned by another participant returns `SKILLS_NOT_FOUND`, identical in body and timing class to a nonexistent ID. Pass when both responses have the same shape.
- TEST-PS-029-04-T05: Event payloads validated against the event schema table. Pass when `SkillOfferUpdated` contains no field values.
