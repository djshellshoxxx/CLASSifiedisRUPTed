# PS-101-07 — Privacy, retention and abuse: Fraud signals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M02 Fraud signals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/signals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-101-07.R01** Signals are P3 in their store, contain no content, and are never federated, never shown to other members and never merged across stores.
- **PS-101-07.R02** Retention is bounded by expiry (at most 365 days) with a counts-only rollup, and subject deletion removes vault signals immediately and pseudonymizes relay signals for the case duration.
- **PS-101-07.R03** Signal poisoning (fake disputes to damage a rival) is limited by small weights, decay, source verification and a per-source cap.

## Specification

**Data classification**
- Signal: P3 (vault owner; relay moderators with case).
- Rollup counts: P3 counts per kind without sources.

**Retention**
- Signals: until expiresAt, at most 365 days (RET-STANDARD).
- Rollup counts: 365 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Fake disputes or no-shows to smear a rival | single events have bounded weights (≤ 40), decay, and need verified source events; repeated signals from one counterparty are capped at 3 per 30 days |
| T02 | Hidden permanent blacklist | maximum lifetime 365 days; counts shown to the subject; no global sharing |
| T03 | Moderator planting manual signals | manual weight capped at 20 per subject per 30 days and audited |
| T04 | Tampering with stored signals | append-only trigger, hash of rows in daily audit digest on the relay |
| T05 | Re-identification through signal queries | queries return categories and counts to non-moderators and only for own history |

**Abuse controls**
- Per-source cap: signals from one source key for one subject count at most 3 times in 30 days.
- Manual signals limited to 10 per day per author via F12.S03.M03.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-101-09.T07 | abuse | PS-101-07.R03, PS-101-02.R03 | 4th signal from the same source in 30 days; manual weight above cap | 4th ignored for scoring; SIGNALS_MANUAL_CAP |
| TEST-PS-101-09.T08 | integration | PS-101-01.R02, PS-101-03.R03, PS-101-07.R02 | daily sweep at expiry and subject deletion | rows purged, rollup counts kept; vault signals removed on deletion |
| TEST-PS-101-09.T10 | abuse | PS-101-07.R01, PS-101-07.R03 | UPDATE and DELETE on signal rows | aborted by trigger |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
