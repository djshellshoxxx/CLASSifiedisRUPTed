# PS-004-01 — Domain schema: Listing publication

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S01.M03 Listing publication](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listings/publish` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-004-01.R01** A PublicationRecord captures one publish attempt: listing revision, policy verdict and ruleset version, expiry, federation opt-in, signed statement digest and per-relay delivery states.
- **PS-004-01.R02** The signed projection contains only P0 fields, a region cell of at most L2 and the listing revision; it never contains drafts, exact address, contact data or offers.
- **PS-004-01.R03** PublicationRecords are retained as evidence of what was published and when; delivery state is local knowledge and is labelled as such.

## Specification

### PublicationRecord

Schema `classrup.bazaar.publication/v1` · storage **device** · privacy **P1** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — fixed local-vault tenant (ID-6) |
| listingId | uuidv7 — ref F01.S01.M01 Listing |
| ownerId | did:key — local principal |
| listingRevision | int — Listing.revision signed in the projection |
| status | enum — submitted \| held_for_confirmation \| active \| blocked \| withdrawn \| unpublished \| ended |
| verdict | enum — allow \| allow_with_notice \| review \| block |
| rulesetVersion | int — F18.S01.M02 ruleset version evaluated |
| matchedRuleKeys? | string[] — <= 10 rule keys |
| acknowledgedNoticeIds? | string[] — <= 10 notice ids from the jurisdiction profile |
| ownerConfirmedAt? | timestamp — required when verdict is review |
| expiresAt | timestamp — publishedAt + 1..90 days, default 30 |
| renewals | int — 0..3 |
| federationOptIn | boolean — default false |
| statementCid? | string — sha256- over JCS of the signed envelope |
| statementSeq? | int — per-author sequence (CTR-FED-001 FED-3) |
| deliveries | object[] — <= 10 items {relayId, syncState: prepared\|transport_acknowledged\|peer_accepted\|relay_rejected\|relay_removed, receiptAt?, reasonKey?} |
| promotion? | object — {relayId, tier: boost_7d\|boost_14d, claimId, state: claimed\|active\|expired, activeUntil?} |
| endReason? | enum — owner \| policy_changed \| expired \| closed \| archived \| account_deleted |
| revision | int — CTR-ID-001 ID-4 |
| createdAt | timestamp — RFC 3339 UTC |
| updatedAt | timestamp — RFC 3339 UTC |

**Invariants**
- At most one PublicationRecord per listing has status active or held_for_confirmation.
- status active implies statementCid, statementSeq and at least one delivery are set.
- verdict review implies ownerConfirmedAt is set before status active; verdict block implies status blocked.
- receiptAt on a delivery is the relay clock and is never used to order events.

### Storage DDL

```sql
CREATE TABLE bazaar_publication (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, listing_id TEXT NOT NULL, owner_id TEXT NOT NULL,
  status TEXT NOT NULL, expires_at TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX bazaar_publication_live ON bazaar_publication(tenant_id, listing_id)
  WHERE status IN ('active','held_for_confirmation');
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-004-09.T01 | unit | PS-004-01.R01, PS-004-01.R03, PS-004-06.R03 | publish L offline | PublicationRecord active, delivery prepared, no receiptAt, no peer_accepted claim |
| TEST-PS-004-09.T02 | contract | PS-004-01.R02, PS-004-04.R02, PS-004-09.R02 | publish and unpublish | projection validates against classrup.bazaar.listing/v1, only P0 allowlisted fields, region <= 5 chars, signature verifies, tombstone validates |

## Dependencies

Module depends on: F01.S01.M01, F01.S02.M01, F01.S02.M02, F01.S02.M03, F01.S03.M01, F18.S01.M01, F18.S01.M02, F18.S01.M03, F12.S02.M02, F09.S01.M01, F16.S02.M03, F11.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [module SPEC](SPEC.md).
