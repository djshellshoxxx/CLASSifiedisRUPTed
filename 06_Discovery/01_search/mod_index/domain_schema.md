# PS-045-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 06_Discovery/01_search/mod_index. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-PRV-001, CTR-EVT-001, CTR-SCH-001; PENDING CTR-DSC-001 (discovery index record schema and ID prefix `idx_`).

**Decision labels:** Retention of index records is PROVISIONAL (D07 default, unapproved). Coarse-cell-only indexing is PROVISIONAL (D05 default, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-045-01.R01 | One index document per listing (`lst_`) per locale-independent key; `idx_` document ID is derived as `idx_` + base32(SHA-256(lst_ ID))[0:26]. Duplicate `lst_` → at most one active document. | MVP |
| PS-045-01.R02 | Index document holds only allowlisted fields (table below). Any other source field is dropped at projection time, never stored. | MVP |
| PS-045-01.R03 | Index stores `region_cell` (LOCATION_COARSE) only. No coordinate, street or home-address field exists in the index schema. | MVP |
| PS-045-01.R04 | Index keeps `source_revision` = last applied `lst_` revision (CTR-EVT-001 R02). Documents never regress to an older revision. | MVP |
| PS-045-01.R05 | Federated listings carry `provenance.origin_node`; index key becomes (`origin_node`, `lst_` ID) for them. | Future |

## Data / schema
Field-level (JSON, all required unless marked):

| Field | Type | Constraint | Data class (CTR-PRV-001) |
|---|---|---|---|
| `doc_id` | string | `idx_` + 26 chars | PUBLIC |
| `listing_id` | string | `lst_` ID (CTR-ID-001) | PUBLIC |
| `origin_node` | string | null for local; CAIP-like node ID for federated | PUBLIC |
| `title` | string | 1–120 chars, normalized NFC | PUBLIC |
| `category_path` | string[] | 1–4 items, each from category registry | PUBLIC |
| `listing_type` | enum | `sell`, `giveaway`, `wanted`, `service`, `auction`, `rental`, `barter` (`closed`) | PUBLIC |
| `price_minor` | string | base-10 integer string, CTR-COM-001 R02; null for giveaway/barter | PUBLIC |
| `currency` | string | ISO 4217 alpha-3 or CAIP-19; null when `price_minor` null | PUBLIC |
| `region_cell` | string | registered cell only (CTR-PRV-001 R04) | LOCATION_COARSE |
| `status` | enum | `active`, `suppressed`, `removed` | PUBLIC |
| `source_revision` | integer | ≥ 1, JSON integer | PUBLIC |
| `indexed_at` | string | RFC 3339 UTC, server-set | PUBLIC |
| `tokens` | string[] | derived from `title` and `category_path`; max 64 tokens | PUBLIC |

Not stored: listing description body, images, seller account ID, precise location, contact data. Seller linkage is by `lst_` only.

## Commands / queries / events
| Name | Kind | Signature | Idempotency key | Version | Errors |
|---|---|---|---|---|---|
| `index.apply_event` | command (internal) | `(event: lst.* envelope)` | `event_id` | 1.0.0 | INDEX.REVISION_GAP, INDEX.UNKNOWN_FIELD_DROPPED (logged, not returned) |
| `index.suppress` | command | `(listing_id, reason_code, case_ref?)` | `(listing_id, reason_code, case_ref)` | 1.0.0 | SYS.NOT_FOUND, INDEX.INVALID_REASON |
| `index.rebuild` | command (operator) | `(scope: all \| region_cell[])` | `rebuild_request_id` | 1.0.0 | INDEX.REBUILD_IN_PROGRESS |
| `index.doc.changed` | event | payload = index doc subset | n/a | 1.0.0 | n/a |

Consumed events: `listing.published`, `listing.updated`, `listing.withdrawn`, `listing.deleted` (names owned by F01; ASSUMPTION: confirmed against CTR-EVT-001 R10). Produced: `index.doc.changed` (public-only fields).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md) (PS-045-03) for the full table. Summary: `absent → active → suppressed ↔ active → removed`.

## Validation & errors
Rules and codes: see [validation_rules.md](validation_rules.md) (PS-045-02). Error codes use prefix `INDEX.` (CTR-ERR-001 R02). Retryable flags are fixed per CTR-ERR-001 R03.

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md) (PS-045-05).

## Failure, idempotency, concurrency, offline
See [failure_recovery_idempotency.md](failure_recovery_idempotency.md) (PS-045-06). Index is server-side only; offline clients receive the last server state, no local index writes.

## Privacy, retention, abuse
Index docs follow the listing retention class; `removed` docs are purged within 24 h (ASSUMPTION, CTR-PRV-001 R06). Details in [privacy_retention_abuse.md](privacy_retention_abuse.md) (PS-045-07).

## Observability & budgets
See [observability_performance.md](observability_performance.md) (PS-045-08).

## Tests
- TEST-PS-045-01-01 (unit): projection drops every non-allowlisted field; fixture with description and seller ID yields no such keys.
- TEST-PS-045-01-02 (property): `idx_` derivation is deterministic and collision-free over 10^6 random `lst_` IDs.
- TEST-PS-045-01-03 (unit): `price_minor` rejects floats and leading zeros.

## Acceptance criteria
1. Schema validates against JSON Schema draft 2020-12 with `additionalProperties: false`.
2. No field with class above LOCATION_COARSE exists in the index schema (static check, CI).
3. `idx_` derivation documented in PENDING CTR-DSC-001 before implementation.

## Assumptions & open decisions
- ASSUMPTION: `idx_` prefix is not yet in CTR-ID-001 registry; PENDING CTR-ID-001 addition.
- D05 PROVISIONAL: region cell is the only location field in index.
- D07 PROVISIONAL: retention follows listing class.
