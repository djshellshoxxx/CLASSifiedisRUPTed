# PS-041-07 — Privacy, retention and abuse: Rental damage claims

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M03 Rental damage claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/damage` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-041-07.R01** Claims, comparisons, photos and amounts are P2, travel only as end-to-end encrypted envelopes and attachments to the two parties, reach a mediator only when the opener explicitly attaches them to the F09 case, and never appear in logs, notifications or public projections.
- **PS-041-07.R02** Inflated or fabricated claims are limited by the recomputed comparison with recorded provenance, evidence requirements, a declared value cap bound to what the renter agreed, signed response deadlines with escalation, the return waiver check and the dispute path.
- **PS-041-07.R03** No automatic penalty or reputation change is applied; any effect on reputation comes from signed dispute resolutions processed by F07.
- **PS-041-07.R04** Evidence photos are at most 5 MiB each, stripped by the sender through F10.S02.M03, and each vault fetches, decrypts, verifies and stores every referenced photo under RET-EVIDENCE before claiming, responding or accepting, unaffected by later message deletion.
- **PS-041-07.R05** The module registers ExportSectionPort (section rentals.damage), DeletionPort and RetentionPurgePort with F10 (N6), classifies every DamageClaim field through F10.S02.M02, and on privacy.deletion.completed pseudonymizes the deleted party in retained evidence while signatures stay verifiable.
- **PS-041-07.R06** Blocks (N7) never suppress damage statements for a reservation confirmed before the block - a blocked renter's response is still verified and stored, so an owner cannot block the renter and let the deadline run.

## Specification

**Data classification**
- DamageClaim: P2 in both vaults.
- Evidence photos: P2 encrypted attachments with MediaBlob ids in the signed claim; verified local copies under RET-EVIDENCE.

**Retention**
- Terminal claims and statements: RET-EVIDENCE (2 years after last related activity), purged through RetentionPurgePort.
- Quarantined statements: RET-SHORT (30 days).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Owner claims damage that already existed | comparison against the attested handoff report, items already worn or damaged cannot be claimed without a basis, receiving vault recomputes the basis and its provenance |
| T02 | Claim inflated beyond the item's value | total capped at the declared value bound in the deposit terms or the signed request, never a fresh input; renter can counter or contest |
| T03 | Renter ignores the claim | silence moves the claim to escalation_due for the owner to open a case explicitly and is never treated as acceptance |
| T04 | Forged response or acceptance | signature over JCS bytes and signer role check; non-party keys quarantined |
| T05 | Doctored evidence photos | MediaBlob hashes recorded at signing, metadata stripped, verified local copies on both sides for the mediator to compare |
| T06 | Fabricated worsening on an owner_only return | provenance owner_only is shown on compare and response screens and a later renter report is compared and flagged as a conflict |
| T07 | Owner waives damage at return and claims anyway | V02 checks the verified return_waiver in both vaults |

**Abuse controls**
- Local quarantine and a per-sender quota of 50 inbound damage statements per day per counterparty.
- One claim per kind per reservation and a window limit make repeated claims impossible.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-041-09.T11 | abuse | PS-041-07.R01, PS-041-07.R02, PS-041-07.R03 | inspect logs, notifications, relay payloads; 51 inbound statements in a day; duplicate claim; claim stating a declared value different from the deposit terms | no amounts or evidence outside encrypted envelopes; 51st dropped; RENTALS_DAMAGE_DUPLICATE; VALIDATION_FAILED |
| TEST-PS-041-09.T22 | integration | PS-041-07.R02 | owner waives damage at return, then claims within 7 days from the owner vault and from a modified owner client sending directly to the renter | RENTALS_DAMAGE_WINDOW in the owner vault and the claim quarantined with RENTALS_DAMAGE_WINDOW in the renter vault |
| TEST-PS-041-09.T23 | integration | PS-041-02.R02, PS-041-07.R02 | owner_only return, claim filed, then the renter files a return report | provenance owner_only shown on compare and response screens; recomputation against the renter's report flags the conflict |
| TEST-PS-041-09.T24 | integration | PS-041-07.R04, PS-041-04.R05 | relay blob of an evidence photo expired before the renter fetched it; owner deletes the thread message after the renter stored the photos; no comms.attachment.deleted reaches the renter vault | the download returns NOT_FOUND and the photo is re-requested; respond refused with RENTALS_EVIDENCE_MISSING until re-sent; stored copies stay and verify after deletion |
| TEST-PS-041-09.T25 | integration | PS-041-07.R05 | privacy.deletion.completed for the renter; export; retention purge after RET-EVIDENCE | DIDs replaced by the pseudonym with signatures intact; section rentals.damage exported; purge removes terminal records |
| TEST-PS-041-09.T26 | abuse | PS-041-07.R06 | owner blocks the renter after the return, files a claim, then the renter's contest arrives | contest verified and stored and the renter's escalation accepted; the claim does not reach escalation_due by silence; notifications suppressed |

## Dependencies

Module depends on: F05.S02.M01, F05.S02.M02, F05.S01.M01, F05.S01.M02, F09.S01.M01, F09.S01.M03, F09.S02.M02, F08.S01.M01, F08.S01.M03, F15.S02.M03, F10.S02.M03, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
