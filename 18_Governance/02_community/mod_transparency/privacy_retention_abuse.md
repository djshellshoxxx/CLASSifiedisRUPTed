# PS-148-07 — privacy retention abuse

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-148-07. **Owner:** [18_Governance/02_community/mod_transparency](SPEC.md). **Implementing module:** 18_Governance/02_community/mod_transparency. **Consumers:** F10 privacy (CTR-PRV-001 owner; erasure and export requests), F16 security (key epochs for subject tokens, rate-limit policy), F15 platform (gateway limits, scheduler), F13 notifications, F12 moderation; declared via [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Purpose and scope
Keep public transparency records useful without exposing participants. Define location, retention and disclosure classes, the pseudonymous subject token, retention periods, erasure interaction and abuse controls. Pseudonyms do not guarantee anonymity: network metadata, counterparties and legal process can still link activity, so this module minimizes linkable data rather than promising anonymity.

Exclusions: exact home addresses and geolocation precision (F10 owns; never stored here), account credentials (F07), payment evidence (CTR-COM-001, F09).

## Requirements
- PS-148-07.R01: Business outcome: the public can audit governance without learning who a participant is, where they live beyond a coarse region, or when exactly they were affected. Actors: public reader, subject participant, reviewer, privacy officer (F10), attacker models in R02.
- PS-148-07.R02: Cases: re-identification from small cells (category + region + date); participant targeted by coordinated false reports; reviewer collusion; scraping the public list; timing correlation between publication and participant activity; aggregate gaming before freeze; erasure request during an open review; legal hold on a withdrawn entry.
- PS-148-07.R03: Accessibility and localization: privacy notices shown to participants are localized through message keys; the module does not depend on colour or audio.
- PS-148-07.R04: Location and disclosure classes (A-TRANSPARENCY-03), mapped to CTR-PRV-001 (owner F10). Location class L0 is "no location" and is the default. Location class L1 is `region_code` from the F10 coarse list only. Precise location is never stored. Disclosure classes: PUBLIC_AGGREGATE (counts only, through snapshots), PUBLIC_REDACTED (redacted entry with category, outcome, policy version, summary, UTC day), PARTICIPANT_ONLY (subject explanation, authenticated), INTERNAL_ONLY (reviewers and auditors; default).
- PS-148-07.R05: Retention and tombstone rules (table below). Withdrawn entries keep identifiers and state, and clear all text and token fields.
- PS-148-07.R06: `subject_token` is `base64url(HMAC-SHA256(epoch_key, participant_id))`, truncated to 32 bytes and encoded to 43 characters. `epoch_key` rotates yearly and is held by F16; the module receives only the derived token (A-TRANSPARENCY-04). Tokens are not comparable across epochs, so one participant cannot be linked across years from public data.
- PS-148-07.R07: Abuse controls: write rate limit 60 commands per minute per actor; read limit 300 requests per minute per session; maximum 20 open REVIEW entries per author; any reviewer who approves more than 50 entries in 24 hours triggers an alert. Public list responses are capped at 100 items per page.
- PS-148-07.R08: Metadata minimization in public payloads: dates are UTC day only (A-TRANSPARENCY-13); timestamps with time of day are never public; suppressed aggregates use the rule in R09; `subject_token`, actor refs and internal IDs are never public.
- PS-148-07.R09: Small-cell suppression (A-TRANSPARENCY-02): any aggregate cell below `min_cell_size` (default 10) is suppressed. Totals are protected by complementary suppression so a suppressed cell cannot be recovered by subtraction.
- PS-148-07.R10: Legal hold: `legal_hold` blocks purge and hard deletion of the affected record and its audit trail; withdrawal is still permitted and is recorded.

## Disclosure and visibility by state
| State | Public read | Participant read | Reviewer read |
|---|---|---|---|
| PREPARING | no | no | author only |
| REVIEW | no | no | yes |
| PUBLISHED (PUBLIC_REDACTED) | yes, redacted fields | own explanation | yes |
| PUBLISHED (PUBLIC_AGGREGATE) | counts via report only | own explanation if any | yes |
| PUBLISHED (PARTICIPANT_ONLY) | no | own explanation | yes |
| SUPERSEDED | yes, marked superseded | own explanation | yes |
| WITHDRAWN | tombstone only | tombstone only | yes |

## Retention schedule (defaults, A-TRANSPARENCY-15)
| Record | Retention | End-of-life action |
|---|---|---|
| transparency_decision_entry in PREPARING | until last edit + 90 days, unless legal_hold | purge row and event `purged.v1` |
| transparency_decision_entry in REVIEW | until decision or 14 days | timeout to PREPARING |
| PUBLISHED or SUPERSEDED entry | 7 years after published_at | archive per PS-148-10 |
| WITHDRAWN entry (tombstone) | 2 years after withdrawal | clear text and token; keep entry_id, state and reason_code |
| participant_explanation | 2 years after published_at | set to null, flag `explanation_expired` |
| transparency_report and snapshot | 7 years after publication | archive per PS-148-10 |
| transparency_audit_entry | 3 years | delete after window; legal hold extends |
| transparency_idempotency_record | 72 hours | delete |
| transparency_redaction_profile | indefinite (versioned, no personal data) | none |

Retention values are defaults for review under D07 (OPEN). Changes apply to new records and to existing records at their next lifecycle check.

## Erasure interaction
- An erasure request from F10 for a participant sets `subject_token` to null on that participant's entries and clears `participant_explanation`. Public text already published is not changed unless it contains personal data, in which case the entry moves to WITHDRAWN through a reviewer.
- Erasure during REVIEW: the entry is returned to PREPARING with reason `SUBJECT_ERASURE` so the reviewer can rewrite the public summary without the participant identity.
- The module cannot identify a participant from `subject_token` alone, so it cannot satisfy a request by itself; F10 supplies the participant_id mapping at the time of the request.

## Abuse controls summary
- Spam entries: four-eyes approval and author cap (R07).
- Targeted false reports: appeal path in F12; module rejects entries whose source_ref has no matching source record (TRANSPARENCY_SOURCE_REF_INVALID).
- Reviewer collusion: separation of duties (PS-148-05.R07) and approval-rate alert (R07).
- Scraping: pagination caps and read rate limits (R07); no bulk export route for the public.
- Aggregate gaming: report freeze locks the snapshot and the content hash; entries cannot change after freeze.

## Open decisions
- A-TRANSPARENCY-02: Minimum cell size 10 with complementary suppression; pending F10 review.
- A-TRANSPARENCY-03: Disclosure classes are this module's mapping onto CTR-PRV-001; F10 has not yet published concrete classes.
- A-TRANSPARENCY-04: Subject-token key epochs are yearly and owned by F16.
- A-TRANSPARENCY-13: Public timestamps are UTC day precision.
- A-TRANSPARENCY-14: Rate limits (60 writes, 300 reads) are defaults pending F15 gateway policy.
- A-TRANSPARENCY-15: Retention periods above are defaults; D07 remains OPEN in [DECISIONS.md](../../../DECISIONS.md).
