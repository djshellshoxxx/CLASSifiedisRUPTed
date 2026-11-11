# F16.S02.M02 — Key registry and revocation

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F16.S02](../SPEC.md). **Process IDs:** PS-129-01…PS-129-10. **Code:** `packages/security/src/cryptography/management`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A key registry in vaults and on relays with exactly one authority per key class. For user device keys (the local principal's and every counterparty's) the single source of validity is F07: the account root key links devices, and F07.S02.M01 answers key status through its KeyStatusPort. Here those keys are an ingest-only cache fed by the own-key identity events and received identity documents, adding where and when the knowledge was last confirmed (freshness) so callers can see revocation lag. Native records exist only for relay-owned keys (the relay transport key mirrored from F15.S02.M01 and VAPID keys) and for peer relay keys pinned by F11.S03.M01. The module owns classrup.security.keyrevocation/v1, the single revocation statement type for device keys, with the F07.S01.M01 signer rules (an account_deleted revocation lists the final statements verifiers keep accepting), a permanent minimal revoked-key set that keeps a revoked key from ever returning after its record is purged, and relay-signed revocation list heads with a monotonic sequence so that a relay replaying an old list is detected. A revocation is never dropped because it arrives late, and offline revocation lag is reported, never hidden.

## Responsibilities

- Own the KeyRecord - public key, algorithm, purpose, owner, relationship, authority, status (active, revocation_pending, contested, revoked, expired), validity window, revocation details, identity document sequence and the freshness of the knowledge.
- Cache user device keys ingest-only from identity.device_key.added and identity.device_key.revoked (own keys) and identity.portable_doc.published (counterparty and relay-hosted keys), and answer get_status for user keys with one KeyStatusPort.keyStatus(did, publicKey, at) call of F07.S02.M01 plus freshness.
- Register and revoke relay-owned keys (VAPID) as relay commands, mirror the relay transport key from F15.S02.M01 and pin peer relay keys through F11.S03.M01, and record revocations of these keys from signed classrup.security.keyrevocation/v1 statements.
- Keep the permanent revoked-key set (key hash, revokedAt, revocation statement cid), and publish and ingest signed revocation list heads { relayId, listSeq, issuedAt, nextUpdateBy, headHash, entryCount } with freshness derived from issuedAt and at least two independent sources for high-stakes checks.
- Return status with freshness (freshnessIssuedAt, sources, class) so callers can require freshness for high-stakes actions and warn when it is stale, and poll relays for list heads on a schedule.
- Define classrup.security.keyrevocation/v1 as the single device-key revocation type with the F07.S01.M01 signer rules (the revoked key itself or the account root key at once, another device key pending 7 days unless the root key confirms, mutual revocations contested), treating the F07 account root key as its recovery-key role, including reason account_deleted with finalCids (at most 120) so the listed final statements stay acceptable after the revocation.
- Show every key with the F07.S01.M01 fingerprint (16 base58btc characters of SHA-256 over the raw public key, or its 8-word form).

## Not responsible for

- Generating, wrapping and rotating keys (F16.S02.M01) and the signature envelope (F16.S02.M03).
- User-key validity, device linking and the revocation rules for device keys (F07.S01.M01, F07.S02.M01); revoking a user device key is identity.device_key.revoke of F07.S01.M01, never a command of this module.
- Relay identity keys, their rotation and revocation certificates (F15.S02.M01), which this module only mirrors.
- Relay peer trust decisions and key pins (F11.S03.M01), which consume key status.
- Future: key transparency log with signed tree heads; short-lived delegated signing keys; certificate-style attestations by third parties.

## User stories

- As a user, I revoke a lost device's key from another device or my root device (F07), and my contacts' vaults learn of it from my next identity document, with this registry showing how recently each of them could know.
- As a user verifying a counterparty's consent, I see whether their key was revoked and how recently and from how many sources my vault confirmed it.
- As a relay operator, I publish a revocation list whose signed head has an increasing sequence number, so peers and vaults notice if anyone serves them an old one.
- As a relay that receives a deleted account's final deletion statements after its device keys were revoked, I still accept exactly the statements its account_deleted revocation lists and refuse every other statement by those keys.

## Edge cases

