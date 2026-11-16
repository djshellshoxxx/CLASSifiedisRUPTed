# F10.S02.M01 — Privacy threat model

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F10.S02](../SPEC.md). **Process IDs:** PS-082-01…PS-082-10. **Code:** `docs/privacy/threat_model`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The living privacy threat model for the local-first hybrid architecture. It catalogs how an adversary could learn who a user is, where they are, who they trade with or what they own: geolocation inference, metadata leakage, Sybil identities, social-graph and cycle-graph deanonymization, compromised or curious relays, malicious federated peers, local device compromise, and update-channel attacks. Each threat has an ID, assets, adversary, attack path, mapped controls (module and requirement IDs), residual risk stated in plain words, and privacy test IDs. A CI check keeps the catalog and the tests in sync. The model states limits honestly, namely that pseudonymity is not anonymity, relays see routing metadata, and copies others fetched cannot be recalled.

## Responsibilities

- Maintain docs/privacy/threat_model as the single catalog of privacy threats PT-01 onward with adversary classes A1 to A7, assets, controls, residual risk and test IDs.
- Cover at least geolocation, metadata, Sybil, social-graph and cycle-graph deanonymization, relay compromise, malicious federated peers, device compromise, push and mailbox traffic analysis, counterparty disclosure, auction host abuse and update-channel compromise.
- Map every threat to controls by module ID and requirement ID and to automated privacy tests with IDs PRIVT-<area>-<nn>.
- Run a review at every release candidate and at least every 90 days, recording reviewer, date and changes.
- Provide a CI check that fails when a threat lacks a control, a test or a residual-risk statement, or when a referenced requirement or test ID does not exist.

## Not responsible for

- Implementing the controls; owning modules (F10.S02.M02 classification, F10.S02.M03 metadata, F06 discovery location, F11 federation, F16 security) do.
- The broader STRIDE security threat model and incident runbooks (F16.S03.M01, F16.S03.M03).
- Legal privacy assessments and regulatory filings (F18 governance).
- Future: quantitative risk scoring, external red-team reports embedded in the catalog and a public disclosure feed.

## User stories

- As a user, I can read in plain language what ClassRup does and does not protect about my identity and location.
- As a developer adding a feature, I find the threats that apply to it and the controls and tests I must satisfy.
- As a reviewer, I see which threats have residual risk and who accepted it and when.

## Edge cases

- A new module adds a field that exposes location finer than L2 publicly; the CI check requires a linked threat entry or fails the build.
- A control is removed in a refactor but the threat still references it; the check fails because the requirement ID no longer exists.
- A threat is closed because the feature is removed; it stays in the catalog marked retired with the reason rather than being deleted.
- Two adversary classes combine, for example a relay operator who also runs Sybil accounts; the entry for combined attacks lists both and the strongest control gap.
- A residual risk is accepted by a reviewer who then leaves; the acceptance remains with date and name, and the next review re-confirms it.
- A test ID is renamed; the check reports the dangling reference with the file and line.

## UX and accessibility



Documentation module with no screens. Output is Markdown rendered at docs/privacy/threat_model and a user-facing summary page 'What ClassRup protects and what it does not' in the PWA help, written in plain language at reading level grade 8.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

F10.S02.M02, F10.S02.M03, F10.S01.M01, CTR-PRV-001, CTR-FED-001, CTR-TST-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-082-01 | [Domain schema](domain_schema.md) | 3 |
| PS-082-02 | [Validation rules](validation_rules.md) | 3 |
| PS-082-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-082-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-082-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-082-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-082-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-082-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-082-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-082-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `docs/privacy/threat_model/index.ts`.

## Acceptance criteria

- privacy-threat-check passes on the real repository with 0 violations.
- All twelve mandatory topics have an active or retired entry with controls, tests and residual risk.
- The user-facing summary states the honesty constraints verbatim in plain language.
