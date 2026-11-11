# F11.S03.M01 — Peer trust

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F11.S03](../SPEC.md). **Process IDs:** PS-091-01…PS-091-10. **Code:** `packages/federation/src/interop/trust`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Keeps the explicit, opt-in list of relays a vault or relay exchanges signed statements with. A relay peer is active only after both sides opted in through signed peer_offer and peer_accept statements that arrive on dedicated inbound endpoints, and after an operator confirmed the key fingerprint; there is no auto-discovery. In a vault the same list holds the user-selected relays, which activate on the relay's signed identity and hosting-policy statement plus the user's fingerprint confirmation, without any per-user acceptance. Each peer has a pinned relay key (did:key), a trust level, per-peer quotas and a health score that falls only on faults the peer relay itself is responsible for (invalid signatures it forwarded, invalid requests, traffic relays never forward, quota breaches, equivocation signed by its own key) and suspends the peer automatically below 40. An author's forks or a local policy rejection never count against the relay that merely forwarded them. Relay-to-relay federation is behind a flag that is off by default; trust here is operational (rate and acceptance), never a claim that a peer's users are honest, and no relay is authoritative for any user's records.

## Responsibilities

- Own Peer records (relay id, did:key relay key, base URL, kind, proposal origin, direction, trust level, quotas, health score, status, opt-in flags for both sides, identity-document listing for selected relays).
- Run the opt-in handshake with classrup.federation.peer_offer/v1 and classrup.federation.peer_accept/v1 statements, including the inbound endpoints POST /fed/v1/peer-offer and /fed/v1/peer-accept; activate only when both are verified and the operator confirmed the key fingerprint.
- Activate a vault's selected relay from the relay's verified classrup.federation.relay_identity/v1 statement and the user's fingerprint confirmation.
- Resolve a request key id to an active peer and enforce quotas (default 6000 envelopes/hour, 10 batches/minute, 2 GiB stored per peer) for F11.S01.M02 and F11.S02.M01, owning FEDERATION_PEER_NOT_ALLOWED and FEDERATION_QUOTA_EXCEEDED (N1).
- Maintain the health score from relay-attributable faults only and suspend automatically below 40 or on 20 invalid signatures in 10 minutes.
- Support key rotation through a rotation statement signed by the old key with a 7-day overlap, emit federation.peer.key_rotated when a pinned key rotates so consumers re-check relay attestations without waiting for a descriptor refresh, and refuse unexpected key changes with FEDERATION_KEY_MISMATCH.
- Register the N6 privacy ports for the vault's selected-relay list.

## Not responsible for

- Verifying envelopes and requests cryptographically (F11.S01.M03) and storing records (F11.S01.M02).
- Signing peer statements; they are signed through the StatementPublisherPort implemented by F11.S01.M02.
- Content-level blocking by author, cid or hash (F11.S03.M02).
- Delivery queues and retries (F11.S02.M01).
- Attributing an author's forks (F11.S02.M03 author-level limit) and reputation of individual users (F07 identity).
- Publishing the user's listed relays in the portable identity document (F07.S02.M01 reads listInIdentityDoc from here).
- Future: peer discovery directories, transitive trust and relay reputation feeds; MVP is manual allowlist only.

## User stories

- As a user, I can choose a relay, see its key fingerprint and hosting policy, confirm it, choose whether it is listed in my identity document, and remove it later without losing any local record.
- As a relay operator, I can propose peering to another relay, compare fingerprints out of band, and see the peering go active only when the other operator accepts.
- As a relay operator, I see unsolicited peering offers from relays I have not allowlisted in a review queue, and I can accept or reject each one.
- As a relay operator, I can see a peer's health score and quotas and suspend it with a reason, and I know an author's misbehaviour forwarded by an honest peer does not lower that peer's score.

## Edge cases

