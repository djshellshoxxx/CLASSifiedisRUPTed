# PS-084-07 — Privacy, retention and abuse: Federated records

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M02 Federated records](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/records` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-084-07.R01** Only P0 data at L2 or coarser is ever stored on relays or federated relay to relay; participant statements travel only as sealed mailbox envelopes {v, mailboxId, ciphertext, size, sentAt} through F08.S01.M01, so relays see no author, type, seq or claimed time of participant traffic, and exact home addresses never exist in this module.
- **PS-084-07.R02** Provenance must not leak user metadata, so peers receive neither reader identity nor IP addresses, and media is fetched by the relay and served locally rather than hot-linked.
- **PS-084-07.R03** Author tombstones remove content within 24 h of receipt and their stubs are kept at least max(180 days, the target type's maxAge); relay_removal advisories remove content only from the issuing relay's index; this is deletion propagation, not recall (PRV-6), and the UI states before withdrawal that peers who copied content earlier may keep it.
- **PS-084-07.R04** The module registers the N6 ports (ExportSectionPort for own statements, tombstones and the quarantine list; DeletionPort whose sign step signs account_deleted tombstones for own records at deletion execution, whose pseudonymize step pseudonymizes retained provenance and whose purge step deletes mirrors; RetentionPurgePort for the sweeps), classifies fields with F10.S02.M02 and calls privacy.consent.check(federation_publish) before publishing public statements; privacy.deletion.completed is a notification only (N6a).
- **PS-084-07.R05** In the vault, statements from a DID blocked in either direction (F07.S02.M02 isBlockedEither) are dropped silently, with no ack, no event and the same outcome a sender sees for an unanswered statement (N7).

## Specification

**Data classification**
- FederatedRecord: public rows P0 (relay and vault); participants rows P2, vault only, decrypted from sealed mailbox envelopes; provenance (receiving relay id, claimed and local timestamps) P1.
- Tombstone: P0 (target cid or record id, reason enum, statement of reasons for advisories).
- Rejection log rows: cidPrefix (12 chars), source kind, peer id, code; no payload, author or type.

**Retention**
- Accepted mirrors: RET-STANDARD; listing mirrors are also purged 35 days after the payload expiresAt.
- Tombstone stubs: at least max(180 days, target type maxAge) after appliedAt; pending_target tombstones at most 180 days; relay_removal advisories 180 days; rejected-envelope log rows 30 days.
- Quarantined records: until discard, release or conflict resolution; dropped after 30 days unless an open ConflictRecord holds them.
- Participant statements in a vault follow the retention of the domain record that references them (RET-EVIDENCE for commitments) and are pseudonymized on deletion.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Forged provenance or capture of an author by the first relay that forwards it | the signature and registry role are the only proof of authorship; no origin binding and no trust on first use; receivedFromRelay and via are display-only; where to fetch comes from the author-signed portable document |
| T02 | Replay of an old valid envelope to resurrect deleted content | cid dedup, tombstone stubs kept at least as long as the target type's maxAge, V08 rejects envelopes older than the type's maxAge |
| T03 | Flood of valid-looking envelopes from a peer | per-peer 6000 envelopes/hour and 10 batches/minute quota, 100-envelope batches, 4 MiB body cap, cheap checks before signature verification |
| T04 | Fork or equivocation: an author shows different histories to different peers | same chain key and seq with different cid is quarantined and reported by F11.S02.M03; successors held_on_fork; neither version is shown |
| T05 | Metadata leakage: reader IP revealed to the source relay through hot-linked images | receiving relay fetches media server-side (https only, ≤ 5 MiB, ≤ 8 per record, SSRF-guarded) and serves it locally |
| T06 | Probing the blocklist by sending candidate cids | every block-rule hit returns the same generic FEDERATION_NOT_ACCEPTED with identical timing class |
| T07 | Malicious payload content (scripts, links, oversized strings) | inbound payload allowlist, plain-text only, strings ≤ 10000 code points, escaped at render |
| T08 | Tombstone forged by a third party, or a pre-emptive tombstone for a record not yet seen | V12 issuer must be the target's author principal; pending tombstones are never applied before the target arrives and is checked; caps of 50 per issuer and 1000 per tenant (V17) |
| T09 | One relay's moderation turned into a cross-relay or in-vault takedown | relay_removal is an advisory for the issuing relay's index only; peers act only through their own operator review or block rules; vaults show a notice and never purge; the author's vault ignores it and V09 never blocks republishing |
| T10 | Relays learning who sends what to whom in participant threads | sealed-sender wrapper through F08.S01.M01; relays store, log and event no author, type or seq of participant traffic |
| T11 | A stolen or revoked device key keeps signing with a backdated createdAt | V15 refuses keys revoked as of this vault's receipt time regardless of createdAt and lists them in quarantine (signer_key_revoked); records first received inside [revocationEffectiveFrom, arrival] are re-marked signed_during_claimed_compromise and quarantined when the revocation is learned, commitment ones frozen through F11.S02.M03 |
| T12 | Sybil authors exhausting buffers or pending tombstones | per-source buffer caps in F11.S02.M02 and pending tombstone caps (V17) |
| T13 | A relay signs a tombstone for other people's content so its moderation deletes copies on other relays or in vaults | V12 accepts classrup.federation.tombstone/v1 only from the target's author principal; relay keys issue only relay_removal advisories for their own index; tombstone.applied carries issuerKind, signerKey and targetAuthor so consumers act only on author withdrawals |
| T14 | Index flooding or spam by a hosted vault key | relay intake admission V18 to V21: consent relay_check, tenant currencies, index_writes_per_day account limit and relay_intake spam throttle before anything is indexed |

**Abuse controls**
- Repeated invalid signatures from one peer (20 in 10 minutes) are reported to F11.S03.M01, which suspends the peer; local-policy, gap and buffer codes are not reported as peer faults.
- Rejected-event emission is coalesced: at most 20 record.rejected events per batch with suppressedCount on the last.
- Relay operators stop relay-to-relay traffic with the F16.S03.M03 containment sentinel federation_off (peer requests receive FEATURE_DISABLED with params.reason federation_killed within 60 s; hosted vaults unaffected) or by turning off flag F11, which also hides mirrors; neither deletes data.
- Own publishing is capped at 60 statements per hour per principal through F12.S03.M03 RateLimitPort (RATE_LIMITED).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-084-09.T07 | integration | PS-084-01.R02, PS-084-03.R03, PS-084-07.R03 | valid owner tombstone for an accepted record | content purged within 1 h, tombstone applied with stubUntil ≥ appliedAt + max(180 days, target maxAge), event emitted |
| TEST-PS-084-09.T08 | abuse | PS-084-07.R03 | resend the tombstoned envelope; a listing envelope dated 121 days ago; a profile envelope dated 200 days ago | FEDERATION_TOMBSTONED; FEDERATION_RECORD_TIME_INVALID for the listing (maxAge 120 days); the profile accepted (maxAge 400 days) |
| TEST-PS-084-09.T13 | integration | PS-084-03.R04, PS-084-07.R01 | two envelopes with the same chain key and seq and different cids, then seq + 1 chaining from one of them, then the conflict resolved keeping that one | both quarantined and hidden; the successor held_on_fork beyond 24 h; after resolution the successor accepted and the other candidate dropped |
| TEST-PS-084-09.T20 | integration | PS-084-07.R02 | media from the source relay with hot-link URL and 6 MiB image | fetched by relay only, oversize skipped, no client request reaches the source relay |
| TEST-PS-084-09.T29 | abuse | PS-084-07.R03, PS-084-03.R03 | relay R1's operator issues relay_removal (moderation_removed) with a statement of reasons for X's listing that R2 and vault V1 also hold | R1's index drops it; R2's mirror stays accepted and only enters R2's review queue; V1 keeps it with a removal notice; X's own vault ignores it and X republishes on another relay without FEDERATION_TOMBSTONED |
| TEST-PS-084-09.T33 | integration | PS-084-07.R04, PS-084-04.R08 | consent federation_publish withdrawn then public publish; consent service unavailable; export, deletion and retention ports called by F10 in step order; privacy.deletion.requested then privacy.deletion.completed | publish refused FEDERATION_NOT_OPTED_IN, then DEPENDENCY_UNAVAILABLE; each port returns its section, plan or purge counts; the sign step signs one account_deleted tombstone per own record (idempotent on resume) and the pseudonymize step pseudonymizes provenance; nothing is signed on requested and nothing is signed or pseudonymized on completed |
| TEST-PS-084-09.T34 | abuse | PS-084-07.R05 | principal blocks DID B, then B's offer statement arrives by mailbox | dropped silently: no row beyond a stub, no ack, no event, generic outcome identical to an unanswered statement |
| TEST-PS-084-09.T36 | abuse | PS-084-07.R01, PS-084-01.R03 | send a participants statement through relay A's mailbox and inspect A's storage, logs and events | relay holds only the sealed wrapper {v, mailboxId, ciphertext, size, sentAt}; no author DID, type or seq appears anywhere on A |
| TEST-PS-084-09.T40 | e2e | PS-084-07.R03 | owner presses 'Withdraw from federation' | the confirmation dialog shows the no-recall notice before any tombstone is signed; cancelling signs nothing |
| TEST-PS-084-09.T45 | abuse | PS-084-02.R04, PS-084-07.R03 | relay key signs classrup.federation.tombstone/v1 for X's listing held by R2 and V1; X's own tombstone afterwards | relay-signed one refused FEDERATION_TOMBSTONE_UNAUTHORIZED, nothing purged anywhere; X's tombstone applied with issuerKind author, signerKey and targetAuthor X; a relay_removal advisory event carries issuerKind origin_relay and advisory true |

## Dependencies

Module depends on: F11.S01.M01, F11.S01.M03, F11.S02.M02, F11.S02.M03, F11.S03.M01, F11.S03.M02, F07.S02.M01, F07.S02.M02, F16.S01.M01, F15.S02.M01, F15.S04.M02, F15.S04.M03, F12.S02.M02, F12.S03.M03, F12.S03.M04, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-FLG-001, CTR-OBS-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
