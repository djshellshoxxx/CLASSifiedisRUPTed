# PS-098-01 — Domain schema: Account limits

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M04 Account limits](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/limits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-098-01.R01** An AccountLimit stores key, limit key, tier, base value, risk multiplier, action restriction, override, effective value and the reasons for each adjustment, with tenant and revision per CTR-ID-001.
- **PS-098-01.R02** Limits are P2 between the member and the relay's moderators and retained under RET-STANDARD with the membership record.
- **PS-098-01.R03** Effective value is 0 while an action restriction is active, otherwise the override when active, otherwise floor(base × multiplier) with a minimum of 1 unless the base is 0.
- **PS-098-01.R04** Limit keys cover only resources the relay itself observes (index writes of public projections it hosts, mailbox puts to new recipient mailboxes, bids on auctions it hosts and governance comments it accepts for a policy proposal), never offers, cycle proposals or other end-to-end encrypted statements.
- **PS-098-01.R05** new_key_comments_per_proposal applies only while the key's firstSeenAt on this relay is less than 7 days ago, with base value 1 per proposal on every tier and a fixed proposal-wide cap of 25 accepted comments from such keys that no per-key override raises; from the 7-day mark the check answers allowed without consuming.

## Specification

### AccountLimit

Schema `classrup.moderation.accountlimit/v1` · storage **relay** · privacy **P2** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — relay hosting scope |
| subjectKey | did:key — member key on this relay |
| limitKey | enum — index_writes_per_day \| new_mailbox_recipients_per_day \| bids_per_day \| new_key_comments_per_proposal |
| tier | enum — new \| established \| trusted |
| baseValue | int — from tier table, 0..10000 |
| riskLevel | enum — low \| medium \| high (latest from moderation.risk.elevated or lowered) |
| riskMultiplier | number — 1.0, 0.75 or 0.5 |
| actionRestriction? | object — { actionId, until?: timestamp } from an active restrict_feature action mapped to this limit key; until absent only for an operator-applied permanent restriction |
| overrideValue? | int — 0..10000 set by a moderator |
| overrideReason? | string — 10..500 code points |
| overrideBy? | did:key — moderator key |
| overrideExpiresAt? | timestamp — RFC 3339 UTC, at most 90 days after setting |
| effectiveValue | int — computed, ≥ 0 |
| firstSeenAt | timestamp — RFC 3339 UTC, relay clock at this relay's first observation of the key |
| completedDeals | int — completions counted from submitted two-party statements, capped at 1000 |
| revision | int — CTR-ID-001 ID-4 |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- effectiveValue is 0 while actionRestriction is set and its until is absent or in the future; otherwise overrideValue when overrideExpiresAt is in the future; otherwise max(1, floor(baseValue × riskMultiplier)) unless baseValue is 0.
- overrideValue requires overrideReason, overrideBy and overrideExpiresAt.
- At most one AccountLimit exists per (tenantId, subjectKey, limitKey).
- completedDeals counts each completionCid at most once per key and only completions whose every party signature verified.

**Note:** Store-local table moderation_counted_completion (tenantId, completionCid, subjectKey, counterpartyKey, countedAt) supports dedupe and the per-pair 30-day rule; P2, retained with the AccountLimit rows. Tier table: new (index_writes_per_day 5, new_mailbox_recipients_per_day 20, bids_per_day 20); established after 7 days since first seen and 3 counted completions (20, 60, 100); trusted after 90 days and 10 counted completions (100, 200, 500). Capability-to-limit table: federation.record.ingest from a hosted vault key -> index_writes_per_day; comms.mailbox.put to a recipient mailbox new for the sender -> new_mailbox_recipients_per_day; auctions.bid.place -> bids_per_day; any other restricted capability is enforced by F16.S01.M01 authorize() only (including governance.policy_comment.relay_accept). New-key comment cap (check only, not a restriction mapping): governance.policy_comment.accept from a key whose firstSeenAt is less than 7 days ago -> new_key_comments_per_proposal with scopeRef the proposal statement cid, base 1 per proposal on every tier and a proposal-wide cap of 25 from such keys; keys from the 7-day mark are not checked for it.

### Storage DDL

```sql
CREATE TABLE moderation_account_limit (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, subject_key TEXT NOT NULL, limit_key TEXT NOT NULL, tier TEXT NOT NULL,
  effective_value INTEGER NOT NULL, restriction_action_id TEXT, restriction_until TEXT, override_expires_at TEXT,
  first_seen_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX moderation_account_limit_key ON moderation_account_limit(tenant_id, subject_key, limit_key);
CREATE TABLE moderation_counted_completion (
  tenant_id TEXT NOT NULL, completion_cid TEXT NOT NULL, subject_key TEXT NOT NULL, counterparty_key TEXT NOT NULL,
  counted_at TEXT NOT NULL, PRIMARY KEY (tenant_id, completion_cid, subject_key));
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-098-09.T01 | unit | PS-098-01.R01, PS-098-01.R04, PS-098-02.R01 | tier table for A, B, C on the three limit keys; override for limitKey open_offers | A new (5, 20, 20), B established (20, 60, 100), C trusted (100, 200, 500); open_offers refused with VALIDATION_FAILED |
| TEST-PS-098-09.T02 | property | PS-098-01.R03, PS-098-03.R02 | random tiers, multipliers, overrides and action restrictions | effective value follows the documented formula; 0 while a restriction is active; never below 1 otherwise unless base is 0 or the override sets 0 |
| TEST-PS-098-09.T15 | e2e | PS-098-01.R02, PS-098-04.R01 | mobile member hits the daily index-write limit | limit sheet shows used, allowed, reset time and next tier; axe zero serious issues |
| TEST-PS-098-09.T21 | integration | PS-098-01.R05, PS-098-02.R05, PS-098-04.R06 | key A (first seen 2 days ago) comments twice on proposal P1 and once on P2; 30 keys first seen today comment once each on P3; key B (first seen 40 days ago) comments on P3; a check without scopeRef; clock advanced to A's 7-day mark | A: first on P1 allowed, second RATE_LIMITED with retryAfterMs to the 7-day mark, P2 allowed; P3: 25 allowed and the rest RATE_LIMITED; B neither counted nor capped; VALIDATION_FAILED; after the mark A is not capped by this module |
| TEST-PS-098-09.T22 | contract | PS-098-04.R06, PS-098-01.R04 | F18.S02.M01 accept fixture through the relay bus: 200 fresh keys from one /24 each comment once on one proposal; F18.S02.M01 depends_on inspected | at most 25 accepted and every refusal is RATE_LIMITED; no depends_on edge from F18.S02.M01 to this module |

## Dependencies

Module depends on: F12.S03.M03, F07.S02.M01, F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
