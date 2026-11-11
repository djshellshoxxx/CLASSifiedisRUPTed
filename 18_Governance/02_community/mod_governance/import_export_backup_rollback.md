# PS-147-10 — Import, export, backup and rollback: Community governance

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M01 Community governance](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/governance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-147-10.R01** The user export contains proposals, decisions and authority lists from trusted publishers, own comments, the trusted-publisher list, pending statements and, for publishers, their drafts and signing history.
- **PS-147-10.R02** Import re-verifies every signature, role, anchored receipt and the conflict check; failing statements are quarantined.
- **PS-147-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Sections governance.policy_proposals, governance.policy_comments, governance.trusted_publishers and governance.pending_statements in classrup-export/v1 through ExportSectionPort, one line per record (schemas classrup.governance.policy_proposal/v1, classrup.governance.policy_comment/v1, classrup.governance.trusted_publisher/v1, classrup.governance.pending_statement/v1) plus signed statements and receipts.
- **import:** Signatures, receipts and authority-list delegation re-verified; decisions keep their anchored validUntil and verify still answers for content activated inside the window; conflicting statements import flagged conflicted; trusted publishers are restored only after the owner confirms each fingerprint in the trust dialog.
- **backup:** Vault export is the primary backup (IOX-6); the publisher's relay holds public copies with receipts that can be re-fetched by any vault through relay_get.
- **migration rollback:** Additive optional fields only in v1; rollback is by reinstalling the previous release; published statements stay valid because their schemas are unchanged.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-147-09.T15 | integration | PS-147-10.R01, PS-147-10.R02, PS-147-10.R03 | export, import to fresh vault, import tampered decision | proposals, decisions, authority lists and trusted publishers round-trip; tampered statement quarantined |

## Dependencies

Module depends on: F16.S02.M03, F11.S01.M01, F15.S02.M01, F12.S03.M03, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
