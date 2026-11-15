# Cross-Module Sensitive Security Audit — 2026-11-15 (Pass 4)

## Scope

This pass examined interactions between sensitive modules rather than repeating the earlier inventory of missing security specifications. Focus areas:

- deletion, retention, append-only evidence, export, backups and federation;
- consent revocation, offline commands, offer revisions and multi-party transactions;
- pseudonym identity, profile portability and reputation;
- dispute evidence, private communications and privileged access;
- module ownership and whether the documented templates create false confidence.

The repository remains a planning/specification project. These are design and assurance findings, not confirmed runtime exploits. No executable application, deployed service, or production dataset was tested.

## Executive assessment

**Disposition: NOT READY for sensitive-feature implementation sign-off.**

The highest-risk issue in this pass is the lack of end-to-end lifecycle contracts across module boundaries. The project assigns data ownership to individual features and states broad trust principles, but adjacent modules do not yet define compatible rules for revocation, deletion, retention, export, portability, and evidence access.

A local module can appear compliant while its downstream consumers, backups, caches, or federation peers preserve or act on data that should no longer be accessible or valid.

## Findings

### S4-01 — Critical: Deletion, append-only evidence, legal holds, backups and federation have no coherent end-to-end lifecycle

**Evidence**
- `PROJECT_SPEC.md` calls for append-only commerce evidence with policy-driven retention.
- The same project specification includes export/portability and deletion in user journeys.
- `10_Privacy/01_data_controls/mod_retention/SPEC.md` is PLANNED; its domain, transitions, authorization, failure, interface, privacy and test contracts are not authored.
- `10_Privacy/01_data_controls/mod_export/authorization_capabilities.md` remains a generic unchecked placeholder.
- Multiple domain specifications defer export and deletion to retention/legal-hold policies without defining the actual cross-domain contract.
- The risk register does not define a deletion-propagation or backup-restoration risk.

**Risk**
A user deletion request may remove a profile row but leave identifiers or content in append-only receipts, dispute evidence, message attachments, search indexes, event logs, backups, exports, or remote federation peers. Conversely, an overly broad deletion job could destroy evidence needed for a legitimate dispute or audit. Restoring a backup could reintroduce data that was deleted or access that was revoked after the backup was made.

**Required gate**
Create a canonical data lifecycle policy and machine-readable data inventory. For each data class, define owner, purpose, sensitivity, retention period, deletion behavior, legal-hold basis, export eligibility, backup treatment, federation propagation, and proof of completion. Distinguish deletion of content from retention of a minimal non-identifying integrity record. Define tombstones or equivalent deletion markers, restore-time reconciliation, cache/index invalidation, and remote peer acknowledgement or documented limits. Test deletion across every copy and derived store, backup restore after deletion, legal hold start/end, and conflicting deletion/dispute events.

### S4-02 — Critical: Consent revocation is not bound to queued commands or material proposal versions

**Evidence**
- `PROJECT_SPEC.md` requires explicit consent from every barter participant and renewed consent for every material proposal revision. It also says offline writes remain pending until server acknowledgement.
- `08_Communications/02_negotiation/mod_consent/SPEC.md` is PLANNED and its process contracts are not authored.
- `08_Communications/02_negotiation/mod_offers/SPEC.md` is PLANNED and its command/state, validation, failure/idempotency and acceptance contracts are not authored.
- `09_Commerce/01_payments/mod_noncustodial` and the settlement modules depend on clear transaction states but the relevant consent/offer lifecycle is not fully defined.

**Risk**
An offline client can queue an acceptance against proposal version N, while another participant revises the proposal to N+1 or a participant revokes consent. If the queued command is later replayed and validated only against the transaction ID or current participant membership, the system may accidentally treat stale consent as approval of changed terms. A user-interface acknowledgement can also be mistaken for a server-committed consent event.

