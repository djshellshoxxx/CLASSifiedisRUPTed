# PS-041-07 — Privacy, retention and abuse: Rental damage claims

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M03 Rental damage claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/damage` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-041-07.R01** Claims, comparisons, photos and amounts are P2, travel only as end-to-end encrypted envelopes and attachments to the two parties and the dispute handler chosen in F09, and never appear in logs, notifications or public projections.
- **PS-041-07.R02** Inflated or fabricated claims are limited by the recomputed comparison, evidence requirements, declared value cap, a 7 day response window with escalation, and the dispute path.
- **PS-041-07.R03** No automatic penalty or reputation change is applied; any effect on reputation comes from signed dispute resolutions processed by F07.

## Specification

**Data classification**
- DamageClaim: P2 in both vaults.
- Evidence photos: P2 encrypted attachments with hashes in the signed claim.

**Retention**
- Terminal claims and statements: RET-EVIDENCE (2 years after last related activity).
- Quarantined statements: RET-SHORT (30 days).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Owner claims damage that already existed | comparison against the attested handoff report, items already worn or damaged cannot be claimed without a basis, receiving vault recomputes the basis |
| T02 | Claim inflated beyond the item's value | total capped at the owner's declared value, which is also visible in the deposit terms, renter can counter or contest |
| T03 | Renter ignores the claim | silence escalates to a dispute after 7 days and is never treated as acceptance |
| T04 | Forged response or acceptance | signature over JCS bytes and signer role check; non-party keys quarantined |
| T05 | Doctored evidence photos | hashes recorded at signing, metadata stripped, the dispute handler can compare with both parties' copies |

**Abuse controls**
- Local quarantine and a per-sender quota of 50 inbound damage statements per day per counterparty.
- One claim per kind per reservation and a window limit make repeated claims impossible.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-041-09.T11 | abuse | PS-041-07.R01, PS-041-07.R02, PS-041-07.R03 | inspect logs, notifications, relay payloads; 51 inbound statements in a day; duplicate claim | no amounts or evidence outside encrypted envelopes; 51st dropped; RENTALS_DAMAGE_DUPLICATE |

## Dependencies

Module depends on: F05.S02.M01, F05.S02.M02, F05.S01.M01, F05.S01.M02, F09.S01.M01, F09.S02.M02, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
