# PS-146-07 — privacy retention abuse

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-146-07. **Owner:** [18_Governance/01_policy/mod_prohibited](SPEC.md). **Implementing module:** 18_Governance/01_policy/mod_prohibited. **Consumers:** publish, offer, proposal and cycle-inclusion owners in [01_LocalBazaar](../../../01_LocalBazaar), [02_LocalMutiny](../../../02_LocalMutiny), [03_Services](../../../03_Services), [04_Auctions](../../../04_Auctions) and [05_Rentals](../../../05_Rentals); [10_Privacy](../../../10_Privacy); [12_Moderation](../../../12_Moderation). Dependency rows: [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Purpose and scope
- PS-146-07.R01: Business outcome. The module stores the minimum evidence needed to explain and audit a decision, keeps subject text out of its storage, keeps reviewer commentary restricted, and resists use of its own rules as an oracle for prohibited wording.
- Exclusions: user account deletion itself (owned by F10); location precision (F10, D05); message content (F08). This module receives only coarse jurisdiction codes.
- Privacy statement: the platform cannot promise anonymity against network metadata, counterparties or legal process. Subject ids are opaque ULIDs, not names or contact details.

## Data classes and locations (CTR-PRV-001 provisional, A-prohibited-04)
| Data | Class | Location | Notes |
|---|---|---|---|
| Rule catalogue (codes, categories, public_title_key) | PUBLIC_POLICY | primary store, replicated to read cache | Published as public summary. |
| Rule match_terms, structured_flag values | PSEUDONYMOUS_OPERATIONAL | primary store, access by capability only | Never exposed to participants or logs. |
| Decision (ids, outcome, rule_codes, digest) | PSEUDONYMOUS_OPERATIONAL | primary store, same region as owner subject | No subject text. |
| Subject snapshot (title, description, flags) | not persisted | request memory only | Discarded after digest computed; never written to logs, queues or caches. |
| Input digest | PSEUDONYMOUS_OPERATIONAL | primary store | HMAC-SHA-256 with key `hmac_key_id`; keys in platform KMS; rotated every 90 days with a new key id. Old digests stay verifiable until key retirement. |
| Reviewer note | RESTRICTED_REVIEW | primary store, reviewer and auditor access | Free text max 1000 chars; reviewers must not copy subject text into notes (policy and UI hint; not enforceable by the server). |
| Jurisdiction hint | PSEUDONYMOUS_OPERATIONAL | primary store | ISO country code only (D05). |
| Audit entries | PSEUDONYMOUS_OPERATIONAL | append-only store | Actor ids are pseudonymous. |

## Retention (D07 OPEN; defaults A-prohibited-09)
| Record | Default retention | Trigger | Legal hold |
|---|---|---|---|
| PolicyVersion (ACTIVE, RETIRED) | indefinite | none | not personal data; kept as governance evidence |
| PolicyVersion (DISCARDED) | 12 months | discard time | honored |
| PolicyDecision | 24 months | subject terminal state (owner-reported) | honored; suspends deletion |
| PolicyHold | 24 months | resolved_at or withdrawn | honored |
| Reviewer note | 12 months | resolved_at | honored |
| Idempotency record | 7 days | created_at | not applicable |
| Snapshot | not stored | n/a | n/a |
| Audit entries | 36 months | occurred_at | honored |

- PS-146-07.R02: Retention jobs run daily, delete or tombstone in batches of 1000 and log counts only.
- PS-146-07.R03: On account deletion requested through F10, decisions are not deleted (evidence). `subject_id` on decisions and holds owned by that account is replaced with a tombstone token `tomb_` plus 22 random characters. `rule_codes`, outcome and dates remain.
- PS-146-07.R04: Legal-hold flag on a subject suspends retention for its decisions, holds and notes until released by an auditor.
- PS-146-07.R05: Export (data subject access) includes the participant's own decisions with rule_codes and public_title_keys only. Reviewer notes and internal terms are excluded.

## Abuse controls
- PS-146-07.R06: Rate limit per caller_service_id: 200 evaluate requests per second sustained, burst 400. Per participant (through owner service): 30 evaluations per minute for PUBLISH and REVISE checkpoints.
- PS-146-07.R07: Probing defence: participants receive only rule_codes and public_title_keys. Repeated HOLD or BLOCK outcomes from one actor within 24 h, 20 or more, emit an operator alert and an audit entry; they do not reveal rule terms.
- PS-146-07.R08: Request size: snapshot max 16 KiB; description max 4000 characters after normalization; rejects control and zero-width characters (validation_rules.md R08).
- PS-146-07.R09: Matching is linear in input length (Aho-Corasick); regex is not accepted in rules. This prevents ReDoS and term-flood attacks.
- PS-146-07.R10: Reviewer abuse: reviewers may not resolve holds on subjects they own or created policy for (PS-146-05.R03). Each resolve writes an audit entry. Mass resolution (more than 100 per hour per reviewer) raises an alert.
- PS-146-07.R11: Policy author abuse: approver independence (PS-146-05.R02); activation logs diff hash; a version with more than 25 percent of rules changed raises a review alert.
- PS-146-07.R12: Replay and forgery: service requests are authenticated; idempotency and subject_revision guards prevent replay from changing outcomes; decisions are server-signed by platform key only if F16 requires it (A-prohibited-03 scope).
- PS-146-07.R13: Fraud-by-timing: an owner cannot request ALLOW by sending an older revision; stale revisions are rejected (PROHIBITED_SUBJECT_REVISION_STALE).

## Logging and disclosure
- Logs never contain title, description, match_terms, reviewer_note, raw user identifiers or precise location. Logs carry hashed subject references (see observability_performance.md).
- Error details never echo submitted text.
- Public summary excludes internal terms (R07 in authorization_capabilities.md).

## Open decisions
- A-prohibited-04 (privacy class names pending CTR-PRV-001), A-prohibited-09 (24-month decision retention, pending D07), A-prohibited-14 (coarse jurisdiction, D05).
- HMAC key rotation period of 90 days is a proposed default; no entry in DECISIONS.md.
- Whether decisions must be server-signed (D06 receipt policy is OPEN) is not decided here.
