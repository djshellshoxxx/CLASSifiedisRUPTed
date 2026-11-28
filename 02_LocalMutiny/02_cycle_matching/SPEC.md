# F02.S02 — 02_cycle_matching

**Status:** SPECIFIED. **Parent:** [F02](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F02.S02.M01 | [Three-party cycles](mod_three/SPEC.md) | SPECIFIED | Length-3 cycle profile of the matcher: thresholds, scoring weights and UX explanation for 3-party cycles; uses F02.S02.M03 engine. |
| F02.S02.M02 | [Four-party cycles](mod_four/SPEC.md) | SPECIFIED | Length-4 profile: stricter value tolerance and distance constraints; uses engine. |
| F02.S02.M03 | [N-party cycle engine](mod_n/SPEC.md) | SPECIFIED | Bounded deterministic cycle enumeration (ADR-0005), budgets, scoring, disjoint selection; produces CycleSuggestion records (not proposals). |
| F02.S02.M04 | [Matching participant eligibility](mod_party/SPEC.md) | SPECIFIED | Opt-in to matching, max cycle length preference, distance bucket, excluded counterparties, suspension/block exclusion. |
| F02.S02.M05 | [Cycle feasibility checks](mod_feasibility/SPEC.md) | SPECIFIED | Pure checks: participant uniqueness, item ownership/availability, value tolerance (MNY-5), quote freshness, distance, blocks, deadlines; explains infeasibility. |

## Aggregation

Modules in this subfeature share the feature package `packages/mutiny` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| mutiny.cycle.suggested | F02.S02.M03 | F02.S02.M01 | internal |
| mutiny.matching_profile.updated | F02.S02.M04 | F02.S02.M01 | internal |
| mutiny.cycle.suggested | F02.S02.M03 | F02.S02.M02 | internal |
| mutiny.matching_profile.updated | F02.S02.M04 | F02.S02.M02 | internal |
| bazaar.want.declared | F01.S02.M02 | F02.S02.M03 | external |
| bazaar.want.withdrawn | F01.S02.M02 | F02.S02.M03 | external |
| bazaar.listing.unpublished | F01.S01.M03 | F02.S02.M03 | external |
| bazaar.listing.expired | F01.S01.M04 | F02.S02.M03 | external |
| bazaar.inventory.depleted | F01.S03.M01 | F02.S02.M03 | external |
| mutiny.matching_profile.updated | F02.S02.M04 | F02.S02.M03 | internal |
| mutiny.valuation.declared | F02.S04.M03 | F02.S02.M03 | external |
| identity.block.added | F07.S02.M02 | F02.S02.M03 | external |
| mutiny.cycle.proposed | F02.S03.M01 | F02.S02.M03 | external |
| mutiny.cycle.declined | F02.S03.M01 | F02.S02.M03 | external |
| identity.portable_doc.published | F07.S02.M01 | F02.S02.M03 | external |
| identity.reputation.recomputed | F07.S03.M01 | F02.S02.M03 | external |
| privacy.deletion.completed | F10.S01.M04 | F02.S02.M03 | external |
| identity.block.added | F07.S02.M02 | F02.S02.M04 | external |
| identity.block.removed | F07.S02.M02 | F02.S02.M04 | external |
| discovery.location.updated | F06.S02.M02 | F02.S02.M04 | external |
| privacy.consent.withdrawn | F10.S01.M01 | F02.S02.M04 | external |
| privacy.deletion.completed | F10.S01.M04 | F02.S02.M04 | external |
| mutiny.proposal.revised | F02.S01.M04 | F02.S02.M05 | external |
| mutiny.values.normalized | F02.S04.M02 | F02.S02.M05 | external |
| mutiny.normalization.expired | F02.S04.M02 | F02.S02.M05 | external |
| mutiny.valuation.flagged | F02.S04.M03 | F02.S02.M05 | external |
| privacy.deletion.completed | F10.S01.M04 | F02.S02.M05 | external |
