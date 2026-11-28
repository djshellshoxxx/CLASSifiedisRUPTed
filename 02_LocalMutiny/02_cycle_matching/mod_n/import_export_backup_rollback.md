# PS-018-10 — Import, export, backup and rollback: N-party cycle engine

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M03 N-party cycle engine](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/n` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-018-10.R01** Export includes active and recent CycleSuggestion records of the user, flagged derived, and excludes CompatibilityGraph caches.
- **PS-018-10.R02** Imported suggestions are always re-verified before they can be proposed and expire at their original expiresAt.
- **PS-018-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section mutiny.suggestions in classrup-export/v1; one line per non-purged CycleSuggestion (schema classrup.mutiny.cycle_suggestion/v1).
- **import:** Suggestions import with verifiedLocally=false and status unchanged unless expiresAt is past, in which case expired; re-verification runs on first open.
- **backup:** The user's vault export is the primary backup (IOX-6); relays hold only transient suggestion envelopes in mailboxes (IOX-7).
- **migration rollback:** Additive optional fields only in v1; rollback to the previous release ignores unknown fields; the suggestion set is derived so a rollback can always regenerate it by running generate.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-018-09.T20 | integration | PS-018-10.R01, PS-018-10.R02, PS-018-10.R03 | export, import into fresh vault, schema rollback | unexpired suggestions round-trip as unverified until re-verified; graph caches absent |

## Dependencies

Module depends on: F02.S02.M04, F02.S02.M05, F02.S04.M03, F01.S01.M01, F01.S02.M02, F01.S03.M01, F06.S02.M01, F07.S02.M02, F07.S02.M01, F07.S03.M01, F07.S03.M02, F09.S03.M02, F09.S03.M03, F11.S01.M01, F11.S01.M02, F16.S02.M03, F15.S01.M01, F15.S04.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-OBS-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
