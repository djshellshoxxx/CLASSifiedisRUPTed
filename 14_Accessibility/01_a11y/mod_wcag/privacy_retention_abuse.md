# PS-111-07 — privacy retention abuse

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-111-07. **Owner:** [14_Accessibility/01_a11y/mod_wcag](SPEC.md). **Implementing module:** 14_Accessibility/01_a11y/mod_wcag. **Consumers:** F10 privacy classes per CTR-PRV-001, F16 security, F07 identity per [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Purpose and scope
**Business outcome:** the module stores accessibility conformance records without personal data about end users, keeps only the reviewer and approver pseudonyms needed for audit, retains records for a defined period, and resists abuse of the review and waiver workflow.

**Exclusions:** any data about end-user disability, health or assistive technology; location of any user (no geolocation field exists in this module); federation disclosure (no federation in MVP); screenshots and recordings (evidence store, A-wcag-14).

## Requirements
- PS-111-07.R01 — Outcome and exclusions as stated above.
- PS-111-07.R02 — Cases covered: note contains personal data, deleted actor, bot flooding, approver collusion, spam waiver requests, legal hold on a record past its retention date, export request for a departed reviewer.
- PS-111-07.R03 — Budgets: rate limits as defined below; zero personal data fields outside pseudonymous actor IDs.
- PS-111-07.R04 — Data classification and storage location.
- PS-111-07.R05 — Retention periods per record type.
- PS-111-07.R06 — Disclosure rules.
- PS-111-07.R07 — Abuse controls.
- PS-111-07.R08 — Deletion, tombstones and legal hold.

## Data classification
| Field group | Class | Notes |
|---|---|---|
| `*_actor_id`, `reviewer_actor_id`, `requested_by_actor_id`, `approved_by_actor_id` | Pseudonymous internal identifier (personal data under most regimes) | Pseudonym from F07; not an anonymity guarantee against operators |
| `surface_id`, `scope_key`, `release_ref`, `sc_id`, `outcome`, counts | Internal operational data | Not personal |
| `note` | Free text, potentially sensitive internal defect detail | Restricted to internal roles; never exported to outside parties |
| `evidence_ref` | Opaque reference | Target content is owned by the evidence store |

Disclosure class for all records: `internal-operations` (A-wcag-06, pending CTR-PRV-001 labels from F10).

## Storage location
- Records are stored in the primary region assigned to the `internal-operations` class by F10.
- No replication outside that class's configured regions.
- Backups follow the same region rule (see [import_export_backup_rollback.md](import_export_backup_rollback.md)).

## Retention
| Record | Retention after terminal state | Basis |
|---|---|---|
| wcag_check_run and wcag_finding | 3 years after COMPLETED or CANCELLED | Release audit; A-wcag-05 |
| wcag_waiver | 3 years after EXPIRED or REVOKED | Exception audit |
| wcag_profile versions | 3 years after RETIRED | Configuration audit |
| wcag_criterion | Kept for every catalog version in use | Reference data |
| Event log (`wcag_outbox` after publish) | 1 year | Operational |
| wcag_idempotency | 72 hours | Replay window (A-wcag-07) |
| Sweeper and operator logs | 30 days | Operational |

Deletion job runs daily. Records under legal hold are excluded until hold release.

## Deletion and tombstones
- When a person account is deleted in F07, the module replaces their pseudonym in all rows with the tombstone `actor:deleted` through an audited update that increments `revision` on the affected rows. Rows are not removed, because audit requires them.
- Notes are not modified by a tombstone. If a note contains personal data, the operator removes it through a privileged procedure that records the reason code and keeps the finding row.
- A waiver approved by a deleted actor stays valid until expiry. Its audit record shows the tombstone.

## Disclosure
- Gate results (`wcag.gate.get`) are visible to roles in [authorization_capabilities.md](authorization_capabilities.md) only.
- Audit export is available to `auditor` only and omits `note` fields unless the auditor holds `wcag.audit.read` with restricted-note access (future scope).
- No data from this module is included in public listing, search or federation payloads (PROJECT_SPEC trust boundaries).

## Abuse controls
| Control | Limit | On exceed |
|---|---|---|
| Commands per human actor | 60 per minute | `WCAG_RATE_LIMITED`, retryable, `Retry-After` header |
| Requests per `release_bot` identity | 600 per minute | `WCAG_RATE_LIMITED` |
| Batches per check run | 10 per minute | `WCAG_RATE_LIMITED` |
| Findings per check run | 20,000 total | `WCAG_BATCH_TOO_LARGE` for the batch that exceeds it |
| Active waivers per surface | 20 | `WCAG_WAIVER_LIMIT_EXCEEDED` |
| Waivers granted by one approver | 10 per 24 hours | Rejected; alert to operator |
| Waiver requests per requester | 25 per 24 hours | Rejected; alert to operator |
| Note length | 500 characters | `WCAG_NOTE_TOO_LONG` |

Additional controls:
- **PII pattern check** on notes (see [validation_rules.md](validation_rules.md)).
- **Plain text only.** Notes are escaped on output. No markup, links or HTML are rendered.
- **Collusion detection:** an approver who approves more than 5 waivers for the same requester in 30 days triggers an operator review. Detection is a report, not an automatic block.
- **Single-use request tickets** for waiver approval (A-wcag-08) prevent replay.
- **Spoofed automated results:** `release_bot` results can be overridden by reviewers. Automated results never silently replace a CONFIRMED finding (the update is rejected with `WCAG_FINDING_REVISION_CONFLICT` when the finding is CONFIRMED).

## Threats considered
- Metadata leakage through gate output (which surfaces fail): restricted to internal roles.
- Forged evidence: evidence is referenced, not verified, by this module. Gate output says so in the response field `evidence_verified: false`.
- Waiver used to hide a real defect: waivers expire, are capped, and require a second actor.
- Graph deanonymization from actor pseudonyms: reviewer pseudonyms are internal only and not shared with any external system.

## Open decisions
- A-wcag-05: retention periods adopt the D07 open default; D07 is not yet decided in [DECISIONS.md](../../../DECISIONS.md).
- A-wcag-06: disclosure class label `internal-operations` pending F10 publication of CTR-PRV-001.
- A-wcag-13: notes are plain text, 500 characters, with PII pattern check.

## Testing expectations
- `TEST-PS-111-07-T01` to `TEST-PS-111-07-T06`: PII rejection, tombstone behaviour, legal hold, rate limit, waiver cap, approver collusion report. Defined in [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md).

## Acceptance criteria
- Every field in [domain_schema.md](domain_schema.md) has a classification row above.
- Deletion job removes no row under legal hold and removes expired idempotency rows within 24 hours.
- Export and gate responses contain no `note` text for roles without the note-read capability.
