# PS-065-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 08_Communications/03_meetups/mod_handoff. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (PSEUDONYMOUS; RET-EVD, RET-EPH, RET-AUD, RET-LEGAL; no LOCATION_PRECISE), CTR-COM-001 (no payment claim fields here; FINANCIAL_EVIDENCE stays with F09), CTR-FED-001 (never federated in MVP).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-065-07.R01 | Handoff records hold no location, photos, notes or identity documents (schema lint, zero tolerance). | MVP |
| PS-065-07.R02 | Attestation lines retained under RET-EVD (24 months after final state; personal fields redacted at 12 months; signatures and digests kept). | MVP |
| PS-065-07.R03 | Attestations are signed statements of what a party says happened; the system does not claim proof of physical transfer. | MVP |
| PS-065-07.R04 | No payment, price or amount fields are stored; payment claims remain with F09 (`clm_`). | MVP |
| PS-065-07.R05 | Handoff data is never federated in MVP. | MVP |
| PS-065-07.R06 | Attestation displays state "self-attested by party X" and never "verified". | MVP |

## Data / schema
| Record | Class | Retention |
|---|---|---|
| attestation line (item, quantity, direction, time) | PSEUDONYMOUS | RET-EVD |
| signature | PSEUDONYMOUS | RET-EVD |
| dispute referral | PSEUDONYMOUS | RET-EVD |
| device queue | PSEUDONYMOUS (local) | RET-EPH |
| moderator read record | internal | RET-AUD |

## Commands / queries / events
Events carry IDs and states; no quantities (PS-065-04 R03).

## States & transitions
Retention starts at `closed` or F09 dispute outcome per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Free-text notes not accepted (PS-065-02 R07), which removes a contact-leak channel.

## Authorization
Party, F09 dispute scope, and moderator presence reads per PS-065-05.

## Failure, idempotency, concurrency, offline
Purge jobs idempotent; legal hold suspends purge for held records.

## Privacy, retention, abuse
- **False attestations:** the counter-attestation and dispute path exist; the system does not decide fault here (PS-065-03 R06).
- **Harassment via forced attestations:** attestations need the other party's counter-attestation to be confirmed; no unilateral "confirmed" state.
- **Location leakage:** no location fields; meetup reference only (PS-064).
- **Reputation abuse:** no reputation input from this module except via F12 review or F09 final outcome (mod_reputation rules).
- **Limit:** a signed line can still be false; the system records claims, not facts.

## Observability & budgets
Aggregate counts by state and dispute rate; no per-handoff values.

## Tests
- TEST-PS-065-07-01 (privacy): no location, note or amount fields stored or returned to non-parties.
- TEST-PS-065-07-02 (retention): redaction at 12 months; deletion at 24 months.
- TEST-PS-065-07-03 (abuse): unilateral attestation never reaches `confirmed_mutual`.
- TEST-PS-065-07-04 (copy): UI shows "self-attested" wording (F14 review).

## Acceptance criteria
1. Zero location or note fields in records (lint).
2. RET-EVD timers verified.
3. No verified-state wording anywhere.
4. Unilateral attestation cannot confirm.

## Assumptions & open decisions
- ASSUMPTION: RET-EVD 24 months (jurisdiction review OPEN, R07).
- PROVISIONAL (D06 default, unapproved): signed statements only.
- PROVISIONAL (D07 default, unapproved): minimal retention with legal-hold exceptions.
