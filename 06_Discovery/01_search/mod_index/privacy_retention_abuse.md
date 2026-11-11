# PS-045-07 — Privacy, retention and abuse: Search index

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M01 Search index](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/index` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-045-07.R01** Only P0 fields and an L2-or-coarser cell are indexed; exact addresses, drafts, offers, contact data and L3/L4 locations never reach this module, and the vault index never leaves the device - it makes no network call and writes no outbox entry.
- **PS-045-07.R02** Removal is fast and complete so unpublished or tombstoned content is not searchable or recoverable from FTS shadow tables on the same index; copies already fetched by other vaults cannot be recalled, and the publish flow warns about this before signing.
- **PS-045-07.R03** A hostile author cannot flood a relay corpus, backdate content or undo a hosting-policy removal by republishing; caps, first-seen anchoring and sticky removals bound the effect.
- **PS-045-07.R04** The module registers a DeletionPort (plan - remove documents with origin own of the deleting principal with reason deleted, plus the author anchor and view rows; scope taken from the F10.S01.M04 plan) and a RetentionPurgePort (30-day purge, 180-day stubs) with F10, and classifies every field with F10.S02.M02 (all P0 except the P3 view table); SearchDocument has no export section because it is derived (IOX-5).

## Specification

**Data classification**
- SearchDocument: P0 copy of public projection data; location cell max 5 characters; provenance is the author's DID, which is a pseudonymous identifier, not anonymity.
- FTS5 shadow tables hold tokens of P0 text only and are rebuilt on removal.
- discovery_doc_view: P3 vault-local view recency used only for eviction; never exported, logged, federated or sent to a relay.
- Relay-local promotion and moderation columns (promotedUntil, promotionClaimId, removedByActionId, removedUntil) are relay operational data and never appear in a vault index.

**Retention**
- Active documents live until removed or past effective expiry; removed documents keep ids only for 30 days then are purged (RET-STANDARD); refusal stubs 180 days (FED-4).
- Relay: retention of projections follows the relay's published policy and signed tombstones are honoured within 24 h (PRV-6); rebuild shadow tables are dropped within 1 h of swap or failure.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Index leaks a location finer than L2 through a buggy or hostile source | V02 assertPublicCell on every upsert, SQL CHECK length IN (0,4,5), contract test with 6-character cells, refusal recorded as a local diagnostic |
| T02 | Tombstoned or unpublished content stays searchable | removal deletes the FTS row in the same transaction, 5 s removal budget, daily reconciliation against retained signed tombstones |
| T03 | A hostile author floods a relay index or fills a vault cache | 100 active documents per author on a relay (newest refused as author_cap), 5 000 document vault cap with eviction of fetched documents only, per-author fairness cap in F06.S03.M02 |
| T04 | Forged or tampered projection injected through a relay | F11.S01.M02 verification plus V03 re-check of Ed25519 signature over JCS bytes and signer role, kernel quarantine on failure, relay-signed receipt time treated as evidence of that relay clock only |
| T05 | Author backdates or post-dates claimedPublishedAt to gain recency | the recency anchor is the claim clamped by firstSeenAt (min(claim, firstSeenAt)), so a claim can only make a document look older, never newer, than first seen |
| T06 | One relay's hosting decision removes a listing from vaults, including the author's own listing and copies from other relays (signer-role confusion on tombstones) | branch on tombstone issuer kind; a relay-signed tombstone only drops that relay's provenance in a vault and never touches own or imported documents (ADR-0016 decisions 3 and 8) |
| T07 | Author undoes a hosting-policy removal or a tombstone by editing or resubmitting | sticky removedReason guard (V08) and 180-day stubs after purge |
| T08 | Relay operator shows unlabelled promotion or promotion without a final or acknowledged claim | promotion only through set_promotion bound to a final or acknowledged claim, cleared on reorg or expiry, promoted flag exported to rankers which cap and label it |

**Abuse controls**
- Per-author active cap 100 on a relay (newest refused with removedReason author_cap) and relay hosting-policy removal with a statement of reasons; vault users hide content or authors locally through F12.S01.M01 at query time.
- Relay ingestion quotas are enforced at F11 federation.record.ingest and by the F01.S01.M03 relay_index_write quota (default 100 projections per key); the vault accepts at most 1 000 new documents per hour from pulls, and list_by_cell is limited by RateLimitPort class read.search.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-045-09.T10 | integration | PS-045-04.R02, PS-045-07.R02, PS-045-03.R04 | author-signed tombstone then later republish of the same cid | document removed with reason tombstoned, republish refused with DISCOVERY_SOURCE_REMOVED |
| TEST-PS-045-09.T12 | abuse | PS-045-07.R03 | author with 101 active documents on a relay; claimedPublishedAt 3 years ahead | 101st (newest) refused with stub author_cap and DISCOVERY_INDEX_CAP diagnostic; recency anchor equals firstSeenAt |
| TEST-PS-045-09.T13 | integration | PS-045-05.R03, PS-045-07.R01 | query layer asks for a document from a removed row | no title or body is ever returned |
| TEST-PS-045-09.T21 | integration | PS-045-03.R04, PS-045-07.R02 | relay A signs a tombstone for a listing the vault fetched from relays A and B, and for the user's own listing | relay A dropped from provenance, document stays active from B; own listing untouched; no refusal for B copies |
| TEST-PS-045-09.T26 | abuse | PS-045-07.R01 | vault indexes 1 000 events under network capture and outbox inspection | zero network requests and zero outbox entries written by the index |
| TEST-PS-045-09.T30 | integration | PS-045-01.R05, PS-045-07.R04 | vault at 5 000 documents receives new ones; deletion executes the registered DeletionPort plan; retention purge run | fetched documents with oldest last view evicted, own and imported kept; own documents removed with reason deleted; field classifications present for every column |

## Dependencies

Module depends on: F06.S02.M01, F01.S01.M03, F11.S01.M01, F11.S01.M02, F11.S01.M03, F09.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001, CTR-COM-001. Predecessor: [domain_schema.md](domain_schema.md).
