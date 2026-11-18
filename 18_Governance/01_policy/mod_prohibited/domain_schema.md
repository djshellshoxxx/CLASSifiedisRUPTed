# PS-146-01 — domain schema

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-146-01. **Owner:** [18_Governance/01_policy/mod_prohibited](SPEC.md). **Implementing module:** 18_Governance/01_policy/mod_prohibited. **Consumers:** publish, offer, proposal and cycle-inclusion owners in [01_LocalBazaar](../../../01_LocalBazaar), [02_LocalMutiny](../../../02_LocalMutiny), [03_Services](../../../03_Services), [04_Auctions](../../../04_Auctions) and [05_Rentals](../../../05_Rentals); [12_Moderation](../../../12_Moderation); [13_Notifications](../../../13_Notifications). Dependency rows: [dependency matrix](../../../DEPENDENCY_MATRIX.md) (F18.S01.M02 depends on F07, F10, F15, F16).

## Purpose and scope
- PS-146-01.R01: Business outcome. The platform keeps one versioned catalogue of prohibited item, service and conduct classes. Each publish, offer, proposal or cycle-inclusion checkpoint is evaluated against the single ACTIVE catalogue version and returns `ALLOW`, `HOLD` or `BLOCK` with matched rule codes. Each result is stored as append-only evidence so the participant gets an actionable explanation and operators can audit it.
- Actors: policy author (drafts), approver (activates), owner services (request evaluation), reviewer (resolves holds), participant (reads own decision), auditor (reads evidence).
- Exclusions:
  - No legal determination of illegality in any jurisdiction. The catalogue expresses platform policy; jurisdiction is an input filter only.
  - No ownership of listing, offer, proposal or cycle lifecycle. Owners apply outcomes; this module never mutates their state.
  - No moderation case handling, sanctions or appeal adjudication. Those belong to [12_Moderation](../../../12_Moderation) (A-prohibited-16).
  - No goods taxonomy. Category codes are owned by mod_goods (PS-144).
  - No image or ML classification, external sanctions screening or payment screening in MVP (A-prohibited-15).
  - No persistence of subject text. Only a keyed digest of the snapshot is stored.

## Entities and ownership
This module owns five records. Other features reference them by ID and never write them.

### PolicyVersion
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| policy_version_id | string(26), ULID | no | primary key (A-prohibited-01) | generated | 01JDQ7M3V8K2Z5N0R4T6W9X1A2 |
| version_number | integer | no | unique, 1..2147483647, assigned at create, never reused | next value | 3 |
| status | enum | no | EDITING, ACTIVE, RETIRED, DISCARDED | EDITING | ACTIVE |
| effective_from | timestamptz UTC | yes | required when ACTIVE; not earlier than activated_at | null | 2026-11-12T00:00:00.000Z |
| created_by_actor_id | string(26) | no | must hold prohibited.policy.draft.create | none | 01JDQ7P0ACT0R3F8H2K5M9N1B4C |
| approved_by_actor_id | string(26) | yes | required when ACTIVE; must differ from created_by_actor_id (A-prohibited-11) | null | 01JDQ7Q2APPR0VER5T8W1Y4Z7B |
| rule_count | integer | no | 0..2000 | 0 | 42 |
| content_sha256 | string(64), lowercase hex | yes | set at activation from canonical rule JSON; immutable once ACTIVE | null | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| row_version | integer | no | >= 1, optimistic lock | 1 | 4 |
| created_at, updated_at | timestamptz UTC | no | millisecond precision (A-prohibited-02) | now | 2026-11-10T09:14:02.118Z |
| activated_at, retired_at | timestamptz UTC | yes | set once by their transition | null | null |

Invariant: at most one row has status ACTIVE (partial unique index on status = 'ACTIVE').

