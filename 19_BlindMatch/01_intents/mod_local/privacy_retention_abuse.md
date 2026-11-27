# PS-149-07 — Privacy, retention and abuse: Private local intents

**Status:** SPECIFIED (Stage 3). **Module:** [F19.S01.M01 Private local intents](SPEC.md) · **Scope:** FUTURE · **Code:** `packages/blindmatch/src/intents/local` · **Contracts:** [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-149-07.R01** Keep private criteria, identifiers and amounts out of logs, network requests, URLs, notifications and public projections.
- **PS-149-07.R02** Erase the local intent immediately without retaining an identifying deletion event, hash or tombstone.
- **PS-149-07.R03** Limit erasure to local intents and ephemeral results; independent backups, peer copies and physical remnants remain outside scope.

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
| TEST-PS-149-09.T07 | integration | PS-149-07.R01, PS-149-07.R02, PS-149-07.R03 | Erase while matching is pending, reopen the vault and inspect storage/backup coverage | Intent is absent; no identifying deletion record is added; independent copies are outside scope |

## Dependencies

Module depends on: F15.S02.M03, CTR-ERR-001, CTR-PRV-001, CTR-IOX-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
