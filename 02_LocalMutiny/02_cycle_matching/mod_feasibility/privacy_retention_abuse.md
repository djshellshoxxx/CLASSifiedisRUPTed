# PS-016-07 — Privacy, retention and abuse: Cycle feasibility checks

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S02.M05 Cycle feasibility checks](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_matching/feasibility` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-016-07.R01** Reports contain pseudonym DIDs, item references and values already visible to the principal, and are never sent to relays or peers.
- **PS-016-07.R02** Failure explanations never reveal block lists, exclusion lists or other cycles that reserve an item.
- **PS-016-07.R03** Reports are purged after 30 days, except that the report hash cited in a signed proposal revision remains part of that revision's evidence.

## Specification

**Data classification**
- FeasibilityReport: P2, derived, device only.
- valueGaps: derived from public declared values and signed acceptedImbalance values.

**Retention**
- RET-SHORT 30 days after createdAt.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Error messages leak that someone blocked or excluded a participant | block and exclusion failures return the generic BLOCKED_PARTY without naming the pair, and the UI says 'a participant is unavailable' |
| T02 | Item reservation elsewhere reveals the user's other trades | message says item_reserved_elsewhere without cycle identifiers |
| T03 | Peer claims accepted as verified | every check carries a basis, and feasible requires no peer_claim or unverifiable bases |
| T04 | Manipulated declared values to pass tolerance | implausible valuations are flagged by F02.S04.M03 and check C12 blocks consent until acknowledged |

**Abuse controls**
- Local rate limit of 60 checks per hour per subject to prevent loops from buggy clients.
- Check parameters are bounded to 1 KiB to prevent oversized reports.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-016-09.T05 | unit | PS-016-02.R03, PS-016-07.R03 | peer item without local projection | check warn basis unverifiable, overall feasible_with_conditions |
| TEST-PS-016-09.T09 | abuse | PS-016-05.R01, PS-016-05.R02, PS-016-05.R03, PS-016-07.R02 | other principal reads report; blocked pair and elsewhere-reserved item | NOT_FOUND; generic messages with no names or cycle ids |
| TEST-PS-016-09.T11 | unit | PS-016-07.R01 | participant list with excluded and blocked DIDs | no DID of the blocker in report; C12 blocks on disputed valuation |
| TEST-PS-016-09.T12 | integration | PS-016-03.R03, PS-016-07.R03 | report cited by a signed revision, 30 days later | standalone report purged, cited hash retained in revision evidence |

## Dependencies

Module depends on: F02.S02.M04, F01.S03.M01, F01.S01.M01, F06.S02.M01, F07.S02.M02, F09.S03.M02, F09.S03.M03, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
