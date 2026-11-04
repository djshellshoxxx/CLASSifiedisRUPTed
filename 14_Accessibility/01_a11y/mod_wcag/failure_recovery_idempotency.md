# PS-111-06 — Failure recovery and idempotency: WCAG 2.2 AA conformance

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M03 WCAG 2.2 AA conformance](SPEC.md) · **Scope:** MVP · **Code:** `tests/a11y` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-111-06.R01** Every task is deterministic and re-runnable, producing the same report for the same commit apart from timestamps.
- **PS-111-06.R02** Flaky browser failures are retried once and reported as flaky if the retry passes, without hiding real findings.
- **PS-111-06.R03** Partial runs never mark a build green; a missing report fails the gate.

## Specification

- **idempotency:** Tasks are pure functions of the commit and fixtures; re-running overwrites the report.
- **concurrency:** Axe runs are sharded across at most 4 parallel Playwright workers; each route-state-theme combination is an independent job.
- **retries:** A failed browser launch or navigation timeout retries once; assertion failures are never retried.
- **offline:** CI uses a seeded offline-capable fixture server; no external network is needed for the checks.
- **partial failure:** If a shard crashes, the aggregator marks the run failed with the missing combinations listed.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-111-09.T09 | chaos | PS-111-06.R01, PS-111-06.R02, PS-111-06.R03 | kill one Playwright shard; inject a flaky navigation timeout | run marked failed listing missing combinations; flaky retry reported, real findings not hidden |
| TEST-PS-111-09.T10 | unit | PS-111-06.R01, PS-111-07.R01, PS-111-07.R02 | run twice on the same commit; scan report for page text or user data | identical findings; reports contain selectors and rule ids only |

## Dependencies

Module depends on: F14.S01.M01, F14.S01.M02, F14.S02.M01, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
