# PS-083-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/01_protocol/mod_portable. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (envelope, R04, R08), CTR-EVT-001, CTR-SCH-001, CTR-ID-001 (new prefix PENDING CTR-ID-001: `pbd_`).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-083-01.R01 | A portable bundle is a manifest plus a list of CTR-EVT-001 envelopes. It introduces no new event envelope. | MVP |
| PS-083-01.R02 | Bundle contains only items whose `federate` flag is true (PS-084) and whose class is ≤ PSEUDONYMOUS, or LOCATION_COARSE as a registered cell (CTR-FED-001 R02). | MVP |
| PS-083-01.R03 | Manifest is signed by the origin node key with `key_id` (CTR-FED-001 R09). | MVP |
| PS-083-01.R04 | Bundle lifetime ≤ 30 days (`expires_at`, ASSUMPTION). | MVP |

## Data / schema
| Field | Type | Constraint |
|---|---|---|
| `bundle_id` | string | `pbd_` + 26 chars (PENDING) |
| `origin_node` | string | `nod_` ID |
| `audience` | string | `fpr_` ID or `public` |
| `items` | object[] | `{aggregate_id, revision, event_id}`; max 1000 items (ASSUMPTION) |
| `max_data_class` | enum | ≤ PSEUDONYMOUS, or LOCATION_COARSE |
| `key_id` | string | per CTR-FED-001 R09 |
| `signature` | string | Ed25519 over domain-prefixed JCS of manifest (ASSUMPTION) |
| `created_at`, `expires_at` | date-time | `expires_at` ≤ `created_at` + 30 d |
| `schema_version` | const | `1.0.0` |

Profile-level account data export is owned by `07_Identity/02_profiles/mod_portable` (B-06, PROVISIONAL). This module consumes its manifest only; it does not own a second profile export record.

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Bundle build from committed revisions only. Offline clients do not build federated bundles (CTR-FED-001 Failure section).

## Privacy, retention, abuse
Data class of manifest: PSEUDONYMOUS. `audience` pseudonyms per CTR-FED-001 R08. Retention in file 07.

## Observability & budgets
Build latency and size metrics in file 08.

## Tests
- TEST-PS-083-01-01 (schema): bundle with a PRIVATE_PERSONAL item fails.
- TEST-PS-083-01-02 (schema): `expires_at` more than 30 days out fails.
- TEST-PS-083-01-03 (signature): altered item list fails verification.

## Acceptance criteria
1. Bundle schema validates with `additionalProperties: false`.
2. No item violates R02.
3. Signature verification covers `audience` and `expires_at` (CTR-FED-001 R04).

## Assumptions & open decisions
- ASSUMPTION: 1000-item cap; 30-day lifetime; Ed25519 signing.
- PROVISIONAL (D01 default, unapproved): versioned signed envelopes with explicit opt-in.
