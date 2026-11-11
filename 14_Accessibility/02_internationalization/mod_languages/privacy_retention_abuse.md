# PS-113-07 — Privacy, retention and abuse: Languages

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M01 Languages](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/languages` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-113-07.R01** The chosen locale is a mild fingerprinting signal, so it is stored only in the vault and never sent to relays except as the standard Accept-Language header the browser already sends.
- **PS-113-07.R02** User-provided text is inserted into messages as plain text only, preventing injection through parameters.
- **PS-113-07.R03** Missing-key diagnostics stay on the device in local diagnostics and are not transmitted.

## Specification

**Data classification**
- Locale preference: P3 vault setting.
- Missing-key diagnostics: P3 local diagnostics, exportable by the user.

**Retention**
- Locale setting kept until the user changes it; diagnostics kept 30 days locally (RET-SHORT).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Injection through message params (HTML or parameter syntax in user text) | params are escaped as text and never re-parsed; React-style text rendering only |
| T02 | Right-to-left override characters used to spoof text | bidi control characters are stripped from user-visible titles and names at input by the owning feature, and numbers are isolated with FSI and PDI |
| T03 | Locale-based fingerprinting | no locale telemetry; no locale in URLs; locale only in the vault and the browser's own header |

**Abuse controls**
- Catalogs are static and reviewed in pull requests; user content can never add or change catalog entries.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-113-09.T07 | abuse | PS-113-07.R02, PS-113-07.R01 | params with <script>, {name} and bidi override characters | rendered as inert text; parameters not re-evaluated; bidi isolated |
| TEST-PS-113-09.T08 | e2e | PS-113-01.R03, PS-113-02.R03, PS-113-07.R01 | run all routes in en-XA (40 percent expansion) and ar-XB at 320 px | no clipping, overlap or horizontal scroll; layout mirrored; V06 passes |
| TEST-PS-113-09.T10 | abuse | PS-113-07.R01, PS-113-07.R03, PS-113-05.R03 | capture network traffic during locale switch and diagnostics export | locale not transmitted by the app; diagnostics only in user-initiated export |
| TEST-PS-113-09.T11 | a11y | PS-113-07.R03, PS-113-03.R03 | axe in each shipped locale and pseudolocale | zero serious or critical findings; lang attributes correct on inline foreign text |

## Dependencies

Module depends on: CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
