# PS-025-07 — Privacy, retention and abuse: Barter currency normalization

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M02 Barter currency normalization](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/currency` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-025-07.R01** Records are P2 and travel only inside signed end-to-end encrypted revision envelopes to the subject's parties.
- **PS-025-07.R02** Quote requests to rate sources carry only the currency pair and requested lifetime, never DIDs, items or amounts.
- **PS-025-07.R03** Rate manipulation by a proposer is limited by labelling sources, recomputation by every participant and each participant's own consent on displayed numbers.
- **PS-025-07.R04** The module registers ExportSectionPort (section mutiny.normalizations), DeletionPort and RetentionPurgePort with F10 (N6), annotates every NormalizationRecord field with its F10.S02.M02 class, and on privacy.deletion.completed pseudonymizes local metadata while the pinned numbers stay verifiable.

## Specification

**Data classification**
- NormalizationRecord: P2; includes declared amounts of items already public in valuations; field classes annotated per F10.S02.M02.
- Quote requests: P0 pair, purpose barter_normalization and lifetime only.

**Retention**
- RET-EVIDENCE 2 years after the last related activity of the subject.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Proposer uses a favorable rate that nobody can verify | each quote shows source and sourceSigned; manual and proposer-stated rates are labelled and participants must consent knowing that |
| T02 | Presented converted amounts differ from the formula | every receiver recomputes with the same integer formula and refuses mismatches |
| T03 | Quote expires after consent but before commit | effective consent deadline is capped at the earliest quote expiry, and expiry before commit voids consent via a new revision |
| T04 | Floating point or double rounding changes outcomes | bigint only, one HALF_EVEN rounding per conversion, property tests against a reference implementation |
| T05 | Rate request reveals trades | requests contain only the pair and lifetime |

**Abuse controls**
- Local rate limit of 60 compute commands per hour per vault.
- At most 8 quotes and 16 items per record bound work per request.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-025-09.T09 | abuse | PS-025-05.R01, PS-025-05.R02, PS-025-07.R02 | peer revision with altered converted amount by one minor unit | MUTINY_NORMALIZATION_MISMATCH and consent blocked |
| TEST-PS-025-09.T10 | abuse | PS-025-05.R03, PS-025-07.R01, PS-025-07.R03 | manual rate presented as signed; request payload inspected | MUTINY_QUOTE_SOURCE_UNLABELLED; request contains only pair and lifetime |
| TEST-PS-025-09.T19 | integration | PS-025-07.R04 | F10 export, deletion and retention sweep | section mutiny.normalizations exported; erased DID pseudonymized in local metadata; normalizationHash unchanged |

## Dependencies

Module depends on: F02.S04.M03, F09.S03.M01, F09.S03.M02, F09.S03.M03, F16.S02.M03, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
