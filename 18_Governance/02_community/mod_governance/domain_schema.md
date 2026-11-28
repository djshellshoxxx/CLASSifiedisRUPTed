# PS-147-01 — Domain schema: Community governance

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M01 Community governance](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/governance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-147-01.R01** A PolicyProposal records publisher, target type and references, a structured proposed change keyed by target reference (at most 16 KiB), summary, a comment period anchored to a relay receipt, status, decision and changelog entry.
- **PS-147-01.R02** Proposals, decisions, co-signatures and authority lists are public signed statements (P0) and comments are P1 statements visible to members of the hosting relay; every receiving vault verifies them.
- **PS-147-01.R03** Decisions bind the proposal statement cid and the digest of the approved change for exact targets, may activate a target only within 30 days after the decision's anchored time, and are evidence retained under RET-EVIDENCE.
- **PS-147-01.R04** The module owns the vault's trusted-publisher list (TrustedPublisher with scopes taxonomy, rules, profiles, proposals and transparency) and the pending-statement inbox (PendingStatement) used by all F18 modules; both are P3 local records.
- **PS-147-01.R05** A publisher's authority list (classrup.governance.authority_list/v1) names the decider and co-signer keys it delegates to, and each key's listing time is anchored to the relay receipt of the list version that first named it.

## Specification

### PolicyProposal

Schema `classrup.governance.policy_proposal/v1` · storage **relay+device** · privacy **P0** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — fixed local-vault tenant (ID-6) |
| publisherId | did:key — proposer and origin; canonical owner |
| title | string — 3..120 code points |
| summary | string — 10..2000 code points, plain text |
| targetType | enum — jurisdiction_profile \| prohibited_rule \| category \| platform_policy \| other; platform_policy maps to an F12.S02.M03 PolicyRule |
| targetRefs | string[] — 1..20 target references: profile code, ruleKey, categoryId or F12 rule id |
| proposedChange | object — map targetRef to the canonical change record of the target type (rule content with keywordHashes for sensitive rules, profile governed fields, category restricted/status/mergedInto), <= 16 KiB JCS |
| changeDigest | string — sha256- over JCS(proposedChange) |
| changelogEntry | string — 10..1000 code points, public |
| commentPeriodHours | int — 72..720, default 336; 24..71 only when expedited |
| expedited | boolean — default false; requires expeditedReason, coSignerId and a verified co-signature |
| expeditedReason? | string — 10..500 code points |
| coSignerId? | did:key — one co-signer listed in the publisher's authority list, differs from publisherId |
| cosignCid? | string — cid of the verified classrup.governance.policy_cosign/v1 over proposalCid |
| status | enum — draft \| open_for_comment \| decision_pending \| approved \| rejected \| withdrawn \| conflicted |
| proposalCid? | string — cid of the signed proposal statement; decisions bind it |
| openedAt? | timestamp — publisher clock, a claim |
| proposalReceipt? | object — classrup.platform.relay_receipt/v1 of the proposal statement {relayId, receivedAt, cid, keyId, sig}; anchors the comment period |
| commentEndsAt? | timestamp — proposalReceipt.receivedAt + commentPeriodHours (relay time); before a receipt exists only plannedCommentEndsAt is shown as a claim |
| commentCount | int — derived, visible comments |
| outcome? | enum — approved \| rejected |
| rationale? | string — 10..2000 code points |
| deciderId? | did:key — signer of the decision, delegated in the authority list, differs from publisherId |
| decisionCid? | string — cid of the verified decision statement |
| decisionReceipt? | object — relay receipt of the decision statement from the same relay as proposalReceipt |
| acknowledgedCommentCids? | string[] — <= 500 comment cids the decider lists as considered |
| decidedAt? | timestamp — decider clock, a claim |
| validUntil? | timestamp — min(decidedAt claim, decisionReceipt.receivedAt) + 30 d |
| withdrawalCid? | string — cid of a verified withdrawal statement |
| conflictCids? | string[] — cids of the contradicting statements when status is conflicted |
| statementCid? | string — sha256- of the latest signed statement |
| revision | int — CTR-ID-001 ID-4; meaningful only in the authoring vault |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- deciderId differs from publisherId and from coSignerId for approved and rejected outcomes, and was listed in the publisher's authority list at least 14 days before proposalReceipt.receivedAt.
- status approved or rejected implies rationale, deciderId, decisionCid and a verified decision statement exist; conflicted implies at least two contradicting verified statements in conflictCids.
- commentPeriodHours >= 72 unless expedited with reason and a verified co-signature; commentEndsAt = proposalReceipt.receivedAt + commentPeriodHours.
- changeDigest equals sha256-JCS(proposedChange) and every key of proposedChange is in targetRefs.

### PolicyComment

Schema `classrup.governance.policy_comment/v1` · storage **relay+device** · privacy **P1** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key, generated by the commenter |
| tenantId | uuidv7 — fixed local-vault tenant (ID-6) |
| proposalId | uuidv7 — ref PolicyProposal |
| proposalCid | string — cid of the proposal statement commented on |
| authorId | did:key — signer, pseudonymous; classified P1 by F10.S02.M02 |
| body | string — 1..2000 code points, plain text; classified P1 by F10.S02.M02 |
| status | enum — visible \| hidden \| withdrawn |
| hiddenReasonKey? | string — i18n key, set by the relay moderator |
| statementCid | string — sha256- over JCS of the signed envelope |
| relayReceipt? | object — relay-signed acceptance receipt; evidence of that relay only |
| relayReceiptAt? | timestamp — relay clock, evidence of that relay only |
| tombstoneCid? | string — author-signed classrup.federation.tombstone/v1 when withdrawn |
| createdAt | timestamp — commenter clock, a claim |

**Invariants**
- At most 5 visible comments per (proposalId, authorId).
- Comments are accepted only while relayReceiptAt is before proposalReceipt.receivedAt + commentPeriodHours on the relay that anchored the proposal.
- A hidden comment keeps its signed statement for audit but is not displayed; a withdrawn comment keeps only its cid, status and tombstone, never its body.

**Note:** Local records owned here (P3, device only, never transmitted; not catalog entities):
TrustedPublisher (schema classrup.governance.trusted_publisher/v1, RET-STANDARD) - publisherDid: did:key; fingerprint: string (first 16 base32 characters of sha256 of the key); scopes: (taxonomy | rules | profiles | proposals | transparency)[] 1..5; pinned: boolean - the publisher whose taxonomy and profiles are active for new records, at most one pinned per scope; paused: boolean - new statements go to the pending inbox, applied configuration stays in force; addedVia: user_confirmation | bundled; trustedAt: timestamp. Invariants: at most 10 entries with addedVia user_confirmation plus the release-pinned project publisher (addedVia bundled); an entry is created only by governance.trusted_publisher.add from the trust dialog.
PendingStatement (schema classrup.governance.pending_statement/v1, RET-SHORT) - id: uuidv7; statementCid; type: statement type; scope; publisherDid; envelope and optional relay receipt; reason: untrusted_publisher | paused_publisher | owner_review | decision_unavailable; ownerModule: F18 module id that applies it; receivedAt; expiresAt = receivedAt + 30 d; status: pending | applied | discarded | refused. Invariants: one pending entry per statementCid; a newer version from the same publisher and target supersedes and discards the older pending entry.
AuthorityList mirror rows store each verified classrup.governance.authority_list/v1 {publisherId, version, entries [{key: did:key, role: decider | cosigner, firstListedReceiptAt}], createdAt claim, receipt} (P0, RET-EVIDENCE).


### Storage DDL

```sql
CREATE TABLE governance_policy_proposal (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, publisher_id TEXT NOT NULL, proposal_cid TEXT, status TEXT NOT NULL,
  target_type TEXT NOT NULL, comment_ends_at TEXT, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE INDEX governance_policy_proposal_status ON governance_policy_proposal(tenant_id, publisher_id, status);
CREATE UNIQUE INDEX governance_policy_proposal_cid ON governance_policy_proposal(tenant_id, proposal_cid);
CREATE TABLE governance_policy_comment (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, proposal_id TEXT NOT NULL, author_id TEXT NOT NULL,
  status TEXT NOT NULL, data TEXT NOT NULL);
CREATE INDEX governance_policy_comment_proposal ON governance_policy_comment(tenant_id, proposal_id, status);
CREATE TABLE governance_authority_list (
  tenant_id TEXT NOT NULL, publisher_id TEXT NOT NULL, version INTEGER NOT NULL, statement_cid TEXT NOT NULL, data TEXT NOT NULL,
  PRIMARY KEY (tenant_id, publisher_id, version));
CREATE TABLE governance_trusted_publisher (
  tenant_id TEXT NOT NULL, publisher_did TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY (tenant_id, publisher_did));
CREATE TABLE governance_pending_statement (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, statement_cid TEXT NOT NULL, publisher_did TEXT NOT NULL, status TEXT NOT NULL,
  expires_at TEXT NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX governance_pending_statement_cid ON governance_pending_statement(tenant_id, statement_cid);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-147-09.T01 | unit | PS-147-01.R01, PS-147-02.R01, PS-147-02.R02 | draft a proposal with valid and invalid fields | stored with revision 1 and changeDigest; invalid length, target or change keys give documented error |
| TEST-PS-147-09.T02 | unit | PS-147-01.R02, PS-147-01.R03, PS-147-02.R03 | violate each rule V01-V16 | documented error code returned; no statement produced or accepted |
| TEST-PS-147-09.T07 | abuse | PS-147-05.R01, PS-147-05.R03, PS-147-01.R05 | proposer decides own proposal; KL decides; an unlisted key decides; untrusted publisher decision | GOVERNANCE_PROPOSAL_SELF_DECISION or decider_unauthorized; statements quarantined |
| TEST-PS-147-09.T16 | a11y | PS-147-01.R01 | axe run on proposal detail, comment form and trust dialog | zero serious or critical issues; keyboard-only commenting works |
| TEST-PS-147-09.T21 | integration | PS-147-01.R04, PS-147-03.R05, PS-147-04.R05 | untrusted pack held; trust added from the dialog; sync ingestion calls trusted_publisher.add; another pending item expires; owner refuses one; owner pauses a trusted publisher, a new statement arrives, owner resumes | held item applied through PendingApplyPort; ingestion call FORBIDDEN; expired item discarded after 30 days; refused item refused; paused statement held with paused_publisher and applied on resume while applied configuration stayed in force |
| TEST-PS-147-09.T22 | unit | PS-147-01.R05, PS-147-05.R04 | expedited proposal without co-signature, with a co-signature by KC, with a co-signature by an unlisted key; inspect the proposal detail UI string | GOVERNANCE_PROPOSAL_PERIOD_INVALID, accepted, rejected; UI shows 'a different key, not proof of a different person' |

## Dependencies

Module depends on: F16.S02.M03, F11.S01.M01, F15.S02.M01, F12.S03.M03, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [module SPEC](SPEC.md).