### ProhibitionRule
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| rule_id | string(26), ULID | no | primary key | generated | 01JDQ7R5RULE0A1B2C3D4E5F6G |
| policy_version_id | string(26) | no | FK to PolicyVersion; rules immutable once version is ACTIVE | none | 01JDQ7M3V8K2Z5N0R4T6W9X1A2 |
| rule_code | string(10..20) | no | pattern `^PRH-[A-Z]{2,4}-[0-9]{3}$`; unique per version | none | PRH-WPN-001 |
| category_code | string(3..40) | no | pattern `^[A-Z0-9_]{3,40}$`; must resolve in category lookup (A-prohibited-05) | none | CAT_WEAPONS_EXPLOSIVES |
| match_type | enum | no | KEYWORD, GOODS_CATEGORY, STRUCTURED_FLAG, MANUAL_ONLY | KEYWORD | KEYWORD |
| match_terms | array of string(1..64) | conditional | 1..200 items when KEYWORD, else empty; each term NFKC-casefolded, no leading/trailing space, no regex (A-prohibited-08) | [] | ["example term"] |
| structured_flag | string(3..40) | conditional | required when STRUCTURED_FLAG; pattern `^[a-z][a-z0-9_]{2,39}$` | null | requires_license |
| default_action | enum | no | BLOCK, HOLD | HOLD | BLOCK |
| severity | smallint | no | 1..3; used only for ordering and reporting | 2 | 3 |
| jurisdiction_scope | array of string(2) or `*` | no | 1..50 ISO 3166-1 alpha-2 codes, or exactly `*` (A-prohibited-14) | ["*"] | ["DE", "FR"] |
| public_title_key | string(12..80) | no | pattern `^prohibited\.rule\.[a-z0-9_.]{3,64}$`; localization key only | none | prohibited.rule.weapons.001 |
| enabled | boolean | no | disabled rules never match | true | true |
| created_at | timestamptz UTC | no | | now | 2026-11-10T09:14:02.118Z |

### PolicyDecision (append-only except status and superseded_by_decision_id)
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| decision_id | string(26), ULID | no | primary key | generated | 01JDQ9D3EC1S0N7F2K8M4N6P1Z |
| subject_type | enum | no | LISTING, OFFER, PROPOSAL, CYCLE_PARTICIPATION | none | LISTING |
| subject_id | string(26), ULID | no | owner-module identifier; not personal data | none | 01JDQ8L1S4H7B2C9F5G0J3K6MN |
| subject_revision | integer | no | 1..2147483647, owner-supplied | none | 5 |
| checkpoint | enum | no | PUBLISH, REVISE, OFFER_CREATE, PROPOSAL_REVISE, CYCLE_INCLUDE, REEVALUATION | none | PUBLISH |
| policy_version_id | string(26) | no | FK; version active at evaluation | none | 01JDQ7M3V8K2Z5N0R4T6W9X1A2 |
| outcome | enum | no | ALLOW, HOLD, BLOCK; most severe matched action wins | none | HOLD |
| rule_codes | array of string(10..20) | no | 0..20, sorted, unique; empty iff outcome ALLOW | [] | ["PRH-WPN-001"] |
| category_codes | array of string(3..40) | no | 0..20, sorted, unique | [] | ["CAT_WEAPONS_EXPLOSIVES"] |
| jurisdiction_hint | string(2) | yes | ISO 3166-1 alpha-2 only; never precise location (D05) | null | DE |
| input_digest | string(64), lowercase hex | no | HMAC-SHA-256 over canonical snapshot | none | 7d1a54127b222502f5b79b5fb0803061152a44f92b37e23c6527baf665d4da9a |
| hmac_key_id | string(32) | no | identifies the keyed-digest key version | none | hk-2026-11 |
| caller_service_id | string(64) | no | authenticated service principal | none | svc-localbazaar-listings |
| idempotency_key | string(1..128) | no | unique with caller_service_id (A-prohibited-10) | none | listing:01JDQ8L1S4H7B2C9F5G0J3K6MN:5:PUBLISH |
| hold_id | string(26) | yes | set iff outcome HOLD; FK to PolicyHold | null | 01JDQAH6R2T8V4W1Y7Z3C5E9F0GH |
| status | enum | no | RECORDED, SUPERSEDED | RECORDED | RECORDED |
| superseded_by_decision_id | string(26) | yes | set when status SUPERSEDED | null | null |
| evaluated_at | timestamptz UTC | no | server clock | now | 2026-11-10T09:14:02.118Z |
| schema_version | string | no | const "1" for this spec (A-prohibited-02, CTR-SCH-001) | "1" | "1" |
| row_version | integer | no | >= 1 | 1 | 1 |

