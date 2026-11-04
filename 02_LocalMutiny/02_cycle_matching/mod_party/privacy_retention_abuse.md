# PS-019-07 — Privacy, retention and abuse: Matching participant eligibility

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M04 Matching participant eligibility](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/party` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-019-07.R01** Exclusions, pause reasons and block interactions never leave the vault in any event, log, projection or request.
- **PS-019-07.R02** The published projection contains exactly four coarse fields plus region at L1 and the author DID, nothing finer than L2 location.
- **PS-019-07.R03** Opt-in is explicit, versioned and withdrawable, and the UI states that already fetched copies cannot be recalled (PRV-6).

## Specification

**Data classification**
- MatchingProfile local record: P3.
- Public projection: P0 fields {optedIn, maxCycleLength, maxDistanceBucket, acceptsCompensation, regionL1}.

**Retention**
- Local profile: RET-STANDARD, deleted with the vault or on user request; tombstone kept 180 days by relays (PRV-6).
- Peer mirrors: kept while the projection is not older than 180 days and not tombstoned.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Inference of who a member excludes | exclusions never published; relay matching cannot apply them and recipient vaults drop suggestions silently |
| T02 | Forged projection opts a victim in to matching | signature must verify against the DID in the envelope; suggestions involving a victim still require the victim's own signed consent |
| T03 | Replay of an old projection to resurrect an opted-out member | seq and prev chain; tombstone with higher seq wins |
| T04 | Location inference from region and distance bucket | regionL1 only (about 39 km by 19.5 km) and bucket enum; no finer cell published |

**Abuse controls**
- Local rate limit of 20 profile updates per day to bound relay write abuse.
- Peer projections from an author that exceed 5 seq increments per hour are quarantined for 24 h.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-019-09.T02 | contract | PS-019-01.R02, PS-019-04.R02, PS-019-07.R02, PS-019-09.R02, PS-019-09.R03 | opt in with 2 exclusions | projection validates against schema, contains exactly the public fields, excludedActorIds absent from projection, events and logs |
| TEST-PS-019-09.T08 | abuse | PS-019-05.R01, PS-019-05.R02, PS-019-07.R01 | other actor updates profile; projection signed by wrong DID; request logs inspected | FORBIDDEN or quarantine; no exclusion in any log |
| TEST-PS-019-09.T10 | abuse | PS-019-07.R03, PS-019-07.R01 | opt-in without confirmation; replay of old projection after tombstone | MUTINY_OPTIN_REQUIRED; old projection ignored |
| TEST-PS-019-09.T15 | e2e | PS-019-07.R03, PS-019-02.R01 | mobile user opts in and out | disclosure shown, fetched-copy warning shown, axe zero serious issues |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F06.S02.M02, F16.S02.M03, F12.S03.M04, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
