# F10.S01.M01 — Privacy consent

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F10.S01](../SPEC.md). **Process IDs:** PS-076-01…PS-076-10. **Code:** `packages/privacy/src/data_controls/consent`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Purpose-based, revocable consent kept in the user's vault. Five purposes exist: publishing to federation, notifications by email, notifications by Web Push, optional analytics sharing, and precise location sharing. Every purpose is off by default. A grant records the exact policy text version and its SHA-256 hash that the user saw. Other modules call a local check before processing for a purpose. When a purpose involves a relay, the grant also produces a signed consent statement for that relay, and withdrawal produces a signed withdrawal; copies already fetched by others cannot be recalled and the UI says so.

## Responsibilities

- Own PrivacyConsent records (append-only history per purpose and scope) with policy id, version and hash.
- Provide privacy.consent.check, the single local decision function other modules call before processing for a purpose.
- Produce signed statements classrup.privacy.consent/v1 and classrup.privacy.consent_withdrawal/v1 addressed to a named relay when the purpose is relay-scoped.
- Lapse consents whose policy hash has a material change, requiring a fresh informed grant.
- Withdraw consent immediately and locally, including when an unsubscribe happens elsewhere (notify.channel.opted_out) or a deletion is requested.

## Not responsible for

- Per-channel notification preferences, quiet hours and unsubscribe tokens (F13.S02), which read consent from this module.
- Precise location storage and sharing mechanics (F06.S02.M02); this module only records consent for them.
- Relay-side enforcement of consent statements (F11 federation and F13 push modules on the relay).
- Future: age-based consent rules and guardian consent; MVP assumes users meet the minimum age of the community and records no age.

## User stories

- As a user, I decide separately whether my listings may be published to federated relays, whether I get email or push notifications, and whether I share precise location, and everything is off until I say yes.
- As a user, I can see the exact policy text version I agreed to and withdraw with one tap.
- As a user, I am told honestly that withdrawing stops future processing but cannot recall copies others already fetched.

## Edge cases

- Policy text changes materially after a grant; the consent lapses and processing stops until the user re-grants with the new hash.
- The user grants federation consent for relay A, then withdraws; the signed withdrawal is queued for relay A while offline and shows prepared until peer_accepted.
- A grant is attempted with an outdated policy hash from a cached screen; it is refused with PRIVACY_POLICY_STALE.
- An unsubscribe link elsewhere withdraws email notification consent; the vault records withdrawal with source unsubscribe within the same session.
- Two tabs grant and withdraw the same purpose at the same moment; the later revision wins locally in order of the vault transaction and both entries stay in history.
- Deletion is requested; all active consents are withdrawn with reason account_deletion, and cancelling the deletion does not restore them.
- Import from an older export carries consents with an unknown policy hash; they import as lapsed.

## UX and accessibility

- Privacy settings: one row per purpose with plain-language description, current state, policy version and Read the text link, and a switch.
- Grant sheet: shows the policy text for the purpose, the relay it applies to, what cannot be undone ('copies already fetched by others cannot be recalled'), and a Grant button.
- History: list of grants and withdrawals with dates and policy versions.

**States:** loading; off-default; granted; withdrawn; lapsed-needs-regrant; pending-offline; error

**Accessibility:** Each switch has a visible label and a description linked with aria-describedby, and state changes are announced politely.; The policy text is readable at 200 percent zoom and reachable by keyboard in a dialog with focus trap and Escape to close.; Switch targets are at least 44 by 44 px.

## Owned data

- `PrivacyConsent` (classrup.privacy.consent/v1, P3, RET-EVIDENCE)

## Interfaces

- Commands: `privacy.consent.grant`, `privacy.consent.withdraw`
- Queries: `privacy.consent.check`, `privacy.consent.list_mine`
- Emits: `privacy.consent.granted`, `privacy.consent.withdrawn`
- Consumes: `notify.channel.opted_out`, `privacy.deletion.requested`

## Dependencies

F07.S01.M01, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-076-01 | [Domain schema](domain_schema.md) | 3 |
| PS-076-02 | [Validation rules](validation_rules.md) | 3 |
| PS-076-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-076-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-076-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-076-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-076-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-076-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-076-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-076-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/privacy/src/data_controls/consent/index.ts`.

## Acceptance criteria

- All tests T01 to T16 pass in CI.
- On a fresh vault every purpose reports not granted and no consumer processes for any purpose.
- Withdrawal stops in-vault processing within 1 second and the UI states that copies cannot be recalled.