**Required gate**
Bind each consent record to an immutable proposal version/hash, participant, action, scope, timestamp, expiry, and authenticated principal. Material changes must create a new version and invalidate prior approvals. Revocation must be an explicit server-side state transition with defined ordering against pending commands. On reconnect, queued commands must be re-authenticated and re-authorized, then checked against current proposal version, participant set, expiry, inventory/asset state, and revocation state. Use idempotency keys and concurrency control. Test revoke-versus-accept races, proposal edits during offline periods, duplicate replay, reordered events, participant dropout, and simultaneous acceptances.

### S4-03 — High: Pseudonym and profile portability can create identity-linkage and reputation-transfer attacks

**Evidence**
- `07_Identity/01_accounts/mod_pseudonyms/SPEC.md` says pseudonyms do not guarantee anonymity and leaves its privacy/security/abuse and lifecycle contracts unauthored.
- `07_Identity/02_profiles/mod_portable/SPEC.md` is PLANNED with all detailed process contracts not yet authored.
- `07_Identity/03_trust/mod_reputation/SPEC.md` is PLANNED with its domain, authorization, lifecycle, privacy and test contracts not yet authored.
- The project supports federation and portability, but no reviewed contract defines a safe identity-linkage and reputation-transfer protocol.

**Risk**
An import/export or migration feature may unintentionally link multiple pseudonyms, expose prior counterparties, or allow an attacker to claim another user's reputation history. Conversely, a design that treats a new pseudonym as an entirely new identity may enable reputation laundering after abuse or sanctions. Stable identifiers, signed migration proofs, timestamps, and reputation attestations can themselves become correlation handles across instances.

**Required gate**
Define separate concepts for account identity, public pseudonym, per-instance identifier, cryptographic key, and reputation subject. Specify whether and when users can link pseudonyms, migrate them, rotate them, or intentionally leave history behind. Make reputation attestations scoped, signed, minimal, revocable where appropriate, and resistant to replay or subject substitution. Do not expose a global stable identifier by default. Define how blocks, moderation decisions, disputes, and appeals behave during migration without silently broadcasting private relationship graphs. Test cross-instance correlation, forged migration, replayed attestations, duplicate identity claims, and reputation laundering.

### S4-04 — High: Dispute evidence access is not bounded by confidentiality or purpose

**Evidence**
- `09_Commerce/02_settlement/mod_disputes/SPEC.md` is PLANNED and its authorization, privacy, workflow and acceptance contracts are not authored.
- `09_Commerce/02_settlement/mod_disputes/authorization_capabilities.md` is a generic unchecked placeholder.
- `08_Communications/01_messaging/mod_private` and attachment controls are also PLANNED; there is no completed contract governing when message or attachment content may be disclosed into a dispute.
- The project includes moderation, appeals, evidence, and disputes as user journeys but does not specify a complete evidence access model.

**Risk**
Dispute handling may expose an entire private conversation when only a narrow excerpt is relevant. Moderators or operators may gain broad access to attachments, location details, identity clues, or unrelated messages. Evidence may be copied into a durable case record without an expiry or deletion policy. A participant may also be able to submit forged, selectively edited, or context-stripped evidence.

**Required gate**
Define evidence classes, provenance, integrity verification, permitted purpose, access roles, participant notice, redaction, retention, export, and appeal. Prefer user-selected, narrowly scoped evidence over blanket message access. Preserve integrity metadata without making all underlying private content visible to staff. Separate evidence submission from adjudicator access. Log privileged access without logging sensitive payloads. Define emergency access, dual control where warranted, and review of staff access. Test cross-case access, unauthorized moderator access, evidence substitution, selective context, overbroad exports, and post-case deletion.

### S4-05 — High: Federation revocation and privacy deletion are not defined as distributed consistency guarantees

**Evidence**
- `PROJECT_SPEC.md` requires federation signatures, provenance, revocation and abuse handling.
- `11_Federation/01_protocol/mod_signatures`, `11_Federation/02_relay_sync/mod_delivery`, and `11_Federation/03_interop/mod_trust` remain planned or have generic process placeholders.
- The data-retention and export specifications do not define federation deletion acknowledgements, peer outages, or reconciliation.

