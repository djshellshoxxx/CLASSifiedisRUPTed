# F11.S01.M02 — Federated records

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F11.S01](../SPEC.md). **Process IDs:** PS-084-01…PS-084-10. **Code:** `packages/federation/src/protocol/records`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Verifies, stores and quarantines signed statements in the CTR-FED-001 envelope format, and is the only path that signs statements of the vault principal or of a relay key. The envelope is the universal sharing format for every cross-party statement under ADR-0016. The same module runs in the user's browser vault (IndexedDB) and in an optional relay (SQLite). Authorship is proven only by the signature and the registry role (F11.S01.M01): a user statement is signed by a device key that the author's portable identity document lists as active, and no relay is ever bound to an author or authoritative for its records. Chains are scoped per (author, signer key, stream); a receiver anchors at the first verified envelope it sees, so the chain detects equivocation and orders delivery but never gates acceptance. A relay stores only public-audience records; participant statements travel as sealed mailbox envelopes through F08.S01.M01 and exist in plaintext only in the participants' vaults, which sign acknowledgements for statements addressed to them. Author tombstones are binding deletion statements; a relay operator's removal is a signed advisory that removes the item from that relay's index only. A signature proves the key holder asserted the content, not that it is true or was delivered, and timestamps from other parties are claims.

## Responsibilities

