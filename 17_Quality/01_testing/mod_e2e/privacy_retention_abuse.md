# PS-134-07 — Privacy, retention and abuse: E2E testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M04 E2E testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/e2e` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-134-07.R01** Traces and screenshots are retained 14 days in CI and are scrubbed of Authorization headers and request bodies for P2–P4 endpoints.
- **PS-134-07.R02** Test data are synthetic and locations are rendered at coarse L2.
- **PS-134-07.R03** The suite asserts no P3 value (exact address) appears in the DOM of public pages or in page URLs.

## Specification

**Data classification**
- Traces and screenshots may contain synthetic P0–P2 data only.
- axe reports contain DOM selectors, not user data.

**Retention**
- Playwright report, traces and axe JSON retained 14 days in CI; local test-results/ is git-ignored.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Trace reveals tokens or secrets | trace config redacts Authorization and cookies; accounts are synthetic and short-lived |
| T02 | Tests pass only because accessibility checks are skipped | every journey calls the shared a11y helper in its teardown; a self-test fails the run if a screen was visited without axe |
| T03 | Dependency on remote services makes tests flaky or leaks data | route handlers abort any request not to the local relay or dist server |

**Abuse controls**
- Network is limited to localhost; any external request fails the test with QUALITY_E2E_CONSOLE_ERROR.
- Test-only endpoints exist only in the e2e relay profile and are disabled in production builds.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-134-09.T02 | e2e | PS-134-01.R03, PS-134-07.R01 | force a failing test | artifacts only under test-results/, and Authorization headers are redacted in the trace |
| TEST-PS-134-09.T09 | abuse | PS-134-05.R03, PS-134-07.R02 | scan trace and DOM of public page for token, exact address canary | none found; public pages show max L2 location |
| TEST-PS-134-09.T11 | e2e | PS-134-07.R03 | view public listing page | no P3 value in DOM or URL |

## Dependencies

Module depends on: CTR-TST-001, CTR-UX-001, CTR-OBS-001, CTR-IDM-001, F17.S01.M01, F15.S01.M01, F15.S01.M02, F14.S01.M03. Predecessor: [domain_schema.md](domain_schema.md).
