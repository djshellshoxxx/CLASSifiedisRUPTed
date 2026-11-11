# Map: specs-federation-identity

Sources (read whole, unmodified): the 13 `module.spec.yaml` files named in the task plus the four `planning/` files.

## 0. Conventions (SPEC_FORMAT.md)

- `PS-NNN-pp.Rnn` = n-th entry of `processes.<key>.requirements` (01 domain_schema … 10 import_export_backup_rollback); append only. `Vnn` rules and invariants are not requirements.
- Tests `Tnn | level | covers | scenario | expected`; cite as `TEST-PS-NNN-09.Tnn`. T-rows are not always numerically ordered (PS-084, PS-083); the label is the identifier.
- Error codes: common (CTR-ERR-001), module-defined, or from a `depends_on` module.

## 1. Module index (`ps` from planning/modules.yaml)

| id | ps | entities (schema; storage, privacy) | machine states | errors defined |
|---|---|---|---|---|
| F11.S01.M01 fed mod_portable | PS-083 | none (library) | none | FEDERATION_NOT_OPTED_IN, FEDERATION_EXPORT_FORBIDDEN_FIELD, FEDERATION_PAYLOAD_INVALID |
| F11.S01.M02 mod_records | PS-084 | FederatedRecord (`classrup.federation.record/v1`; relay+device, P2); Tombstone (`classrup.federation.tombstone/v1`; relay, P0) | FederatedRecord: received, accepted, buffered, quarantined, rejected, dropped, tombstoned; Tombstone: received, pending_target, applied, rejected, expired | FED_SIGNATURE_INVALID, FEDERATION_REQUEST_SIGNATURE_INVALID, FEDERATION_PAYLOAD_INVALID, FEDERATION_NOT_OPTED_IN, FEDERATION_SIGNER_ROLE_INVALID, FEDERATION_PEER_NOT_ALLOWED, FEDERATION_BATCH_TOO_LARGE, FEDERATION_QUOTA_EXCEEDED, FEDERATION_NOT_ACCEPTED, FEDERATION_RECORD_TIME_INVALID, FEDERATION_TOMBSTONED (410), FEDERATION_ORIGIN_MISMATCH, FEDERATION_TOMBSTONE_UNAUTHORIZED, FEDERATION_AUTHOR_NOT_OWNED |
| F11.S01.M03 fed mod_signatures | PS-085 | none (library; value types Envelope, Cid, DidKey) | none | FED_SIGNATURE_INVALID, FEDERATION_ENVELOPE_NOT_CANONICALIZABLE, FEDERATION_DID_UNSUPPORTED, FEDERATION_CID_MISMATCH, FEDERATION_REQUEST_SIGNATURE_INVALID |
| F11.S02.M01 mod_delivery | PS-088 | PeerOutbox (`classrup.federation.peer_outbox/v1`; relay+device, P2) | prepared, transport_acknowledged, peer_accepted, paused, failed, cancelled | FEDERATION_DESTINATION_INVALID, FEDERATION_RECEIPT_INVALID (plus the four shared FEDERATION_* codes) |
| F11.S02.M02 mod_dedup | PS-087 | none (pure library) | none | FEDERATION_GAP_TOO_LARGE (422), FEDERATION_BUFFER_FULL (429, retryable) |
| F11.S02.M03 mod_conflicts | PS-086 | ConflictRecord (`classrup.federation.conflict/v1`; relay+device, P1, RET-EVIDENCE) | open, resolved, auto_resolved, superseded | FEDERATION_CONFLICT_INVALID_RESOLUTION, FEDERATION_CONFLICT_NOT_AUTO_RESOLVABLE (409), FED_SIGNATURE_INVALID |
| F07.S01.M01 mod_pseudonyms | PS-052 | Account (`classrup.identity.account/v1`; device, P0); DeviceKey (`classrup.identity.device_key/v1`; device, P3); HandleRegistration (`classrup.identity.handle_registration/v1`; relay, P0) | Account active->erased; DeviceKey active->revoked; Handle active->released->purged | IDENTITY_PSEUDONYM_INVALID, _RESERVED, _TAKEN, _CONFUSABLE, _COOLDOWN; IDENTITY_DEVICE_LIMIT (409), IDENTITY_LINK_INVALID (422), IDENTITY_LAST_DEVICE_KEY (409) |
| F07.S01.M02 mod_sessions | PS-054 | LoginChallenge (`classrup.identity.login_challenge/v1`; relay, P4); Session (`classrup.identity.session/v1`; relay+device, P4) | issued->consumed/expired; active->revoked/expired | none (`errors: []`) |
| F07.S01.M03 mod_recovery | PS-053 | RecoveryKit (`classrup.identity.recovery_kit/v1`; device, P4) | active, recovery_pending, used, superseded | IDENTITY_KIT_PARAMS_INVALID, IDENTITY_KIT_WORDS_INVALID, IDENTITY_KIT_CORRUPT, IDENTITY_RECOVERY_WINDOW_OPEN (409) |
| F07.S02.M01 identity mod_portable | PS-055 | PortableIdentityDoc (`classrup.identity.portable_doc/v1`; relay+device, P0) | current, stale, superseded, contested | IDENTITY_DOC_SIGNATURE_INVALID (422), IDENTITY_DOC_CHAIN_INVALID (409) |
| F16.S02.M01 mod_key | PS-128 | none; local blob `classrup.security.wrappedkey/v1` | none | SECURITY_PASSPHRASE_WEAK, SECURITY_UNLOCK_FAILED (401), SECURITY_WRAPPED_KEY_INVALID, SECURITY_VAULT_LOCKED (403), SECURITY_ROTATION_INVALID, SECURITY_ENVIRONMENT_UNSUPPORTED |
| F16.S02.M02 mod_management | PS-129 | KeyRecord (`classrup.security.keyrecord/v1`; relay+device, P1, RET-EVIDENCE) | active, revoked, expired, conflicted | SECURITY_KEY_UNAUTHORIZED (403), SECURITY_KEY_LIMIT (409), SECURITY_KEY_REVOKED (422) |
| F16.S02.M03 security mod_signatures | PS-130 | none; `classrup.security.envelope/v1` | none | SECURITY_SIGNATURE_INVALID, SECURITY_CONTEXT_MISMATCH, SECURITY_PAYLOAD_NOT_CANONICAL, SECURITY_SIGNER_UNKNOWN, SECURITY_BINDING_MISMATCH |

