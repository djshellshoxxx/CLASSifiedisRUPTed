# PS-075-09 — Contract and acceptance tests: FX rates and quotes

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S03.M02 FX rates and quotes](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/valuation/rates` · **Contracts:** [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-075-09.R01** Every requirement is covered by at least one automated test.
- **PS-075-09.R02** Adapter behavior is tested against recorded provider fixtures with no network access in CI, and signature verification is tested with fixed relay test keys.
- **PS-075-09.R03** Expiry boundaries are tested with a controllable clock.

## Specification

See the module test table below (all processes).

**Fixtures:** Recorded ECB daily XML fixtures (fresh, 3 days old, 6 days old), manual operator O, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-075-09.T01 | unit | PS-075-01.R01, PS-075-01.R03, PS-075-02.R02 | request EUR/USD with the fixture 1.0870 token | stored rate 1087/1000, no float used, source ecb-daily |
| TEST-PS-075-09.T02 | unit | PS-075-02.R01, PS-075-02.R03 | same currency pair, unknown currency, stale 6-day-old data, 60% deviation | documented error codes returned and nothing stored |
| TEST-PS-075-09.T03 | property | PS-075-01.R01, PS-075-02.R02 | random decimal strings up to 18 fractional digits | num and den coprime and num/den equals the decimal exactly |
| TEST-PS-075-09.T04 | unit | PS-075-03.R01, PS-075-03.R02, PS-075-01.R03 | clock advanced to expiresAt and one second before | check returns valid then EXPIRED; quote never extended |
| TEST-PS-075-09.T05 | integration | PS-075-03.R03, PS-075-05.R03 | issuer revokes a manual quote already sent to a peer | local check shows revoked, revocation statement reaches prepared then peer_accepted, peer pin check reports invalid |
| TEST-PS-075-09.T06 | contract | PS-075-04.R01, PS-075-04.R02, PS-075-09.R02 | execute each command and query | outputs and events validate against registry schemas |
| TEST-PS-075-09.T07 | integration | PS-075-04.R03, PS-075-06.R01 | replayed request with same key | same quote ID returned; no second event |
| TEST-PS-075-09.T08 | abuse | PS-075-05.R01, PS-075-05.R02, PS-075-07.R02 | relay_issue by an unregistered device key; 31 relay requests in one hour; tampered relay quote | relay denies, 31st returns RATE_LIMITED, vault rejects tampered quote with COMMERCE_RATE_SIGNATURE_INVALID |
| TEST-PS-075-09.T09 | chaos | PS-075-06.R02, PS-075-06.R03 | provider times out three times | DEPENDENCY_UNAVAILABLE, falls back to live manual quote if present, cache intact |
| TEST-PS-075-09.T10 | integration | PS-075-07.R01, PS-075-07.R03, PS-075-01.R02 | inspect outbound provider request and a statement embedding a quote | request contains only the pair and no client identifiers; embedded quote carries its source signature |
| TEST-PS-075-09.T11 | load | PS-075-08.R01, PS-075-08.R02, PS-075-08.R03 | 50 req/s for 5 minutes with cache | p95 ≤ 150 ms; sweep of 100 000 quotes ≤ 3 s |
| TEST-PS-075-09.T12 | unit | PS-075-09.R01, PS-075-09.R03 | traceability tool run and boundary tests | every PS-075 requirement maps to a passing test |
| TEST-PS-075-09.T13 | integration | PS-075-10.R01, PS-075-10.R02, PS-075-10.R03 | export, re-import and downgrade | quotes round-trip identical; expired quotes import as expired |

## Acceptance criteria

- All tests T01–T13 pass in CI.
- An expired or revoked quote can never be pinned or used, and the response is always EXPIRED or an explicit invalid status.
- Every manual quote is visibly labelled manual in API output and UI.

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
