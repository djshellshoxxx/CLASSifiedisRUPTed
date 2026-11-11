# PS-013-07 — Privacy, retention and abuse: Barter offer items

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S01.M03 Barter offer items](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/trade_proposals/offer` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-013-07.R01** Legs expose only what is already in public listings plus the declared values the owners chose to publish; nothing about addresses or exact location.
- **PS-013-07.R02** Legs of closed subjects are retained as evidence for 2 years and pseudonymized if a party erases their identity locally.
- **PS-013-07.R03** Abuse such as listing other people's items is limited because peer items require a signed listing authored by the giver.
- **PS-013-07.R04** The module registers ExportSectionPort (section mutiny.legs), DeletionPort and RetentionPurgePort with F10 (N6), annotates every TradeLeg field with its F10.S02.M02 class, and on privacy.deletion.completed pseudonymizes the erased party in retained legs.

## Specification

**Data classification**
- TradeLeg: P2; item references are public listing cids, declared values are owner-published; field classes annotated per F10.S02.M02.

**Retention**
- RET-EVIDENCE 2 years after last related activity; voided unreferenced legs are purged after 7 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | A proposer lists someone else's item to bait them | peer items need a listing projection signed by the giver, and the giver's own signed reservation is required before commit |
| T02 | Availability claim shown as fact | basis chip distinguishes local verification from signed listing claims |
| T03 | Draft legs leak intent | legs are not sent until sealed in a revision to the subject's parties only |
| T04 | Resource exhaustion by creating many legs | 8 legs per subject, 24 h garbage collection, 200 defined legs per vault |

**Abuse controls**
- At most 200 defined unreferenced legs per vault; define rate limit 60 per hour.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-013-09.T09 | abuse | PS-013-05.R01, PS-013-05.R02, PS-013-05.R03, PS-013-07.R01 | other principal defines or reads; leg for someone else's unlisted item | FORBIDDEN or NOT_FOUND; MUTINY_ITEM_NOT_OWNED |
| TEST-PS-013-09.T11 | abuse | PS-013-07.R03 | 201st defined leg; 61st define in an hour | limit error and RATE_LIMITED |
| TEST-PS-013-09.T12 | unit | PS-013-07.R02, PS-013-07.R01 | account erased locally with closed subject | leg pseudonymized and retained, no address fields ever present |
| TEST-PS-013-09.T17 | integration | PS-013-07.R04 | F10 export, deletion of a counterparty and retention sweep | section mutiny.legs exported; erased DID pseudonymized in referenced legs; voided legs purged after 7 days |

## Dependencies

Module depends on: F01.S03.M01, F01.S01.M01, F02.S04.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
