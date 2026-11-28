# PS-110-06 — Failure recovery and idempotency: Screen reader support

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M02 Screen reader support](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/screenreader` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-110-06.R01** Announcing the same message twice within 2 s results in one announcement.
- **PS-110-06.R02** If a locale lacks a spoken-name pattern, the helper falls back to English patterns and logs a development warning, never to an empty string.
- **PS-110-06.R03** Helpers are pure and return Result<string, AppError> - Ok for every valid typed input, Err(COMMERCE_MONEY_INVALID) for a malformed amount and Err(COMMERCE_CURRENCY_UNKNOWN) when the caller found no CurrencyDef - and components render the localized error text on Err, so a value is never silent and never spoken as raw minor-unit digits.

## Specification

- **idempotency:** announce() de-duplicates identical text per region within 2 s; helpers are pure functions.
- **concurrency:** Single-threaded UI; the announcer serializes messages per region in a queue of at most 3.
- **retries:** Not applicable; no network or storage operations.
- **offline:** Fully offline; all patterns are bundled in the locale catalogs.
- **partial failure:** spokenMoney has no separate Intl fallback: on Err from F14.S02.M02 or a missing CurrencyDef the component speaks the localized 'amount unavailable' or 'amount unavailable, unknown currency {code}' text, never minor-unit digits; an unknown SyncState value returns Err(VALIDATION_FAILED) and the component speaks the 'Needs attention' text.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-110-09.T04 | property | PS-110-03.R01, PS-110-03.R02, PS-110-03.R04, PS-110-06.R01, PS-110-07.R04 | random sequences of announce() calls (200 runs), plus 1 000 distinct polite messages with one coalesce key within 1 s, plus messages left queued for 11 s | at most one message per 2 s per region; assertive never interrupted by polite; duplicates dropped; queue never exceeds 3; at most 4 announcements for the 1 000 messages and the last is the '{count} updates' summary; stale messages dropped |
| TEST-PS-110-09.T07 | unit | PS-110-06.R02, PS-110-06.R03 | missing locale pattern; unregistered code XYZ with spec null; BTC and ETH amounts with their CurrencyDef | English fallback with dev warning; Err(COMMERCE_CURRENCY_UNKNOWN) rendered as 'amount unavailable, unknown currency XYZ'; BTC and ETH spoken with 8 and 18 decimals; never empty and never raw minor-unit digits |

## Dependencies

Module depends on: F14.S02.M01, F14.S02.M02, F09.S03.M01, F09.S03.M03, F06.S02.M01, F15.S01.M01, CTR-UX-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
