# PS-093-07 — Privacy, retention and abuse: Moderation evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M02 Moderation evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-093-07.R01** Snapshot bodies and media are P2 between the store owner and the moderators of the relay that received them, encrypted per blob, and leave a store only inside a sealed report or case bundle addressed to a relay moderation key, or in the owner's own export.
- **PS-093-07.R02** Retention is RET-EVIDENCE with legal-hold override on relays, and destruction is cryptographic shredding of a blob key once no active snapshot references it; copies already sent to a relay or fetched by others cannot be recalled and the UI says so.
- **PS-093-07.R03** Every access is logged and neither moderators nor vault apps expose a way to edit or delete access rows.
- **PS-093-07.R04** A report on a P2 target gives the relay only metadata by default; plaintext leaves the vault only as a participant disclosure the reporter approved after a redact/1 preview reached export prepared, the single exception to ADR-0016 §3 and PRV-5 this module relies on.
- **PS-093-07.R05** The content author's view of the access log shows only purpose, accessor role and time, with accessor keys redacted and reporter-side rows excluded.
- **PS-093-07.R06** The module meets N6 by registering ExportSectionPort, DeletionPort and RetentionPurgePort with F10, classifying snapshot and access fields per F10.S02.M02, and consuming privacy.deletion.completed.

## Specification

**Data classification**
- EvidenceSnapshot: P2 (vault owner; moderators of the relay that received it for the case; author for appeal view).
- EvidenceAccess: P2 (store owner and relay operators; author sees the redacted view only).
- Per-blob keys: P4, wrapped by the vault key (vault) or the relay data key from F16.S01.M02 (relay).

**Retention**
- Snapshots: RET-EVIDENCE (2 years after last related activity) through the RetentionPurgePort unless a relay legal hold applies; failed-integrity snapshots are purged on the same schedule.
- Access rows: RET-EVIDENCE; after purge they are reduced to stubs without content references for 180 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Relay moderator browses snapshots out of curiosity | relay read requires assigned case; each read logged; operator weekly access report; more than 50 reads per moderator per day alerts |
| T02 | Tampering with stored evidence to justify a decision | content hash plus per-blob AEAD tag; author signature over the original envelope; sweep verification; decisions store the hash they relied on |
| T03 | Forged evidence fabricated by a reporter | capture requires a valid author signature over the envelope; unsigned captures are labelled reporter claim and cannot alone support removal |
| T04 | Snapshot used to leak third-party private data | P2 targets are metadata_only by default; a disclosure is sent only after the reporter approves a redact/1 preview (L3/L4 location shares, geohash cells longer than 5 characters, emails, phone numbers and attachments removed); abuse test T19 |
| T05 | Stolen device or relay disk exposes evidence | blobs encrypted with per-blob keys wrapped by the vault key or relay data key; key rotation in F16.S02.M01 |
| T06 | Moderator identity learned from the access log during an appeal | author view redacts accessor keys and excludes reporter-side rows |
| T07 | Seller evades reporting by adding photos | media limits cover the listing maximum (10 items of 5 MiB) and P0 media are referenced, not copied |

**Abuse controls**
- Capture and ingest are rate limited by F12.S03.M03 at 60 per hour per key on a relay; relay evidence quota 5 GiB per tenant with operator alert at 80%; vault warns at 500 MiB of evidence.
- Identical bodies share one evidence blob with a reference count, which limits storage growth from repeated reports without weakening shredding.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-093-09.T07 | abuse | PS-093-05.R01, PS-093-05.R02, PS-093-07.R03, PS-093-09.R03 | member without case reads relay snapshot; unassigned moderator reads; assigned moderator reads | FORBIDDEN, FORBIDDEN, success with exactly one access row; refused reads write none |
| TEST-PS-093-09.T08 | abuse | PS-093-05.R02, PS-093-07.R05, PS-093-09.R03 | author reads access log of own snapshot and of another's; attempt to UPDATE or DELETE an access row | own shows purpose, role and time only, accessor redacted, reporter rows excluded; other NOT_FOUND; mutation aborts |
| TEST-PS-093-09.T11 | abuse | PS-093-07.R02 | author deletes own record after report | snapshot retained until RET-EVIDENCE end; UI states that copies cannot be recalled |
| TEST-PS-093-09.T15 | abuse | PS-093-05.R03, PS-093-07.R03 | verify, export and purge one snapshot each | exactly one access row per action with action verify, export and purge |
| TEST-PS-093-09.T16 | integration | PS-093-01.R04, PS-093-03.R03, PS-093-07.R02 | two snapshots share one blob, one under relay legal hold, both past retention | unheld snapshot purged and refCount drops to 1; blob key survives; after hold release and the next run the blob key is destroyed and the blob deleted |
| TEST-PS-093-09.T19 | abuse | PS-093-07.R01, PS-093-07.R04 | report message M without disclosure and inspect the relay copy and moderator view | relay holds only targetCid, sender key, sender signature and reason; no plaintext; label 'metadata only' shown |
| TEST-PS-093-09.T20 | integration | PS-093-07.R06 | ExportSectionPort run, then privacy.deletion.completed in the vault with keepEvidence true and false | export section moderation.evidence produced; evidence purged or pseudonymized as documented |
| TEST-PS-093-09.T22 | abuse | PS-093-07.R01, PS-093-07.R04 | F12 privacy suite after captures, ingests, disclosures and purges in a vault and on a relay: scan federation payloads, public projections, relay and vault logs, events and notification payloads | no snapshot body, media reference of a P2 item, accessorId or redacted value appears in any of them; events carry only ids, hashes and enums |

## Dependencies

Module depends on: F15.S02.M03, F16.S01.M01, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
