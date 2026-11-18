# PS-040-07 — privacy retention abuse

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-040-07. **Owner:** [05_Rentals/01_rental_catalog/mod_deposits](SPEC.md). **Implementing module:** 05_Rentals/01_rental_catalog/mod_deposits. **Consumers:** privacy review (F10), moderation, observability, export and deletion workflows.

## Purpose and scope
Define what personal data deposits hold, where it lives, how long it lasts, who may see it, and which abuse controls apply. Pseudonyms do not guarantee anonymity against network metadata, counterparties or legal process. Classes come from CTR-PRV-001 (owner F10). Labels below are provisional until that contract is published (A-deposits-22).

## Requirements
- PS-040-07.R01: Business outcome: a deposit holds no names, addresses, contact details, device identifiers or payment account data. Only pseudonymous participant IDs and enumerated codes are stored. Exclusions: rental address and listing location (owned by 01_rental_catalog listing and F10 precision), chat content (F-messaging), and payment account data (F09).
- PS-040-07.R02: Case coverage: data subject export, deletion request during open deposit, counterparty requesting another party's history, moderator scope abuse, bulk enumeration of deposits, dispute spam, and forged evidence.
- PS-040-07.R03: Accessibility of privacy controls: export and deletion requests are reachable through the account settings flow and are described in plain language.
- PS-040-07.R04: Location class is none. Deposits never store coordinates, regions or addresses.
- PS-040-07.R05: Disclosure is limited to the two parties of the deposit, a scoped dispute moderator, and aggregate operator counts. Public summary disclosure is off unless the listing owner opts in (A-deposits-23).
- PS-040-07.R06: Forged or unverified evidence is labeled self_attested = true. It is never shown as verified unless a verification_source reference is present.
- PS-040-07.R07: Abuse controls apply before state change, and each limit returns a stable code (see the table below).

## Data classes
| Data | Class (provisional) | Location class | Disclosure class | Notes |
|---|---|---|---|---|
| depositor_participant_id, receiver_participant_id | pseudonymous identifier | LOC-NONE | DISC-PARTIES | resolved via F07 |
| amount_minor, currency_code, method_code | deposit terms | LOC-NONE | DISC-PARTIES; DISC-MODERATION (dispute only) | financial, not location |
| state, timestamps, revision | lifecycle | LOC-NONE | DISC-PARTIES | |
| evidence external_ref | opaque reference | LOC-NONE | DISC-PARTIES; DISC-MODERATION (dispute only) | never raw account data |
| reason codes | enumerated | LOC-NONE | DISC-PARTIES; DISC-MODERATION | no free text (A-deposits-06) |
| deposit_event rows | audit history | LOC-NONE | DISC-PARTIES; DISC-MODERATION (dispute only) | append-only |
| actor references in logs | keyed hash | LOC-NONE | DISC-OPERATOR-AGGREGATE | see observability_performance.md |

Disclosure class DISC-PUBLIC-SUMMARY (deposit_required flag and amount, opt-in by listing owner) is not used for any other field.

## Retention
| Record | Lifetime (provisional, D07) | After lifetime |
|---|---|---|
| Non-terminal deposit and children | while non-terminal | not applicable |
| settled, expired, cancelled deposit and children | 365 days after settled_at | pseudonymized: participant IDs replaced by per-record random tokens; event rows kept 2 years for abuse analytics; amounts kept for aggregate statistics |
| Disputed or dispute-linked records | until resolution + 365 days | same as above |
| Idempotency records | 72 hours | deleted |
| Outbox rows | until published + 7 days | deleted |
| Logs with actor references | 30 days | deleted |

Legal hold suspends deletion and pseudonymization for the held records. Retention class name: RET-DEP-STD (provisional).

## Data subject rights
- Export: a participant receives their deposits, term revisions, evidence and events in the format in import_export_backup_rollback.md.
- Deletion: a deletion request during a non-terminal deposit is deferred until the deposit reaches a terminal state. Afterward, the retention table applies.
- Pseudonymization happens by rewriting participant IDs. Records remain linkable to the deposit but not to the person.

## Abuse controls
| Control | Limit (A-deposits-24) | Code on breach |
|---|---|---|
| deposit.create per participant | 20 per day | DEPOSITS_RATE_LIMITED |
| propose and counter per rental_ref | 30 per hour | DEPOSITS_RATE_LIMITED |
| state commands per participant | 60 per hour | DEPOSITS_RATE_LIMITED |
| deposit.attach_evidence per deposit | 10 per day | DEPOSITS_RATE_LIMITED |
| open disputes per depositor | 3 in rolling 90 days | DEPOSITS_STATE_DISPUTE_ALREADY_OPEN or DEPOSITS_RATE_LIMITED |
| counter-proposals per deposit | 5 | DEPOSITS_STATE_COUNTER_LIMIT |
| list queries per participant | 120 per minute | DEPOSITS_RATE_LIMITED |

Repeated create-decline cycles between the same two participants raise an abuse signal to moderation after 5 declined deposits in 30 days. The signal is an aggregate counter, not a new record type.

## Threats and mitigations
- Enumeration of deposit IDs: IDs are unguessable ULIDs; non-party access returns NOT_FOUND.
- Metadata leakage through error text: messages carry no amounts or IDs.
- Forged evidence: labeled self-attested; no state transition is triggered by evidence alone.
- Replay of old commands: idempotency and revision checks.
- Blocked participant continuing to act: revocation check on every request.

## Assumptions and open decisions
- A-deposits-21: Retention defaults above. D07 remains OPEN in DECISIONS.md. The default is recorded here for review.
- A-deposits-22: Class labels (LOC-NONE, RET-DEP-STD, DISC-PARTIES, DISC-MODERATION, DISC-OPERATOR-AGGREGATE, DISC-PUBLIC-SUMMARY) are provisional until CTR-PRV-001 (F10) is final.
- A-deposits-23: Public summary is opt-in per listing and off by default.
- A-deposits-24: Rate limits above are first-pass values.
- Open: D09 (no custody) and D05 (geoprivacy) affect whether any location field is ever added. None is added in v1.

## Test cases
- TEST-PS-040-07-T01: Scan a deposit row and its events for names, emails, addresses or account patterns. Pass: no match. Fail: any match.
- TEST-PS-040-07-T02: Request deletion during agreed state. Pass: deletion deferred; record intact until terminal. Fail: deletion applied early.
- TEST-PS-040-07-T03: Send 21 deposit.create calls from one participant in one day. Pass: the 21st returns DEPOSITS_RATE_LIMITED. Fail: accepted.
