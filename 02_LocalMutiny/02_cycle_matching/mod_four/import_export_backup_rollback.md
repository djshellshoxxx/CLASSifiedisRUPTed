# PS-017-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_four. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R05–R09), CTR-FED-001 (R03), CTR-PRV-001 (R11).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-017-10.R01 | Participant export includes the participant's own cycles (all versions) in schema 1.0.0. | MVP |
| PS-017-10.R02 | Four-party cycles are never federated in MVP (PS-017-07.R05). | MVP |
| PS-017-10.R03 | Backup restores cycle rows with version numbers and consent flags unchanged. | MVP |
| PS-017-10.R04 | Rollback disables new proposals and keeps existing cycles readable; locked cycles are handled by PS-024 recovery, not deleted. | MVP |
| PS-017-10.R05 | Schema changes follow CTR-SCH-001; consented cycles are never rewritten. | MVP |

## Data / schema
Export: `{cycles: [cycle record], schema_version}` limited to the requester's slots.

## Commands / queries / events
Import is not supported; replay of events rebuilds state.

## States & transitions
Rollback: no transitions forced; open proposals expire by rule.

## Validation & errors
Unknown MAJOR returns SCH.UNKNOWN_VERSION.

## Authorization
Export by participant only.

## Failure, idempotency, concurrency, offline
Restore replays events in revision order; gaps block restore (EVT.REVISION_GAP).

## Privacy, retention, abuse
Export omits other slots' wants text.

## Observability & budgets
Export ≤ 64 KB per participant (ASSUMPTION).

## Tests
- TEST-PS-017-10-01 (contract): export validates.
- TEST-PS-017-10-02 (restore): backup and restore preserve version and consent flags.
- TEST-PS-017-10-03 (rollback): disabling proposals leaves consented cycles readable.

## Acceptance criteria
1. Restore reproduces cycles exactly in test fixtures.
2. No four-party cycle appears in federation output.
3. Rollback deletes zero cycle rows.

## Assumptions & open decisions
- PENDING: feature flag for four-party matching (F15 mod_flags).
- PROVISIONAL (D02 default, unapproved): versioned matching rules.
