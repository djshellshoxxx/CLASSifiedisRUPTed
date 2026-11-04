# PS-045-07 — Privacy, retention and abuse: Search index

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S01.M01 Search index](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/search/index` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-045-07.R01** Only P0 fields and an L2-or-coarser cell are indexed; exact addresses, drafts, offers, contact data and L3/L4 locations never reach this module, and the vault index never leaves the device.
- **PS-045-07.R02** Removal is fast and complete so unpublished or tombstoned content is not searchable or recoverable from FTS shadow tables on the same index; copies already fetched by other vaults cannot be recalled, and the publish flow warns about this before signing.
- **PS-045-07.R03** A hostile author cannot flood a relay corpus or backdate content; caps and first-seen anchoring bound the effect.

## Specification

**Data classification**
- SearchDocument: P0 copy of public projection data; location cell max 5 characters; provenance is the author's DID, which is a pseudonymous identifier, not anonymity.
- FTS5 shadow tables hold tokens of P0 text only and are rebuilt on removal.

**Retention**
- Active documents live until removed or past effective expiry; removed documents keep ids only for 30 days then are purged (RET-STANDARD).
- Relay: retention of projections follows the relay's published policy and signed tombstones are honoured within 24 h (PRV-6); rebuild shadow tables are dropped within 1 h of swap or failure.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Index leaks a location finer than L2 through a buggy or hostile source | V02 length check on every upsert, SQL CHECK constraint, contract test with 6-character cells, refusal recorded as a local diagnostic |
| T02 | Tombstoned or unpublished content stays searchable | removal deletes the FTS row in the same transaction, 5 s removal budget, daily reconciliation against retained signed tombstones |
| T03 | A hostile author floods a relay index or fills a vault cache | 200 active documents per author on a relay, 5 000 document vault cap with eviction rules, per-author fairness cap in F06.S03.M02 |
| T04 | Forged or tampered projection injected through a relay | Ed25519 signature check over JCS bytes against the author DID, kernel quarantine on failure, relay-signed receipt time treated as evidence of that relay clock only |
| T05 | Author backdates or post-dates claimedPublishedAt to gain recency | recency anchored on local firstSeenAt via min(claim, firstSeenAt), claim never used for sorting |

**Abuse controls**
- Per-author active cap 200 on a relay (excess stored removed with reason withdrawn) and relay hosting-policy removal with a statement of reasons; vault users can hide an author locally.
- Relay ingestion rate is limited by relay policy (default 60 projections per author per hour); the vault accepts at most 1 000 new documents per hour from fetch.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-045-09.T08 | abuse | PS-045-02.R02, PS-045-07.R03 | tampered projection, wrong author key and unsigned projection | all rejected with DISCOVERY_PROJECTION_INVALID, nothing indexed |
| TEST-PS-045-09.T10 | integration | PS-045-04.R02, PS-045-07.R02 | signed tombstone then later republish of the same cid | document removed with reason tombstoned, republish refused |
| TEST-PS-045-09.T12 | abuse | PS-045-07.R03 | author with 201 documents; claimedPublishedAt 3 years ahead | excess stored removed; recency uses firstSeenAt |
| TEST-PS-045-09.T13 | integration | PS-045-05.R03, PS-045-07.R01 | query layer asks for a document from a removed row | no title or body is ever returned |

## Dependencies

Module depends on: F06.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001, CTR-FED-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
