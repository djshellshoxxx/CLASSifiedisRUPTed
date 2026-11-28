# PS-038-07 — Privacy, retention and abuse: Anti-sniping soft close

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M02 Anti-sniping soft close](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/sniping` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-038-07.R01** Extensions are public and contain no identities, so there is no privacy cost beyond the bid timing already public in the ledger.
- **PS-038-07.R02** Manipulation by repeated late bids to keep an auction open is bounded by the cap of 30 extensions and the increment rules.
- **PS-038-07.R03** The rule constants are public and versioned, the version is signed in the terms and echoed in the host acceptance, and vaults reject extensions under any other version, so hosts cannot change them mid-auction.
- **PS-038-07.R04** The module registers ExportSectionPort (section auctions.extensions), DeletionPort and RetentionPurgePort with F10 (N6) and annotates every Extension field P0 in F10.S02.M02; extensions hold no DIDs, so deletion removes cached histories and pseudonymizes nothing.

## Specification

**Data classification**
- Extension: P0 public, signed by the host.

**Retention**
- Extensions: RET-EVIDENCE (2 years) in participant vault caches; host keeps them for its published retention, default 90 days after close.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Bidders or a seller's accomplice keep the auction open with minimum bids | hard cap of 30 extensions (60 minutes), each bid must beat the increment, shill scoring watches alternation |
| T02 | Host extends or refuses to extend selectively | rules are deterministic and public, each extension is signed and numbered, bidders can compare the end time in receipts with the rule; a deviation is exportable evidence |
| T03 | Client clock manipulation to appear to bid in the window | only host time counts; client times are ignored by the qualification test |
| T04 | Replay of an extension statement for another auction | statement binds auction id, terms cid, sequence and previous end; verification rejects mismatches |
| T05 | Host changes the constants mid-auction | the version is signed in the terms and echoed in host_acceptance; vaults quarantine extensions with another rulesVersion or other constants (V06) |

**Abuse controls**
- Bid rate limits from F04.S01.M02 apply (10 per minute per bidder per auction).
- A host alert fires when an auction uses 25 or more extensions.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-038-09.T11 | abuse | PS-038-07.R02, PS-038-01.R01 | adversary bids minimum increments every 100 ms in each window | auction ends at scheduledEnd plus at most 60 minutes; alert at 25 extensions |
| TEST-PS-038-09.T16 | contract | PS-038-07.R01, PS-038-01.R02 | schema check of Extension, its statement and its event | no field holds a DID, key, alias or bidder reference |
| TEST-PS-038-09.T17 | integration | PS-038-07.R03 | host signs an extension with a 180 000 ms window, and one with rulesVersion softclose-v2, in a softclose-v1 auction | vaults quarantine both with AUCTIONS_EXTENSION_INVALID and keep the last verified end |
| TEST-PS-038-09.T20 | integration | PS-038-07.R04 | export and account deletion | section auctions.extensions present; cached histories deleted; nothing to pseudonymize |

## Dependencies

Module depends on: F04.S01.M01, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
