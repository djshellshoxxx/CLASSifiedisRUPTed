# PS-037-07 — Privacy, retention and abuse: Auction fraud review

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M03 Auction fraud review](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/fraud` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-037-07.R01** Evidence, findings and keys of suspected parties remain P3 on the host; participants receive only the reason category and the signed void statement.
- **PS-037-07.R02** The void statement is the host's finding under its policy; it names no individual, and the UI says it is not a court ruling.
- **PS-037-07.R03** Abuse of the review process by moderators is limited by the two-moderator rule, conflict checks, audit entries and the participants' ability to choose another host.
- **PS-037-07.R04** The module registers ExportSectionPort (operator section auctions.reviews; user section auctions.voids with received void and rescission statements), DeletionPort and RetentionPurgePort with F10 (N6), annotates fields with their F10.S02.M02 class, and pseudonymizes moderator and subject keys on deletion.

## Specification

**Data classification**
- AuctionReview: P3 host-only; evidence snapshots per F12.S01.M02.
- Void and rescission statements: P2 to participants, signed by the host; reason category only.

**Retention**
- Reviews and evidence snapshots: RET-EVIDENCE per host policy (default 2 years); void and rescission statements kept 2 years in participant vaults.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Rogue moderator voids a competitor's sale | two different moderators required, conflict-of-interest block including linked keys, audit entry for every allow and deny, and no vault applies a void over an acknowledged or final payment |
| T02 | Mass false reports to trigger reviews | reports alone open at normal priority only, reviewers see reporter reputation, one open review per auction with merged triggers, report abuse limits in F12 |
| T03 | Void statement forged to cancel a legitimate sale | signature check against the host key in the auction terms, wrong key is quarantined, cid binds auction and result |
| T04 | Disclosure of suspected party's linked keys | evidence stays on the host, participants get only a reason category; subjectKeys exist only in the host-local event |
| T05 | Retaliatory voiding after a bad review of the host | host operator is not a party; participants can leave the host; voiding needs evidence snapshot and findings visible to a second moderator; the void is appealable through its EnforcementAction |
| T06 | Void used as a relay command over a user's Deal | the void is a finding; it never cancels a Deal, which needs every party's signed cancel (F09), and vaults decide how it applies |

**Abuse controls**
- Host operator alert when a moderator proposes more than 5 voids in 24 hours.
- Appeals via F12.S01.M03 are linked to the review through enforcementActionId and the outcome is recorded.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-037-09.T10 | abuse | PS-037-07.R01, PS-037-07.R02, PS-037-07.R03, PS-037-01.R02 | inspect participant notices, logs, public projection, user exports | only reason category in notices; no evidence, findings or keys elsewhere; statement says host finding, not a ruling |
| TEST-PS-037-09.T11 | abuse | PS-037-07.R03 | moderator proposes 6 voids in 24 hours | operator alert fired on the 6th |
| TEST-PS-037-09.T22 | integration | PS-037-07.R04 | operator export, user export, deletion of a moderator and a subject | reviews only in the operator export; the user export carries auctions.voids; keys pseudonymized |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M02, F04.S01.M03, F04.S02.M01, F04.S02.M02, F12.S01.M01, F12.S01.M02, F12.S01.M03, F12.S02.M01, F11.S01.M01, F11.S01.M03, F07.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
