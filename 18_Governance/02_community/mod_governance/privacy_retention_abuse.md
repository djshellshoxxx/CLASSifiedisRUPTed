# PS-147-07 — Privacy, retention and abuse: Community governance

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M01 Community governance](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/governance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-147-07.R01** Proposals and decisions are public signed statements; comments are visible to the relay's community and are linkable to pseudonyms; the UI says pseudonymity is not anonymity.
- **PS-147-07.R02** Decisions and proposals are retained as evidence (RET-EVIDENCE); comments follow RET-STANDARD and hidden comments keep their signed statement for audit.
- **PS-147-07.R03** No comment or proposal content is sent through notification channels beyond a reference and a template key.
- **PS-147-07.R04** PolicyComment is user content: the module registers ExportSectionPort, DeletionPort and RetentionPurgePort, classifies comment fields through F10.S02.M02, signs comment tombstones in the DeletionPort sign step (N6a), and reacts to privacy.deletion.requested and cancelled with reversible actions only.
- **PS-147-07.R05** Comment display filters blocked authors through F07.S02.M02 filterBlocked, and relay intake is rate limited per key and per network prefix with a per-proposal cap for keys registered less than 7 days ago (N7, N18).

## Specification

**Data classification**
- PolicyProposal, decisions, co-signatures and authority lists: P0 signed statements.
- PolicyComment: P1 signed statements, pseudonymous author; authorId and body classified P1 by F10.S02.M02.
- TrustedPublisher and PendingStatement: P3 local records, never transmitted.

**Retention**
- PolicyProposal, decision and authority list: RET-EVIDENCE.
- PolicyComment: RET-STANDARD; a withdrawn comment keeps only cid and tombstone; a hidden comment withdrawn by its author keeps only cid, hide record and reason key for 1 year (RET-AUDIT), never the body.
- PendingStatement: RET-SHORT, discarded 30 days after receipt.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Operator pushes a harmful rule without notice | mandatory 72 h comment period anchored to the relay receipt, expedited path needs reason and a verified co-signature, changelog public, users choose which publishers to trust |
| T02 | Self-approval by one operator | decider must be a different key delegated in the publisher's authority list at least 14 days before the proposal; this proves a different key, not a different person, and the UI says so |
| T03 | Equivocation or backdated decision | signatures over JCS, decision bound to the proposal cid, conflict detection, decidedAt is a claim and the relay receipt times decide the period |
| T04 | Comment flooding or harassment | 5 comments per member per proposal, 10 per hour per key, 30 per 24 h per /24 or /48 prefix, relay moderator can hide, local block filtering |
| T05 | Replay of an old approved decision for new targets, another publisher or other content | verify compares publisherId, targetRefs subset, the content digest, the anchored activation time and prior use |
| T06 | Sybil keys bypass per-key limits | per-prefix limits through RateLimitPort, at most 25 comments per proposal from keys registered less than 7 days ago (F12.S03.M04) |
| T07 | Backdated openedAt or forward-set decider clock creates a zero-length comment period | V11 uses relay receipts; openedAt earlier than the receipt minus 10 min is rejected |
| T08 | Sync ingestion or a malicious pack silently adds trust | trust changes only from the owner's trust dialog with fingerprint confirmation; ingestion can only hold statements as pending |

**Abuse controls**
- Publisher limit of 20 active proposals; comments rate limited by relay policy per key and per prefix.
- Hidden comments carry a reason key shown to the author.
- At most 10 user-trusted publishers per vault; at most 200 pending statements, oldest discarded first.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-147-09.T08 | abuse | PS-147-05.R02, PS-147-07.R03 | non-registered key comments; sixth comment; 11 comments in an hour; moderator hides; anonymous relay_list | relay refuses; GOVERNANCE_COMMENT_LIMIT; RATE_LIMITED; hide affects that relay only; relay_list returns UNAUTHENTICATED; notifications carry only reference and template key |
| TEST-PS-147-09.T12 | abuse | PS-147-07.R01, PS-147-07.R02, PS-147-07.R03 | scan notifications, logs and exports; assert UI strings | no comment content in notifications or logs; retention classes as specified; hidden comment kept for audit; comment form shows 'pseudonymity is not anonymity' |
| TEST-PS-147-09.T19 | abuse | PS-147-07.R05 | 200 fresh keys from one /24 each comment on one proposal; a blocked author comments | at most 25 accepted, the rest RATE_LIMITED; the blocked author's comment is dropped silently from comment.list |
| TEST-PS-147-09.T20 | integration | PS-147-07.R04, PS-147-04.R02 | author withdraws a comment; DeletionPort plan and sign step for a deleting principal with 3 comments; privacy.deletion.requested then cancelled | tombstone signed; relay removes the body and returns tombstone stubs in relay_list; mirrors delete it; sign step signs 3 tombstones; posting paused then resumed |

## Dependencies

Module depends on: F16.S02.M03, F11.S01.M01, F15.S02.M01, F12.S03.M03, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
