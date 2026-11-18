# PS-057-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/03_trust/mod_evidence. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (PSEUDONYMOUS, PRIVATE_PERSONAL, FINANCIAL_EVIDENCE for payment references; RET-EVD, RET-PRIV, RET-LEGAL), CTR-COM-001 (evidence digests, no attachment content), CTR-FED-001 (evidence of equivocation kept as RET-EVD; no federation of trust evidence in MVP).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-057-07.R01 | Evidence stores digests and short text only; no identity documents, bank data, or photos (zero tolerance, schema lint). | MVP |
| PS-057-07.R02 | Trust evidence never links to payment or claim content beyond the `clm_` or `trx_` reference ID (CTR-COM-001 R08 digests stay in F09). | MVP |
| PS-057-07.R03 | Retention RET-EVD: 24 months after final state; personal fields (`content`) redacted at 12 months; digests and signatures kept. | MVP |
| PS-057-07.R04 | Withdrawn records keep digest for 24 months and content is removed at withdrawal. | MVP |
| PS-057-07.R05 | Evidence is not federated in MVP. | MVP |
| PS-057-07.R06 | Users can see every evidence record about their pseudonym and its issuer type. | MVP |

## Data / schema
| Record part | Class | Retention |
|---|---|---|
| `content` | PRIVATE_PERSONAL | redacted at 12 months; removed at withdrawal |
| `content_digest`, `signature`, metadata | PSEUDONYMOUS | RET-EVD (24 months after final state) |
| quarantine record | internal | RET-EVD |
| pending queue | PRIVATE_PERSONAL (local) | RET-EPH |

## Commands / queries / events
Events carry no content or digests (PS-057-04 R04).

## States & transitions
Retention clocks start at final state per [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Free-text contact patterns rejected; logs record code only.

## Authorization
Content visible to subject and issuer only; moderators via case grant metadata only.

## Failure, idempotency, concurrency, offline
Purge jobs idempotent; legal hold (RET-LEGAL) suspends purge for held records. Device cache cleared at logout.

## Privacy, retention, abuse
- **Sybil and collusion:** issuers who repeatedly sign for the same subject are down-weighted in scoring (mod_reputation owns weights); this module flags patterns, it does not decide.
- **Fabricated evidence:** signature and key registry checks; equivocation quarantine (PS-057-03 R05). Self-attested evidence is labelled as such in every view.
- **Evidence as doxxing vector:** issuer refs are pseudonymous; counterparty identity beyond `prf_` is never stored.
- **Limitation:** signatures evidence an assertion; they do not prove the underlying event happened (CTR-COM-001 R14).

## Observability & budgets
Counts of records by kind and state; quarantine backlog; no content.

## Tests
- TEST-PS-057-07-01 (privacy scan): no document-like or contact fixtures stored or returned outside subject/issuer.
- TEST-PS-057-07-02 (retention): redaction at 12 months; deletion at 24 months.
- TEST-PS-057-07-03 (withdrawal): content removed on withdrawal; digest retained.
- TEST-PS-057-07-04 (abuse): repeated issuer pattern flagged, not auto-decided.

## Acceptance criteria
1. Zero document or contact content in stored records (lint and fixture scan).
2. Retention timers verified.
3. Self-attested labelling visible in every view.
4. No federation path for trust evidence.

## Assumptions & open decisions
- ASSUMPTION: RET-EVD 24 months with redaction at 12 months (jurisdiction review OPEN, R07).
- PROVISIONAL (D06 default, unapproved): signed statements only.
- PROVISIONAL (D07 default, unapproved): minimal per-category retention with legal-hold exceptions.
