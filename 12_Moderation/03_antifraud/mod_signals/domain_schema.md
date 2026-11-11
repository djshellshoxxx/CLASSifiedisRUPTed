# PS-101-01 — Domain schema: Fraud signals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M02 Fraud signals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/signals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-101-01.R01** A Signal stores subject key, kind, signed integer weight, half-life in days, source module and event ID, optional source key, evidence reference, observed time from the store clock and expiry, with tenant and revision per CTR-ID-001.
- **PS-101-01.R02** Signals are P3 in a vault (owner only) and P2 on a relay (the subject and that relay's moderators), retained until expiresAt and at most 365 days under the expiry-bounded class RET-SIGNAL, and are never exported to other users.
- **PS-101-01.R03** Signals are append-only; the only mutable field is none, and corrections are new signals that reference the corrected one.
- **PS-101-01.R04** Each event-derived signal names the key that caused it (reporter, opener or counterparty) as sourceKey when the producer payload carries one, and at most 3 signals per (subject, sourceKey) in 30 days count for scoring.

## Specification

### Signal

Schema `classrup.moderation.signal/v1` · storage **relay+device** · privacy **P2** · retention **RET-SIGNAL**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — store scope (vault scope or relay hosting scope) |
| subjectKey | did:key — counterparty key the signal concerns; never the vault's own local principal |
| kind | enum — shill_suspected \| spam_detected \| dispute_opened \| refund_agreed \| no_show \| payment_claim_expired \| payment_claim_disputed \| cycle_dropout \| auction_voided \| damage_agreed \| report_actioned \| report_dismissed \| report_dismissed_bad_faith \| deal_completed \| proximity_pattern \| manual_concern \| manual_positive \| compensation |
| weight | int — -100..100, positive increases risk, negative reduces it, defaults from the kind table |
| halfLifeDays | int — 7..180, default from the kind table |
| sourceModule | string — module ID that produced the source event or called SignalPort.record, or manual or import |
| sourceEventId | string — unique per (tenantId, kind) except manual |
| sourceKey? | did:key — reporter, opener or counterparty whose action produced the source event; absent for system observations |
| evidenceRef? | string — id of snapshot, deal, dispute case, damage claim, action, report, no-show report statement cid or module pattern id, never content or location cells |
| supersedesSignalId? | uuidv7 — set only on kind compensation |
| observedAt | timestamp — RFC 3339 UTC, store clock at ingestion |
| claimedAt? | timestamp — RFC 3339 UTC, time claimed by the source event, advisory only |
| expiresAt | timestamp — observedAt + 5 half-lives, at most 365 days |
| revision | int — CTR-ID-001 ID-4, always 1 |

**Invariants**
- Signal rows are never updated or deleted before expiresAt, except by the local principal's own deletion in a vault and pseudonymization on a relay.
- At most one signal exists per (tenantId, kind, sourceEventId) for non-manual kinds.
- A compensation signal has weight equal to minus the weight of the signal it supersedes and references it.
- A vault never stores a signal whose subjectKey is its own local principal.

### Storage DDL

```sql
CREATE TABLE moderation_signal (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, subject_key TEXT NOT NULL, kind TEXT NOT NULL, weight INTEGER NOT NULL,
  half_life_days INTEGER NOT NULL, source_event_id TEXT, source_key TEXT, evidence_ref TEXT, observed_at TEXT NOT NULL,
  expires_at TEXT NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX moderation_signal_source ON moderation_signal(tenant_id, kind, source_event_id) WHERE source_event_id IS NOT NULL;
CREATE INDEX moderation_signal_subject ON moderation_signal(tenant_id, subject_key, observed_at);
CREATE INDEX moderation_signal_source_key ON moderation_signal(tenant_id, subject_key, source_key, observed_at);
CREATE INDEX moderation_signal_evidence ON moderation_signal(tenant_id, evidence_ref);
CREATE TRIGGER moderation_signal_no_update BEFORE UPDATE OF kind, weight, half_life_days, source_event_id, observed_at, expires_at ON moderation_signal
  BEGIN SELECT RAISE(ABORT, 'append-only'); END;
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-101-09.T01 | unit | PS-101-01.R01, PS-101-02.R01, PS-101-02.R02 | record valid manual signals; invalid weight and kind | stored with expiry = observedAt + 5 half-lives; documented errors otherwise |
| TEST-PS-101-09.T02 | property | PS-101-01.R03, PS-101-03.R01, PS-101-03.R02 | random signal sets and times | decayed weight equals w × 0.5^(age/h); order of ingestion does not change totals; no row changes after insert |
| TEST-PS-101-09.T07 | abuse | PS-101-07.R03, PS-101-01.R04 | 4th no_show signal from the same sourceKey about B in 30 days; 4th from a different sourceKey; manual weight above cap | first 4th ignored for scoring and counted in sourceCapped; second counts; MODERATION_SIGNAL_MANUAL_CAP |
| TEST-PS-101-09.T14 | integration | PS-101-02.R04, PS-101-01.R02 | commerce.deal.completed with parties [P, B]; payment.disputed where P is the payer; auctions.result.voided without subjectKeys in a vault | deal_completed recorded only for B; no signal about P; nothing recorded for the void; unresolved_subject metric increments |

## Dependencies

Module depends on: F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
