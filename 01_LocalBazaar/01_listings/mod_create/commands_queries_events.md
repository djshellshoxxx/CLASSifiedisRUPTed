# PS-002-04 — commands queries events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/01_listings/mod_create. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001 (envelope, idempotency, revision), CTR-ERR-001 (errors), CTR-SCH-001 (payload versions), CTR-ID-001 (IDs), CTR-CAP-001 (field visibility).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-002-04.R01 | `listing.create` is the only command. Each call either returns the listing summary or one error from the registry. | MVP |
| PS-002-04.R02 | The request carries `idempotency_key` (16–128 chars, CTR-EVT-001 R03). Key scope is (`acc_`, `listing.create`, key). | MVP |
| PS-002-04.R03 | Exactly one `listing.created` event (revision 1) is emitted per successful create. None on any error. | MVP |
| PS-002-04.R04 | The event payload holds no `title`, `description` or `asking_price` (PS-002-07). | MVP |
| PS-002-04.R05 | Responses include only fields the owner may read (CTR-CAP-001 R10). | MVP |
| PS-002-04.R06 | This module owns no queries. Reads of a draft are served by mod_edit. | MVP |

## Data / schema
Request `listing.create.request` 1.0.0: `listing_type` (enum), `title` (string), `description` (string, optional), `category_code` (string), `asking_price` (object, optional), `region_cell` (string), `expected_revision` (null or absent). Validation rules: PS-002-02.

Response `listing.create.response` 1.0.0: `listing_id`, `listing_type`, `state` (`draft`), `revision` (1), `title`, `description`, `category_code`, `asking_price`, `region_cell`, `created_at`.

Event `listing.created` 1.0.0 (CTR-SCH-001 `schema_id` equals `event_type`):

| Envelope field | Value |
|---|---|
| aggregate_type / aggregate_id | `listing` / `lst_` |
| revision | 1 |
| actor_ref | `{kind: "user", ref: acc_}` |
| max_data_class | LOCATION_COARSE |
| correlation_id | One `cor_` per command |
| payload | `{listing_type, state: "draft", category_code, region_cell, content_digest}` |

`content_digest` = SHA-256 of JCS of `{listing_type, title, description, category_code, asking_price, region_cell}`, lowercase hex. It is an integrity check, visible to the owner only.

## Commands / queries / events
| Name | Signature | Idempotency | Version | Errors |
|---|---|---|---|---|
| listing.create | (principal, body, key) → summary | (`acc_`, `listing.create`, key) | request 1.0.0 | PS-002-02, -05, -06 codes |

## States & transitions
Command effect is the `none → draft` row in PS-002-03.

## Validation & errors
Body rules: PS-002-02. Event emission failure: `EVT.ENVELOPE_INVALID` (internal; must never reach the client as success).

## Authorization
Caller must hold `lst.create` (PS-002-05). `actor_ref` comes from the session, never from the body.

## Failure, idempotency, concurrency, offline
Unknown major version in a queued command: remains pending as "client upgrade required" (CTR-SCH-001 R06). Replays and conflicts: PS-002-06.

## Privacy, retention, abuse
Subscribers receive `listing.created` only for `lst_`, `listing_type`, `category_code` and `region_cell` (LOCATION_COARSE). Permitted subscribers at MVP: mod_edit, mod_publish, observability counters, and F12 aggregate signals (ASSUMPTION). Notifications (F13) do not fire on create.

## Observability & budgets
Event fields logged: `event_id`, `event_type`, `revision`, `max_data_class`, codes (CTR-EVT-001). Never the payload. Commit p95 ≤ 150 ms (CTR-EVT-001 budget).

## Tests
- TEST-PS-002-04-01 (schema): valid request, response and event fixtures pass; each invalid fixture fails on its listed violation.
- TEST-PS-002-04-02 (privacy scan): `listing.created` fixtures contain no `title`, `description` or `asking_price`; `max_data_class` = LOCATION_COARSE.
- TEST-PS-002-04-03 (contract): `content_digest` equals the JCS-based SHA-256 vector for three fixtures, including a Unicode title.

## Acceptance criteria
1. Request, response and event schemas validate their examples and reject their violations.
2. Zero payloads contain title, description or price across 10,000 events.
3. Every successful create emits exactly one `listing.created`; errors emit none.
4. TEST-PS-002-04-01 to -03 pass in CI.

## Assumptions & open decisions
- PROVISIONAL (D08 default, unapproved): offline creates use the same command.
- ASSUMPTION: JCS plus SHA-256 for `content_digest`; signing is not needed because this event is local (CTR-EVT-001 R05).
- ASSUMPTION: unknown body keys are rejected, not ignored, to stop location smuggling (PS-002-02 R03).
