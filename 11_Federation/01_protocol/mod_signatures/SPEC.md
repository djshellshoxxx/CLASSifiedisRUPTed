# F11.S01.M03 — signatures

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** Platform Lead. **Parent:** [F11.S01 protocol](../SPEC.md).

**Canonical contracts:** CTR-EVT-001 (R05 signing input), CTR-FED-001 (R04 per-event signing, R09 keys, verification order steps 7–8), CTR-ID-001 (`key_`, `nod_`), CTR-ERR-001, CTR-SCH-001, CTR-PRV-001 (R08 secret handling). Error slug: none owned; uses `FED.*` and `EVT.SIGNATURE_REQUIRED` from CTR-FED-001 and CTR-EVT-001.

**Canonical owner (record class "federation event signature and verification outcome"):** this module, `11_Federation/01_protocol/mod_signatures` (PROVISIONAL, CTR-FED-001 owner F11). Signing primitives, algorithm library and signing-key lifecycle: `16_Security/02_cryptography/mod_signatures` (F16.S02.M03). Consumers reference either by full ID only.

## Purpose and business behavior
Sign outbound federated events and verify inbound ones, so a receiving node can confirm which node asserted an event and that its bytes were not altered after signing. This module implements the signing input and the verification steps that CTR-EVT-001 R05 and CTR-FED-001 define. It does not redefine them. A valid signature proves the origin node made the assertion. It does not prove that a real-world exchange, delivery or payment happened. Signing never exposes private key material. Verification never accepts an event whose key is unknown, revoked, or compromised at the event's `occurred_at`.

## User stories
- As a node operator, I can see which key signed each imported event, and whether that key was later marked compromised.
- As a node operator, I can rotate a signing key without rejecting events signed by the previous key before its `valid_until`.
- As a peer operator, I receive a specific rejection (`FED.SIGNATURE_INVALID`, `FED.KEY_REVOKED`) for each bad event, and a batch never partially imports an invalid event.

## Scope
- [PS-085-01 domain schema](domain_schema.md)
- [PS-085-02 validation rules](validation_rules.md)
- [PS-085-03 workflow state machine](workflow_state_machine.md)
- [PS-085-04 commands, queries and events](commands_queries_events.md)
- [PS-085-05 authorization and capabilities](authorization_capabilities.md)
- [PS-085-06 failure, recovery and idempotency](failure_recovery_idempotency.md)
- [PS-085-07 privacy, retention and abuse](privacy_retention_abuse.md)
- [PS-085-08 observability and performance](observability_performance.md)
- [PS-085-09 contract and acceptance tests](contract_and_acceptance_tests.md)
- [PS-085-10 import, export, backup and rollback](import_export_backup_rollback.md)

## Public interfaces
No public endpoint. Internal operations: `signing.sign_event` (outbound, `sys_` principal), `signing.verify_event` (inbound, step 8 of CTR-FED-001 verification order), `key.lookup` (projection read). Full signatures in PS-085-04. Only `federation_event.execute`, `federation_key.read`, `federation_key.revoke` and `federation_key.administer` capabilities apply (PS-085-05).

## Relationships, dependencies and integration
- Declared dependencies (DEPENDENCY_MATRIX.md): F11.S01.M01 mod_portable, F16.S02.M03 mod_signatures (primitives, key records).
- Declared dependents: F11.S01.M02 mod_records, F11.S02.M02 mod_dedup.
- Runtime callers: F11.S02.M01 mod_delivery (signs at export, verifies at ingress), F11.S03.M02 mod_blocklists (verifies signed activations before import).
- Reference IDs only. No copies of foreign schemas (PS-085-09 R05).

## Data ownership
This module owns the signature object shape, the verification result contract and a read-only projection of key metadata. It does not own key records (F16), stored envelopes (F11 storage in PS-086) or peer trust state (F11.S03.M01). Export and deletion follow PS-085-07 and CTR-PRV-001.

## Risk considerations
Main risks: forged or replayed envelopes accepted after a key compromise; signing-input drift between nodes that causes false rejections; private key exposure through logs, exports or backups; expensive signature checks used for denial of service before cheap checks run; use of a non-audited cryptographic implementation. Mitigations: PS-085-02 (cheap checks first, strict verification), PS-085-09 golden vectors, PS-085-07 (no key material in logs or exports), PS-085-05 (dual control for key revocation and compromise marking), audited library only (PS-085-01 R02). No platform custody of money. Pseudonyms do not guarantee anonymity.

## Completion criteria
All ten PS-085 process specs are SPEC-DRAFT-COMPLETE. Golden signing-input vectors are defined (PS-085-09). F16 has reviewed primitives and key lifecycle. F10 has reviewed log fields. Peer-side contract tests are listed in PS-085-09 and pass in CI once implemented.

## Open decisions
- PROVISIONAL (D01 default, unapproved): versioned signed envelopes; explicit opt-in.
- PROVISIONAL (D10 default, unapproved): user-controlled keys cover account identity. This module covers node signing keys only. OPEN: whether user keys sign federated events.
- ASSUMPTION: Ed25519 (RFC 8032) and JCS (RFC 8785), as in CTR-EVT-001 R05.
- OPEN (F16): signing library choice and version. Record as an ADR (ADR index has no file yet).
- OPEN: canonical owner of the `key_` record class after F16 review.

## Required process specification inventory
- [x] [domain_schema.md](domain_schema.md) — PS-085-01
- [x] [validation_rules.md](validation_rules.md) — PS-085-02
- [x] [workflow_state_machine.md](workflow_state_machine.md) — PS-085-03
- [x] [commands_queries_events.md](commands_queries_events.md) — PS-085-04
- [x] [authorization_capabilities.md](authorization_capabilities.md) — PS-085-05
- [x] [failure_recovery_idempotency.md](failure_recovery_idempotency.md) — PS-085-06
- [x] [privacy_retention_abuse.md](privacy_retention_abuse.md) — PS-085-07
- [x] [observability_performance.md](observability_performance.md) — PS-085-08
- [x] [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md) — PS-085-09
- [x] [import_export_backup_rollback.md](import_export_backup_rollback.md) — PS-085-10