- Peer presents a different key than the pinned one without a rotation statement; requests rejected with FEDERATION_KEY_MISMATCH and the peer is suspended with reason key_mismatch.
- Both operators propose to each other at the same time; each side's receive_offer merges the inbound offer with its own outbound proposal into one proposed Peer, and activation needs one verified accept plus the fingerprint confirmation.
- A relay that is not allowlisted sends 6 peer offers in one day from the same /24 prefix; the 6th is refused with RATE_LIMITED and an offer over 8 KiB with PAYLOAD_TOO_LARGE.
- Base URL resolves to a private IP address or redirects to http; refused with FEDERATION_PEER_URL_INVALID on every request, including after DNS changes.
- Proposal not accepted within 14 days; the Peer becomes expired and a new proposal is required.
- Health score reaches 39 during a batch; the current batch finishes and the peer is suspended before the next request.
- An author forks twice in 24 h and both forks reach this relay through two honest peers; no peer loses health, and the author is limited by F11.S02.M03.
- The previous key of a rotated peer is used 7 days and 1 minute after the rotation; refused with FEDERATION_KEY_MISMATCH.
- A selected relay rotates its key with a verified classrup.federation.key_rotation/v1; federation.peer.key_rotated is emitted in the same transaction with the old and new key, so F07.S03.M02 re-checks relay_email_check attestations at once instead of after its 24 h descriptor refresh.
- Operator lowers a quota below current usage; existing records stay, new envelopes are refused with FEDERATION_QUOTA_EXCEEDED until usage falls.
- Flag F11 is off; peer relays stay in the table dormant and their health score is frozen, while selected relays keep working.

## UX and accessibility

- Relay chooser (vault): list of relays with name, hosting policy summary from the signed identity statement, key fingerprint in 8 groups of 4 characters, 'Use this relay', 'List in my identity document' toggle and 'Remove'.
- Peer list (relay operator): status, origin, direction, trust level, health score bar with number, quota use, last activity, suspend and reinstate actions.
- Add peer wizard: base URL, fetch identity statement, compare fingerprint, send proposal, waiting for acceptance.
- Inbound offers queue (relay operator): offering relay id, base URL, fingerprint, received time and expiry, 'Accept after comparing fingerprint' and 'Reject'.

**States:** loading; empty; proposed; inbound-offer; active; suspended; removed; expired; flag-off

**Accessibility:** Fingerprints are shown as monospace groups with a copy button and are read by screen readers group by group.; Health score is shown as text and number, not colour alone, and status changes are announced via aria-live polite.; Suspend, reinstate, accept, reject and remove buttons are ≥ 44×44 px and confirm in a focus-trapping dialog that names the peer.

## Owned data

- `Peer` (classrup.federation.peer/v1, P1, RET-AUDIT)

## Interfaces

- Commands: `federation.peer.propose`, `federation.peer.receive_offer`, `federation.peer.accept`, `federation.peer.receive_accept`, `federation.peer.suspend`, `federation.peer.reinstate`, `federation.peer.remove`, `federation.peer.update`
- Queries: `federation.peer.list`, `federation.peer.get`, `federation.peer.resolve_key`
- Emits: `federation.peer.added`, `federation.peer.key_rotated`, `federation.peer.suspended`, `federation.peer.reinstated`, `federation.peer.removed`
- Consumes: `federation.record.rejected`, `federation.conflict.detected`, `federation.delivery.failed`, `platform.flag.changed`, `privacy.deletion.completed`

## Dependencies

F11.S01.M01, F11.S01.M03, F15.S04.M02, F07.S02.M01, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-091-01 | [Domain schema](domain_schema.md) | 3 |
| PS-091-02 | [Validation rules](validation_rules.md) | 4 |
| PS-091-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-091-04 | [Commands, queries and events](commands_queries_events.md) | 6 |
| PS-091-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-091-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-091-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-091-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-091-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-091-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/federation/src/interop/trust/index.ts`.

## Acceptance criteria

- All tests T01–T24 pass in CI.
- No peer becomes active without both sides' signed opt-in (or a selected relay's signed identity statement) and a recorded fingerprint confirmation.
- SSRF, key substitution and unsolicited-offer tests pass, and no honest relay is penalized for an author's fork.
