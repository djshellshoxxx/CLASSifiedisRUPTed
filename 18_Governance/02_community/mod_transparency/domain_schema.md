# PS-148-01 — Domain schema: Transparency reports

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M02 Transparency reports](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/transparency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-148-01.R01** A TransparencyReport is an immutable computed report identified by relayId, periodKey and version, with suppressed aggregate tables, a content digest, the snapshot it was computed from and a publication status; corrections are new versions.
- **PS-148-01.R02** TransparencyCounter rows hold only period key, metric, dimension value and count; they never reference users, cases, listings or free text.
- **PS-148-01.R03** Reports are public P0; counters are relay-local operational data (IOX-7) of class P2 for that relay's operator role, stored only on the relay, and leave it only as a relay-signed snapshot sealed to an operator key.
- **PS-148-01.R04** Dimension vocabularies are bound to the producer enums: reason codes of the relay-side moderation.report.received of F12.S01.M01 (the vault-local moderation.report.filed is never counted), action kinds of F12.S02.M01, appeal outcomes upheld, overturned and reduced of moderation.appeal.decided of F12.S01.M03 (moot closures emit no event and are not counted) and spam detections of F12.S02.M02 relay intake.

## Specification

### TransparencyReport

Schema `classrup.governance.transparency_report/v1` · storage **relay+device** · privacy **P0** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — fixed local-vault tenant (ID-6) |
| relayId | string — canonical relay id (F15.S02.M01); with periodKey and version identifies the report |
| compilerId | did:key — operator key that computed the report and signed the draft |
| reviewerId? | did:key — operator key that countersigned; differs from compilerId |
| periodKey | string — YYYY-Qn or YYYY-MM, one granularity per relay |
| granularity | enum — month \| quarter; fixed by the relay's first published report |
| periodStart | timestamp — RFC 3339 UTC, relay time |
| periodEnd | timestamp — RFC 3339 UTC, relay time |
| version | int — 1.. per (relayId, periodKey) |
| scope | string — hosting scope statement key, for example this relay's hosted listings and mailboxes |
| snapshotCid | string — cid of the relay-signed classrup.governance.transparency_counts/v1 the report was computed from |
| coveragePercent | int — 0..100, floor of processed hours / period hours from the snapshot's processing checkpoints; never operator input |
| tables | object — metric to dimension to count, the literal under_10 (primary suppression) or the literal suppressed (complementary or cross-version suppression); per-metric total only when no cell of the metric is suppressed; <= 64 KiB JCS |
| suppressedCellCount | int — 0..500 |
| totalsVisible | boolean — false when the total of reports is under 10 |
| contentCid | string — sha256- over JCS of the report body |
| draftCid? | string — cid of the compiler-signed classrup.governance.transparency_draft/v1 |
| supersedes? | uuidv7 — report id of the corrected version |
| correctionNote? | string — 10..500 code points, required with supersedes |
| status | enum — computed \| awaiting_review \| published \| superseded \| discarded \| conflicted |
| publishedAt? | timestamp — reviewer claim |
| statementCid? | string — sha256- of the signed report envelope |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- No published cell holds a value between 1 and 9; such cells are the literal under_10, a row with exactly one under_10 cell shows its next smallest cell as suppressed too, and a metric with any suppressed cell publishes no total.
- In a correction every cell whose absolute change from the superseded version is between 1 and 9 is the literal suppressed.
- reviewerId differs from compilerId for status published and both are operator keys in the relay's verified tenant configuration.
- Exactly one report per (relayId, periodKey) has status published; older versions are superseded; two different reports with the same version are both conflicted.

### TransparencyCounter

Schema `classrup.governance.transparency_counter/v1` · storage **relay** · privacy **P2** · retention **RET-AUDIT**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — relay tenant |
| relayId | string — the relay holding the counter |
| periodKey | string — YYYY-Qn or YYYY-MM in the relay's granularity, from the relay time of the counted event |
| metric | enum — reports_received \| actions_applied \| appeals_filed \| appeals_decided \| spam_detected \| policy_decisions \| legal_requests |
| dimension | string — closed vocabulary per metric bound to the producer enum (see note), 1..40 characters |
| count | int — 0..100000000 |
| lastEventIds | string[] — <= 100 recent event ids (or proposalId:statementCid for decisions) for deduplication within the period window |
| frozenAt? | timestamp — relay time, periodEnd + 24 h; afterwards only a correction recount changes it |
| revision | int — CTR-ID-001 ID-4 |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- Unique (relayId, periodKey, metric, dimension); dimension values come only from the closed vocabulary of the metric.
- Counters never store user ids, listing ids, case ids or free text.
- Counters of frozen periods change only by an explicit correction recount recorded with the reason.

**Note:** Dimension vocabularies (bound to producer enums; contract-tested against the F12 event schemas):
reports_received - reasonCode of the relay-side moderation.report.received, the 12-code taxonomy of F12.S01.M01: spam, scam_fraud, prohibited_item, harassment, hate, sexual_content, violence, counterfeit, privacy_leak, impersonation, minor_safety, other. The vault-local moderation.report.filed never reaches the relay (EVT-8) and is not counted.
actions_applied - kind of moderation.action.applied with origin relay (F12.S02.M01): warn, remove_from_index, restrict_feature, suspend_relay_access.
appeals_filed - filed (relay-local moderation.appeal.filed of F12.S01.M03).
appeals_decided - outcome of moderation.appeal.decided with origin relay (F12.S01.M03): upheld, overturned, reduced. Moot closures (mootReason action_reverted or action_expired) emit no decided event, so moot is not a dimension and moot appeals appear only in appeals_filed.
spam_detected - throttled or flagged (moderation.spam.detected of F12.S02.M02 with mode relay_intake only; throttled when the payload carries a throttle).
policy_decisions - approved, rejected, conflicted (governance.policy_proposal.decided with scope relay whose publisherId is an operator key of this relay).
legal_requests - <type>:<outcome> with type court_order, law_enforcement, data_subject, other and outcome complied, partial, rejected.
Relay-local ProcessingCheckpoint rows (one per hour bucket in which the relay's moderation consumers and the counter consumer committed a heartbeat) feed coverage: coveragePercent = floor(100 x processed hours / period hours).
The relay-signed statement classrup.governance.transparency_counts/v1 { relayId, periodKey, periodStart, periodEnd, frozenAt, counters [{metric, dimension, count}], coverage { processedHours, periodHours, coveragePercent, gaps [{from, to}] } } contains no generation time, so snapshots of a frozen period are byte-identical and have one snapshotCid.


### Storage DDL

```sql
CREATE TABLE governance_transparency_report (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, relay_id TEXT NOT NULL, period_key TEXT NOT NULL, version INTEGER NOT NULL,
  status TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX governance_transparency_published ON governance_transparency_report(tenant_id, relay_id, period_key) WHERE status = 'published';
CREATE TABLE governance_transparency_counter (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, relay_id TEXT NOT NULL, period_key TEXT NOT NULL, metric TEXT NOT NULL, dimension TEXT NOT NULL,
  count INTEGER NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX governance_transparency_counter_key ON governance_transparency_counter(tenant_id, relay_id, period_key, metric, dimension);
CREATE TABLE governance_transparency_checkpoint (
  tenant_id TEXT NOT NULL, relay_id TEXT NOT NULL, hour_bucket TEXT NOT NULL, PRIMARY KEY (tenant_id, relay_id, hour_bucket));
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-148-09.T01 | unit | PS-148-01.R01, PS-148-01.R02, PS-148-02.R01 | import the 2026-Q3 snapshot and compute | report immutable with contentCid and snapshotCid; counters hold closed-vocabulary dimensions only |
| TEST-PS-148-09.T08 | abuse | PS-148-05.R01, PS-148-05.R03, PS-148-01.R03 | member reads counters; non-operator computes; X requests a snapshot; inspect the sealed snapshot in transit | FORBIDDEN or NOT_FOUND; snapshot refused to X; counters only on the relay and the snapshot readable only by the requesting operator key |
| TEST-PS-148-09.T16 | a11y | PS-148-01.R01 | axe run on public report page | zero serious or critical issues; suppressed cells read as fewer than ten or withheld |
| TEST-PS-148-09.T19 | integration | PS-148-04.R02, PS-148-01.R04, PS-148-03.R04 | F12 fixtures emit relay-local events through the quarter; relay freezes at periodEnd + 24 h; O1 and O2 each fetch the snapshot; O1 computes and requests review; O2 recomputes and publishes | both snapshots have the same snapshotCid; O2's recomputed contentCid equals O1's; the published report matches the event fixture after suppression |
| TEST-PS-148-09.T22 | contract | PS-148-01.R04, PS-148-04.R02 | compare the dimension vocabularies with the F12.S01.M01 moderation.report.received, F12.S02.M01, F12.S01.M03 and F12.S02.M02 event schemas; a moderation.report.filed fixture; an appeal closed as moot | every enum value maps to one dimension and no dimension lacks a producer value; report.filed and the moot closure change no counter and appeals_decided has exactly upheld, overturned and reduced |

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, F11.S01.M01, F15.S02.M01, F15.S04.M03, F07.S02.M01, F12.S01.M01, F12.S01.M03, F12.S02.M01, F12.S02.M02, F10.S01.M02, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
