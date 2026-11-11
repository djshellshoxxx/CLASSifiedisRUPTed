# PS-076-07 — Privacy, retention and abuse: Privacy consent

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M01 Privacy consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/consent` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-076-07.R01** Consent records are P3 and never leave the vault except the signed statement to the named relay and the user's own export.
- **PS-076-07.R02** Consent is never pre-ticked, bundled or inferred, and each purpose is a separate decision with its own text.
- **PS-076-07.R03** The UI states the limits of withdrawal, namely that future processing stops, copies already fetched by other vaults and relays cannot be recalled.

## Specification

**Data classification**
- PrivacyConsent: P3. Signed statement to relay: purpose, scope, policy hash, did and times, P2 to that relay.

**Retention**
- RET-EVIDENCE (2 years after withdrawal) as proof of consent; deletable earlier on account deletion except under a relay-side legal hold.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Dark pattern obtains consent by default | all purposes off by default, no pre-ticked controls, separate text per purpose, tested by a UI test |
| T02 | Module processes without checking consent | single check function, lint rule requiring a check call in code paths tagged with a purpose, integration tests per consumer |
| T03 | Relay keeps indexing after withdrawal | signed withdrawal statement, relay obligation to honour tombstones (PRV-6), UI states copies cannot be recalled |
| T04 | Consent replay or forgery toward a relay | statements signed over JCS with Ed25519 and carrying policy hash and times; relays verify and dedupe by cid |

**Abuse controls**
- Grant and withdraw limited to 30 per hour per vault; consent statements to a relay limited to 20 per hour.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-076-09.T04 | unit | PS-076-02.R03, PS-076-07.R01 | fresh vault, check every purpose | all return granted false |
| TEST-PS-076-09.T12 | abuse | PS-076-07.R02, PS-076-07.R03 | 31 grants in an hour; UI inspection of the grant sheet | 31st RATE_LIMITED; no pre-ticked control; limits of withdrawal stated |
| TEST-PS-076-09.T14 | a11y | PS-076-07.R02, PS-076-01.R03 | privacy settings and grant sheet | axe zero serious issues; keyboard-only completion; switches announced |

## Dependencies

Module depends on: F07.S01.M01, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
