# F10.S01.M01 — Privacy consent

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F10.S01](../SPEC.md). **Process IDs:** PS-076-01…PS-076-10. **Code:** `packages/privacy/src/data_controls/consent`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Purpose-based, revocable consent kept in the user's vault. Six purposes exist: publishing to federation, notifications by email, notifications by Web Push, optional analytics sharing, precise location sharing, and chain lookups that disclose addresses and transaction IDs to a user-chosen crypto verifier endpoint. Every purpose is off by default. A grant records the exact policy text version and its SHA-256 hash that the user saw. Other modules call a local check before processing for a purpose and refuse with PRIVACY_CONSENT_REQUIRED when it is not granted. Federation, email and push consents are each scoped to one user-selected relay named by its canonical relayId (F15.S02.M01), and chain lookup consents to one verifier endpoint origin. Exactly one relay-facing artifact exists per purpose: for federation_publish the vault signs classrup.privacy.consent_statement/v1 for that relay, which accepts and acknowledges it through the relay command privacy.consent.relay_register; for email and push the relay-facing artifact is the F13.S02.M03 channel consent statement, which carries this module's consent ID and purpose. A location_precise grant only enables the feature; every precise share is still a separate action in F06.S02.M02. Withdrawal always succeeds locally and, for federation, queues a signed withdrawal that names the grant it revokes; copies already fetched by others cannot be recalled and the UI says so.

## Responsibilities

- Own PrivacyConsent records (append-only history per purpose and scope) with policy id, version and hash.
- Provide privacy.consent.check, the single local decision function other modules call before processing for a purpose.
- Produce the relay-facing statements for federation_publish only, classrup.privacy.consent_statement/v1 and classrup.privacy.consent_withdrawal/v1, signed by the principal and addressed to the named relay; notify_email and notify_push rely on the F13.S02.M03 classrup.notify.channel_consent/v1 statement, which references the consent ID and purpose.
- Lapse consents whose policy hash has a material change, requiring a fresh informed grant, and queue the same signed withdrawal as an explicit withdrawal.
- Withdraw consent immediately and locally on user request, on an F13 unsubscribe or settings opt-out for the same purpose and relay, and in this module's DeletionPort step when a deletion executes.
- Serve the relay command privacy.consent.relay_register, which verifies a consent or withdrawal statement and returns a relay-signed acknowledgement, and the in-process relay query privacy.consent.relay_check that relay federation calls before indexing or forwarding an author's records.
- Meet the N6 duties for its own data, namely ExportSectionPort section privacy.consents, a DeletionPort step and a RetentionPurgePort kind, with every field classified by F10.S02.M02.
- Define PRIVACY_CONSENT_REQUIRED, the single error code every consumer returns when a purpose check is not granted, and the in-process guard privacy.consent.require that returns it.
- Bind privacy.consent.check as the ConsentCheckPort in the kernel port registry at vault composition (inverted registration), so modules this module depends on, F07.S01.M01 among them, consult consent without a depends_on edge that would close a cycle.

## Not responsible for

- Per-channel notification preferences, quiet hours, unsubscribe tokens and the relay-facing statement for notify_email and notify_push (F13.S02.M03), which read consent from this module.
- Precise location storage and sharing mechanics (F06.S02.M02); a location_precise grant only enables the feature, and every L4 share still needs an explicit per-counterparty action with a TTL of at most 24 h there.
- Relay-side enforcement of federation scope by the relay federation modules (F11.S02.M01 calls privacy.consent.relay_check) and of notification channels (F13.S02.M03).
- Chain verifier configuration and the unauthenticated lookups themselves (F09.S01.M03); a chain_lookup grant only permits lookups to the one endpoint origin it names.
- The canonical relayId format, defined by F15.S02.M01; this module only validates and stores it.
- Future: age-based consent rules and guardian consent; MVP assumes users meet the minimum age of the community and records no age.

## User stories

- As a user, I decide separately whether my listings may be published to federated relays, whether I get email or push notifications, and whether I share precise location, and everything is off until I say yes.
- As a user, I can see the exact policy text version I agreed to and withdraw with one tap.
- As a user, I am told honestly that withdrawing stops future processing but cannot recall copies others already fetched.

## Edge cases

