# PS-095-01 — Domain schema: Abuse policy

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S02.M03 Abuse policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/policy/abuse` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-095-01.R01** A PolicyRule version stores rule ID, version, family, severity, allowed actions, change type, locale texts, effective and retirement times and the relay signature content id, with tenant and revision per CTR-ID-001.
- **PS-095-01.R02** Published rule versions are P0, immutable and retained under RET-EVIDENCE because moderation decisions cite them.
- **PS-095-01.R03** Rule IDs follow POL-<FAMILY>-<NNN>, are never reused and version numbers increase by one.
- **PS-095-01.R04** Each version has a derived in-force state (scheduled, in_force, superseded) computed from effectiveAt, later versions and retirement, and at most one version of a rule ID is in force at any time.

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
| prohibitedRuleRef? | string — F18.S01.M02 rule ID when family is prohibited_goods |
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
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-095-09.T01 | unit | PS-095-01.R01, PS-095-01.R03, PS-095-02.R01 | draft and publish a valid rule; draft with an unknown field | version row stored with changeType, version = previous + 1, ID matches pattern; VALIDATION_FAILED |
| TEST-PS-095-09.T03 | property | PS-095-01.R02, PS-095-01.R04, PS-095-03.R01 | random sequences of draft, publish, retire, edit and clock advances | published versions never change; at most one version of each ruleId in force at any instant; only declared transitions succeed |
| TEST-PS-095-09.T14 | e2e | PS-095-01.R02, PS-095-04.R01 | mobile visitor reads policy offline after first visit | cached policy shown with fetch date; axe zero serious issues |

## Dependencies

Module depends on: F18.S01.M02, F16.S02.M02, F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
