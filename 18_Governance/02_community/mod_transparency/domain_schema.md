# PS-148-01 — Domain schema: Transparency reports

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M02 Transparency reports](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/transparency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-148-01.R01** A TransparencyReport is an immutable computed report for one publisher and period with suppressed aggregate tables, a content digest and a publication status; corrections are new versions.
- **PS-148-01.R02** TransparencyCounter rows hold only period key, metric, dimension value and count; they never reference users, cases, listings or free text.
- **PS-148-01.R03** Reports are public P0; counters are operator-private working data (P3) retained only until the period is published and reviewed.

## Specification

### TransparencyReport

Schema `classrup.governance.transparency_report/v1` · storage **relay+device** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — fixed local-vault tenant (ID-6) |
| publisherId | did:key — operator key that compiled the report |
| periodKey | string — YYYY-Qn or YYYY-MM |
| periodStart | timestamp — RFC 3339 UTC |
| periodEnd | timestamp — RFC 3339 UTC |
| version | int — 1.. per (publisherId, periodKey) |
| scope | string — hosting scope statement key, for example this relay's hosted listings and mailboxes |
| coveragePercent | int — 0..100 share of the period during which event processing was running |
| tables | object — metrics to dimension to count or the literal under_10; <= 64 KiB JCS |
| suppressedCellCount | int — 0..500 |
| totalsVisible | boolean — false when the total of reports is under 10 |
| contentCid | string — sha256- over JCS of the report body |
| status | enum — computed \| published \| superseded \| discarded |
| reviewerId? | did:key — operator key that reviewed; differs from publisherId |
| publishedAt? | timestamp — publisher claim |
| statementCid? | string — sha256- of the signed envelope |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- No published cell holds a value between 1 and 9; such cells are the literal under_10, and a row with exactly one suppressed cell suppresses its next smallest cell too.
- reviewerId differs from publisherId for status published.
- Exactly one report per (publisherId, periodKey) has status published; older versions are superseded.

### TransparencyCounter

Schema `classrup.governance.transparency_counter/v1` · storage **relay+device** · privacy **P3** · retention **RET-SHORT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — fixed local-vault tenant (ID-6) |
| periodKey | string — YYYY-Qn or YYYY-MM |
| metric | enum — reports_filed \| actions_applied \| appeals_filed \| appeals_decided \| spam_detected \| policy_decisions \| legal_requests |
| dimension | string — closed vocabulary per metric (for example reason, action type, outcome), 1..40 characters |
| count | int — 0..100000000 |
| lastEventIds | string[] — <= 100 recent event ids for deduplication within the period window |
| revision | int — CTR-ID-001 ID-4 |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- Unique (periodKey, metric, dimension); dimension values come only from the closed vocabulary of the metric.
- Counters never store user ids, listing ids, case ids or free text.
- Counters of published periods are frozen except by an explicit correction compute.

### Storage DDL

```sql
CREATE TABLE governance_transparency_report (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, publisher_id TEXT NOT NULL, period_key TEXT NOT NULL, version INTEGER NOT NULL,
  status TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX governance_transparency_published ON governance_transparency_report(tenant_id, publisher_id, period_key) WHERE status = 'published';
CREATE TABLE governance_transparency_counter (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, period_key TEXT NOT NULL, metric TEXT NOT NULL, dimension TEXT NOT NULL,
  count INTEGER NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX governance_transparency_counter_key ON governance_transparency_counter(tenant_id, period_key, metric, dimension);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-148-09.T01 | unit | PS-148-01.R01, PS-148-01.R02, PS-148-02.R01 | compute 2026-Q3 | report immutable with contentCid; counters hold closed-vocabulary dimensions only |
| TEST-PS-148-09.T03 | property | PS-148-01.R03 | random counter tables | no published cell between 1 and 9; complementary suppression prevents recovery from totals; total under 10 hides all breakdowns |
| TEST-PS-148-09.T16 | a11y | PS-148-01.R01 | axe run on public report page | zero serious or critical issues; suppressed cells read as fewer than ten |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
