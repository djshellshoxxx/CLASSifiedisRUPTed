# PS-005-07 — Privacy, retention and abuse: Giveaway listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M03 Giveaway listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/giveaway` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-005-07.R01** Requests, notes and selections are P2 and travel only end-to-end encrypted to the two parties; relays see ciphertext and routing metadata.
- **PS-005-07.R02** Requests are retained RET-EVIDENCE for the giver and the requester; notes are purged 30 days after a terminal state unless a dispute references them.
- **PS-005-07.R03** The queue is visible only to the giver; requesters never see others in the queue.
- **PS-005-07.R04** The module registers ExportSectionPort, DeletionPort and RetentionPurgePort with F10 (N6), annotates every GiveawayTerms and GiveawayRequest field with its F10.S02.M02 class, and pseudonymizes the deleted party in retained requests on privacy.deletion.completed.

## Specification

**Data classification**
- GiveawayRequest: P2 (giver, requester); field classes annotated per F10.S02.M02.
- GiveawayTerms: P3 draft; selectionMode, queueLimit and closesAt are public in the projection, pickupNote is not.

**Retention**
- GiveawayRequest: RET-EVIDENCE with note purged 30 days after terminal state; party DIDs pseudonymized after principal deletion.
- GiveawayTerms: RET-STANDARD.
- Quarantined statements: RET-SHORT 30 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Hoarding by one person or a ring of pseudonyms for resale | per-giver caps (3 pending, 2 uncollected, 5 per 7 days), fresh-key share of 50 % of the queue, giver confirmation of every first-come pick, giver choice mode, visible honest note that pseudonym rings cannot be fully detected |
| T02 | Forged request or selection statements | requests verified against the stated requester; selections and declines verified against the author of the verified listing projection and bound to requestId and requestCid; mismatches quarantined |
| T03 | Spam flooding a giver's queue | queueLimit up to 200, fresh-key share, relay mailbox quotas, requester rate limit 20 requests per hour, block list silent drop |
| T04 | Harassment or stalking through pickup details | pickupNote only in the selection statement to the recipient; exact location shared by the user only through F06.S02.M02 shares with TTL 24 h |
| T05 | Gaming first-come with forged timestamps or a relay reordering deliveries | order uses the giver vault's receipt order, requests within one sync batch or 60 s are tied and drawn locally, requester claimedAt is shown only as a claim, and the queue says relays can influence order |
| T06 | Sybil swarm of free did:keys draining stock while the giver is away | first-come picks wait for one giver confirmation; fresh keys capped at 50 % of the queue |
| T07 | Replay of an old selection onto a new request | selection binds requestId and requestCid; cid dedup; replays quarantined |

**Abuse controls**
- Requester limit 20 request commands per hour per vault; giver limit 200 select/decline per hour.
- Silent drops on block avoid retaliation; moderation of listing content is by relay hosting policy and local filtering.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-005-09.T02 | unit | PS-005-01.R02, PS-005-07.R01 | inspect projection, relay payload and logs | notes and queue only in encrypted statements; projection has mode, queueLimit and closesAt only |
| TEST-PS-005-09.T12 | abuse | PS-005-02.R03, PS-005-07.R03 | requester sends 4th pending request and 6th collection within 7 days; 21 requests in an hour | BAZAAR_GIVEAWAY_LIMIT and RATE_LIMITED; the rejected requester learns nothing about the queue |
| TEST-PS-005-09.T13 | abuse | PS-005-07.R02 | terminal request older than 30 days | note purged, evidence fields retained |
| TEST-PS-005-09.T19 | integration | PS-005-07.R03 | R1 and R2 each request L; R1 calls list_mine and the giver calls list_for_listing | R1 sees only its own request; only the giver vault returns the queue |
| TEST-PS-005-09.T21 | integration | PS-005-07.R04 | export sections, deletion plan and retention purge through the F10 ports, then privacy.deletion.completed for R2 | sections present with field classes; R2's DID replaced by the pseudonym in retained requests and notes purged |

## Dependencies

Module depends on: F01.S01.M01, F01.S03.M01, F07.S02.M02, F16.S02.M03, F11.S01.M01, F11.S01.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
