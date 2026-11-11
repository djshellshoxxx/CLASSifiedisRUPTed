# PS-101-03 — Workflow state machine: Fraud signals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M02 Fraud signals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/signals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-101-03.R01** A signal has no transitions; it is valid from observedAt until expiresAt and read with decay applied.
- **PS-101-03.R02** Decay is exponential, weight times 0.5 to the power of age over half-life, evaluated at read time in the store clock.
- **PS-101-03.R03** Expired signals are purged by a daily sweep and a rollup keeps only counts per kind for 365 days.

## Specification

**Note:** Signals are immutable records without a lifecycle; expiry is time-based and does not change stored fields.

### Timeouts and scheduled transitions

- Daily purge sweep at 04:00 UTC (relay) or on app idle once per 24 h (vault) removes rows past expiresAt through the RetentionPurgePort and writes counts per kind to a rollup row.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-101-09.T02 | property | PS-101-01.R03, PS-101-03.R01, PS-101-03.R02 | random signal sets and times | decayed weight equals w × 0.5^(age/h); order of ingestion does not change totals; no row changes after insert |
| TEST-PS-101-09.T08 | integration | PS-101-03.R03, PS-101-07.R02 | injected clock past expiresAt; counterparty B's deletion tombstone; P's own privacy.deletion.completed; relay applies B's signed deletion request | rows purged through the RetentionPurgePort and rollup counts kept; B's tombstone removes nothing in P's vault; P's deletion removes P's vault signals; relay signals about B pseudonymized |

## Dependencies

Module depends on: F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