**Risk**
A remote peer may continue serving a revoked listing, stale profile, blocked participant, deleted attachment, or previously authorized data after the home instance changes its state. A malicious or offline peer may ignore deletion/revocation events. The project needs to distinguish local enforcement from best-effort remote propagation and avoid implying global deletion or revocation when it cannot guarantee it.

**Required gate**
Define authoritative home-instance ownership, event sequence/version, signed revocation and deletion events, delivery retry/expiry, peer acknowledgement, quarantine, reconciliation, and user-visible status. A remote peer must not be able to restore stale state by replaying an older event. Define fail-closed behavior for sensitive reads when trust status is unknown. State clearly what data may remain on remote peers and under what policy. Test prolonged peer outage, replay after revocation, peer refusal, divergent replicas, peer rejoin, and stale cache/index recovery.

### S4-06 — Medium-High: Reusable module templates create an assurance and traceability hazard

**Evidence**
- Reviewed module specifications repeatedly contain identical generic user stories and risk language, including modules for pseudonyms, retention, secrets, reputation, consent, offers, disputes, incident response and threat management.
- Process documents repeatedly retain generic unchecked requirements and refer to future prompts for substantive scenarios.
- Some generic language is not domain-specific—for example, broad statements about payment custody or pseudonym use appear in modules whose actual responsibility is different.

**Risk**
A completed-looking folder structure can be mistaken for completed engineering requirements. Reviewers may count files or boilerplate checklists rather than verify whether a module has domain-specific controls, measurable acceptance criteria, owners, and downstream consumers. Generic copied requirements can also conceal contradictions between modules.

**Required gate**
Add a specification-quality gate that rejects generic placeholder text as completion evidence. Each sensitive module must contain domain-specific assets, threats, trust boundaries, state transitions, authorization rules, failure modes, retention rules, named owner, consumer list, and executable acceptance criteria. Add automated checks for unchecked placeholders, unresolved owner fields, repeated template paragraphs, missing test IDs, and links to nonexistent contracts. Require independent review of cross-module consistency before marking a module ready.

## Cross-module attack scenarios to test

These are design validation scenarios, not claims of observed exploitation:

1. **Deleted-account resurrection:** user requests deletion; profile is removed; a backup is restored; a federated peer replays an older profile event.
2. **Stale offline consent:** participant approves version 4 offline; terms change to version 5; participant revokes; queued version-4 acceptance reconnects.
3. **Reputation hijack:** attacker imports a signed reputation record but substitutes the subject or destination pseudonym.
4. **Dispute overexposure:** one party submits a message excerpt; an adjudicator or moderator obtains access to the full private thread and attachments.
5. **Revocation split-brain:** home instance revokes a peer or user, but a remote relay continues accepting delayed events from the previously trusted identity.
6. **Evidence retention conflict:** a user deletion request races with a dispute hold and backup snapshot; all copies must converge to the correct policy state without leaking data or destroying legitimately held evidence.

## Prioritized release gates

1. Establish canonical data lifecycle semantics across primary stores, derived stores, exports, backups and federation.
2. Bind consent to immutable proposal versions and enforce revocation at command execution time.
3. Define pseudonym/account separation and safe portability/reputation migration.
4. Define purpose-limited dispute evidence access and privileged access auditing.
5. Specify distributed revocation/deletion behavior and stale-event rejection.
6. Enforce specification quality checks so boilerplate cannot satisfy security readiness.

## Limitations

This review examined repository specifications and planning files only. No application runtime, API, database, cryptographic implementation, federation network, wallet integration, or production deployment was available for dynamic testing. No confirmed exploitable runtime vulnerability is asserted.

## Final verdict

The most important remaining risk is not a single missing control. It is inconsistent lifecycle and authority across modules. Deletion, consent, identity, evidence, and federation must share explicit versioning, ownership, revocation, and retention semantics. Until those contracts are complete and tested together, sensitive features should not pass implementation security review.
