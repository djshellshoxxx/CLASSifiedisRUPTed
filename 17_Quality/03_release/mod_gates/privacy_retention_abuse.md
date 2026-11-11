# PS-143-07 — Privacy, retention and abuse: Release gates

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M02 Release gates](SPEC.md) · **Scope:** MVP · **Code:** `tools/gates` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-143-07.R01** Reports contain package names and advisory IDs from the audit and test IDs; no user data.
- **PS-143-07.R02** Waivers are public in the repository and carry no personal data beyond a GitHub handle.
- **PS-143-07.R03** Gate reports are retained with the release artifacts for 1 year.

## Specification

**Data classification**
- Package names, advisory IDs, test IDs, requirement IDs.
- No user data.

**Retention**
- Release reports kept with release artifacts for 1 year; CI copies 30 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Release forced through by editing the gate or waivers | gates and waivers are code-owned, waivers expire in 14 days and are listed in the report |
| T02 | Fake test titles to satisfy traceability | gate counts only tests present in a JUnit report as passed and whose spec row lists the requirement |
| T03 | Stale green reports reused | evidence must match the commit SHA and be under 24 h old |
| T04 | Coverage padded by listing unrelated requirements in a test row covers | a mapping counts only with a shared key term or a code-owner approved mapping review whose text hash still matches (QUALITY_GATE_TRACE_MAPPING) |
| T05 | Unreviewed or tampered governance seed pack shipped as bundled, which F18 applies without policy decisions | signature by the release-pinned projectPublisherDid and a cid equal to the code-owner approved release review are required (QUALITY_GATE_GOVERNANCE_BUNDLE) |

**Abuse controls**
- A gate may not be disabled by environment variable in the release workflow; only waivers are allowed.
- The audit gate ignores nothing silently: ignored advisories need a waiver.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-143-09.T10 | integration | PS-143-07.R01, PS-143-07.R02, PS-143-07.R03 | inspect reports for data and retention config | only package, advisory, test IDs; handles only in waivers; retention 1 year |

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, CTR-SCH-001, F17.S01.M01, F17.S01.M04, F17.S02.M01, F17.S03.M03, CTR-FED-001, F18.S01.M01, F18.S01.M02, F18.S01.M03. Predecessor: [domain_schema.md](domain_schema.md).
