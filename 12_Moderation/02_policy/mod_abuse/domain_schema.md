# PS-095-01 — Domain schema: Abuse policy

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M03 Abuse policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/abuse` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-095-01.R01** A PolicyRule version stores rule ID, version, family, severity, allowed actions, change type, locale texts, effective and retirement times and the relay signature content id, with tenant and revision per CTR-ID-001.
- **PS-095-01.R02** Published rule versions are P0, immutable and retained under RET-EVIDENCE because moderation decisions cite them.
- **PS-095-01.R03** Rule IDs follow POL-<FAMILY>-<NNN>, are never reused and version numbers increase by one.
- **PS-095-01.R04** Each version has a derived in-force state (scheduled, in_force, superseded) computed from effectiveAt, later versions and retirement, and at most one version of a rule ID is in force at any time.
- **PS-095-01.R05** A prohibited-goods reference is the F18.S01.M02 identity (publisherId, ruleKey) with an optional ruleId for one exact version, a version drafted from a governance decision keeps its governanceRef, and review flags and reference status derived from governance events live in a store-local review table beside the immutable version rows.

## Specification

### PolicyRule

Schema `classrup.moderation.policyrule/v1` · storage **relay+device** · privacy **P0** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key of this version row |
| tenantId | uuidv7 — relay hosting scope |
| ruleId | string — stable ID matching POL-[A-Z]+-[0-9]{3} |
| version | int — starts at 1, increments by 1 per published change |
| family | enum — spam \| fraud \| prohibited_goods \| harassment \| hate \| sexual_content \| violence \| privacy \| impersonation \| counterfeit \| minor_safety \| platform_manipulation |
| severity | enum — low \| medium \| high \| imminent_harm |
| allowedActions | string[] — subset of warn, remove_from_index, restrict_feature, suspend_relay_access |
| changeType | enum — initial \| restrictive \| non_restrictive |
| texts | object — locale to { title ≤ 120 code points, summary ≤ 400, body ≤ 4000 } |
| prohibitedRuleRef? | object — { publisherId: did:key, ruleKey: [a-z0-9_]{3,40}, ruleId?: uuidv7 } F18.S01.M02 reference when family is prohibited_goods; cross-module identity is (publisherId, ruleKey) and ruleId pins one exact version |
| governanceRef? | object — { proposalId, publisherId, proposalStatementCid, decisionCid, changeDigest } when the draft was built from an approved F18.S02.M01 decision; kept unchanged on publication |
| changelog | string — 10..1000 code points |
| publishedAt? | timestamp — RFC 3339 UTC, relay clock at publication |
| effectiveAt | timestamp — RFC 3339 UTC; at least 14 days after publication when changeType is restrictive |
| inForce | enum — scheduled \| in_force \| superseded (derived, published versions only) |
| retiredAt? | timestamp — RFC 3339 UTC |
| status | enum — draft \| published \| retired |
| statementCid? | string — content id of the relay-signed policy statement |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- (tenantId, ruleId, version) is unique and a published version is never modified.
- At most one version of a ruleId is in force at any time; a version is in force from its effectiveAt until a later version of the same ruleId reaches its effectiveAt or the rule is retired.
- imminent_harm rules are the only restrictive ones allowed an effective date earlier than 14 days after publication.
- changeType initial exists only for versions published before the relay's first in-force policy version; non_restrictive requires a previous version whose allowedActions include the new ones, with no higher severity and the same family.
- prohibitedRuleRef.ruleId, when present, names a version of the same (publisherId, ruleKey); review flags and reference status are never written into a version row.

**Note:** Store-local tables (P1, relay-internal, operators only, retained with the rule versions they refer to): moderation_policy_review holds review flags (prohibited_rule_changed, governance_conflicted) and the derived prohibitedRefStatus (active | retired) per version; moderation_policy_governance_draft dedupes governance drafts per (decisionCid, ruleId).

### Storage DDL

```sql
CREATE TABLE moderation_policy_rule (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, rule_id TEXT NOT NULL, version INTEGER NOT NULL, family TEXT NOT NULL,
  change_type TEXT NOT NULL, status TEXT NOT NULL, published_at TEXT, effective_at TEXT NOT NULL, retired_at TEXT,
  revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX moderation_policy_version ON moderation_policy_rule(tenant_id, rule_id, version);
CREATE INDEX moderation_policy_effective ON moderation_policy_rule(tenant_id, rule_id, effective_at);
CREATE TRIGGER moderation_policy_published_immutable BEFORE UPDATE ON moderation_policy_rule
  WHEN OLD.status = 'published' AND NEW.status = 'published' BEGIN SELECT RAISE(ABORT, 'immutable'); END;
CREATE TABLE moderation_policy_review (
  tenant_id TEXT NOT NULL, rule_id TEXT NOT NULL, version INTEGER NOT NULL, flag TEXT NOT NULL,
  prohibited_ref_status TEXT, source_event_id TEXT NOT NULL, flagged_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, rule_id, version, flag));
CREATE TABLE moderation_policy_governance_draft (
  tenant_id TEXT NOT NULL, decision_cid TEXT NOT NULL, rule_id TEXT NOT NULL, policy_rule_id TEXT NOT NULL,
  PRIMARY KEY (tenant_id, decision_cid, rule_id));
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-095-09.T01 | unit | PS-095-01.R01, PS-095-01.R03, PS-095-02.R01 | draft and publish a valid rule; draft with an unknown field | version row stored with changeType, version = previous + 1, ID matches pattern; VALIDATION_FAILED |
| TEST-PS-095-09.T03 | property | PS-095-01.R02, PS-095-01.R04, PS-095-03.R01 | random sequences of draft, publish, retire, edit and clock advances | published versions never change; at most one version of each ruleId in force at any instant; only declared transitions succeed |
| TEST-PS-095-09.T14 | e2e | PS-095-01.R02, PS-095-04.R01 | mobile visitor reads policy offline after first visit | cached policy shown with fetch date; axe zero serious issues |
| TEST-PS-095-09.T18 | integration | PS-095-04.R06, PS-095-01.R05, PS-095-02.R02 | draft with prohibitedRuleRef { publisherId P, ruleKey counterfeit_goods }, with an unknown ruleKey and with a ruleId of another key; relay-scope prohibited_rule.changed retired for (P, counterfeit_goods) and a vault-scope copy; check_citable for the dependent version | stored; VALIDATION_FAILED twice; prohibitedRefStatus retired and flag set in the review table while the version row is unchanged; copy ignored; citable false |

## Dependencies

Module depends on: F18.S01.M02, F18.S02.M01, F16.S02.M02, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
