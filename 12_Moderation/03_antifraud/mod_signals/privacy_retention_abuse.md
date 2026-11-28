# PS-101-07 — Privacy, retention and abuse: Fraud signals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M02 Fraud signals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/signals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-101-07.R01** Signals are P3 in a vault and P2 on a relay, contain no content, and are never federated, never shown to other members and never merged across stores.
- **PS-101-07.R02** Retention is bounded by expiry (at most 365 days, class RET-SIGNAL) with a counts-only rollup; in a vault signals are deleted only by the local principal's own deletion or by expiry, never by a counterparty's tombstone or deletion, and relay signals are pseudonymized when the subject's signed deletion request is applied.
- **PS-101-07.R03** Signal poisoning (fake disputes to damage a rival) is limited by small weights, decay, source verification and a per-source cap.
- **PS-101-07.R04** The module meets N6 by registering ExportSectionPort, DeletionPort and RetentionPurgePort with F10, classifying every Signal field per F10.S02.M02, and consuming privacy.deletion.completed.

## Specification

**Data classification**
- Signal in a vault: P3 (vault owner only).
- Signal on a relay: P2 (the subject's category counts and that relay's moderators with a case).
- Rollup counts: P3 counts per kind without sources.

**Retention**
- Signals: RET-SIGNAL, until expiresAt and at most 365 days, through the RetentionPurgePort.
- Rollup counts: 365 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Fake disputes or no-shows to smear a rival | single events have bounded weights (≤ 40), decay, and need verified source events; signals from one sourceKey about one subject count at most 3 times per 30 days |
| T02 | Hidden permanent blacklist | maximum lifetime 365 days; counts shown to the subject; no global sharing |
| T03 | Moderator planting manual signals | manual weight capped at 20 per subject per 30 days and audited |
| T04 | Tampering with stored signals | append-only trigger, hash of rows in daily audit digest on the relay |
| T05 | Re-identification through signal queries | queries return categories and counts to non-moderators and only for own history |
| T06 | Counterparty wipes its history in other vaults with a deletion tombstone before switching keys | vault signals are removed only by the local principal's own deletion or expiry |
| T07 | Overturned actions keep adding risk | revert compensations cancel report_actioned weight |

**Abuse controls**
- Per-source cap: signals from one sourceKey for one subject count at most 3 times in 30 days.
- Manual signals limited to 10 per 24 h per author via F12.S03.M03.
- Reporting bad faith: report_dismissed_bad_faith only at 5 non-exempt dismissals of one key in 30 days; minor_safety dismissals never count.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-101-09.T07 | abuse | PS-101-07.R03, PS-101-01.R04 | 4th no_show signal from the same sourceKey about B in 30 days; 4th from a different sourceKey; manual weight above cap | first 4th ignored for scoring and counted in sourceCapped; second counts; MODERATION_SIGNAL_MANUAL_CAP |
| TEST-PS-101-09.T08 | integration | PS-101-03.R03, PS-101-07.R02 | injected clock past expiresAt; counterparty B's deletion tombstone; P's own privacy.deletion.completed; relay applies B's signed deletion request | rows purged through the RetentionPurgePort and rollup counts kept; B's tombstone removes nothing in P's vault; P's deletion removes P's vault signals; relay signals about B pseudonymized |
| TEST-PS-101-09.T10 | abuse | PS-101-07.R01, PS-101-07.R03 | UPDATE of weight and observedAt on signal rows | aborted by trigger |
| TEST-PS-101-09.T17 | abuse | PS-101-07.R01, PS-101-02.R04 | F12 privacy suite: scan federation payloads, public projections, notifications, relay and vault logs after ingesting every mapped event | no Signal field, subject key, source key or weight appears in any of them |
| TEST-PS-101-09.T18 | integration | PS-101-07.R04 | ExportSectionPort run, DeletionPort plan and RetentionPurgePort run in a vault and on a relay | section moderation.signals exported in the vault only; deletion and purge counts reported; relay export absent |

## Dependencies

Module depends on: F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
