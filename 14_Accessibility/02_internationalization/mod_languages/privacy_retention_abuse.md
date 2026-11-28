# PS-113-07 — Privacy, retention and abuse: Languages

**Status:** SPECIFIED (Stage 3). **Module:** [F14.S02.M01 Languages](SPEC.md) · **Scope:** MVP · **Code:** `packages/i18n/src/internationalization/languages` · **Contracts:** [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-113-07.R01** The chosen locale is a mild fingerprinting signal, so it stays in the vault and is sent to a relay only as a copy inside the opted-in email registration of F13.S01.M02 (consent purpose notify_email, F10.S01.M01), to that one user-selected email relay, and never otherwise; the browser's own Accept-Language header is outside the app's control.
- **PS-113-07.R02** User-provided text is inserted into messages as plain text only, preventing injection through parameters.
- **PS-113-07.R03** Missing-key diagnostics are written through the F15.S03.M01 logger into its in-memory ring buffer as P0 entries holding only the catalog key and locale tag; they are cleared on reload and leave the device only when the user explicitly exports diagnostics.
- **PS-113-07.R04** t() and tp() wrap every string parameter in FSI…PDI (U+2068…U+2069) and remove unpaired U+202A–U+202E and U+2066–U+2069 characters, and every U+202D or U+202E override, inside parameters at render time, whatever the sending vault did, because received titles and names come from other vaults that may be adversarial.

## Specification

**Data classification**
- Locale preference: P1 field defaultLocale of F15.S04.M03 LocalSettings, device only; this module reads it and stores nothing.
- Locale copy in the email registration: sent with the address only to the user-selected email relay after notify_email consent (F10.S01.M01); held there under F13.S01.M02 rules.
- Missing-key diagnostics: P0 entries {key, locale} in the F15.S03.M01 in-memory ring buffer; no user data.

**Retention**
- This module stores nothing; LocalSettings retention belongs to F15.S04.M03; missing-key diagnostics last for the page lifetime, until reload or user clear, and leave the device only in a user-initiated diagnostics export.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Injection through message params (HTML or parameter syntax in user text) | params are escaped as text and never re-parsed; React-style text rendering only |
| T02 | Right-to-left override characters in received titles and names used to spoof text | t() and tp() wrap every string parameter in FSI…PDI and remove unpaired U+202A–U+202E and U+2066–U+2069 and every U+202D/U+202E override inside parameters at render time, whatever the sender did; numbers are isolated the same way |
| T03 | Locale-based fingerprinting | no locale telemetry; no locale in URLs because all production catalogs are precached together at service-worker install; the chosen locale reaches a relay only in the F13.S01.M02 email registration after notify_email consent, to that one user-selected relay; the browser's own Accept-Language header is outside the app's control |

**Abuse controls**
- Catalogs are static and reviewed in pull requests; user content can never add or change catalog entries.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-113-09.T04 | unit | PS-113-03.R02, PS-113-06.R02, PS-113-06.R03, PS-113-07.R03 | remove a key from fr at runtime; corrupt the de catalog JSON; call t() without a declared parameter; reload the page | en string returned with dev warning and a P0 {key, locale} entry in the F15.S03.M01 ring buffer; UI continues in en; missing parameter shown as '…' with dev warning; never raw key or blank; ring buffer empty after reload |
| TEST-PS-113-09.T07 | abuse | PS-113-07.R02, PS-113-07.R04 | params with <script>, {name} and bidi override characters; a received listing title containing U+202E displayed inside the catalog message listing.title_by | rendered as inert text; parameters not re-evaluated; every string parameter wrapped in U+2068…U+2069; unpaired U+202E removed; surrounding message text keeps its logical order |
| TEST-PS-113-09.T10 | abuse | PS-113-07.R01, PS-113-07.R03, PS-113-05.R03 | capture all network traffic during locale switch, catalog loads, push alert rendering, diagnostics export and the email opt-in with and without notify_email consent | no request carries the chosen locale except the F13.S01.M02 notify.email.add registration, which after consent carries exactly the chosen locale to that one user-selected relay; without consent it is not sent; catalog loads come from the precache; diagnostics leave only in the user-initiated export; the locale change is written only through platform.local_settings.update |

## Dependencies

Module depends on: F15.S04.M03, F15.S03.M01, F15.S01.M02, CTR-UX-001, CTR-TST-001, CTR-OBS-001, CTR-ERR-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
