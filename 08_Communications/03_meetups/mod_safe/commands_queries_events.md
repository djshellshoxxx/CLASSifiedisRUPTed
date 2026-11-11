# PS-066-04 — Commands, queries and events: Safe meetup guidance

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S03.M01 Safe meetup guidance](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/meetups/safe` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-066-04.R01** Curators draft and sign spots in their vault and publish or retire them through relay commands that accept signed statements; anyone lists spots of an L2 cell and reads the relay's curator list through public relay queries; members report unsuitable spots through a relay command.
- **PS-066-04.R02** Members get suggestions through a vault command that reads only the local cache and emits comms.safe_spot.suggested locally.
- **PS-066-04.R03** The module consumes relay role events so that only current relay operators can change the relay-signed curator list.
- **PS-066-04.R04** Statements are registered with F11.S01.M01 (N2): classrup.comms.safe_spot/v1 and classrup.comms.safe_spot_retirement/v1 (signer: a curator key listed in the hosting relay's curator list, or the relay key for operator retirements and expiry) and classrup.comms.curator_list/v1 (signer: the relay key, issued only on an operator's request).
- **PS-066-04.R05** The module registers ExportSectionPort (section comms.safe_spots, including checklist progress and local trust settings), DeletionPort (plan, execute, pseudonymize - a curator's published spots keep the curator DID as public evidence until retired) and RetentionPurgePort with F10 (N6).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `comms.safe_spot.draft` | comms.safe_spot.author | [vault command, curator, local only] { spotId?, name, kind, l2Cell, accessNote?, hours, venueTz, validUntil? } | { spotId, status: draft, revision } | VALIDATION_FAILED, DISCOVERY_PRECISION_FORBIDDEN, NOT_FOUND, CONFLICT_REVISION |  | yes (Idempotency-Key) |
| `comms.safe_spot.sign` | comms.safe_spot.author | [vault command, curator; produces signed statement classrup.comms.safe_spot/v1] { spotId, expectedRevision } | { spotId, version, statementCid, status: signed } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, DISCOVERY_PRECISION_FORBIDDEN, EXPIRED |  | yes (Idempotency-Key) |
| `comms.safe_spot.publish` | comms.safe_spot.publish | [relay command; signed request of a curator device; accepts signed statement classrup.comms.safe_spot/v1] { statement } | { spotId, version, status: active } | UNAUTHENTICATED, VALIDATION_FAILED, DISCOVERY_PRECISION_FORBIDDEN, COMMS_SAFE_SPOT_CURATOR_UNTRUSTED, NOT_FOUND, RATE_LIMITED, CONFLICT_REVISION, EXPIRED |  | yes (Idempotency-Key) |
| `comms.safe_spot.retire` | comms.safe_spot.retire | [relay command; accepts signed retirement statement classrup.comms.safe_spot_retirement/v1] { spotId, reason, expectedRevision } | { spotId, revision, status: retired } | UNAUTHENTICATED, NOT_FOUND, FORBIDDEN, VALIDATION_FAILED, CONFLICT_REVISION, CONFLICT_STATE |  | yes (Idempotency-Key) |
| `comms.safe_spot.report` | comms.safe_spot.report | [relay command, signed request of a registered device] { spotId, reason: closed\|unsuitable\|unsafe\|wrong_hours\|duplicate\|other, text? (≤ 280 characters) } | { reportId, status: received } | UNAUTHENTICATED, NOT_FOUND, VALIDATION_FAILED, RATE_LIMITED |  | yes (Idempotency-Key) |
| `comms.curator_list.update` | comms.curator_list.update | [relay command, request by an operator key; the relay key signs the resulting classrup.comms.curator_list/v1] { add[]: { curatorDid, label }, remove[]: curatorDid, expectedVersion } | { version, statementCid } | UNAUTHENTICATED, FORBIDDEN, VALIDATION_FAILED, CONFLICT_REVISION |  | yes (Idempotency-Key) |
| `comms.safe_spot.suggest` | comms.safe_spot.suggest | [vault command, local only] { l2Cell, windowStart, windowEnd, kinds? } | { items: SafeSpot[] (≤ 5) each with trustSource, cacheAgeMs, checklistVersion, curatorListWarnings[] } | VALIDATION_FAILED, NOT_FOUND, DISCOVERY_PRECISION_FORBIDDEN | comms.safe_spot.suggested | yes (Idempotency-Key) |
| `comms.safe_spot.set_trust` | comms.safe_spot.manage_trust | [vault command, local only] { relayId, action: pin_curator\|unpin_curator\|acknowledge_list_change\|hide_starter_entry\|restore_starter_entry, curatorDid?, entryId? } | { pinnedCurators[], hiddenStarterEntries[] } | VALIDATION_FAILED, NOT_FOUND |  | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `comms.safe_spot.list_for_cell` | comms.safe_spot.read_public | [relay query, public] { l2Cell, sinceVersion?, cursor?, limit ≤ 100 } | { items: SafeSpot[] (signed statements), tombstones[], curatorListCid, nextCursor? } | NOT_FOUND, DISCOVERY_PRECISION_FORBIDDEN |
| `comms.curator_list.get` | comms.curator_list.read_public | [relay query, public] { sinceVersion? } | { statement: classrup.comms.curator_list/v1 { relayId, version, curators[{ curatorDid, label, addedAt }] }, relaySig } | NOT_FOUND |
| `comms.safe_spot.checklist` | comms.safe_spot.suggest | [vault query] { locale } | { version, items: [{ key, defaultText }] (10 items) } |  |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `comms.safe_spot.suggested` | P2 | { l2Cell, spotIds[] (≤ 5), windowStart, windowEnd } — local event; carries the chosen meetup area and window (CTR-PRV-001 P2) and is never sent anywhere |

### Events consumed

| Type | Effect |
|---|---|
| `security.role.assigned` | relay only: a key assigned the operator role on this relay may request curator-list changes |
| `security.role.revoked` | relay only: the key can no longer request curator-list changes; curators it added stay listed and are flagged for review by another operator |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| COMMS_SAFE_SPOT_CURATOR_UNTRUSTED | 403 | no | statement signer is not in the hosting relay's signed curator list |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

### Example

```
vault command comms.safe_spot.suggest
{ "l2Cell": "u33db", "windowStart": "2026-11-07T14:00:00Z", "windowEnd": "2026-11-07T15:00:00Z" }
-> { "items": [ { "id": "0192f3a4-7777-7000-8000-000000000001", "name": "Polizeiabschnitt 53 lobby", "kind": "police_station",
     "l2Cell": "u33db", "trustSource": { "kind": "relay_delegated", "relayId": "relay.example", "curatorLabel": "Community curator C1" } } ],
     "cacheAgeMs": 86400000, "checklistVersion": 3, "curatorListWarnings": [] }
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-066-09.T04 | contract | PS-066-04.R01, PS-066-04.R02, PS-066-04.R03, PS-066-09.R02 | draft, sign, publish, retire, report, curator-list update, suggest, list, curator list and checklist | outputs and event payloads validate against registry schemas |
| TEST-PS-066-09.T05 | unit | PS-066-04.R02, PS-066-02.R02 | suggest for window 14:00 to 15:00 | at most 5 spots, in-hours first, outside-hours labelled, trust source shown, no network call made |
| TEST-PS-066-09.T16 | integration | PS-066-04.R01, PS-066-04.R04 | C1 drafts and signs offline, publishes on reconnect; a member reports the spot; registry lookup | spot active only after relay acceptance; report stored with RET-SHORT expiry; registry lists spot, retirement and curator-list statements with signer roles |
| TEST-PS-066-09.T17 | contract | PS-066-04.R02 | comms.safe_spot.suggested declared privacy class and payload | class P2 and payload holds only l2Cell, spotIds and the window |
| TEST-PS-066-09.T20 | integration | PS-066-04.R05, PS-066-07.R04 | account deletion of a member and of curator C1 | DeletionPort plans export and erase trust settings and checklist progress; C1's published spots stay public until retired, as the plan states |

## Dependencies

Module depends on: F06.S02.M01, F16.S01.M01, F16.S02.M03, F11.S01.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
