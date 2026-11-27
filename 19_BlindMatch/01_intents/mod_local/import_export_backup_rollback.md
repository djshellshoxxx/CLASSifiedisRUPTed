# PS-149-10 — Import, export, backup and rollback: Private local intents

**Status:** SPECIFIED (Stage 3). **Module:** [F19.S01.M01 Private local intents](SPEC.md) · **Scope:** FUTURE · **Code:** `packages/blindmatch/src/intents/local` · **Contracts:** [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-149-10.R01** Register the explicit codec and bind imported owner and stored key to validated content.
- **PS-149-10.R02** Restore intents as draft, preserve the live source during export and require fresh action before matching resumes.
- **PS-149-10.R03** Keep legacy archives compatible and reject unknown or malformed records; old external backups restore content only through explicit import.

## Specification

- **export:** Encrypted export includes the codec, validates owner/key binding and leaves the live source unchanged.
- **import:** Validate closed content, owner and key, then restore every intent as draft.
- **backup:** Legacy archives remain compatible; unknown/malformed records fail closed and recovered content never resumes authority.
- **migration rollback:** Existing formats and storage drivers remain unchanged; disabled state preserves owner inspection and erasure.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-149-09.T10 | integration | PS-149-10.R01, PS-149-10.R02, PS-149-10.R03 | Export an active intent, restore an older archive, and import a legacy codec archive | Source stays active; restored content is draft; no automatic loader call; legacy archives remain valid |

## Dependencies

Module depends on: F15.S02.M03, CTR-ERR-001, CTR-PRV-001, CTR-IOX-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
