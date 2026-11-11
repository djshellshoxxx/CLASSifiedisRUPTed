# PS-134-04 — Commands, queries and events: E2E testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M04 E2E testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/e2e` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-134-04.R01** The module exposes pnpm test:e2e, pnpm test:e2e --project=pixel7, pnpm test:e2e --grep <TEST ID>, pnpm test:e2e:a11y and pnpm test:e2e:budgets, which writes reports/pwa-budgets.json (classrup-pwa-budget-report/v1 with commitSha, profile, lcpMs, inpMs, cls, initialJsGzipBytes) for the release gates.
- **PS-134-04.R02** Exit codes: 0 pass, 1 test failure, 2 accessibility violation, 3 configuration failure.
- **PS-134-04.R03** The suite consumes the PWA build artifact path from env PWA_DIST and fails when the directory is missing.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| QUALITY_E2E_CONFIG_INVALID | 422 | no | Playwright version or device projects differ from the pinned set (exit 3) |
| QUALITY_E2E_ENV_MISSING | 422 | no | Chromium path or PWA build directory missing (exit 3) |
| QUALITY_E2E_A11Y_VIOLATION | 422 | no | axe found a serious or critical violation (exit 2) |
| QUALITY_E2E_CONSOLE_ERROR | 422 | no | unexpected console error during a journey (exit 1) |
| QUALITY_E2E_BUDGET_EXCEEDED | 422 | no | PWA budget from OBS-5 exceeded (exit 1) |
| QUALITY_E2E_RELAY_REQUIRED | 422 | no | a core journey failed or blocked because no relay was configured (exit 1) |
| QUALITY_E2E_TEST_ENDPOINT_IN_PROD | 422 | no | a test-only route or hook (clock, seed) is present in a production relay build (exit 1) |
| QUALITY_E2E_AUTH_UX_INVALID | 422 | no | identity screen breaks UX-5 or shows account, sign-up or login wording (exit 1) |
| QUALITY_E2E_FLAKY | 422 | no | a test needed a retry in more than 3 of the last 20 CI runs (exit 1) |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Tooling module: exposes no relay commands or queries and emits no domain events; the interface is the pnpm scripts and CLI exit codes listed in the example.

### Example

```
$ PWA_DIST=apps/pwa/dist pnpm test:e2e --project=pixel7 --grep TEST-PS-134-09.T06
  TEST-PS-134-09.T06 offline offer: one OutboxEntry (cid sha256-Xq1...) survives reload; seller vault applied once   OK (6.2 s)
    labels: Saved on this device -> Delivered to relay, peer has not confirmed -> Confirmed by peer
$ pnpm test:e2e:budgets
  pixel7  LCP 1.9 s  INP 140 ms (open listing, tap Make offer)  CLS 0.03  initial JS 131 KiB gzip  OK  reports/pwa-budgets.json
$ pnpm test:e2e:a11y
  screens 14, serious 0, critical 0, moderate 2  exit 0
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-134-09.T07 | unit | PS-134-04.R01, PS-134-04.R02, PS-134-04.R03 | invoke documented scripts | exit codes as documented and PWA_DIST missing yields exit 3 |

## Dependencies

Module depends on: CTR-TST-001, CTR-UX-001, CTR-OBS-001, CTR-IDM-001, CTR-CAP-001, CTR-PRV-001, F17.S01.M01, F15.S01.M01, F15.S01.M02, F14.S01.M03, F07.S01.M01, F07.S01.M02, F07.S01.M03, F11.S01.M02, F01.S04.M01. Predecessor: [domain_schema.md](domain_schema.md).
