# PS-110-04 — Commands, queries and events: Screen reader support

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S01.M02 Screen reader support](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/a11y/screenreader` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-110-04.R01** The module exposes component and helper APIs and no vault or relay commands or queries.
- **PS-110-04.R02** It emits DOM events only and no domain events.
- **PS-110-04.R03** Failures are developer-facing lint and test codes and never shown to end users.

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
| I18N_A11Y_LANDMARKS | 400 | no | landmark or heading structure rule failed |
| I18N_A11Y_FORM_LABEL | 400 | no | form control lacks a name or error association |
| I18N_A11Y_NAME_MISSING | 400 | no | interactive element without accessible name |
| I18N_A11Y_ALT_TEXT | 400 | no | photo alt text missing or longer than 140 characters |
| I18N_A11Y_LIVE_REGION | 400 | no | live region misuse or announcement flood |
| I18N_A11Y_SPOKEN_VALUE | 400 | no | value displayed without a spoken name |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** API: <PageShell/>, <Field/> with label hint error, <ErrorSummary/>, announce(message, { priority, region }), spokenMoney(money, locale, opts), spokenDistance(bucket, locale), spokenTime(instant, now, locale), spokenSync(state, locale), <Photo alt/>.

### Example

```
spokenMoney({ amount: "4500", currency: "EUR" }, "en") // "45 euros"
spokenMoney({ amount: "4210", currency: "EUR" }, "en", { approximate: { source: "ECB", asOf: "2026-11-04T10:15:00Z" } })
  // "approximately 42 euros 10 cents, quote from ECB at 10:15"
spokenDistance("<5km", "en") // "less than 5 kilometres away"
announce(t("offer.saved_local"), { priority: "polite", region: "status" })
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-110-09.T05 | contract | PS-110-04.R01, PS-110-04.R02, PS-110-04.R03, PS-110-01.R03 | inspect exports and run spoken helpers on typed inputs | no vault or network access; pure typed functions; Result for invalid input |
| TEST-PS-110-09.T11 | e2e | PS-110-03.R02, PS-110-04.R01 | VoiceOver on iPhone 14 and TalkBack on Pixel 7 manual-assisted run of listing create and offer flows | landmarks navigable, values spoken in full, status announced without focus loss |

## Dependencies

Module depends on: F14.S02.M01, F14.S02.M02, CTR-UX-001, CTR-MNY-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001. Predecessor: [domain_schema.md](domain_schema.md).
