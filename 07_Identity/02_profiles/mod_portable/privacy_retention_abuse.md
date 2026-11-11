# PS-055-07 — Privacy, retention and abuse: Portable identity

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M01 Portable identity](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/portable` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-055-07.R01** The document is a deliberate public P0 statement containing only public keys, key hashes, the pseudonym and relay URLs, and it never contains P3 data, private keys or recovery material.
- **PS-055-07.R02** The product states before first publication that a published document and copies other vaults fetched cannot be recalled, only superseded or tombstoned.
- **PS-055-07.R03** Relays honor signed tombstones within 24 hours (FED-4, PRV-6) and may not rewrite documents.
- **PS-055-07.R04** The module meets the N6 privacy duties - it registers ExportSectionPort (section identity.portable_docs), DeletionPort (tombstone the own document on the selected relays, delete received documents, pseudonymize documents kept as evidence) and RetentionPurgePort, classifies provenance fields with F10.S02.M02, checks federation_publish consent per relay before publication, and treats privacy.deletion.completed only as final cleanup.

## Specification

**Data classification**
- PortableIdentityDoc: P0 public; provenance, firstSeenAt, pendingRecoveries and revokedUnion are local metadata (P3 on device).

**Retention**
- Own and received documents until vault erase or contact removal (RET-STANDARD); superseded and history versions kept for 2 years (RET-EVIDENCE) to verify old statements; relay keeps the latest 20 versions per DID.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Forged document for someone else's DID | signature must verify against the key encoded in the DID; a forger would need the root private key |
| T02 | Fork attack by a stolen key | only the root key signs documents, so a stolen non-root device cannot fork the document; a stolen root device or kit can, which shows as a fork (contested) as soon as the owner also issues, and the honest limit is stated |
| T03 | Replay of an old document to resurrect a revoked device | seq and prev chain, lower seq stored as history, revokedUnion keeps every revocation and a later active listing is a rollback that contests the DID |
| T04 | Document used to deanonymize the owner | the document contains only what the owner chose; the UI explains that a DID is a stable pseudonymous identifier that links all of the owner's public activity, not anonymity |
| T05 | Relay flood with many fake DIDs | 10 publications per hour per DID, 100 per hour per IP /24, 8 KiB size limit, relay hosting policy |
| T06 | Backdated issuedAt to claim earlier revocation | issuedAt is a claim; verifiers use seq and their own receipt time for trust decisions, the relay-signed receipt time is evidence of that relay's clock only |
| T07 | Fork resolution that brings back a revoked key | a resolving document must list every revocation of every competing branch (V10) and revokedUnion never shrinks |
| T08 | Quick takeover by a recovery that revokes the owner's devices | revocations with reason recovery wait 72 h from this vault's own first sight of the notice; no notice or a self-contradicting timeline contests the DID |
| T09 | Foreign key listed to fake same-owner linkage | possession signatures over the DID-bound message are required for every active key (V07) |

**Abuse controls**
- Relay quotas as above; vault intake accepts at most 50 documents per hour from one transport source and quarantines the rest; gap fetches at most 4 per DID per 24 h.
- Documents from blocked DIDs are dropped silently through BlockFilterPort; the sender cannot tell.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-055-09.T11 | abuse | PS-055-07.R01, PS-055-07.R03 | inspect documents for P3 fields and private keys; relay asked to rewrite a document; tombstone for the own document | no private data; rewrite impossible; relay removes it within 24 h |
| TEST-PS-055-09.T24 | integration | PS-055-07.R04 | F10 export section, deletion plan and retention sweep with stub registries | section identity.portable_docs exported; own document tombstoned on selected relays; received documents deleted; superseded versions kept as evidence are pseudonymized |
| TEST-PS-055-09.T25 | e2e | PS-055-07.R02, PS-055-09.R04 | UI copy check before first publication and on the contact identity screen | no-recall notice shown before the first publication; 'first seen by this device' and recovery pending texts present |
| TEST-PS-055-09.T26 | abuse | PS-055-02.R05, PS-055-07.R01 | a later document lists revoked key D1 as active again | rollback detected; DID contested; D1 stays revoked in key_status |

## Dependencies

Module depends on: F07.S01.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
