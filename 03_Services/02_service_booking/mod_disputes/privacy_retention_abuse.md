# PS-030-07 — privacy retention abuse

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-030-07. **Owner:** [03_Services/02_service_booking/mod_disputes](SPEC.md). **Implementing module:** 03_Services/02_service_booking/mod_disputes. **Consumers:** F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); event subscribers in [commands_queries_events.md](commands_queries_events.md).

## Purpose and scope
Defines data classification, storage location, retention, disclosure, deletion and abuse controls for dispute records. Disputes contain personal and sensitive text and evidence. The module stores no exact home address, no precise coordinates and no contact details as structured fields. Pseudonyms are user-selected and do not guarantee anonymity against network metadata, counterparties or legal process.

Exclusions: classification authority and location policy (F10, CTR-PRV-001); identity credentials and block storage (F07); legal-hold issuance (F10 governance); moderation policy beyond the hooks defined here.

## Requirements
- **PS-030-07.R01**: Business outcome: each dispute field is classified, stored only where its class allows, disclosed only to the role its class allows, and removed on schedule. Actors: parties, moderators, system purge job. Exclusions as above.
- **PS-030-07.R02**: Cases covered: account deletion of a party, request for export, evidence containing location metadata, statement containing contact details, duplicate-claim flooding, retaliatory claims, reviewer leaking notes, legal hold during purge, purge job failure.
- **PS-030-07.R03**: Abuse controls operate within the rate budgets in section "Abuse controls"; false-positive rate for automated flags is tracked, target at most 5% of flags overturned on review.
- **PS-030-07.R04**: Evidence binaries are stored encrypted at rest in restricted object storage, separate from relational data, with keys managed by the platform key service (A-disputes-18). Access is by short-lived signed reference only.
- **PS-030-07.R05**: Export and deletion never break the other party's record integrity: deletion replaces the party's reference with a tombstone token and keeps outcome and timestamps.
- **PS-030-07.R06**: No dispute content is sent to third-party analytics or model services in v1. Any future use requires a new decision record.

## Data classification
Classes reference CTR-PRV-001 (F10, OPEN). Labels used here are provisional (A-disputes-09).

| Data | Class | Stored where | Disclosure | Retention (A-disputes-08) |
|---|---|---|---|---|
| Claim, response, rebuttal text | personal, counterparty-visible | relational, relay region | both parties; moderators | 180 days after terminal state, then purged to tombstone |
| Settlement note, decision text | personal, counterparty-visible | relational | both parties; moderators | 180 days after terminal state |
| Reviewer note | restricted internal | relational | moderators holding `disputes.review.note` only | 90 days after terminal state |
| Evidence text and links | personal, counterparty-visible | relational | both parties; moderators | 180 days after terminal state |
| Evidence binaries | personal, sensitive | restricted object storage, encrypted | both parties; moderators; quarantined: moderators only | 180 days after terminal state |
| Pending upload tickets | technical | object storage | uploader only | 24 hours |
| Dispute header, transitions, resolutions | structural | relational | parties; moderators; aggregate analytics without text | 36 months after terminal state |
| Idempotency records | technical | relational | none (internal) | 72 hours |
| Event envelopes (metadata only) | structural | outbox, observability | subscribers per [commands_queries_events.md](commands_queries_events.md) | 36 months |
| Participant references | pseudonymous | relational | as above | Tombstoned on account deletion |

Location: no field stores a street address or precise coordinates. Booking location, when needed for a dispute, is referenced as the coarse discovery region already held by the parent booking (CTR-PRV-001). Evidence images have EXIF and GPS metadata stripped before `available`; a failed strip makes the item `quarantined`.

## Retention and deletion
- Scheduled purge runs daily. It selects rows past their retention date and skips any dispute under legal hold (`legal_hold` flag set by F10 governance; flag is an external input and is not defined here).
- Content purge replaces statement and evidence bodies with empty values, sets `purged_at`, and deletes binaries. Header, transitions and resolutions remain until the 36-month purge.
- Account deletion of a party: the party's `pid_` in dispute rows is replaced with `tombstone_<hash>`; statements authored by the party keep their text for the current retention period only if the other party has a live claim, otherwise text is purged at once. Outcomes and timestamps remain.
- Deletion requests during an active dispute are queued until the dispute reaches a terminal state, except where law requires immediate action (legal path owned by F10).
- Purge job failure: rows stay due; alert after 24 hours overdue. Purge is idempotent by row ID.

## Disclosure rules
- Parties see their dispute, both parties' counterparty-visible statements, counterparty-visible evidence, the transition timeline with actor role (not actor ref), and the decision and reason code.
- Moderators see all counterparty-visible data plus reviewer notes. Access is logged with reviewer `pid_` and the dispute ID.
- Non-parties see nothing (`DISPUTES_NOT_FOUND`).
- Notifications carry no text bodies; they carry the event name and dispute ID only.
- Exports follow [import_export_backup_rollback.md](import_export_backup_rollback.md) and include only data the requesting party may already see.

## Abuse controls
| Control | Default | Response |
|---|---|---|
| New disputes per claimant | 5 per rolling 30 days | `DISPUTES_RATE_LIMITED` |
| Active disputes per claimant | 3 | `DISPUTES_ACTIVE_DISPUTE_EXISTS` for the same booking; `DISPUTES_RATE_LIMITED` above 3 |
| Intake rejections per claimant | 3 within 90 days | Opening suspended 30 days (`DISPUTES_OPEN_SUSPENDED`) pending moderator review |
| Command rate per token | 30 per minute | `DISPUTES_RATE_LIMITED` with `Retry-After` |
| Evidence uploads per party | 10 items per dispute, 20 uploads per hour | `DISPUTES_EVIDENCE_LIMIT_EXCEEDED` or rate limit |
| Repeated identical statements | same body hash 3 times in one dispute | Flag `flag_repetition`; hold for moderation |
| Contact details in text | regex for email, phone, postal patterns | Flag `flag_contact_detail`; content visible to moderators first |
| Retaliatory claim after decision | same booking or milestone after `closed` | `DISPUTES_ALREADY_RESOLVED` |
| Blocked counterparty | block record from F07 | `DISPUTES_BLOCKED_COUNTERPARTY` (A-disputes-10) |

Detection heuristics are signals, not guarantees. They are tested for false positives in [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md).

## Threat list
- Unauthorized read of another party's dispute: enforced by party membership check and `DISPUTES_NOT_FOUND` for non-parties.
- Metadata leakage through timestamps and reason codes: timeline shows actor role only; event payloads exclude free text.
- Forged evidence: hash check, server-side MIME detection, metadata strip. Evidence is an assertion; the platform does not verify its truth.
- Replay of commands: idempotency keys and revision checks.
- Harassment through statements: contact-detail flag, repetition flag, moderator review, block semantics.
- Sybil claimants: rate limits and suspension thresholds limit benefit; account creation controls belong to F07.
- Stale federated records: not applicable in v1 (A-disputes-15).

## Open decisions
- A-disputes-08: Retention windows above are defaults pending D07 (retention, OPEN) and F10 policy.
- A-disputes-09: Class labels are provisional until CTR-PRV-001 is published.
- A-disputes-12: Abuse thresholds are defaults; calibration after pilot data.
- A-disputes-18: Encryption at rest uses the platform key service; not yet verified by an external review and not claimed as audited.
- D07 (retention) is OPEN.