Commands (capability = command name unless noted; signer roles in brackets): PS-084 `federation.record.ingest` [relay peer, vault device], `federation.record.receive`, `federation.record.publish` [local principal], `federation.tombstone.issue` [local principal, operator]; reads `federation.record.read_public|read_head|read_provenance`. PS-086 `federation.conflict.detect` [local principal, system], `federation.conflict.resolve` [local principal, operator], `federation.conflict.read`. PS-088 `federation.outbox.enqueue|retry|cancel|acknowledge|dispatch|read|pull`. PS-052 `identity.account.create` [anonymous], `identity.pseudonym.change` (cap `identity.account.update_pseudonym`), `identity.device_key.add|revoke` [principal], `identity.handle.claim|release` (cap `identity.handle_registration.*`). PS-053 `identity.recovery.create_kit|verify_kit|begin|complete|cancel` (cap `identity.recovery_kit.*`; begin anonymous). PS-054 `identity.session.unlock|lock|start|rotate|revoke`, `identity.login_challenge.issue`. PS-055 `identity.portable_doc.issue|receive|publish|read_public|read_own`. PS-129 `security.keyrecord.register|revoke|record_revocation|read_status|read_public|read_own`. Library APIs: PS-083 `roleFor`; PS-085 `cidOf, signEnvelope, verifyEnvelope, didKeyEncode, didKeyDecode`; PS-087 `decide, drain, expired, verifyChain`; PS-128 `createVault, unlock, lock, sign, agree, rotateKey`; PS-130 `sign, verify` (`signJcs`/`verifyJcs` FED-2 only).

## 2. Statement types and signers