- A revocation for a relay-owned or peer key arrives before the key itself; it goes straight into the permanent revoked-key set and is applied the moment the key appears, with the receipt time shown.
- A signature made by a key before its revocation is verified later; F07.S02.M01 judges it by this verifier's first-seen time of the statement against revokesEffectiveAt, and this module reports that status with its freshness.
- A revocation claims an effective date 60 days before its earliest evidence; it is recorded, and effectiveFrom is clamped to the earliest evidence minus 30 days and labelled 'claimed compromise window' rather than rejected.
- A vault that was offline meets a revocation 45 days after it was issued; it is recorded as revoked with revokedAt = receipt time and effectiveFrom from the evidence, and later statements by that key are refused.
- An attacker holding a stolen linked device key revokes the victim's other keys; as F07 reports it, those keys are revocation_pending for 7 days, a counter-revocation makes them contested, and only the DID root key decides.
- A relay serves an older signed revocation list head (lower listSeq) to hide a new revocation; the head is recorded as a replay with SECURITY_REVOCATION_LIST_STALE, freshness stays at the stored head, and high-stakes checks need a second source.
- Revocation sources unreachable for 8 days; keys from those sources show freshness unknown and high-stakes actions ask the user to refresh or proceed with a warning.
- A relay presents an X25519 agreement key for a counterparty device; agreement keys are never registered here, so it is refused and the sender derives the key from the listed Ed25519 device key instead.
- A KeyRecord for a revoked key is purged after its retention; a later attempt to register the same key is refused because the revoked-key set still holds its hash.
- A relay receives the account_deleted revocation of device key K1 before the final deletion statement it lists; get_status with that statement's cid reports revoked with finalListed true, so verification still accepts it, while a statement by K1 whose cid is not listed is refused.
- An account_deleted revocation lists 121 cids, or a revocation with reason lost carries finalCids; it is refused with VALIDATION_FAILED and nothing is recorded.
- A key revoked with reason account_deleted is also revoked by the account root key for compromise; F07.S02.M01 then reports reason compromised with its clamped effective time, and the finalCids are no longer honoured.
- A revocation is signed by the root key decrypted from the user's recovery kit on a new device; it is treated exactly as a root-key revocation (the recovery-key role is the F07 account root key) and takes effect at once.

## UX and accessibility

- My keys: list of own device keys with label, created date, last used, fingerprint (F07.S01.M01 fingerprintOf - 16 base58btc characters of SHA-256 over the raw public key in groups of 4, with the 8-word form on request), status, and a revoke action that opens the F07 identity.device_key.revoke flow.
- Counterparty key detail (vault): fingerprint (F07.S01.M01 fingerprintOf, 16 base58btc characters or the 8-word form), first seen, status as F07.S02.M01 reports it, freshness 'confirmed 3 hours ago by 2 sources (relay X, relay Y)', link to the identity document.
- Relay operator: relay-owned and peer keys by purpose with their F07.S01.M01 fingerprints, revocation list head (sequence, issued, next update by), peer list freshness and detected list replays.

**States:** loading; active; revocation-pending; contested; revoked; expired; freshness-unknown; list-replay-detected

**Accessibility:** Status is conveyed by words and icons, not color alone.; Revoke confirmation is a dialog with focus trap naming the key fingerprint, buttons at least 44 by 44 px.; Freshness text is plain language and announced when it changes during verification.

## Owned data

- `KeyRecord` (classrup.security.keyrecord/v1, P1, RET-EVIDENCE)

## Interfaces

- Commands: `security.keyrecord.register`, `security.keyrecord.revoke`, `security.keyrecord.record_revocation`, `security.keyrecord.ingest_list`
- Queries: `security.keyrecord.get_status`, `security.keyrecord.get`, `security.keyrecord.list_revocations`, `security.keyrecord.list_own`
- Emits: `security.key.registered`, `security.key.revoked`
- Consumes: `identity.device_key.added`, `identity.device_key.revoked`, `identity.portable_doc.published`, `federation.peer.added`, `federation.peer.removed`, `platform.relay_identity.rotated`

## Dependencies

F16.S01.M01, F16.S02.M03, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-129-01 | [Domain schema](domain_schema.md) | 7 |
| PS-129-02 | [Validation rules](validation_rules.md) | 3 |
| PS-129-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-129-04 | [Commands, queries and events](commands_queries_events.md) | 7 |
| PS-129-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-129-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-129-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-129-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-129-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-129-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/security/src/cryptography/management/index.ts`.

## Acceptance criteria

- All tests T01–T23 pass in CI.
- A revoked key can never become active again, also after its record is purged, and verification always reports freshness of revocation knowledge from list issuedAt.
- User-key status never differs from F07.S02.M01, and a stolen linked device key cannot revoke or add keys on its own.
