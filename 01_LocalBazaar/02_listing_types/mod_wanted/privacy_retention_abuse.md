# PS-007-07 — Privacy, retention and abuse: Wanted listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M02 Wanted listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/wanted` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-007-07.R01** The maximum budget is private by default because revealing it weakens the buyer's negotiating position; it is never in an event payload.
- **PS-007-07.R02** Wants follow RET-STANDARD with the listing; fulfilled and withdrawn wants are purged with the listing and leave a 180-day tombstone.
- **PS-007-07.R03** Wants reveal interests, so the UI states that published keywords are public and linkable to the pseudonym.

## Specification

**Data classification**
- WantSpec: P3 draft; category, keywords and conditions P0 when projected; maxBudget P3 unless budgetVisible.

**Retention**
- WantSpec: RET-STANDARD; deleted 30 days after the listing is deleted.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Budget leakage lets sellers price up | budget excluded from events and from projection unless budgetVisible; contract test checks allowlist |
| T02 | Fake wants to pollute matching or harvest offers | cap of 100 open wants, matching requires signed projection and local block lists, relay hosting policy |
| T03 | Sensitive interest disclosure through keywords | owner sees exactly what becomes public before publishing; pseudonymity is not anonymity notice |
| T04 | Keyword stuffing | at most 10 keywords of 2..40 code points; duplicates rejected |

**Abuse controls**
- At most 100 open wants and 30 define commands per hour per vault.
- Prohibited-item rules apply to keywords at publication (F01.S01.M03).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-007-09.T10 | abuse | PS-007-07.R01, PS-007-07.R02, PS-007-07.R03 | scan events, logs and projection; delete listing | budget absent everywhere; tombstone after purge; public-keywords notice present |
| TEST-PS-007-09.T11 | abuse | PS-007-07.R03 | create 101st open want and 31st define in an hour | BAZAAR_WANT_LIMIT and RATE_LIMITED |

## Dependencies

Module depends on: F01.S01.M01, F18.S01.M03, F09.S03.M01, F09.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
