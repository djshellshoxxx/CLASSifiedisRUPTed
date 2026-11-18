# PS-016-10 — import, export, backup and rollback

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 02_LocalMutiny/02_cycle_matching/mod_feasibility. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-SCH-001 (R05–R09), CTR-FED-001 (R03), CTR-PRV-001 (R11).

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-016-10.R01 | Snapshots are exportable only to the internal replay tool; they are never exported to peers. | MVP |
| PS-016-10.R02 | Verdict records are exported to the owning participant only, as schema 1.0.0 JSON with reason codes. | MVP |
| PS-016-10.R03 | Replay of a snapshot with the same algorithm version reproduces every verdict byte-for-byte. | MVP |
| PS-016-10.R04 | Rollback disables evaluation; it creates no proposals and changes no proposal state, so no data repair is needed. | MVP |
| PS-016-10.R05 | Algorithm version upgrade is MINOR when verdicts are unchanged for all golden fixtures; otherwise MAJOR. | MVP |

## Data / schema
Export object: `{verdicts: [record], algorithm_version, schema_version}`. No snapshot content.

## Commands / queries / events
Replay is an internal read path, not a command.

## States & transitions
Rollback path: disable → no new snapshots → existing verdicts expire per RET-EPH.

## Validation & errors
Replay with unknown algorithm MAJOR returns SCH.UNKNOWN_VERSION.

## Authorization
Export by participant (self) only; replay by operator tool with purpose constraint (CTR-CAP-001 R06).

## Failure, idempotency, concurrency, offline
Backup excludes snapshots (RET-EPH). Restore restores verdicts only.

## Privacy, retention, abuse
Exports exclude other participants' IDs and value terms beyond the participant's own slot.

## Observability & budgets
Replay job time ≤ 1 s per 5,000-edge snapshot (ASSUMPTION).

## Tests
- TEST-PS-016-10-01 (contract): export validates against 1.0.0.
- TEST-PS-016-10-02 (golden): replay of 20 fixtures matches stored verdicts exactly.
- TEST-PS-016-10-03 (rollback): disabling evaluation leaves proposal table unchanged.

## Acceptance criteria
1. Golden replay passes for all fixtures before any algorithm release.
2. Zero proposal rows changed by rollback in test.
3. No snapshot content appears in any export.

## Assumptions & open decisions
- PROVISIONAL (D02 default, unapproved): versioned algorithm with golden replay.