- Policy text changes materially after a grant; the consent lapses, processing stops until the user re-grants with the new hash, and for federation the same signed withdrawal as an explicit withdrawal is queued for the relay.
- The user grants federation consent for relay A, then withdraws; the signed withdrawal is queued for relay A while offline and shows prepared until relay A returns its signed acknowledgement (peer_accepted).
- A grant is attempted with an outdated policy hash from a cached screen; it is refused with PRIVACY_POLICY_STALE.
- An unsubscribe link in an email from relay A withdraws the F13 email channel; on the next sync with relay A the vault receives notify.channel.opted_out with via unsubscribe_link and withdraws the notify_email consent for relay A with source unsubscribe. An opted_out with via expired, account_deletion, privacy_withdrawal or relay_policy leaves the purpose consent unchanged.
- Two tabs grant and withdraw the same purpose at the same moment; the later revision wins locally in order of the vault transaction and both entries stay in history.
- Deletion is requested; consents stay unchanged during the 14-day grace because cancelling must restore normal operation (publishing is refused meanwhile by privacy.deletion.assert_not_pending of F10.S01.M04); at execution this module's DeletionPort step withdraws every consent with source deletion and signs the federation withdrawals before the keys are destroyed.
- Import from an older export carries consents with an unknown policy hash; they import as lapsed.
- A relay receives a replayed grant whose cid already has a withdrawal, a grant addressed to another relay, or a statement signed by a revoked key; privacy.consent.relay_register refuses each with PRIVACY_CONSENT_STATEMENT_INVALID.
- A burst of 100 withdrawals in one hour from unsubscribes across several relays all succeed locally; the outgoing withdrawal statements are coalesced per relay in the sync outbox and none is dropped.
- A grant names a relay by hostname such as relay.example.org instead of its canonical relayId; it is refused with VALIDATION_FAILED, and a relay whose genesis key changed (new identity) has a different relayId and needs a new grant.
- The user grants chain_lookup for https://esplora.example.net and later switches the verifier to another endpoint; check for the new origin returns granted false with reason scope, F09.S01.M03 refuses the lookup with PRIVACY_CONSENT_REQUIRED and the settings sheet asks for a grant for the new origin.

## UX and accessibility

- Privacy settings: one row per purpose with plain-language description, current state, the relay it applies to (federation, email, push) shown by relay name and identity fingerprint, the verifier endpoint origin for chain lookups, policy version and Read the text link, and a switch.
- Grant sheet: shows the policy text for the purpose, the relay or endpoint it applies to, what cannot be undone ('copies already fetched by others cannot be recalled'), for precise location the sentence 'Turning this on shares nothing; each share is a separate choice', for chain lookups the sentence 'This endpoint learns which transactions and addresses you look up', and a Grant button.
- History: list of grants and withdrawals with dates and policy versions.

**States:** loading; off-default; granted; withdrawn; lapsed-needs-regrant; pending-offline; error

**Accessibility:** Each switch has a visible label and a description linked with aria-describedby, and state changes are announced politely.; The policy text is readable at 200 percent zoom and reachable by keyboard in a dialog with focus trap and Escape to close.; Switch targets are at least 44 by 44 px.

## Owned data

- `PrivacyConsent` (classrup.privacy.consent/v1, P3, RET-EVIDENCE)

## Interfaces

- Commands: `privacy.consent.grant`, `privacy.consent.withdraw`, `privacy.consent.relay_register`
- Queries: `privacy.consent.check`, `privacy.consent.require`, `privacy.consent.list_mine`, `privacy.consent.relay_check`
- Emits: `privacy.consent.granted`, `privacy.consent.withdrawn`
- Consumes: `notify.channel.opted_out`

## Dependencies

F07.S01.M01, F11.S01.M01, F15.S01.M01, F15.S02.M01, F16.S02.M02, F12.S03.M03, F10.S02.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001, CTR-FLG-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-076-01 | [Domain schema](domain_schema.md) | 4 |
| PS-076-02 | [Validation rules](validation_rules.md) | 6 |
| PS-076-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-076-04 | [Commands, queries and events](commands_queries_events.md) | 6 |
| PS-076-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-076-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-076-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-076-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-076-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-076-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/privacy/src/data_controls/consent/index.ts`.

## Acceptance criteria

- All tests T01 to T23 pass in CI.
- On a fresh vault every purpose reports not granted and no consumer processes for any purpose.
- Withdrawal stops in-vault processing within 1 second, is never refused, and the UI states that copies cannot be recalled.
- Exactly one relay-facing statement exists per relay-scoped purpose, and relays refuse replayed, cross-relay or revoked-key statements.