- `classrup.bazaar.listing/v1`, `classrup.identity.profile/v1`, `classrup.services.offering/v1`: role from PS-083 `roleFor(type, context)`; PS-084 V14 quarantines others.
- `classrup.federation.tombstone/v1`: author | origin_relay. `classrup.federation.ack/v1`: recipient did. `classrup.identity.device_link/v1`: account signing key or active device key, ≤ 10 min old. `classrup.identity.device_revocation/v1`: principal. `classrup.identity.handle_claim/v1`, `handle_release/v1`: account signing key.
- `classrup.identity.recovery_notice/v1`: account key. `classrup.identity.recovery_dispute/v1`: existing device key. `classrup.identity.portable_doc/v1`: account signing key only.
- `classrup.security.keyrecord/v1`: new key plus an active key of the same principal (or relay). `classrup.security.keyrevocation/v1`: revoked key, another active key, or recovery key. `classrup.security.keyrotation/v1`: old and new keys.
- `classrup.security.envelope/v1` contexts: `classrup/consent/v1, receipt/v1, attestation/v1, key-link/v1, key-rotation/v1, key-revoke/v1, relay-request/v1, revocation-list/v1, login/v1, export-manifest/v1`.
- Login: device Ed25519 key signs `classrup-login:v1:<relayId>:<nonce>`; key must be active in the identity document.

## 3. CTR-ERR-001 / CTR-CAP-001

CTR-ERR-001: RFC 9457 object `{type, code, status, retryable, messageKey, params, fields[{path,code}], correlationId, retryAfterMs}`. ERR-1 UPPER_SNAKE, domain-prefixed unless common, never reused; ERR-3 `Result<T, AppError>`; ERR-4 unknowable resource -> `NOT_FOUND`. Common: VALIDATION_FAILED 422, UNAUTHENTICATED 401, FORBIDDEN 403, NOT_FOUND 404, CONFLICT_REVISION 409 (`params.currentRevision`), CONFLICT_STATE 409 (`params.state`), IDEMPOTENCY_KEY_REUSED 422, PRECONDITION_FAILED 412, EXPIRED 410, RATE_LIMITED 429 (retryable), FEATURE_DISABLED 404, PAYLOAD_TOO_LARGE 413, UNSUPPORTED_SCHEMA_VERSION 400, BLOCKED_PARTY 403, DEPENDENCY_UNAVAILABLE 503 (retryable), INTERNAL 500.

CTR-CAP-001: CAP-1 `<featureSlug>.<resource>.<action>`, one per command, one read per query; CAP-2 `authorize(actor, capability, resource?, context) -> Allow | Deny(code)`, default deny, pure; CAP-3 roles `anonymous, member, moderator, operator, admin`, predicates `owner, participant, counterparty, blockedWith, notSuspended`; CAP-4 anonymous = `*.*.read_public`; CAP-6 revocation on next request, cache ≤ 60 s. ADR-0016: CAP-8 vault policy (actor = unlocked local principal; incoming statements accepted only when signed by a key authorized for the role, else quarantined); CAP-9 roles per relay only; CAP-10 tokens are relay access only.

## 4. FED-3: seq/prev chain, 24 h gap buffer, forks, replay

Facts (PS-084): `seq: int — per-author sequence, ≥ 1`; `prev?: string — cid of seq-1 record of the same author; absent only when seq = 1`; `bufferedUntil?: timestamp — receivedAt + 24 h while status buffered`; index `fed_record_chain ON fed_record(tenant_id, author, seq) WHERE status = 'accepted'`. V05 prev iff seq > 1; V08 createdAt > 180 d old or > 10 min future -> FEDERATION_RECORD_TIME_INVALID. Transitions: `received -> buffered | seq > head+1 (gap) per F11.S02.M02 | sets bufferedUntil = receivedAt + 24 h`; `buffered -> accepted | missing predecessors arrive and chain closes | emits federation.record.accepted for each released record in seq order`; `buffered -> dropped | bufferedUntil passed and fetch from origin failed | emits federation.record.rejected reason gap_timeout`; `received -> quarantined | fork detected (same author and seq, different cid) per F11.S02.M03`. Known cid -> outcome `duplicate`, no event. PS-087: 24 h, gap ≤ 100 (V02 FEDERATION_GAP_TOO_LARGE), 50 per author / 5000 total (V03 FEDERATION_BUFFER_FULL), `bufferedUntil = receivedAt + 86400 s exactly` (V04); fork = `seq ≤ head with unknown cid, or prev mismatch`.

