# PS-090-07 — Privacy, retention and abuse: Account and relay migration

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M03 Account and relay migration](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/migration` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-090-07.R01** A move statement reveals the old and new relay of a pseudonymous did:key, which is public by design and stated in the wizard.
- **PS-090-07.R02** A stolen device key must not silently move an account, so a 24 h veto window on each receiver's clock, a 24 h minimum key age and a 30-day cool-down limit the damage, and the UI says when only one device key exists and no veto is possible.
- **PS-090-07.R03** The move never transfers private data between relays; the vault re-establishes mailboxes and encrypted material itself.
- **PS-090-07.R04** The module registers the N6 ports (ExportSectionPort for the migration history, DeletionPort, RetentionPurgePort for RET-EVIDENCE records), classifies fields with F10.S02.M02 and pseudonymizes retained records on privacy.deletion.completed.

## Specification

**Data classification**
- MigrationRecord and move statements: P0 (did, relay ids, times).
- Copy progress counters: P0.

**Retention**
- RET-EVIDENCE for MigrationRecord (2 years after closing); redirect data on the old relay 180 days after effectiveAt.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Stolen device key moves the account to an attacker relay | 24 h veto from another device key measured on each receiver's clock, 30-day cool-down, immediate notice on all devices, key age ≥ 24 h (V08), key status re-checked at promotion |
| T02 | Forged move statement for a victim | signature by a key active in the victim's portable document is mandatory; observers verify independently |
| T03 | Redirect abuse to send readers to a malicious relay | redirect only after a verified effective statement; relays are allowlisted or user-selected; readers see the target relay name |
| T04 | Replay of an old move statement to move an account back | move cid dedup, 30-day cool-down, 3 moves per 90 days, tombstone stubs kept at least 180 days |
| T05 | Metadata leak of old relay to new relay or peers | the statement carries only did and relay ids; no records or contact data are included |
| T06 | Relay move used to hijack peering, or a forged relay move used to get an honest peer suspended | relay move honored only with the pinned relay key; a wrong-key move is dropped and counted only against the sender that signed the delivering request; a key change requires manual re-peering |
| T07 | Backdated announcedAt used to skip the veto window | window starts at each receiver's first verified receipt or the old relay's signed receipt; direct receivers refuse announcedAt more than 10 min off (V04) |

**Abuse controls**
- Move statements per did are limited to 3 per 90 days even when cancelled.
- Redirect lookups are rate limited to 60 per minute per IP prefix (/24 or /48).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-090-09.T03 | abuse | PS-090-02.R01, PS-090-07.R02 | own announce signed by a revoked key, by an unlisted key and by a key added 1 h earlier | FEDERATION_MOVE_SIGNER_INVALID for each |
| TEST-PS-090-09.T11 | abuse | PS-090-07.R01, PS-090-07.R02, PS-090-07.R03 | inspect move statement and UI with a single device key | no private data in statement; UI states that no veto is possible; no mailbox contents moved |
| TEST-PS-090-09.T12 | abuse | PS-090-07.R02, PS-090-02.R01 | second move after 10 days; 4th move statement in 90 days | FEDERATION_MOVE_COOLDOWN; rate limit |
| TEST-PS-090-09.T24 | unit | PS-090-07.R04 | export, deletion and retention ports called by F10; privacy.deletion.completed | migration section exported; deletion plan returned; retained records pseudonymized |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S02.M03, F11.S03.M01, F07.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
