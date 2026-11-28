# PS-142-04 — Commands, queries and events: Compatibility

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M03 Compatibility](SPEC.md) · **Scope:** MVP · **Code:** `tests/compat` · **Contracts:** [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-142-04.R01** The module exposes pnpm test:compat (N-1 data and API), pnpm test:compat:browsers (automated matrix, nightly and release), pnpm compat:schema-diff and pnpm compat:checklist <version>, which merges the signed manual cells from gates/manual/<version>/ into reports/compat.json.
- **PS-142-04.R02** Exit codes: 0 pass, 1 compatibility failure, 2 matrix cell failure, 3 configuration failure.
- **PS-142-04.R03** The OpenAPI diff compares the generated relay spec of the previous release tag with the working tree and fails on removed paths, removed fields or changed types.

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
| QUALITY_COMPAT_N1_READ_FAILED | 422 | no | current release cannot read an N-1 fixture (exit 1) |
| QUALITY_COMPAT_BREAKING_CHANGE | 422 | no | schema change breaks N-1 compatibility (exit 1) |
| QUALITY_COMPAT_SIGNATURE_BROKEN | 422 | no | N-1 signature no longer verifies (exit 1) |
| QUALITY_COMPAT_UPGRADE_UNSAFE | 422 | no | vault upgrade lost or duplicated records (exit 1) |
| QUALITY_COMPAT_BROWSER_FAILED | 422 | no | a browser matrix cell failed (exit 2) |
| QUALITY_COMPAT_API_BREAKING | 422 | no | relay API diff shows a breaking change (exit 1) |
| QUALITY_COMPAT_EXT_UNSAFE | 422 | no | a reader drops unknown payload keys, alters or over-admits ext, or accepts an unknown critical ext key (exit 1) |
| QUALITY_COMPAT_ROLLBACK_UNSAFE | 422 | no | N-1 rollback after an IndexedDB version bump loses records, opens partially or offers no restore (exit 1) |
| QUALITY_COMPAT_MATRIX_MISLABELED | 422 | no | a matrix cell lacks its engine source and version or an automated cell is labelled as a real Safari or Firefox stable release (exit 3) |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Tooling module: exposes no relay commands or queries and emits no domain events; the interface is the pnpm scripts and CLI exit codes listed in the example.

### Example

```
$ pnpm test:compat
  fixtures 0.2.x -> 0.3.0: 842 records upgraded, 842 valid, 311 signatures verified  OK
  schema diff: 1 additive field (mutiny.proposal.note)  OK
  openapi diff: 0 breaking  OK
$ pnpm test:compat:browsers
  automated: chrome 150 (Chrome for Testing) OK | chrome 149 (Chrome for Testing) OK | chrome-beta 151 (Playwright channel) OK
             firefox-engine Gecko 142.0 (Playwright build) OK | webkit-engine WebKit 26.0 (Playwright build, Safari-engine proxy) OK
             webkit-engine push: feature-detect and content-free payload format OK
  manual (gates/manual/0.3.0/): firefox 142, 141 | safari 26, 18 (macOS) | ios-safari 26, 18 | iOS 16.4+ installed-PWA push  -> pending checklist
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-142-09.T07 | unit | PS-142-04.R01, PS-142-04.R02, PS-142-04.R03 | run scripts; diff OpenAPI of previous tag and working tree with a removed field | documented exit codes; QUALITY_COMPAT_API_BREAKING for removed field |

## Dependencies

Module depends on: CTR-SCH-001, CTR-ERR-001, CTR-FED-001, CTR-IOX-001, CTR-TST-001, CTR-OBS-001, F17.S01.M01, F15.S02.M03, F11.S01.M02, F11.S01.M03, F10.S01.M03. Predecessor: [domain_schema.md](domain_schema.md).
