# PS-103-07 — Privacy, retention and abuse: In-app notifications

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M03 In-app notifications](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/inapp` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-103-07.R01** Notifications are vault-local, content-free and P2; they never leave the device except as the separate content-free alerts decided by the gate, and references and collapse keys reach only the vault gate, which seals them before anything is sent to a relay.
- **PS-103-07.R02** Retention is 30 days with a cap of 500 items, and security rows are the last to be dropped by the cap.
- **PS-103-07.R03** Notification spam from hostile peers is limited by blocking, collapsing, a per-actor cap of 50 rows per day and an aggregate budget of 20 rows per day per category for actors with no prior interaction, beyond which events collapse into one row reading N new from new members.
- **PS-103-07.R04** Eviction under the 500-item cap removes read rows first, then rows from unknown actors, then the oldest unread non-security rows from known counterparties, and security rows last, so a Sybil flood never evicts pre-existing unread rows from known counterparties.

## Specification

**Data classification**
- Notification: P2, vault only; contains template key and reference but no content.
- Known-actor index: P2, vault only, salted hashes of DIDs.

**Retention**
- Rows: RET-SHORT (30 days) and at most 500; counters of removed rows kept in diagnostics.
- Known-actor index: RET-STANDARD, at most 5 000 entries, oldest removed first.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Peer floods the inbox with offers or messages | blocking, collapse within 10 minutes, cap of 500, per-actor cap of 50 rows per day, hidden counter instead of rows beyond the cap |
| T02 | Forged event creates a fake security notification | notifications are created only from events derived from verified statements; security templates only from identity, privacy and notify events |
| T03 | Notification text leaks content on lock screen | OS alerts come from F13.S02.M01 with generic text from the template; in-app titles never contain amounts or names unless the user enabled previews (default off) |
| T04 | Urgent class abused | urgent only for the three fixed security templates |
| T05 | Sybil actors with free did:key identities fill the inbox and evict real items | aggregate budget of 20 rows per day per category for unknown actors with collapse into one row, unknown-actor rows evicted before unread rows of known counterparties |
| T06 | Account takeover on another device goes unnoticed because the actor is the same DID | security rows skip only events raised on this device; device_key.added from another device is urgent |

**Abuse controls**
- Per-actor cap of 50 rows per day and new-actor budget of 20 rows per day per category through RateLimitPort in vault-local mode (F12.S03.M03), plus the local block list (F07.S02.M02).
- Users can mute categories and threads; the user can report a source from the notification screen.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-103-09.T10 | abuse | PS-103-07.R01, PS-103-07.R02, PS-103-07.R03 | 51st event from one actor in a day; 501st row; inspect exported diagnostics and the dispatch port arguments | hidden counter increments, cap removes read rows first, no content in exports, refs and collapse keys reach only the in-vault port |
| TEST-PS-103-09.T16 | abuse | PS-103-07.R03, PS-103-07.R04, PS-103-01.R04 | 600 fresh DIDs each send one offer while U has 30 unread rows from known counterparties and the inbox is near the cap | after 20 rows the rest collapse into one new_members row; every pre-existing unread row from known counterparties survives; unknown-actor rows evicted first |

## Dependencies

Module depends on: F13.S02.M04, F07.S02.M02, F08.S01.M02, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
