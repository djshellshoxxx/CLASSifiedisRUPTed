# PS-067-06 — Failure recovery and idempotency: Cash payments

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M02 Cash payments](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/cash` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-067-06.R01** All three commands are idempotent per CTR-IDM-001 and use expectedRevision.
- **PS-067-06.R02** Concurrent proposals from several tabs serialize and the later one supersedes the earlier one.
- **PS-067-06.R03** Statement delivery uses the sync outbox states and the UI never shows terms as agreed before peer_accepted.

## Specification

- **idempotency:** Vault command ID recorded for 24 h; terms, accept and decline statements dedupe by cid; default terms are created once per obligation, keyed by their deterministic termsCid.
- **concurrency:** expectedRevision on set (in-force terms), accept and decline; unique partial index for one accepted terms per obligation; Web Lock commerce-cash per Deal; the superseding of accepted terms happens in the acceptance transaction only.
- **retries:** Sync outbox retry 5 s, 30 s, 5 min, 1 h, then every 6 h until terms expire.
- **offline:** Propose, accept and decline commit locally and show prepared; delivery resumes online; the terms in force do not change until the acceptance is committed locally.
- **partial failure:** If sending fails after local commit the terms stay proposed locally with sync state prepared; the user sees that the peer has not received them.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-067-09.T08 | integration | PS-067-06.R01, PS-067-06.R02, PS-067-06.R03 | replay of a command ID and interrupted delivery | original result; UI shows prepared until peer_accepted |

## Dependencies

Module depends on: F09.S01.M01, F09.S02.M01, F09.S03.M03, F18.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