PS-084:
- 01.R01 A FederatedRecord stores the full verified envelope, its cid, author, seq, prev, type and the local provenance object originRelay, receivedAt, via and verifiedAt, with tenant and revision per CTR-ID-001.
- 03.R01 Envelopes move only along the declared FederatedRecord and Tombstone transitions; any other transition is refused with CONFLICT_STATE.
- 03.R02 A record becomes visible to readers only in status accepted; buffered and quarantined records are never served.
- 06.R01 Ingest and receive are idempotent per envelope by cid, and relay requests also by batchId and Idempotency-Key, so senders may retry whole batches safely.
- Also 02.R03, 06.R02 (one transaction per envelope), 06.R03 (record and event in one transaction), 10.R02.
Tests: T02 | unit | 02.R03,02.R01,09.R01. T04 | property | 03.R01,03.R03. T05 | integration | 03.R02,01.R02 (seq 7 before 6). T06 | integration | 03.R01,07.R01 (gap_timeout). T08 | abuse | 03.R03,07.R01 (replay). T13 | integration | 03.R01,07.R01,08.R02 (fork). T15 | integration | 04.R01,04.R02,06.R02. T18 | integration | 05.R02,06.R01. T24 | integration | 10.R01,10.R02,10.R03.

PS-087:
- 01.R02 The chain rule is fixed by CTR-FED-001 (seq starts at 1, prev is the cid of the previous seq of the same author and is absent only at seq 1).
- 01.R03 The buffer limits are constants of this module (24 h, 100 ahead, 50 per author, 5000 total) so every relay and vault behaves identically.
- 02.R01 Decisions are deterministic functions of (envelope, head, known cids, buffer counts, now).
- 03.R02 Decision precedence is fixed as duplicate, then reject, then fork, then next, then buffer.
- 03.R03 The decision for a given input never depends on arrival order of unrelated authors.
- 10.R02 Importing a vault or relay backup must rebuild each chain head by running verifyChain() over stored envelopes before ingest resumes.
- Also 01.R01, 02.R02, 02.R03, 03.R01, 04.R01–R03, 05.R03, 06.R01 (decide() deterministic), 06.R02, 06.R03, 07.R01, 07.R02, 07.R03 (≤ 24 h via bufferedUntil), 09.R02 (permutation convergence, splice rejection), 09.R03.
Tests: T01 | unit | 09.R02,01.R01,01.R02,02.R01. T02 | property | 01.R02,03.R01,03.R02,09.R03 (permutations). T03 | unit | 02.R02,02.R03,01.R03 (limits). T04 | property | 01.R01,02.R01,07.R03 (splices). T05 | unit | 02.R01,03.R03,04.R01. T06 | unit | 05.R03,09.R02,04.R02,04.R03,05.R01. T07 | unit | 03.R01,06.R01,06.R02 (expiry, clock). T08 | unit | 06.R03,05.R02. T09 | abuse | 07.R01,07.R02,07.R03. T10 | load | 08.R01,08.R02,08.R03. T11 | unit | 09.R01. T12 | unit | 10.R01,10.R02,10.R03.

PS-086 (forks):
- 02.R01 A conflict is opened only from verified envelopes, so unsigned or invalid statements can never freeze a trade.
- 06.R01 Detect is idempotent per (author, seq) or subject so repeated arrivals append at most new candidates and never open duplicates.
- Also 01.R01 (≤ 5 candidates; kind `fork_seq | prev_mismatch | commitment_conflict`), 03.R01, 03.R02 (origin-wins after 7 days for public projections only; commitments never auto-resolve), 03.R03, 06.R03.
Tests: T01 | unit | 01.R01,01.R02,02.R02. T02 | unit | 02.R01,02.R03. T03 | property | 03.R01,03.R03. T04 | integration | 03.R02,04.R03,07.R02. T05 | integration | 03.R02,01.R03. T06 | integration | 03.R03,04.R01. T11 | integration | 06.R01,06.R02,02.R02.

Supporting: PS-083 06.R03 (caller supplies seq and prev; a lost response never skips a seq; T10 | unit | 06.R01,06.R02,06.R03). PS-085 01.R02 "The signed bytes are exactly the RFC 8785 JCS UTF-8 serialization of the envelope object with the sig member removed, with no other transformation."; V05 -> FEDERATION_CID_MISMATCH (T03 | property | 01.R02,06.R02,09.R03; T08 | unit | 02.R03,01.R01). PS-088 06.R01 (at-least-once send, receiver dedup by cid; T09 | integration | 06.R01,06.R02); catch-up `federation.outbox.pull { since: cursor, limit ≤ 100 }`.

