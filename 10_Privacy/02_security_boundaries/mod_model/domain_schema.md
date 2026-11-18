# PS-081-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_model. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001, CTR-ID-001 (new prefixes PENDING CTR-ID-001: `ast_`, `bnd_`, `flw_`, `mdv_`).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-081-01.R01 | Model holds three record types: asset (data store or artifact), trust boundary (zone pair), data flow (asset or boundary crossing with data class). | MVP |
| PS-081-01.R02 | Every flow records `max_data_class` per CTR-PRV-001 ordering and the controls applied at each boundary crossing. | MVP |
| PS-081-01.R03 | Model versions are immutable and carry a SHA-256 digest of canonical JSON. | MVP |
| PS-081-01.R04 | The model contains class labels and IDs only, never sample data or real identifiers. | MVP |

## Data / schema
| Entity | Key fields | Constraint |
|---|---|---|
| asset `ast_` | `asset_id`, `name_key`, `owner_module`, `data_class`, `location_zone` | `data_class` from CTR-PRV-001 |
| boundary `bnd_` | `boundary_id`, `from_zone`, `to_zone`, `controls[]` | zones: `client_pwa`, `relay`, `peer_node`, `external_chain`, `external_payment` |
| flow `flw_` | `flow_id`, `source`, `sink`, `boundary_ids[]`, `data_class`, `retention_class` | `data_class` ≥ class of payload |
| version `mdv_` | `version`, `digest_sha256`, `approved_by` (role), `schema_version` | immutable |

Trust zones: `client_pwa` and `peer_node` are untrusted for enforcement. `relay` enforces authorization (PROJECT_SPEC). Static PWA host holds no secrets.

## Commands / queries / events
See [commands_queries_events.md](commands_queries_events.md).

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
Read: Privacy, Security and QA leads. Write: Privacy Lead (propose), Security Lead (accept). Fields visible to `global` scope only; model holds no personal data.

## Failure, idempotency, concurrency, offline
Version publish is idempotent by `(version, digest)`. Concurrent proposals are serialized by version number.

## Privacy, retention, abuse
No personal data. Retention: all versions kept (ASSUMPTION) for audit.

## Observability & budgets
Model coverage metrics in [observability_performance.md](observability_performance.md).

## Tests
- TEST-PS-081-01-01 (schema): flow without `data_class` fails validation.
- TEST-PS-081-01-02 (digest): changing one byte of a published version fails verification.
- TEST-PS-081-01-03 (privacy): model fixtures contain no sample values.

## Acceptance criteria
1. All four entity types validate against the schema.
2. Published versions verify by digest.
3. No field contains personal or sample data.

## Assumptions & open decisions
- ASSUMPTION: version history retained indefinitely.
- PROVISIONAL (D10 default, unapproved): user-controlled keys are a trust-zone input; key records are modelled as assets, not stored values.
