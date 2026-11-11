# PS-146-01 — Domain schema: Prohibited items

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M02 Prohibited items](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/prohibited` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-146-01.R01** A ProhibitedRule is an immutable version of a rule identified by a stable (publisherId, ruleKey); activating a new version retires the previous version of the same key.
- **PS-146-01.R02** Keywords are stored normalized (NFKC, case-folded, diacritics folded) and bounded: at most 50 phrases per rule, each 2 to 60 code points, at most 2 000 active rules per pack; sensitive rules carry in the signed pack only salted hashes of whole-word phrases of at most 5 tokens.
- **PS-146-01.R03** Rules are public configuration (P0) so sellers can see what is not allowed; evaluation results are local P3 and never leave the vault.
- **PS-146-01.R04** A rule pack declares the taxonomy its category scopes refer to and expresses jurisdiction scopes as ProfileRefs; scopes that do not resolve are stored as scope_unresolved with one defined fallback, never skipped silently.
- **PS-146-01.R05** Each rule version records the pack version that first activated it and its proposalId, and the pack embeds the decision envelopes with receipts for rule versions first activated in that pack version and cites older ones by decisionCid.

## Specification

### ProhibitedRule

Schema `classrup.governance.prohibited_rule/v1` · storage **relay+device** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — ruleId, primary key of this rule version |
| tenantId | uuidv7 — fixed local-vault tenant (ID-6) |
| publisherId | did:key — signer of the pack and origin |
| ruleKey | string — [a-z0-9_]{3,40}, stable across versions; cross-module references use (publisherId, ruleKey) |
| version | int — monotonic per (publisherId, ruleKey) |
| categoryIds | uuidv7[] — 0..20 categories of the pack's taxonomyRef whose subtree the rule covers; empty means all categories |
| keywords | string[] — 0..50 normalized phrases of 2..60 code points; for sensitive rules only in the publisher vault, never in the pack |
| keywordHashes? | string[] — sensitive rules only: 1..50 base64url sha256 of keywordSalt followed by the normalized phrase, phrases of 1..5 whole-word tokens |
| keywordSalt? | string — sensitive rules only: 16 random bytes base64url, fixed per rule version so carried-forward versions keep a stable content digest |
| matchMode | enum — whole_word \| phrase; sensitive rules whole_word only |
| action | enum — block \| review \| allow_with_notice |
| kinds | string[] — subset of sell, wanted, giveaway, service, rental, auction; empty means all |
| jurisdictionScope | ProfileRef[] — 0..10 F18.S01.M01 references {publisherId, code}, version resolved at evaluation; empty means all |
| noticeId? | string — notice shown for review and allow_with_notice |
| reasonKey | string — i18n message key for the owner-facing reason |
| sensitive | boolean — when true the pack carries keywordHashes and keywordSalt instead of keywords |
| status | enum — draft \| active \| retired |
| scopeState | enum — resolved \| scope_unresolved |
| rulesetVersion | int — pack version in which this rule version first became active |
| activatedAt? | timestamp — anchored time of that pack version: its relay receipt, else the publisher's claimed createdAt marked as a claim |
| emergencyUntil? | timestamp — publisher claim, at most activation + 7 d; only for action review |
| effectiveEmergencyUntil? | timestamp — derived by receivers: min(emergencyUntil, firstSeenAt + 7 d) |
| proposalId? | uuidv7 — ref F18.S02.M01 approved decision, required unless emergency |
| decisionCid? | string — cid of the decision recorded at verification; a decision activates each rule key at most once |
| provenance | object — {originRelay?, receivedAt, verifiedAt, packCid, bundled: boolean} |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- A rule must have at least one category id or at least one keyword (or keyword hash); a rule with neither is invalid.
- At most one active version per (publisherId, ruleKey); versions only increase.
- emergencyUntil is allowed only with action review and at most 7 days after activation; blocking rules always need proposalId.
- Sensitive rules use whole_word matching, carry keywordHashes and keywordSalt in the pack and never plaintext keywords outside the publisher vault.

**Note:** The signed statement classrup.governance.rule_pack/v1 carries { publisherId, packVersion, createdAt (claim), changelogEntry, taxonomyRef { publisherId, packVersion?, packCid? }, rules[] (full snapshot of active rules with rulesetVersion), retiredRuleKeys[], decisions: [{ proposalId, decisionCid, decision?: { envelope, receipt } }] (envelopes embedded for rule versions first activated in this pack version, cids for older ones, fetched through governance.policy_proposal.relay_get), anchors?: [{ packVersion, packCid, receipt }] }. Relays serve it unchanged; nothing in it is rewritten after signing.
Local record EmergencyHistory (P0 derived, device and relay): per (publisherId, ruleKey) the emergency activations seen in the last 30 days with firstSeenAt and effective expiry; used by V11.
Unknown-category policy shared with F18.S01.M01: unresolved ids are stored as scope_unresolved, shown in settings and re-resolved on governance.category.changed.


### Storage DDL

```sql
CREATE TABLE governance_prohibited_rule (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, publisher_id TEXT NOT NULL, rule_key TEXT NOT NULL, version INTEGER NOT NULL,
  action TEXT NOT NULL, status TEXT NOT NULL, ruleset_version INTEGER, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX governance_prohibited_rule_active ON governance_prohibited_rule(tenant_id, publisher_id, rule_key) WHERE status = 'active';
CREATE TABLE governance_emergency_history (
  tenant_id TEXT NOT NULL, publisher_id TEXT NOT NULL, rule_key TEXT NOT NULL, first_seen_at TEXT NOT NULL, effective_until TEXT NOT NULL,
  PRIMARY KEY (tenant_id, publisher_id, rule_key, first_seen_at));
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-146-09.T01 | unit | PS-146-01.R01, PS-146-01.R02, PS-146-02.R01 | draft valid rule and one with 51 keywords | stored immutable version; invalid rejected with documented code |
| TEST-PS-146-09.T03 | property | PS-146-01.R02 | random texts with look-alikes and zero-width characters | verdict deterministic and stable under normalization; whole-word mode avoids substring matches |
| TEST-PS-146-09.T18 | abuse | PS-146-01.R03 | network spy during evaluate, apply_pack and policy result display | no request carries evaluation input or results; rules readable through relay_latest anonymously |
| TEST-PS-146-09.T19 | integration | PS-146-02.R04, PS-146-01.R05 | vault offline 45 days applies pack 41; fresh vault applies pack 41 whose rules from pack 12 cite the year-old D1; PB's pack cites D2 of PK1; a rule version whose keywords differ from D2's approved content | both vaults apply pack 41 (asOf from anchors or claimed createdAt, never the vault clock); PB's rule rejected with publisher_mismatch; changed rule rejected with content_mismatch and held at its previous version |
| TEST-PS-146-09.T21 | integration | PS-146-01.R04 | pack scoped to T2 applied in a vault that holds only T1; listing with a T2 category id; listing whose text matches a T2-scoped block keyword; T2 arrives later | rules stored scope_unresolved and listed in settings; exact id match applies; keyword match capped at review with viaFallback true; after T2 arrives scopes resolve |
| TEST-PS-146-09.T22 | unit | PS-146-01.R02, PS-146-07.R02 | sensitive whole-word rule with a 3-token phrase; phrase-mode sensitive rule; relay serves the pack | n-gram hashing matches the phrase; phrase-mode sensitive rule rejected; pack contains no plaintext and its signature still verifies as served |

## Dependencies

Module depends on: F18.S01.M03, F18.S01.M01, F18.S02.M01, F16.S02.M03, F11.S01.M01, F07.S02.M01, F15.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [module SPEC](SPEC.md).
