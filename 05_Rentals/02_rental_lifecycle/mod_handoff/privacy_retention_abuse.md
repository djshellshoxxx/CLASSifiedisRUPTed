# PS-042-07 — privacy retention abuse

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-042-07. **Owner:** [05_Rentals/02_rental_lifecycle/mod_handoff](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_handoff. **Consumers:** provisional, per [dependency matrix](../../../DEPENDENCY_MATRIX.md) and sibling [mod_return](../mod_return/SPEC.md); subscriber map confirmed in Prompt 3.

## Purpose and scope
Defines data classes, storage location, disclosure, retention, deletion and abuse controls for handoff records. Location, retention and disclosure classes follow CTR-PRV-001 (owner F10, OPEN). The class labels P0 to P3 below are provisional and map to CTR-PRV-001 when it is approved ([A-handoff-11](#assumptions-and-open-decisions)). Exact home addresses are never stored in this module.

## Requirements
- PS-042-07.R01 — Business outcome: handoff data exposes the least detail needed. The exact meeting place is free text visible only to the two parties. Public, discovery and federation surfaces receive no handoff data in v1.
- PS-042-07.R02 — Cases covered: non-party probing; a party scraping counterparty notes; contact details smuggled into notes; repeated create and cancel to block a counterparty; repeated reschedule to stall; account deletion while a handoff is active; legal hold on a disputed handoff; backup containing purged data.
- PS-042-07.R03 — Pseudonymity: all participant references are pseudonymous IDs. The system does not promise anonymity against network metadata, counterparties or legal process ([PROJECT_SPEC](../../../PROJECT_SPEC.md)).
- PS-042-07.R04 — Disclosure: no handoff field is placed in search, discovery, federated envelopes ([CTR-FED-001](../../../planning/CONTRACTS.md), not applicable in v1), analytics or third-party SDKs.
- PS-042-07.R05 — Retention and deletion follow the table below. Legal hold overrides deletion and is recorded with a reason code.

## Data classes and location
| Data | Class | Location | Visible to |
|---|---|---|---|
| IDs, state, window, revision, timestamps, reason codes | P0 | relay primary store, region of relay deployment | parties, moderator, system |
| `region_code` (coarse) | P1 | relay primary store | parties, moderator |
| `meeting_note`, `condition_note`, `dispute_reason_code` | P2 | relay primary store, encrypted at rest | parties; moderator during dispute |
| `evidence_refs`, `signature` | P2 | relay primary store (refs only; media lives in the evidence store) | parties; moderator during dispute |
| `deposit_ref` | P2 | relay primary store | parties only |
| Client cache of own handoffs | P2 | device storage, cleared on sign-out, max 30 days | the owning participant |

Client cache must not hold other parties' notes after the handoff is terminal and purged server-side.

## Retention
| Record | Period | Start of clock | Action at end |
|---|---|---|---|
| Handoff, attestations, transitions (terminal) | 24 months ([A-handoff-12](#assumptions-and-open-decisions)) | `completed_at`, `cancelled` or `expired` timestamp | purge row set, keep aggregate counters |
| `meeting_note` | 30 days | terminal timestamp | set to null |
| `condition_note` | 24 months | terminal timestamp | set to null, keep `condition_code` |
| Active handoff (non-terminal) | until terminal, plus 24 months | terminal timestamp | as above |
| Disputed handoff | until resolved, plus 24 months | resolution timestamp | as above |
| Idempotency receipts | 7 days ([A-handoff-09](failure_recovery_idempotency.md)) | write timestamp | delete |
| Dead-letter events (IDs only) | 30 days | parking timestamp | delete |
| Abuse counters | 90 days rolling | event timestamp | delete |

Retention periods are defaults for D07, which is OPEN, and are subject to legal hold.

## Deletion and account closure
- Account deletion request: `participant_id` in terminal handoffs is replaced by the tombstone `deleted-participant`. The counterparty keeps the record, condition and timestamps so the handoff remains evidence for their side.
- Account deletion while a handoff is active: the handoff is held in its current state. The system does not auto-complete or auto-cancel it. Expiry proceeds normally, and the deleted party's side is marked unavailable.
- Legal hold: records under hold are excluded from purge and from deletion rewrites, and the hold reason code is stored with the hold ID.
- Deleted or purged records are removed from backups on expiry of the backup window ([import_export_backup_rollback.md](import_export_backup_rollback.md)).

## Abuse controls
- **Assumption A-handoff-13:** Rate limits per participant (rolling windows): `handoff.create` 20 per hour, reduced to 2 per day after 5 cancellations in 7 days; `handoff.propose_reschedule` 6 per day; `handoff.confirm` 30 per hour; `handoff.cancel` 10 per day; `handoff.dispute` 5 per day. Exceeding a limit returns `HANDOFF_RATE_LIMITED` with `Retry-After`.
- Per-agreement limits: maximum 3 reschedule proposals (`HANDOFF_RESCHEDULE_LIMIT_REACHED`) and one active handoff (`HANDOFF_DUPLICATE_ACTIVE`).
- Content filter for `meeting_note` and `condition_note` (rule VR-14): reject URLs, email-shaped strings, phone-shaped digit runs of 7 or more, and messaging handles. Regex set is versioned and tested with fixtures. Filter false positives are reported with `HANDOFF_NOTE_UNSAFE_CONTENT` and never leak the matched text.
- Block list from F07 is checked on every command.
- Griefing signal: 5 or more cancellations by one participant in 7 days, or 3 or more expired handoffs where the same participant had confirmed, raises a moderation signal. The signal changes limits (above) but never changes handoff state.
- Forged evidence: `evidence_refs` must belong to the actor and be linked to this handoff. Hash mismatch returns `HANDOFF_EVIDENCE_REF_INVALID`.
- Replay: revision checks and receipts prevent stale replays from changing state.

## Assumptions and open decisions
- **Assumption A-handoff-11:** Provisional disclosure classes P0 (identifiers and state), P1 (coarse region), P2 (participant-private free text and refs), P3 (moderation-restricted). Mapping to CTR-PRV-001 is pending.
- **Assumption A-handoff-12:** Terminal records retained 24 months; `meeting_note` purged 30 days after terminal; `condition_note` nulled at 24 months.
- **Assumption A-handoff-13:** Rate limits and cancellation threshold as listed above.
- Open decisions in this file: D05 (geoprivacy; region only, precision never stored here), D07 (retention, OPEN), CTR-PRV-001 (classes, OPEN).
