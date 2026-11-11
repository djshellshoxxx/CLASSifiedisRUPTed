# PS-105-04 — Commands, queries and events: Quiet-hours schedule

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M02 Quiet-hours schedule](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/hours` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-105-04.R01** Saving the schedule is a vault command that emits vault-local notify.quiet_hours.changed in the same IndexedDB transaction and produces a signed mirror statement for each relay that holds a registered push or email consent.
- **PS-105-04.R02** The relay exposes a mirror command that emits relay-local notify.quiet_hours.changed in the same SQLite transaction when the effective mirror changes, and a signed get_mirror query; both environments expose the same pure evaluate query.
- **PS-105-04.R03** The vault instance consumes vault-local channel consent events to mirror the current schedule to a newly consented relay, and the relay instance consumes relay-local notify.channel.opted_out and security.key.revoked to delete or retire its mirror rows.
- **PS-105-04.R04** classrup.notify.quiet_hours_mirror/v1 is registered with F11.S01.M01 (N2) with signer role principal (device key active in the author's portable document and in F16.S02.M02) and audience the relay named in payload relayId.
- **PS-105-04.R05** The module registers ExportSectionPort (section notify.quiet_hours), DeletionPort (purge step) and RetentionPurgePort (kind notify.quiet_hours) with F10 (N6), classifies every field with F10.S02.M02, and routes limits through RateLimitPort of F12.S03.M03 (N18).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `notify.quiet_hours.set` | notify.quiet_hours.set | [vault command; produces classrup.notify.quiet_hours_mirror/v1 with the canonical zone for each relay holding a registered consent] { enabled, timeZone, windows[] (≤ 4), expectedRevision? } | { scheduleId, revision, mirrorStates: [{ relayId, syncState }], currentlyQuiet, quietEndsAt? } | VALIDATION_FAILED, NOTIFY_QUIET_TZ_UNKNOWN, NOTIFY_QUIET_WINDOW_INVALID, CONFLICT_REVISION, RATE_LIMITED | notify.quiet_hours.changed | yes (Idempotency-Key) |
| `notify.quiet_hours.mirror` | notify.quiet_hours.mirror | [relay command; request signed by an active device key of userDid; body is a sealed classrup.notify.quiet_hours_mirror/v1 envelope] { statement } | { outcome: applied\|stale, appliedCid, effectiveCid, effectiveDeviceKeyId, relayReceiptAt, acceptance?: { cid, sig } (applied only) } | VALIDATION_FAILED, NOTIFY_QUIET_TZ_UNKNOWN, NOTIFY_QUIET_WINDOW_INVALID, PRECONDITION_FAILED, UNAUTHENTICATED, CONFLICT_STATE, RATE_LIMITED | notify.quiet_hours.changed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `notify.quiet_hours.get` | notify.quiet_hours.read_own | [vault query] {} | { schedule: QuietHoursSchedule \| null, currentlyQuiet, quietEndsAt? } |  |
| `notify.quiet_hours.get_mirror` | notify.quiet_hours.read_mirror | [relay query signed by an active device key of the user] {} | { effectiveCid?, effectiveDeviceKeyId?, acceptedAt?, chains: [{ deviceKeyId, headSeq, headCid }] } | UNAUTHENTICATED, RATE_LIMITED |
| `notify.quiet_hours.evaluate` | notify.quiet_hours.evaluate | [pure function, vault and relay] { at: timestamp, schedule } | { quiet: boolean, quietEndsAt?: timestamp, nextQuietStartsAt?: timestamp } | VALIDATION_FAILED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `notify.quiet_hours.changed` | P2 | { userDid, enabled, windowCount, mirrorSeq?, revision?, side: vault\|relay } — vault-local from set; relay-local from mirror and from key or consent changes that change the effective mirror; never the time zone or windows |

### Events consumed

| Type | Effect |
|---|---|
| `notify.channel.opted_in` | vault instance: queue the current schedule as a mirror statement to that relay after the consent registration in the same per-relay outbox, so the relay sees the consent first |
| `notify.channel.opted_out` | vault instance: stop mirroring to that relay when no granted push or email consent remains there; relay instance (relay-local event): delete the user's mirror rows at once when no granted consent of the user remains at this relay and emit relay-local notify.quiet_hours.changed |
| `security.key.revoked` | relay instance: rows of the revoked device key stop being effective and later mirrors signed by it are refused UNAUTHENTICATED; when the effective mirror changes, emit relay-local notify.quiet_hours.changed |
| `privacy.deletion.completed` | vault instance: notification only; confirm that the DeletionPort purge step removed the schedule; nothing is signed |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| NOTIFY_QUIET_TZ_UNKNOWN | 422 | no | time zone is not in the pinned IANA tzdata or is not a canonical zone in a mirror |
| NOTIFY_QUIET_WINDOW_INVALID | 422 | no | a window is shorter than 15 minutes, longer than 12 hours, equal start and end, or overlapping |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Execution sites (ADR-0016): set and get run in the vault; mirror and get_mirror on the relay; evaluate in both. Statement (N2, registered with F11.S01.M01): classrup.notify.quiet_hours_mirror/v1 - CTR-FED-001 envelope, author the principal did:key, ext.signerKey the device key, ext.stream notify.quiet_hours, seq and prev per (author, signerKey, stream) (FED-8); signer role principal; audience the relay named in payload relayId, sealed to that relay's published key; payload exactly {relayId, enabled, timeZone (canonical), windows, tzdataVersion}; maxAge 400 d. The relay acceptance signature covers the applied cid; outcome stale (seq at or below the head with the same cid) keeps the vault below transport_acknowledged in meaning and is shown as superseded; a fork is CONFLICT_STATE. Effective mirror - the head accepted most recently across the user's chains whose device key is active; no effective mirror means never quiet. The canonical-zone table is generated at build time from the pinned tzdata by grouping zones with identical transitions and offsets from 2020 to 2100 and choosing the zone whose class covers the largest area (at least an L1 cell). Privacy ports (N6): ExportSectionPort section notify.quiet_hours with schema classrup.notify.quiet_hours/v1; DeletionPort plan {willDelete: the schedule, willPseudonymize: none, blockers: none} and step purge (relay copies are deleted when the F13.S02.M03 sign-step withdrawals are registered); RetentionPurgePort kind notify.quiet_hours, class RET-STANDARD, anchorField updatedAtClaim. Every field is classified with F10.S02.M02.

### Example

```
vault command notify.quiet_hours.set
{ "enabled": true, "timeZone": "Europe/Busingen", "windows": [ { "days": [1,2,3,4,5,6,7], "start": "22:00", "end": "07:00" } ] }
-> { "scheduleId": "0192f3b2-0000-7000-8000-000000000001", "revision": 1, "mirrorStates": [ { "relayId": "relay:k3n7v2…", "syncState": "prepared" } ], "currentlyQuiet": false }
relay command notify.quiet_hours.mirror { "statement": <sealed classrup.notify.quiet_hours_mirror/v1, seq 4, payload.timeZone "Europe/Zurich"> }
-> { "outcome": "applied", "appliedCid": "sha256-a1…", "effectiveCid": "sha256-a1…", "effectiveDeviceKeyId": "…#d1", "relayReceiptAt": "2026-11-04T10:00:01Z", "acceptance": { "cid": "sha256-a1…", "sig": "…" } }   vault syncState -> peer_accepted
evaluate { "at": "2026-03-08T06:30:00Z", "schedule": { "timeZone": "America/New_York", … } }   // 01:30 EST on the spring-forward night
-> { "quiet": true, "quietEndsAt": "2026-03-08T11:00:00Z" }     // 07:00 EDT
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-105-09.T07 | contract | PS-105-04.R01, PS-105-04.R02, PS-105-09.R02, PS-105-01.R05 | set, mirror, get, get_mirror, evaluate execute | outputs, the statement envelope and event payloads validate against registry schemas; statement schema differs from both record schemas; the changed event has no timeZone or windows |
| TEST-PS-105-09.T08 | integration | PS-105-04.R03, PS-105-03.R02 | vault-local opted_in and opted_out; relay-local opted_out for the last consent at R; security.key.revoked for the effective device key | mirror queued after the registration; relay rows deleted at once and relay-local changed emitted; revoked chain no longer effective |
| TEST-PS-105-09.T17 | integration | PS-105-04.R04, PS-105-04.R05 | registry lookup of classrup.notify.quiet_hours_mirror/v1; DeletionPort plan and purge, export section and retention purge with F10 doubles | signer role principal and audience relayId present; purge removes the schedule; section notify.quiet_hours exported |

## Dependencies

Module depends on: F13.S02.M03, F11.S01.M01, F16.S02.M02, F07.S02.M01, F15.S01.M01, F15.S02.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
