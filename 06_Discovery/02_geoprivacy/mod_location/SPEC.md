# F06.S02.M02 — User location settings

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F06.S02](../SPEC.md). **Process IDs:** PS-048-01…PS-048-10. **Code:** `packages/discovery/src/geoprivacy/location`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Keeps the user's location choices inside the vault. The user sets a home region (public precision at most L2, chosen by tapping a map tile or picking from an offline gazetteer, with GPS optional and used only once to snap to a cell on the device). The user can also share a precise position (L3 cell or L4 exact coordinates) with exactly one counterparty for at most 24 hours as an end-to-end encrypted signed statement, and can revoke it. Exact coordinates never reach a relay in readable form and exact home addresses are never stored.

## Responsibilities

- Own LocationSetting - the vault-local home cell, the public level (L0, L1 or L2) and the entry mode.
- Snap device GPS or manual map input to a cell on the device before any storage, discarding the raw point within 1 second.
- Own LocationShare - the sharer's record and the recipient's received copy of a time-limited precise share, with expiry, revocation and context binding.
- Produce the signed statements classrup.discovery.location_share/v1 and classrup.discovery.location_share_revoke/v1 and verify incoming ones.

## Not responsible for

- Geohash math and the public-precision guard (F06.S02.M01).
- Transport and encryption of envelopes (F08.S01.M02 private messaging, relay mailboxes under F11).
- Meetup scheduling and safe-spot suggestions (F08.S03).
- Storing a street address; the vault holds no address field in this module.
- Future: continuous live location, location sharing to groups, platform-protected key storage for share keys.

## User stories

- As a user, I set my area by tapping a map tile without granting any location permission, and only the approximate area is stored.
- As a user, I choose whether my profile and listings show my area at L1 (about 39 km) or L2 (about 5 km) or nothing.
- As a buyer arranging a meetup, I share my exact position with the seller for 2 hours and can stop sharing at any time.
- As a recipient, I see that a share is active, when it ends, and that the sender can revoke it.

## Edge cases

- Browser geolocation permission is denied or times out after 10 s; the flow falls back to the manual map tile picker with no error blocking the user.
- The user changes the home cell more than 3 times in 24 hours; the local guard refuses with DISCOVERY_HOME_CHANGE_LIMIT to discourage position-probing patterns.
- A share is requested for a counterparty the user has blocked; refused with BLOCKED_PARTY.
- An incoming share claims an expiry 5 days ahead; the recipient clamps it to receipt time plus 24 h and marks it clamped.
- The sender revokes while the recipient is offline; the revoke statement waits in the sync outbox (prepared, then transport_acknowledged) and the recipient's copy ends when it arrives or at expiry, whichever is first.
- A recipient device keeps a copy after expiry; the protocol cannot force deletion on another device and the sender UI says so before sharing.
- The user already has an active share to the same counterparty and context; the new grant replaces it only after explicit confirmation (old one revoked first).
- Clock skew - the recipient's clock differs from the sender's by an hour; all expiry decisions use the recipient's local receipt time as the anchor.

## UX and accessibility

- Location settings: map tile picker with a 5 km grid, 'Use my device position once' button, public level selector (Hidden, Region about 39 km, Area about 5 km) with a live preview of what others will see.
- Share precise location sheet: counterparty name, precision (neighbourhood about 1 km or exact point), duration (15 min, 1 h, 2 h, 8 h, 24 h), warning text about copies on the other device, Share and Stop buttons.
- Incoming share card: map with marker, remaining time countdown, 'ends when sender stops or at <time>'.

**States:** loading; no-home-set; permission-denied; active-share; share-expired; share-revoked; pending-offline; delivered-transport; accepted-by-peer; error

**Accessibility:** The map tile picker has a keyboard and list alternative (choose from a searchable list of regions) per WCAG 2.5.7.; Share state and remaining time are announced through an aria-live polite region and shown as text.; Share and Stop buttons are at least 44 by 44 px with distinct accessible names including the counterparty.

## Owned data

- `LocationSetting` (classrup.discovery.location_setting/v1, P3, RET-STANDARD)
- `LocationShare` (classrup.discovery.location_share/v1, P3, RET-EPHEMERAL)

## Interfaces

- Commands: `discovery.location.set_home`, `discovery.location.clear_home`, `discovery.location_share.grant`, `discovery.location_share.revoke`, `discovery.location_share.receive`
- Queries: `discovery.location.get_own`, `discovery.location_share.list`
- Emits: `discovery.location.updated`, `discovery.location_share.granted`, `discovery.location_share.revoked`
- Consumes: `identity.block.added`, `comms.meetup.cancelled`, `privacy.deletion.requested`

## Dependencies

F06.S02.M01, F07.S01.M01, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-UX-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-048-01 | [Domain schema](domain_schema.md) | 3 |
| PS-048-02 | [Validation rules](validation_rules.md) | 3 |
| PS-048-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-048-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-048-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-048-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-048-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-048-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-048-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-048-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/discovery/src/geoprivacy/location/index.ts`.

## Acceptance criteria

- All tests T01-T14 pass in CI.
- No location finer than L2 appears in any public projection, event class below P3, log or relay-readable payload.
- Every share ends by expiry or revocation locally within 30 seconds with its position deleted, and the UI states what the other device may still hold.
