# PS-147-10 — Import, export, backup and rollback: Community governance

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M01 Community governance](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/governance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-147-10.R01** The user export contains proposals and decisions from trusted publishers, own comments and, for publishers, their drafts and signing history.
- **PS-147-10.R02** Import re-verifies every signature, role and the equivocation check; failing statements are quarantined.
- **PS-147-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Sections governance.policy_proposals and governance.policy_comments in classrup-export/v1, one line per record (schemas classrup.governance.policy_proposal/v1 and classrup.governance.policy_comment/v1) plus signed statements.
- **import:** Signatures and authority-list membership re-verified; decisions older than 30 days import as evidence but verify returns expired; conflicting statements import flagged conflicted.
- **backup:** Vault export is the primary backup (IOX-6); the publisher's relay holds public copies that can be re-fetched by any vault.
- **migration rollback:** Additive optional fields only in v1; rollback is by reinstalling the previous release; published statements stay valid because their schemas are unchanged.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-147-09.T15 | integration | PS-147-10.R01, PS-147-10.R02, PS-147-10.R03 | export, import to fresh vault, import tampered decision | proposals and decisions round-trip; tampered statement quarantined |

## Dependencies

Module depends on: F16.S02.M03, F11.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