## 5. FED-4: tombstones

Facts (PS-084): Tombstone `targetCid?`/`targetRecordKey?` (exactly one), `issuerKind: author | origin_relay`, `reason: owner_withdrawn | account_deleted | listing_expired | moderation_removed | legal`, `expiresAt = appliedAt + 180 days`. Transitions `received -> applied | pending_target | rejected`, `pending_target -> applied | target arrives or 24 h pass`, `applied -> expired`; FederatedRecord `accepted -> tombstoned | ... content purged within 1 h of trigger (deadline 24 h); emits federation.tombstone.applied`. V09 FEDERATION_TOMBSTONED, V12 FEDERATION_TOMBSTONE_UNAUTHORIZED. Sweeps every 5 min; alert `classrup_federation_purge_overdue_total`. Event payload `{ tombstoneId, tombstoneCid, targetCid?, targetRecordKey?, author, reason, expiresAt }`. PS-088 consumes `federation.tombstone.applied` (fan out; cancel prepared entries). PS-055 07.R03 "Relays honor signed tombstones within 24 hours (FED-4, PRV-6) and may not rewrite documents."

PS-084:
- 01.R02 A Tombstone stores target (cid or record id), issuer kind, reason, the signed tombstone envelope, appliedAt and expiresAt equal to appliedAt plus 180 days.
- 03.R03 Tombstoned and rejected are terminal, so a rejected envelope can only be reconsidered by a new submission and a purged record cannot be restored.
- 04.R02 Each command emits exactly the listed events in the same transaction as the state change, one event per envelope outcome.
- 07.R03 Tombstones remove content within 24 h of receipt and are kept 180 days; this is deletion propagation, not recall (PRV-6), and the UI states that peers who copied content earlier may keep it.
- Also 01.R04 (purged content leaves a stub with cid, author, type, purgedAt), 04.R01, 04.R03, 05.R01, 08.R02, 10.R01, 10.R02.
Tests: T07 | integration | 01.R02,03.R03,07.R02 (apply). T08. T09 | integration | 03.R01,07.R02 (pending_target). T10 | abuse | 05.R02,07.R01 (unauthorized issuer). T22 | integration | 08.R03,08.R04,03.R03. PS-088 T06 | integration | 04.R02,04.R03.

## 6. ADR-0013: device linking, rotation, revocation, recovery kit

Linking/revocation (PS-052; ADR-0013 cited only for keystore parameters): DeviceKey `linkedBy: signup | device_link | recovery`, `linkStatementCid?`, `revocationStatementCid?`, `keyRef?`; 1..10 active keys "or zero only while a verified recovery kit exists"; revoked permanent, never reused. V07 IDENTITY_LINK_INVALID, V08 IDENTITY_DEVICE_LIMIT, V09 IDENTITY_LAST_DEVICE_KEY (needs kit with `lastVerifiedAt`). Events `identity.device_key.added|revoked` (P3).
- 01.R02 A DeviceKey stores a public key, label, link evidence and status; private keys are referenced by keyRef into the kernel keystore where they are encrypted with XChaCha20-Poly1305 under a key derived by scrypt (N=2^17, r=8, p=1) per ADR-0013.
- 03.R02 Device keys move from active to revoked once; revoked keys never return.
- 04.R01 Account creation, pseudonym change and device key add and revoke are vault commands; add and revoke produce the signed statements classrup.identity.device_link/v1 and classrup.identity.device_revocation/v1, and a change also may produce classrup.identity.handle_claim/v1 for registered relays.
- 05.R01 Vault policy - only the unlocked local principal mutates its Account and DeviceKey records; a new device is authorized only by a link statement signed by the account signing key or an active device key.
- Also 02.R02 (JCS bytes, domain-separated prefixes), 06.R02, 06.R03 (CONFLICT_REVISION or contested document), 07.R02, 10.R01.
Tests: T01 | unit | 01.R01,01.R02,04.R01. T07 | unit | 02.R02,02.R03,03.R02 (link, limit, re-add). T08 | integration | 03.R02,02.R03 (last key). T09 | contract | 04.R01,04.R02,04.R03,09.R02. T10 | abuse | 05.R01,05.R02,05.R03. T11 | integration | 06.R01,06.R02,06.R03. T12 | abuse | 07.R01,07.R02,07.R03. T16 | integration | 10.R01,10.R02,10.R03.

