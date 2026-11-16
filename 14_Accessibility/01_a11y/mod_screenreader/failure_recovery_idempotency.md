# PS-110-06 — Failure recovery and idempotency: Screen reader support

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M02 Screen reader support](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/screenreader` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-110-06.R01** Announcing the same message twice within 2 s results in one announcement.
- **PS-110-06.R02** If a locale lacks a spoken-name pattern, the helper falls back to English patterns and logs a development warning, never to an empty string.
- **PS-110-06.R03** Helpers are pure and total, returning a string for every valid typed input.

## Specification

- **idempotency:** announce() de-duplicates identical text per region within 2 s; helpers are pure functions.
- **concurrency:** Single-threaded UI; the announcer serializes messages per region.
- **retries:** Not applicable; no network or storage operations.
- **offline:** Fully offline; all patterns are bundled in the locale catalogs.
- **partial failure:** If the Intl formatter throws for an unknown currency, spokenMoney falls back to digits plus the currency code spelled out, so the value is never silent.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-110-09.T04 | property | PS-110-03.R01, PS-110-03.R02, PS-110-06.R01 | random sequences of announce() calls (200 runs) | at most one message per 2 s per region; assertive never interrupted by polite; duplicates dropped |
| TEST-PS-110-09.T06 | unit | PS-110-01.R03, PS-110-06.R02, PS-110-05.R01 | spokenMoney golden values per locale including 123456789012 and -250 and approximate label | strings equal the reviewed goldens and include quote source and time when approximate |
| TEST-PS-110-09.T07 | unit | PS-110-06.R02, PS-110-06.R03 | missing locale pattern; unknown currency | English fallback with dev warning; digits plus spelled code; never empty |
| TEST-PS-110-09.T10 | a11y | PS-110-01.R01, PS-110-02.R01, PS-110-06.R01 | axe via Playwright on every screen with screen reader rule set | zero serious or critical findings |

## Dependencies

Module depends on: F14.S02.M01, F14.S02.M02, CTR-UX-001, CTR-MNY-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
