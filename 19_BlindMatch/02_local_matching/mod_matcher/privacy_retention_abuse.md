# PS-150-07 — Privacy, retention and abuse: Bounded local matching

**Status:** SPECIFIED (Stage 3). **Module:** [F19.S02.M01 Bounded local matching](SPEC.md) · **Scope:** FUTURE · **Code:** `packages/blindmatch/src/local_matching/matcher` · **Contracts:** [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-150-07.R01** Keep private criteria inside unlocked local computation and require a network-free candidate loader.
- **PS-150-07.R02** Persist no results, query logs, negative explanations, deletion markers or private fingerprints.
- **PS-150-07.R03** Describe public-record comparison as local filtering, not confidential cross-user computation or anonymity.

## Specification

**Data classification**
- P3 private criteria and current state; candidates were already intentionally public.

**Retention**
- Current intents live until owner erasure; results and context tokens are ephemeral with no identifying deletion history.
- RET-OWNER-LIVE takes precedence over legacy tombstone, audit, evidence and legal-hold retention for this local intent API; no identifying deletion history is created.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | foreign owner or stale session reads private content | owner-scoped storage and session guards |
| T02 | old backup silently resumes processing | restored intents are draft and jobs are never persisted |
| T03 | private query reaches a loader or log | loader gets signal and limit only; logging is absent |

**Abuse controls**
- Bound input/output and refuse nonlocal modes without any implicit disclosure authority.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-150-09.T07 | unit | PS-150-07.R01, PS-150-07.R02, PS-150-07.R03 | Spy on logging/network APIs and inspect outputs and persisted tables | Criteria, amounts, negative explanations and identifying markers are absent from outputs and side effects |

## Dependencies

Module depends on: F19.S01.M01, F06.S01.M01, CTR-ERR-001, CTR-PRV-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