Recovery kit (PS-053): 24 words (256-bit, 8-bit checksum), scrypt N=131072 r=8 p=1 salt 16, XChaCha20-Poly1305 nonce 24; `revokeOthersNotBefore = requestedAt + 259 200 000 ms`; pending expires 7 days; V06 IDENTITY_RECOVERY_WINDOW_OPEN; V07 backoff 60 s doubling to 900 s after 5 failures. Events `identity.recovery.kit_created|requested|completed|cancelled`.
- 01.R02 KDF parameters are fixed to scrypt N=131072, r=8, p=1 with a 16-byte salt and the cipher is XChaCha20-Poly1305 with a 24-byte nonce; weaker parameters are rejected.
- 03.R03 Completing with revocation of other devices requires the 72 hour window to have passed.
- 04.R01 All commands are vault commands; begin, complete and cancel produce signed statements (classrup.identity.recovery_notice/v1 signed by the account key, classrup.identity.recovery_dispute/v1 signed by an existing device key) delivered through the sync outbox.
- 05.R02 Disputes are authorized by a signature from an active device key listed in the account's identity document; the dispute proves only that such a key signed it.
- Also 01.R01, 01.R03, 02.R01–R03, 03.R01, 03.R02 (pending -> used, or active by cancel/dispute/7-day expiry), 04.R03 (keys via F07.S01.M01), 06.R03, 07.R01, 09.R02, 10.R01.
Tests: T01 | unit | 01.R01,01.R02,02.R01. T02 | unit | 01.R02,02.R01. T03 | unit | 02.R02,02.R03. T04 | property | 01.R03,03.R01,03.R02,03.R03. T05 | integration | 03.R03,02.R03 (71 h vs 72 h). T06 | integration | 03.R02,04.R03 (dispute). T07 | contract | 04.R01,04.R02,09.R02. T08 | integration | 04.R03,06.R02. T09 | abuse | 05.R01,05.R02,05.R03. T10 | chaos | 06.R01,06.R02,06.R03. T11 | abuse | 07.R01,07.R02,07.R03. T15 | integration | 10.R01,10.R02,10.R03.

Identity document (PS-055): `seq` +1 per version, `prev?`, `cid`, `deviceKeys` ≤ 20 `{ publicKey, status: active|revoked, addedAt, revokedAt?, revokesEffectiveAt? }`, ≤ 8 192 bytes, `expiresAt = issuedAt + 180 days`; V01 IDENTITY_DOC_SIGNATURE_INVALID, V03 IDENTITY_DOC_CHAIN_INVALID, V05 own doc = active keys plus keys revoked within 180 days | CONFLICT_STATE.
- 03.R01 A document moves from current to superseded when a valid higher seq arrives, to stale when the owner's state changes, and to contested when a fork is detected.
- 06.R03 Fork detection never discards either version; it records both.
- Also 01.R01, 02.R01, 02.R02 (seq orders versions, not clocks), 03.R02 (contested resolved only by a higher-seq signed document the user accepts), 03.R03, 04.R03, 06.R01.
Tests: T01 | unit | 01.R01,01.R02,02.R01. T03 | unit | 02.R01,02.R02,02.R03. T04 | integration | 03.R01,03.R02 (replay, fork). T05 | integration | 03.R03,02.R03. T06 | property | 03.R01,03.R02,03.R03. T08 | integration | 04.R03,05.R01. T10 | chaos | 06.R01,06.R02,06.R03. T11 | abuse | 07.R01,07.R02,07.R03.

Sessions (PS-054): 02.R02 "The signing key must be listed active in the DID's current signed identity document held by the relay." 04.R03 "The module consumes device key, recovery and erase events to end sessions." Tests T02 | unit | 02.R01,02.R02,02.R03; T07 | integration | 04.R03,02.R03.

## 7. Key management

