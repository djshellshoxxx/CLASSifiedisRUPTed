# PS-031-07 — privacy retention abuse

**Status:** SPECIFIED — Stage 3 draft, pending review.
**Requirement ID:** PS-031-07. **Owner:** [03_Services/02_service_booking/mod_milestones](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_milestones. **Consumers:** F07 identity, F10 privacy, F15 platform, F16 security (per [dependency matrix](../../../DEPENDENCY_MATRIX.md)); mod_disputes (PS-030) for dispute references.

## Purpose and scope
Business outcome: the milestone records reveal only what the two parties need, keep no location or contact data, retain commerce evidence for a defined period, and resist spam, Sybil and fabricated-evidence abuse without claiming to prevent it entirely.

Exclusions: anonymity against network metadata, counterparties or legal process (PROJECT_SPEC). Pseudonyms are not anonymity. Identity proofing (F07). Moderation policy (F16).

## Requirements
- PS-031-07.R01: Data classes are assigned per CTR-PRV-001 (owner F10; class labels below are proposed and not yet approved). No field in this module is classed as location, contact, or government identifier.
- PS-031-07.R02: Abuse cases covered: spam plans, Sybil participants creating plans with themselves, plan graphs that reveal identity through booking and quote links, fabricated evidence digests, submission flooding, dispute abuse through repeated open-and-close, and enumeration of plan IDs.
- PS-031-07.R03: Budgets: abuse rate limits add at most 5 ms p95 to a write; retention job for expired idempotency rows runs hourly and completes within 10 minutes for 1 million rows.

## Data classes (proposed for CTR-PRV-001)
| Data | Class | Location | Retention | Disclosure |
|---|---|---|---|---|
| plan_id, item_id, revision numbers, state codes | commerce evidence (CE) | primary database, same region as parent booking | 3 years after terminal state (A-MILESTONES-10) | both parties; operators as redacted view |
| participant IDs (pseudonymous) | pseudonymous identifier (PI) | primary database | same as plan | both parties of that plan only; never in public or federated payload |
| title, description_text, note_text | user content (UC) | primary database | same as plan; deleted with plan only after legal-hold check | both parties; operators only under moderation grant |
| evidence_digest | integrity reference (IR) | primary database | same as plan | both parties |
| evidence_uri | user content (UC) | primary database | same as plan | both parties; never logged |
| content_json revisions | commerce evidence (CE) | primary database | same as plan | both parties |
| amounts and currency | commerce evidence (CE) | primary database | same as plan | both parties; no public aggregate |
| idempotency log | operational (OP) | primary database | 7 days | none |
| outbox payload | operational (OP) | primary database | published rows 30 days | internal consumers only |
| logs and metrics | operational (OP) | log store | 30 days logs; metrics 13 months aggregate | operators; fields per observability_performance.md |

No data class in this table is public. Public listing, search and federation never include milestone data (CTR-FED-001 is not in scope here).

## Privacy controls
- Data minimization: titles and descriptions are the only free-text user content; they are not required, but a title is always required. No photo, attachment or file name is accepted.
- Pseudonymity: the module never looks up legal names, emails, phones or addresses. A counterparty sees the other party's participant ID and display name supplied by F07 at read time, never stored here.
- Location: the module stores no location. Service location is in the parent booking under its own class (F10).
- Disclosure: plan reads require party membership; non-party gets `MILESTONES_PLAN_NOT_FOUND`. Export is party-only (see import_export_backup_rollback.md).
- Logs: no free text, no digest, no URI, no participant ID in clear (log `actor_hash` = HMAC-SHA-256 with per-environment key, truncated to 16 hex characters).
- Erasure: when F07 deletes an account, participant IDs in this module are replaced by a tombstone ID `tombstone:<ulid>`. Plan evidence stays for the retention period. Free-text user content authored by the deleted party is replaced by the string `[removed]` where legal hold does not apply. Digests and amounts stay.
- Legal hold: F10 may place a hold on a booking; holds suspend all deletion and expiry of rows for that booking (no change to state machine timers; deletion only).

## Retention and deletion jobs
- Plan retention ends 3 years after `completed_at` or `cancelled_at`. The job marks plan rows `deleted_at` and deletes child rows in one transaction, excluding holds. The job runs daily at 02:00 UTC and is idempotent.
- Idempotency log rows are deleted when `expires_at` < now, hourly.
- Outbox rows with `published_at` older than 30 days are deleted daily.
- Deletion is never applied to a plan in `agreed`, `active`, `proposed`, `draft` or any item in `disputed`.

## Abuse controls
| Control | Rule | Result on breach |
|---|---|---|
| Plan creation rate | 10 create commands per actor per hour; 3 non-terminal plans per actor as provider | MILESTONES_RATE_LIMITED (429); MILESTONES_ACTION_NOT_PERMITTED when cap of 3 reached |
| Write rate | 60 writes per actor per minute | MILESTONES_RATE_LIMITED |
| Submission flood | 5 submissions per item (hard limit) and 1 submission per item per 10 minutes | MILESTONES_SUBMISSION_LIMIT_REACHED or MILESTONES_RATE_LIMITED |
| Repeated dispute open | Each item can open a dispute once per dispute_ref; a closed dispute cannot be re-opened for the same item | MILESTONES_DISPUTE_REF_INVALID |
| Self-dealing (Sybil) | Provider and client must differ; plans where both parties share a device fingerprint from F16 signals are flagged for review (no automatic block) | flag event `milestones.plan.flagged` (internal, IDs only) |
| Plan enumeration | Non-party gets identical 404 for absent and forbidden plans; per-actor 404 rate above 30 per minute triggers rate limit | MILESTONES_RATE_LIMITED |
| Evidence fabrication | The module verifies digest format only, not that the file matches. Evidence is self-attested; the counterparty may reject or dispute | none at this layer; handled through reject and dispute |
| Blocked participant | F07 block denies all writes within 30 s (PS-031-05.R04) | MILESTONES_ACCOUNT_BLOCKED |

Graph deanonymization: booking_ref and quote_ref links let a participant observe that two IDs share a plan. This is accepted as residual risk; the module does not expose a cross-plan query to users, and operators see redacted views only.

## Assumptions and open decisions
- A-MILESTONES-10: Retention is 3 years after terminal state (D07 open; legal review required before launch).
- A-MILESTONES-13: All identities are pseudonymous F07 IDs; tombstone replacement is the only identity-related mutation.
- A-MILESTONES-11: Deliverable bytes are outside this module; evidence_uri is retained as user content and must follow the owning feature's retention when that is defined.
- Open: F10 must approve class labels and the 30-day log retention; F16 must confirm the flagging signal set for Sybil review.