### PolicyHold
| Field | Type | Null | Constraints | Default | Example |
|---|---|---|---|---|---|
| hold_id | string(26), ULID | no | primary key | generated | 01JDQAH6R2T8V4W1Y7Z3C5E9F0GH |
| decision_id | string(26) | no | unique FK; one hold per decision | none | 01JDQ9D3EC1S0N7F2K8M4N6P1Z |
| subject_type, subject_id | as PolicyDecision | no | copied for reviewer queue | none | LISTING, 01JDQ8L1S4H7B2C9F5G0J3K6MN |
| status | enum | no | OPEN, ESCALATED, RELEASED, CONFIRMED_BLOCK, WITHDRAWN | OPEN | OPEN |
| opened_at | timestamptz UTC | no | | now | 2026-11-10T09:14:02.118Z |
| due_at | timestamptz UTC | no | opened_at + 72 h (A-prohibited-07) | computed | 2026-11-13T09:14:02.118Z |
| escalated_at | timestamptz UTC | yes | set on escalation | null | null |
| assigned_reviewer_actor_id | string(26) | yes | must not be the subject owner or policy author | null | 01JDQ7RVIEWER7K4M1N8P2Q5S |
| resolution_code | enum | yes | RELEASE_NO_MATCH, RELEASE_EXCEPTION_DOCUMENTED, BLOCK_RULE_CONFIRMED; set iff RELEASED or CONFIRMED_BLOCK | null | RELEASE_NO_MATCH |
| reviewer_note | string(0..1000) | yes | no control characters; RESTRICTED_REVIEW class (A-prohibited-04) | null | (free text, never copied from subject) |
| resolved_at | timestamptz UTC | yes | | null | null |
| row_version | integer | no | >= 1, optimistic lock | 1 | 2 |

### PolicyAuditEntry (append-only)
| Field | Type | Null | Constraints | Example |
|---|---|---|---|---|
| audit_id | string(26), ULID | no | primary key | 01JDQBA1UDT0R9K3M6N2P5Q8S4 |
| actor_id | string(26) | no | acting principal | 01JDQ7P0ACT0R3F8H2K5M9N1B4C |
| action | enum | no | POLICY_CREATE, POLICY_EDIT, POLICY_APPROVE, POLICY_DISCARD, POLICY_RETIRE, HOLD_ASSIGN, HOLD_RESOLVE, HOLD_ESCALATE, HOLD_WITHDRAW, EVIDENCE_EXPORT | POLICY_APPROVE |
| target_type, target_id | enum, string(26) | no | PolicyVersion, ProhibitionRule, PolicyHold, PolicyDecision | PolicyVersion, 01JDQ7M3V8K2Z5N0R4T6W9X1A2 |
| occurred_at | timestamptz UTC | no | | 2026-11-11T16:40:55.903Z |
| before_sha256, after_sha256 | string(64) hex | yes | content hash of target before and after | null |
| reason_code | string(40) | yes | pattern `^[A-Z_]{3,40}$` | null |

## Subject snapshot (request-only, never persisted)
Sent by the caller with each evaluate request (A-prohibited-06). Only a keyed digest is stored.
- subject_type, subject_id, subject_revision, checkpoint: as above.
- title: string(0..200), NFKC, no control characters.
- description: string(0..4000), NFKC, no control characters.
- category_code: string(3..40) or null.
- structured_flags: array of string, 0..20 items, each matching the structured_flag pattern.
- jurisdiction_hint: string(2) or null.
Maximum serialized snapshot: 16 KiB.

## Assumptions
- Assumption A-prohibited-01: IDs are ULIDs (26 characters, Crockford base32) pending CTR-ID-001 (F15, OPEN). A UUID choice changes only length and pattern.
- Assumption A-prohibited-02: Timestamps are UTC RFC 3339 with millisecond precision. Envelope and schema fields follow CTR-EVT-001 and CTR-SCH-001 once published.
- Assumption A-prohibited-04: Privacy class labels PUBLIC_POLICY, PSEUDONYMOUS_OPERATIONAL and RESTRICTED_REVIEW are provisional. CTR-PRV-001 (F10) publishes no class names yet.
- Assumption A-prohibited-05: category_code resolves through a read-only lookup owned by mod_goods that returns the code and its ancestors. The lookup contract is not in CONTRACTS.md.
- Assumption A-prohibited-06: Owner services send the subject snapshot; this module never fetches subjects. The snapshot contract is cross-module and not in CONTRACTS.md.
- Assumption A-prohibited-14: jurisdiction_hint is a country code from mod_jurisdictions, with no subdivision or coordinates (D05).

## Open decisions
- A-prohibited-01, A-prohibited-02, A-prohibited-04, A-prohibited-05, A-prohibited-06, A-prohibited-14 (see Assumptions above).
- Seed catalogue content and taxonomy depth are product and legal choices (DECISIONS.md lacks an entry; raise before Prompt 3 gate). Not defined here.
- Retention windows: see [privacy_retention_abuse.md](privacy_retention_abuse.md) (D07).