PS-128 (mod_key): @noble/curves and @noble/ciphers 2.4.0; key ID = SHA-256 thumbprint; rotation overlap default 7 days (0–30); Web Lock `classrup-vault-unlock`; V02 SECURITY_WRAPPED_KEY_INVALID, V04 SECURITY_ROTATION_INVALID.
- 03.R02 Rotation proceeds generate, sign, deliver and finalize, with the old key kept valid for an overlap of at most 7 days unless the user marks it compromised, in which case revocation is immediate.
- 04.R03 rotateKey produces a rotation statement (classrup.security.keyrotation/v1) signed by old and new keys and hands it to the sync outbox and to F16.S02.M02 for registration.
- Also 01.R01, 01.R02 (keys unwrapped only in memory; no key bytes exposed), 01.R03, 02.R02 (blob KDF minimums enforced), 03.R01, 06.R01, 06.R03, 07.R01, 10.R02.
Tests: T01 | unit | 01.R01,01.R03,02.R01,04.R01. T02 | unit | 01.R01,01.R02,09.R02. T03 | property | 01.R02,06.R01. T04 | unit | 02.R02,02.R03. T06 | integration | 03.R01,03.R03. T07 | integration | 03.R02,04.R03,06.R03 (rotation). T08 | unit | 04.R03. T09 | abuse | 04.R02,05.R01,05.R02,07.R01. T11 | chaos | 06.R01,06.R03. T12 | abuse | 07.R02,07.R03. T15 | integration | 10.R01,10.R02,10.R03.

PS-129 (mod_management): KeyRecord `status: active | revoked | expired | conflicted`, `revocationEffectiveFrom` ≤ 30 days before `revokedAt`, `freshnessCheckedAt`, `freshnessSource`, `successorKeyId?`; V02/V03 SECURITY_KEY_UNAUTHORIZED, V05 SECURITY_KEY_LIMIT; events `security.key.registered|revoked`; consumes `identity.device_key.added|revoked`, `federation.peer.added`, `federation.account.moved`.
- 01.R03 Key IDs are unique per public key and a revoked key ID is never reused or reactivated.
- 06.R03 Revocations received before their key are stored as pending and applied when the key is seen, so ordering never loses a revocation.
- Also 01.R01, 02.R01, 02.R02 (effectiveFrom bounded 30 days), 03.R01, 03.R02 (conflicting successors -> conflicted until recovery-key revocation), 03.R03, 04.R02, 04.R03, 06.R01, 10.R02.
Tests: T01 | unit | 01.R01,01.R02,01.R03,02.R01. T02 | unit | 02.R02,02.R03. T03 | property | 01.R03,03.R01. T04 | integration | 03.R03,06.R03. T05 | integration | 03.R02 (conflicted). T06 | contract | 04.R01,04.R02,09.R02. T07 | integration | 04.R03. T08 | abuse | 05.R01,05.R02,05.R03,07.R01 (recovery wins). T09 | abuse | 07.R03,02.R01. T10 | chaos | 06.R01,06.R02,06.R03. T11 | integration | 07.R02,07.R03. T12 | integration | 02.R03,07.R01. T15 | integration | 10.R01,10.R02,10.R03.

PS-130 (security mod_signatures):
- 01.R02 The signed bytes are UTF-8 of the context, one zero byte, the 32-byte signer key ID digest, one zero byte, then the JCS bytes of the payload, so context and key are bound into every signature.
- 02.R02 Verification is strict Ed25519 (RFC 8032, canonical S, no small-order keys) and recomputes canonical bytes rather than trusting transmitted bytes.
- 04.R03 signJcs and verifyJcs exist only for the federation envelope (FED-2) and are not exported to other modules.
- Also 03.R02 (verifier receipt time, not signedAt, decides revocation), 06.R02.
Tests: T01 | unit | 01.R01,01.R02,01.R03,02.R01. T02 | unit | 02.R02,09.R02. T03 | property | 01.R02,05.R02. T06 | integration | 03.R01,03.R02,03.R03. T07 | abuse | 05.R03,07.R01,07.R03. T08 | chaos | 06.R01,06.R02,06.R03,03.R03.

## 8. Gaps

- ADR-0013, ADR-0016, CTR-FED-001, CTR-IDM-001 are cited but not among the files read; PS-054 defines no module error codes.
- PS-052 (`classrup.identity.device_revocation/v1`) and PS-129 (`classrup.security.keyrevocation/v1`) name different revocation statement types; the files do not say how they map.
