# PS-043-07 — privacy retention abuse

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-043-07. **Owner:** [05_Rentals/02_rental_lifecycle/mod_return](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_return. **Consumers:** F10 privacy service, moderation intake, F07 trust signals, operators.

## Purpose and scope
Classifies every field of the return record for location, retention and disclosure per CTR-PRV-001 (owner F10), sets retention and deletion behavior, and defines abuse controls for return declarations and disputes. Pseudonyms are not anonymity: this module does not protect against network metadata, counterparties or legal process.

**Exclusions:** exact home addresses and coordinates (never stored here; owned by mod_handoff and F10 geoprivacy, D05); damage evidence (mod_damage); deposit data (mod_deposits); identity proofing (F07).

## Requirements
- PS-043-07.R01: Business outcome: a participant can see and export their own return history; counterparty free text is never disclosed outside the rental and a moderation case; retention ends without leaving personal data in operational stores. Actors and exclusions as above.
- PS-043-07.R02: Case coverage: block after declaration, deletion request during an active return, legal hold, export by one party while the other has notes, rate-limited spam, fake return declarations, owner dispute spam, collusion between two participants, replayed commands.
- PS-043-07.R03: Accessibility: privacy notices and export status are plain text with `message_key`; deletion and export confirmations do not depend on colour.
- PS-043-07.R04: No renter_note or owner_note value appears in events, logs, metrics, error details or exports to a non-party.
- PS-043-07.R05: Abuse controls produce signals and holds for review; they never move money, release deposits or change a terminal state by themselves.

## Table 1 — data classes (provisional labels, A-return-23)
| Field | Class label | Location class | Disclosure class | Notes |
|---|---|---|---|---|
| return_id, rental_id | RET-ID | none | parties, moderator (case), F10 export | pseudonymous operational identifiers |
| renter_participant_id, owner_participant_id | RET-PSEUDO | none | parties, moderator (case), F10 export | F07 pseudonym; never a legal name |
| initiated_at, declared_at, returned_at, due_at, handoff_at, terminal_at, owner_responded_at, dispute_opened_at | RET-TIME | none | parties, moderator (case) | timestamps can reveal schedules; treated as sensitive metadata |
| state, timing, lateness_minutes, condition_declared, dispute_reason_code, revision | RET-STATE | none | parties, moderator (case) | enumerations and counters |
| renter_note, owner_note | RET-NOTE | none | author, counterparty, moderator (case) | free text; not in events, logs or non-party exports |
| return_point_ref | RET-LOCREF | reference only | parties | opaque reference; coordinates and addresses live in mod_handoff under F10 precision rules |
| resolution_ref, legal_hold_ref | RET-CASE | none | moderator, F10 | case and hold references |

No field is in a raw-location class. No field stores a legal name, email address, phone number, postal address, device identifier or IP address.

## Table 2 — retention
| Data | Retention | Trigger | Action at expiry |
|---|---|---|---|
| rental_return rows (non-note fields) | 24 months | terminal_at | delete row and its transitions and outbox rows (A-return-24) |
| renter_note, owner_note | 90 days | terminal_at | set to null (A-return-24) |
| rental_return_transition | 24 months | terminal_at | delete with parent row |
| rental_return_idempotency | 7 days | created_at | delete (PS-043-06) |
| rental_return_outbox | 14 days after publish | published_at | delete (PS-043-06) |
| Logs | 30 days | log timestamp | delete (PS-043-08) |
| Any row with legal_hold_ref | until hold released | hold set | retention jobs skip the row |

Retention jobs run daily, in batches of 500 rows, and log only counts.

## Deletion and anonymization
- A deletion request is forwarded from F10. For each return where the participant is a party:
  - If the return is terminal: notes are nulled and the participant_id is replaced by a per-request tombstone ULID (`deleted-<ULID>` mapping is held only by F10 and destroyed on completion). Transition rows keep state facts. Completion within 30 days.
  - If the return is active: deletion is recorded but not executed until the return reaches a terminal state or 30 days pass, whichever is first. Deletion never closes or cancels an active return.
- Legal hold blocks anonymization and deletion; F10 records the hold reference.

## Export
- A party can export their own returns via `rental.return.export_own` (PS-043-10 format).
- Export includes their own notes and timestamps. Counterparty notes are replaced by the literal `[redacted-counterparty]`.
- Export is produced asynchronously; the requester receives a link valid for 24 hours.

## Abuse controls
| Control | Limit or rule | Response |
|---|---|---|
| InitiateReturn per rental | 3 per rental per 24 h | RETURN_RATE_LIMITED with Retry-After |
| InitiateReturn per renter | 20 per 24 h | RETURN_RATE_LIMITED |
| Mutating commands per actor | 30 per minute | RETURN_RATE_LIMITED |
| Reads per actor | 120 per minute | RETURN_RATE_LIMITED |
| Disputes per owner | 3 open disputes per 30 days triggers a moderation review flag; further disputes are still accepted | signal to moderation intake |
| Abandoned returns per renter | 3 abandoned in 90 days triggers a trust signal to F07 | signal only, no block |
| Declared-then-disputed pairs | repeated disputes between the same pair | signal to moderation intake |
| Collusion | 5 or more confirmed returns between the same pair within 30 days | trust signal to F07 with pair counts; no automatic penalty |
| Back-dated returned_at | outside the accepted window | RETURN_RETURNED_AT_OUT_OF_RANGE |
| Note content | NFC, length, forbidden characters, no link rendering, escaped output | RETURN_NOTE_* codes |
| Replay | idempotency and revision checks; session bound to participant | PS-043-06 rules |
| Enumeration | ULID identifiers; identical non-party responses | PS-043-05 |

Rate-limit values are A-return-25.

## Threats and residual risk
- Forged evidence: the return declaration is self-attested. Every return view carries `attestation: self_attested` for renter fields and `attestation: owner_attested` for owner fields. The platform never states that an item was physically handed back.
- Metadata leakage: timestamps and state changes reveal rental activity to the counterparty and to anyone with access to the database. This is accepted residual risk.
- Sybil and graph inference: pseudonymous accounts can create repeated pairs; signals in the abuse table are the only mitigation in this module.
- Insider access: moderator read-all access is logged (PS-043-05).
- No security audit has been performed on this design.

## Open decisions
- A-return-23: Privacy class labels above are provisional until CTR-PRV-001 is published by F10.
- A-return-24: Notes are kept for 90 days after terminal; rows and transitions for 24 months; both are subject to legal hold.
- A-return-25: Rate limits in the abuse table are MVP defaults and are configurable under the rental_return namespace.
