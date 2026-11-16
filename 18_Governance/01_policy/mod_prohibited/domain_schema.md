# PS-146-01 — Domain schema: Prohibited items

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M02 Prohibited items](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/prohibited` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-146-01.R01** A ProhibitedRule is an immutable version of a rule identified by a stable ruleKey; activating a new version retires the previous version of the same key.
- **PS-146-01.R02** Keywords are stored normalized (NFKC, case-folded, diacritics folded) and bounded: at most 50 phrases per rule, each 2 to 60 code points, at most 2 000 active rules per pack.
- **PS-146-01.R03** Rules are public configuration (P0) so sellers can see what is not allowed; evaluation results are local P3 and never leave the vault.

## Specification

### ProhibitedRule

Schema `classrup.governance.prohibited_rule/v1` · storage **relay+device** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key of this rule version |
| tenantId | uuidv7 — fixed local-vault tenant (ID-6) |
| publisherId | did:key — signer of the pack and origin |
| ruleKey | string — [a-z0-9_]{3,40}, stable across versions |
| version | int — monotonic per ruleKey |
| categoryIds | uuidv7[] — 0..20 categories whose subtree the rule covers; empty means all categories |
| keywords | string[] — 0..50 normalized phrases of 2..60 code points |
| matchMode | enum — whole_word \| phrase |
| action | enum — block \| review \| allow_with_notice |
| kinds | string[] — subset of sell, wanted, giveaway, service, rental, auction; empty means all |
| jurisdictionProfileIds | uuidv7[] — 0..10; empty means all profiles |
| noticeId? | string — notice shown for review and allow_with_notice |
| reasonKey | string — i18n message key for the owner-facing reason |
| sensitive | boolean — when true the keywords are omitted from the public copy of the pack and replaced by a hash list |
| status | enum — draft \| active \| retired |
| rulesetVersion | int — pack version in which the rule became active |
| emergencyUntil? | timestamp — publisher claim, at most activation + 7 d; only for action review |
| proposalId? | uuidv7 — ref F18.S02.M01 approved decision, required unless emergency |
| provenance | object — {originRelay?, receivedAt, verifiedAt, packCid} |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- A rule must have at least one category id or at least one keyword; a rule with neither is invalid.
- At most one active version per (publisherId, ruleKey); versions only increase.
- emergencyUntil is allowed only with action review and at most 7 days after activation; blocking rules always need proposalId.

### Storage DDL

```sql
CREATE TABLE governance_prohibited_rule (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, publisher_id TEXT NOT NULL, rule_key TEXT NOT NULL, version INTEGER NOT NULL,
  action TEXT NOT NULL, status TEXT NOT NULL, ruleset_version INTEGER, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX governance_prohibited_rule_active ON governance_prohibited_rule(tenant_id, publisher_id, rule_key) WHERE status = 'active';
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-146-09.T01 | unit | PS-146-01.R01, PS-146-01.R02, PS-146-02.R01, PS-146-02.R02 | draft valid rule and one with 51 keywords | stored immutable version; invalid rejected with documented code |
| TEST-PS-146-09.T03 | property | PS-146-01.R03, PS-146-02.R02 | random texts with look-alikes and zero-width characters | verdict deterministic and stable under normalization; whole-word mode avoids substring matches |

## Dependencies

Module depends on: F18.S01.M03, F18.S01.M01, F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [module SPEC](SPEC.md).
