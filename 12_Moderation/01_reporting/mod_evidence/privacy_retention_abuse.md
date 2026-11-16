# PS-093-07 — Privacy, retention and abuse: Moderation evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S01.M02 Moderation evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/reporting/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-093-07.R01** Snapshot bodies and media are P3, encrypted per object, and leave a store only inside a sealed report or case bundle addressed to a relay moderation key, or in the owner's own export.
- **PS-093-07.R02** Retention is RET-EVIDENCE with legal-hold override, and destruction is cryptographic shredding by key deletion; copies already sent to a relay or fetched by others cannot be recalled and the UI says so.
- **PS-093-07.R03** Every access is logged and neither moderators nor vault apps expose a way to edit or delete access rows.

## Specification

**Data classification**
- EvidenceSnapshot: P3 (vault owner; moderators of the relay that received it for the case; author for appeal view).
- EvidenceAccess: P3 (store owner and relay operators).
- Per-object keys: P4, wrapped by the vault key (vault) or the relay data key from F16.S01.M02 (relay).

**Retention**
- Snapshots: RET-EVIDENCE (2 years after last related activity) unless a legal hold applies.
- Access rows: RET-EVIDENCE; after purge they are reduced to stubs without content references for 180 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Relay moderator browses snapshots out of curiosity | relay read requires assigned case; each read logged; operator weekly access report; more than 50 reads per moderator per day alerts |
| T02 | Tampering with stored evidence to justify a decision | content hash plus per-object AEAD tag; author signature over the original envelope; sweep verification; decisions store the hash they relied on |
| T03 | Forged evidence fabricated by a reporter | capture requires a valid author signature over the envelope; unsigned captures are labelled reporter claim and cannot alone support removal |
| T04 | Snapshot used to leak third-party private data | body limited to what the target's privacy class exposes to the reporter; P3 fields of others are never captured |
| T05 | Stolen device or relay disk exposes evidence | bodies encrypted with per-object keys wrapped by the vault key or relay data key; key rotation in F16.S02.M01 |

**Abuse controls**
- Capture is rate limited by F12.S03.M03 at 60 per hour per key on a relay; relay evidence quota 5 GiB per tenant with operator alert at 80%; vault warns at 500 MiB of evidence.
- Dedup of identical bodies limits storage growth from repeated reports.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-093-09.T07 | abuse | PS-093-05.R01, PS-093-05.R02, PS-093-07.R03 | member without case reads relay snapshot; unassigned moderator reads; assigned moderator reads | FORBIDDEN, FORBIDDEN, success with exactly one access row; refused reads write none |
| TEST-PS-093-09.T08 | abuse | PS-093-05.R03, PS-093-07.R01 | author reads access log of own snapshot and another's; attempt to UPDATE or DELETE an access row | own allowed, other NOT_FOUND; mutation aborts |
| TEST-PS-093-09.T11 | abuse | PS-093-07.R02 | author deletes own record after report | snapshot retained until RET-EVIDENCE end; UI states that copies cannot be recalled |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
