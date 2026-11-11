# PS-148-09 — Contract and acceptance tests: Transparency reports

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M02 Transparency reports](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/transparency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-148-09.R01** Every requirement is covered by at least one automated test.
- **PS-148-09.R02** Contract tests validate the report statement, commands and events against the registry and verify signatures.
- **PS-148-09.R03** Suppression is covered by property tests with at least 200 runs, 10 000 nightly, including differencing attacks.

## Specification

See the module test table below (all processes).

**Fixtures:** Operator vaults O1 (compiler) and O2 (reviewer), relay stub, counters for 2026-Q3 with cells of 3, 7, 12, 45 and total 67, 5 duplicate events, clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-148-09.T01 | unit | PS-148-01.R01, PS-148-01.R02, PS-148-02.R01 | compute 2026-Q3 | report immutable with contentCid; counters hold closed-vocabulary dimensions only |
| TEST-PS-148-09.T02 | unit | PS-148-02.R02, PS-148-02.R03 | violate each rule V01-V09 | documented error code returned; nothing published |
| TEST-PS-148-09.T03 | property | PS-148-01.R03 | random counter tables | no published cell between 1 and 9; complementary suppression prevents recovery from totals; total under 10 hides all breakdowns |
| TEST-PS-148-09.T04 | property | PS-148-03.R01, PS-148-03.R03 | random lifecycle commands | only declared transitions; one published version per period; corrections supersede |
| TEST-PS-148-09.T05 | integration | PS-148-03.R02, PS-148-05.R02 | same key publishes; reviewer different key publishes | GOVERNANCE_TRANSPARENCY_SELF_REVIEW for the same key; success for O2 |
| TEST-PS-148-09.T06 | contract | PS-148-04.R01, PS-148-04.R03, PS-148-09.R02 | compute, publish, receive | statement validates against classrup.governance.transparency_report/v1, signature verifies, published event valid |
| TEST-PS-148-09.T07 | integration | PS-148-04.R02, PS-148-06.R01 | deliver the same moderation events twice and out of order | counts equal unique events; consumer idempotent |
| TEST-PS-148-09.T08 | abuse | PS-148-05.R01, PS-148-05.R03 | member reads counters; non-operator computes; relay upload with unknown key | FORBIDDEN or NOT_FOUND; relay refuses upload |
| TEST-PS-148-09.T09 | chaos | PS-148-06.R03 | upload fails after signing; operator offline in the middle of the period | published locally with pending delivery and not shown publicly; coverage percent below 100 stated |
| TEST-PS-148-09.T10 | integration | PS-148-06.R01, PS-148-06.R02 | replay compute and publish with same key; recompute with same counters | same contentCid; one published report |
| TEST-PS-148-09.T11 | abuse | PS-148-07.R01, PS-148-07.R02, PS-148-07.R03 | scan report, counters, logs for identifiers; delete after 90 days | no identifiers or free text; counters purged 90 days after publication |
| TEST-PS-148-09.T12 | abuse | PS-148-07.R03 | legal request with free text; 101 increments in a day | rejected by schema; RATE_LIMITED; scope key present in body |
| TEST-PS-148-09.T13 | load | PS-148-08.R01, PS-148-08.R02, PS-148-08.R03 | 1 000 000 counted events; relay 50 req/s | compute p95 <= 2 s, publish p95 <= 300 ms, download p95 <= 150 ms |
| TEST-PS-148-09.T14 | unit | PS-148-09.R01, PS-148-09.R03 | traceability tool run, nightly seeds | every PS-148 requirement maps to a passing test |
| TEST-PS-148-09.T15 | integration | PS-148-10.R01, PS-148-10.R02, PS-148-10.R03 | export operator vault, import to fresh vault, import tampered report | reports round-trip; tampered statement quarantined; cell between 1 and 9 rejected |
| TEST-PS-148-09.T16 | a11y | PS-148-01.R01 | axe run on public report page | zero serious or critical issues; suppressed cells read as fewer than ten |

## Acceptance criteria

- All tests T01-T16 pass in CI.
- No published cell reveals a count between 1 and 9 directly or by differencing, and totals under 10 hide all breakdowns.
- Every published report is signed by one operator key, reviewed by a different operator key, states its hosting scope and coverage, and corrections never overwrite earlier versions.

## Dependencies

Module depends on: F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
