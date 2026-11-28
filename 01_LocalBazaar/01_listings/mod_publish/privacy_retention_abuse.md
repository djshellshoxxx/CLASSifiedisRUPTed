# PS-004-07 — Privacy, retention and abuse: Listing publication

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M03 Listing publication](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/publish` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-004-07.R01** Only P0 fields leave the device in the projection; the UI shows exactly what becomes public and warns that copies already fetched by others cannot be recalled (PRV-6).
- **PS-004-07.R02** Tombstones are honoured by relays that follow CTR-FED-001; retention of the PublicationRecord is RET-EVIDENCE.
- **PS-004-07.R03** Pseudonymity is not anonymity: the author did:key and relay metadata link all of a principal's publications, and the publish sheet says so.
- **PS-004-07.R04** The module registers ExportSectionPort (section bazaar.publications), DeletionPort and RetentionPurgePort with F10 (N6), annotates every PublicationRecord field and projection key with its F10.S02.M02 class, and calls privacy.consent.check for federation_publish before federating.

## Specification

**Data classification**
- Projection statement: P0, signed, closed key set per the allowlist, regionCell at most L2.
- PublicationRecord: P1 in the vault, with receipt times that are relay claims; field classes annotated per F10.S02.M02.

**Retention**
- PublicationRecord: RET-EVIDENCE (2 years after last related activity); ownerId pseudonymized after principal deletion.
- Tombstones: kept 180 days by senders and receivers (CTR-PRV-001).
- Quarantined relay notices: RET-SHORT 30 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Prohibited or illegal goods published | local rules and risk assessment before signing, relay hosting policy on receipt, relay-side removal with reasons; no claim of global enforcement |
| T02 | Location leak in the projection | assertPublicCell caps regionCell at 5 characters; media GPS check; projection builder test fails if the key set differs from the allowlist |
| T03 | Impersonation by republishing another author's listing | receivers accept only statements whose author did:key matches the listing owner; duplicates by cid are ignored |
| T04 | Spam flooding relays | local cap of 100 active publications, relay quotas, local spam heuristics from F12.S02.M02 and risk assessment before signing |
| T05 | Stale offer terms after unpublish | tombstone queued to every relay that received the projection; UI states copies may persist |
| T06 | Forged relay_removal advisory to make the owner believe a listing was removed, or an advisory of one relay applied to another | F11.S01.M02 verification plus V16 accept only the pinned key of the relay of that delivery and the publication's statementCid; quarantine otherwise; advisories never change the Listing (FED-9) |
| T07 | A malicious or misconfigured relay blocks publishing with future receipt times | median of at least 2 relays; receipts more than 24 h ahead discarded and the relay flagged untrusted; one relay alone only warns |
| T08 | Promotion overclaim (paid or promoted shown without the relay) | promotion acknowledged only by the operator-signed payment acknowledgement, never by the seller's own finalized observation; active only on the relay-signed statement; relay can revoke |
| T09 | Publisher key compromise or malicious rule pack used as a takedown of the user's publications | a block verdict caused by a pack change only holds the publication in policy_attention for its owner with a reminder after at least 7 days; no automatic unpublish or tombstone (CTR-FED-001 FED-9, ADR-0016 §3 and §8) |

**Abuse controls**
- At most 20 publish commands per hour per vault.
- Relay hosting policies are shown before sending; the user can choose relays, and relays can refuse.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-004-09.T09 | abuse | PS-004-05.R03, PS-004-07.R03, PS-004-04.R04 | R2 signs a classrup.federation.relay_removal/v1 advisory with a statement of reasons for L, then a foreign-author statement reaches a receiving vault | delivery relay_removed with hostingRemoved {reasonCode, removalCid, statementOfReasons} only for R2; Listing status and R1 delivery unchanged; foreign statement quarantined; wording says pseudonymous not anonymous |
| TEST-PS-004-09.T12 | integration | PS-004-07.R01, PS-004-07.R02 | unpublish after publish | tombstone queued to every relay with a received delivery; UI copy states fetched copies may persist |
| TEST-PS-004-09.T22 | integration | PS-004-07.R04 | export section, deletion plan and retention purge through the F10 ports | section bazaar.publications present with field classes; deletion ends publications with account_deleted and pseudonymizes retained records |

## Dependencies

Module depends on: F01.S01.M01, F01.S02.M01, F01.S02.M02, F01.S02.M03, F01.S03.M01, F18.S01.M01, F18.S01.M02, F18.S01.M03, F12.S02.M02, F12.S03.M01, F10.S01.M01, F06.S02.M01, F08.S01.M01, F09.S01.M01, F11.S01.M01, F11.S01.M02, F15.S01.M01, F15.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
