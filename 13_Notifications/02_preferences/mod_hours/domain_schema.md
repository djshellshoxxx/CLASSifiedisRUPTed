# PS-105-01 — Domain schema: Quiet-hours schedule

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M02 Quiet-hours schedule](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/hours` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-105-01.R01** A QuietHoursSchedule stores the user DID, an IANA time zone, an enabled flag, up to 4 windows each with days of week 1 to 7 and local start and end as HH:mm, the tzdata version used, and this device's mirror chain position (seq and head cid), with tenant and revision per CTR-ID-001.
- **PS-105-01.R02** The schedule is P2, held in the vault and mirrored to relays only as a rule-equivalent canonical time zone plus windows; it contains no location and no content, the mirrored zone is a region shared by many places covering at least an L1 cell, and the UI states that the relay learns that region and the sleep rhythm.
- **PS-105-01.R03** Evaluation is a pure function of the instant, the schedule and the pinned tzdata; local wall-clock windows are mapped to instants with the rules in the invariants.
- **PS-105-01.R04** Before mirroring, the time zone is replaced by the canonical zone of its rule-equivalence class in the pinned tzdata (identical UTC offsets and transitions from 2020 to 2100, for example Europe/Busingen to Europe/Zurich and America/Indiana/Tell_City to America/Chicago), chosen so that the class covers at least an L1 cell, and isQuiet results are identical for the original and the canonical zone.
- **PS-105-01.R05** The mirror statement classrup.notify.quiet_hours_mirror/v1 has its own schema distinct from the vault record and from the relay copy classrup.notify.quiet_hours_relay/v1; it is a CTR-FED-001 envelope signed by a device key, addressed to one relay, and chained per (author, signing device key, stream notify.quiet_hours) with seq and prev.

## Specification

### QuietHoursSchedule

Schema `classrup.notify.quiet_hours/v1` · storage **device** · privacy **P2** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| vaultId | uuidv7 — local vault scope (CTR-ID-001 tenant slot) |
| userDid | did:key — owner |
| enabled | boolean — false means never quiet |
| timeZone | string — IANA identifier present in the pinned tzdata, for example Europe/Berlin |
| windows | array — 0..4 items { days: int[1..7] (ISO, 1 Monday), start: HH:mm, end: HH:mm } |
| tzdataVersion | string — IANA tzdata release used when the schedule was saved, for example 2026b |
| mirrorSeq | int — seq of this device's last mirror statement (chain per signing device key) |
| mirrorHeadCid? | string — cid of this device's last mirror statement |
| mirrorStates | array — per relay { relayId, cid, syncState: prepared\|transport_acknowledged\|peer_accepted\|stale\|conflict, effectiveDeviceKeyId? } |
| updatedAtClaim | timestamp — user clock, a claim |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- A window whose end is not later than its start crosses midnight and belongs to the day of its start; its length is at least 15 minutes and at most 12 hours.
- A local start time that does not exist (spring-forward gap) moves forward by the gap length; a local time that occurs twice is interpreted as the earlier occurrence for a start and the later occurrence for an end, so the whole repeated hour lies inside a window that spans it.
- Windows of one schedule must not overlap in real time on any day and the union of windows must be shorter than 24 hours per day.

### QuietHoursSchedule

Schema `classrup.notify.quiet_hours_relay/v1` · storage **relay** · privacy **P2** · retention **RET-STANDARD**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| tenantId | uuidv7 — relay tenant scope |
| userDid | did:key — statement author |
| deviceKeyId | string — signing device key of this chain |
| headSeq | int — seq of the applied head statement of this chain |
| headCid | string — cid of the applied head statement |
| enabled | boolean — as stated |
| timeZone | string — canonical zone from the pinned equivalence table |
| windows | array — 0..4 windows as stated |
| tzdataVersion | string — as stated |
| acceptedAt | timestamp — relay clock when this head was accepted; the most recent across the user's active device chains is effective |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- At most one row per (userDid, deviceKeyId); headSeq only increases and headCid is the cid of that seq.
- Rows exist only while the user holds a granted push or email consent registered at this relay.
- Rows of a device key revoked per F16.S02.M02 are never effective.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-105-09.T01 | unit | PS-105-01.R01, PS-105-01.R02, PS-105-02.R01 | save a valid New York schedule 22:00 to 07:00 daily | stored with tzdataVersion and mirrorSeq 0; mirror statement payload has exactly relayId, enabled, timeZone, windows, tzdataVersion |
| TEST-PS-105-09.T03 | unit | PS-105-01.R03, PS-105-02.R02 | evaluate New York on 2026-03-08 across the gap | window covers 8 real hours: quiet from 03:00 UTC to 11:00 UTC on 2026-03-08 inclusive of the start and exclusive of the end |
| TEST-PS-105-09.T04 | unit | PS-105-01.R03 | evaluate New York on 2026-11-01 across the repeated hour | window covers 10 real hours from 02:00 UTC to 12:00 UTC; both 01:30 occurrences are quiet |
| TEST-PS-105-09.T05 | unit | PS-105-01.R03, PS-105-02.R02 | window starting 02:30 on 2026-03-08 New York, and Lord_Howe, London and Auckland transitions | start shifts forward by the gap, empty window yields not quiet, 30-minute shifts handled, results equal reference implementation |
| TEST-PS-105-09.T07 | contract | PS-105-04.R01, PS-105-04.R02, PS-105-09.R02, PS-105-01.R05 | set, mirror, get, get_mirror, evaluate execute | outputs, the statement envelope and event payloads validate against registry schemas; statement schema differs from both record schemas; the changed event has no timeZone or windows |
| TEST-PS-105-09.T16 | property | PS-105-01.R04 | every zone of the pinned tzdata mapped to its canonical zone; random schedules and instants 2020 to 2100 | isQuiet identical for the zone and its canonical zone; Europe/Busingen maps to Europe/Zurich and America/Indiana/Tell_City to America/Chicago; every canonical class covers at least an L1 cell |
| TEST-PS-105-09.T18 | e2e | PS-105-01.R02, PS-105-07.R01, PS-105-07.R02 | open the quiet hours screen with Europe/Busingen selected and a relay with push consent | the relay note names Europe/Zurich as the region the relay learns and states that the windows are sent; no location permission is requested |

## Dependencies

Module depends on: F13.S02.M03, F11.S01.M01, F16.S02.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [module SPEC](SPEC.md).