- Own FederatedRecord (statement or mirror plus provenance receivedFromRelay, receivedAt, via, verifiedAt, optional relay receipt) and Tombstone (author tombstones and relay_removal advisories), in the vault and in the relay, with the vault receive, publish, tombstone, discard and release commands and the relay inbox endpoint.
- Run the verification pipeline in fixed order: flag or hosting policy, sender authentication and quota, request signature, size limits, block rules before storage, strict parse, signature and cid, registry role and device-key delegation, revoked-key check, record age per type, tombstone check, blocked-DID drop (vault), chain placement through F11.S02.M02, commitment conflict check through F11.S02.M03, payload check per audience, store.
- Be the single signing path for the vault principal and the relay key; federation.record.publish and federation.tombstone.issue allocate seq and prev inside the transaction that stores the envelope, and producers (F01, F03, F07, F11.S03.*) call them through the StatementPublisherPort.
- Apply author tombstones as binding deletion (purge within 1 h, deadline 24 h), keep tombstone stubs at least max(180 days, the target type's maxAge), and store relay_removal statements as advisories that remove the item only from the issuing relay's index.
- Sign a classrup.federation.ack/v1 over the exact cid of every accepted participants statement addressed to the local principal and hand incoming acks to F11.S02.M01 through federation.record.accepted.
- Maintain the promise index (subject key and digest of commitment statements) and call federation.conflict.detect inside the receive transaction when two verified commitment statements share a subject with different digests.
- Emit one record.accepted, record.rejected or tombstone.applied event per envelope outcome in the same local transaction as the state change; events stay on the device or relay (EVT-8) and only signed statements leave it (EVT-9).
- Register the N6 privacy ports, call privacy.consent.check(federation_publish) before publishing public statements and drop statements from blocked DIDs silently (N7).
- Never claim more than was reached; a locally published statement is local committed until F15.S01.M01 records a verified relay receipt or acknowledgement.

## Not responsible for

- Canonicalization, signing primitives, cid definition and did:key handling (F11.S01.M03).
- Field allowlists, the statement-type registry and record mapping (F11.S01.M01).
- Cid dedup rules, anchor, buffer and fork decisions (F11.S02.M02 supplies pure decision functions; this module stores the rows).
- Conflict records, freeze and review (F11.S02.M03).
- Peer allowlist, quotas and block rules (F11.S03.M01, F11.S03.M02).
- Routing to destinations, transport and retries (F11.S02.M01 with the F15.S01.M01 sync outbox).
- Mailbox storage and sealing of participant traffic on relays (F08.S01.M01 MailboxEnvelope and comms.mailbox.put).
- Future: multi-hop relay forwarding (more than one relay hop) and ActivityPub or AT Protocol inbound adapters.
- Future: relay-to-relay federation of anything above P0, including reviews, offers and proposals.

## User stories

- As a buyer on relay A, I can browse a listing mirrored from relay B, see which relays delivered it and when it was verified, and I cannot edit it.
- As a seller, when I unpublish a federated listing, the mirrors on peer relays disappear within 24 h and a tombstone signed by me proves it was withdrawn.
- As a user, I can see that a statement from another party was quarantined because its signer was not authorized for that role, and I can discard it or let it expire after 30 days.
- As a buyer whose vault has never seen this seller before, I receive the seller's acceptance of my offer and it is accepted even though the seller has signed many statements before it.
- As a relay operator, I can remove a listing from my relay's index with a statement of reasons, knowing it stays on other relays and in readers' vaults unless their own operators or owners decide otherwise.
- As a relay operator, I can see why an inbound envelope was rejected and which peer or device sent it without seeing any private data.

## Edge cases

- A peer sends the same envelope twice or two peers send it; the second arrival is acknowledged as duplicate, no event is emitted and the second relay is added to via for display (at most 5).
- In an anchored public chain, seq 7 arrives before seq 6; seq 7 is buffered for up to 24 h, one catch-up fetch is made from the relays in the author's portable document, and it is then accepted with chainGap = true if seq 6 never arrives, never dropped for the gap.
- A vault that has never seen seller S receives S's acceptance at seq 57 of the thread stream; it anchors there (chainAnchor = true) and accepts it, and seq 58 then follows as next.
- An author tombstone arrives before the record it targets; it is kept pending_target (at most 50 per issuer, 1000 per tenant, 180 days) and is never applied before the target arrives and its author is checked; a target by the same author is then rejected with FEDERATION_TOMBSTONED, while a target by a different author is accepted and the tombstone rejected.
- Two different envelopes with the same chain key and seq arrive; both go to quarantine via F11.S02.M03, and envelopes that chain from either candidate are held_on_fork without the 24 h drop until the conflict is resolved.
- A batch has 101 envelopes or 4 MiB plus one byte; the whole request is refused with FEDERATION_BATCH_TOO_LARGE and nothing is stored.
- Relay B forwards a listing of author Y whose portable document lists only relay C; it is accepted on its signature alone, B is recorded only as receivedFromRelay and nothing binds Y to B or C.
- Relay R1's operator issues a relay_removal (moderation_removed) for a listing; R1 drops it from its own index, R2's mirror stays and is only queued for R2's operator review, reader vaults keep it with a notice and may hide it locally, and the author's own vault ignores it and may republish anywhere.
- Federation flag F11 is switched off while a batch is processing; the batch finishes its current transaction and later relay-to-relay requests return FEATURE_DISABLED while vault to relay sharing continues.
- A statement signed by a valid key that is not the listing author claims to accept an offer; the vault quarantines it with reason signer_role_invalid and does not act on it.
- A statement is signed by a device key that the latest verified portable document marks revoked but claims a createdAt before the revocation; it is rejected with FEDERATION_SIGNER_ROLE_INVALID.
- Two offline devices of one principal each publish a public statement; they use different signer-key chains, so no self-fork occurs, and two producers in one vault get seq n+1 and n+2 from one transaction each.
- A hide rule matches an accepted mirror and is undone an hour later; the record goes hidden and back to accepted with its envelope intact, while a reject rule purges it.
- Envelope createdAt is older than its type's maxAge (a listing 121 days old) or 11 minutes in the future; rejected with FEDERATION_RECORD_TIME_INVALID, except for the owner's own vault import or restore, which is exempt from the age limit.
- Relay stops responding after a statement was published; the statement stays local committed and the UI shows delivery unknown.

## UX and accessibility

- Mirrored record view: relays that delivered it (provenance, never ownership), verified-at time, banner 'Remote copy, read-only', link to the author's listed relays; no edit controls; when a relay_removal advisory exists, a notice 'Removed from relay R1's index' with the statement of reasons and a 'Hide in my vault' action.
- Relay operator federation inbox: counts per peer and reason, rejected list with cid prefix and code, quarantine list with Discard and Release, removal advisories issued by this relay, conflict queue link (F11.S02.M03).
- Owner federation panel in listing and profile settings: per-record opt-in toggle, sync state (local committed, prepared, relay received, peer accepted, withdrawn) and button 'Withdraw from federation' that issues a signed tombstone after a notice that copies already fetched cannot be recalled (PRV-6).
- Vault quarantine list: statements not acted on, with reason (signer not authorized, signer key revoked, conflicting statement), Discard button and the 30-day automatic removal date.

**States:** loading; empty; local-committed; buffered; held-on-fork; accepted; hidden; quarantined; tombstoned; removal-advisory; rejected; flag-off

**Accessibility:** Remote-copy banner and removal notice are role=note regions read before the content and are not conveyed by colour alone.; Withdraw button is ≥ 44×44 px, has the accessible name 'Withdraw this listing from federation' and confirms in a dialog that traps and restores focus.; Operator tables have header cells with scope attributes and sortable columns announced via aria-sort.

## Owned data

- `FederatedRecord` (classrup.federation.record/v1, P2, RET-STANDARD)
- `Tombstone` (classrup.federation.tombstone/v1, P0, RET-STANDARD)

## Interfaces

- Commands: `federation.record.ingest`, `federation.record.receive`, `federation.record.publish`, `federation.tombstone.issue`, `federation.record.discard`, `federation.record.release`
- Queries: `federation.record.get`, `federation.record.list_by_author`, `federation.record.head`, `federation.record.list_rejections`, `federation.record.list_quarantined`
- Emits: `federation.record.accepted`, `federation.record.rejected`, `federation.tombstone.applied`
- Consumes: `federation.block_rule.changed`, `federation.peer.suspended`, `federation.conflict.detected`, `federation.conflict.resolved`, `federation.account.moved`, `identity.portable_doc.published`, `privacy.deletion.requested`, `privacy.deletion.completed`, `bazaar.listing.unpublished`, `bazaar.listing.expired`, `services.offering.withdrawn`, `platform.flag.changed`

## Dependencies

F11.S01.M01, F11.S01.M03, F11.S02.M02, F11.S02.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F07.S02.M02, F15.S04.M02, F12.S03.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-084-01 | [Domain schema](domain_schema.md) | 7 |
| PS-084-02 | [Validation rules](validation_rules.md) | 6 |
| PS-084-03 | [Workflow state machine](workflow_state_machine.md) | 5 |
| PS-084-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-084-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-084-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 5 |
| PS-084-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 5 |
| PS-084-08 | [Observability and performance](observability_performance.md) | 4 |
| PS-084-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-084-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/federation/src/protocol/records/index.ts`.

## Acceptance criteria

- All tests T01–T40 pass in CI.
- The adversarial suite shows forged provenance, author capture, replay, flood, fork, pre-emptive tombstones, cross-relay takedown and participant metadata leakage are each blocked.
- No record above P0 or finer than L2 is ever stored or served by a relay (privacy suite), and no relay stores author, type or seq of participant traffic.
- Tombstoned content is gone from reads within 1 h and from storage within 24 h in the chaos test.
