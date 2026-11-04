# PS-101-01 — Domain schema: Fraud signals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M02 Fraud signals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/signals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-101-01.R01** A Signal stores subject key, kind, signed integer weight, half-life in days, source module and event ID, evidence reference, observed time from the store clock and expiry, with tenant and revision per CTR-ID-001.
- **PS-101-01.R02** Signals are P3 in a vault and P3 on a relay, retained for the shorter of expiry and 365 days under RET-STANDARD, and are never exported to other users.
- **PS-101-01.R03** Signals are append-only; the only mutable field is none, and corrections are new signals that reference the corrected one.

## Specification

### Signal

Schema `classrup.moderation.signal/v1` · storage **relay+device** · privacy **P3** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — store scope (vault scope or relay hosting scope) |
| subjectKey | did:key — counterparty key the signal concerns |
| kind | enum — shill_suspected \| spam_detected \| dispute_opened \| dispute_lost \| no_show \| payment_claim_expired \| payment_claim_disputed \| cycle_dropout \| auction_voided \| damage_claimed \| report_actioned \| report_dismissed_bad_faith \| deal_completed \| manual_concern \| manual_positive \| compensation |
| weight | int — -100..100, positive increases risk, negative reduces it, defaults from the kind table |
| halfLifeDays | int — 7..180, default from the kind table |
| sourceModule | string — module ID that produced the source event, or manual |
| sourceEventId | string — unique per (tenantId, kind) except manual |
| evidenceRef? | string — id of snapshot, deal, dispute or case, never content |
| supersedesSignalId? | uuidv7 — set only on kind compensation |
| observedAt | timestamp — RFC 3339 UTC, store clock at ingestion |
| claimedAt? | timestamp — RFC 3339 UTC, time claimed by the source event, advisory only |
| expiresAt | timestamp — observedAt + 5 half-lives, at most 365 days |
| revision | int — CTR-ID-001 ID-4, always 1 |

**Invariants**
- Signal rows are never updated or deleted before expiresAt.
- At most one signal exists per (tenantId, kind, sourceEventId) for non-manual kinds.
- A compensation signal has weight equal to minus the weight of the signal it supersedes and references it.

### Storage DDL

```sql
CREATE TABLE moderation_signal (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, subject_key TEXT NOT NULL, kind TEXT NOT NULL, weight INTEGER NOT NULL,
  half_life_days INTEGER NOT NULL, source_event_id TEXT, observed_at TEXT NOT NULL, expires_at TEXT NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX moderation_signal_source ON moderation_signal(tenant_id, kind, source_event_id) WHERE source_event_id IS NOT NULL;
CREATE INDEX moderation_signal_subject ON moderation_signal(tenant_id, subject_key, observed_at);
CREATE TRIGGER moderation_signal_no_update BEFORE UPDATE ON moderation_signal BEGIN SELECT RAISE(ABORT, 'append-only'); END;
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-101-09.T01 | unit | PS-101-01.R01, PS-101-02.R01, PS-101-02.R02 | record valid manual signals; invalid weight and kind | stored with expiry = observedAt + 5 half-lives; documented errors otherwise |
| TEST-PS-101-09.T02 | property | PS-101-01.R03, PS-101-03.R01, PS-101-03.R02 | random signal sets and times | decayed weight equals w × 0.5^(age/h); order of ingestion does not change totals |
| TEST-PS-101-09.T08 | integration | PS-101-01.R02, PS-101-03.R03, PS-101-07.R02 | daily sweep at expiry and subject deletion | rows purged, rollup counts kept; vault signals removed on deletion |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
