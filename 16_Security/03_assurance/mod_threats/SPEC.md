# F16.S03.M01 — Security threat model

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F16.S03](../SPEC.md). **Process IDs:** PS-133-01…PS-133-10. **Code:** `docs/security/threat_model`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The security threat model for the local-first architecture, kept as a reviewed document under docs/security/threat_model. It applies STRIDE (spoofing, tampering, repudiation, information disclosure, denial of service, elevation of privilege) to each trust boundary: the static distributor and PWA host, the user's vault on the device, a relay, federation peers, wallets and chains, and the physical exchange of goods. It also covers three cross-cutting hazards, malicious or altered code delivered by a static distributor, forked vaults, and offline revocation lag. Every threat row names a control, the module that owns it and the test that proves it. Where a control only detects an attack (for example a malicious distributor replacing the app), the row says so and states the residual risk. Relay boundaries describe exactly what relays hold, as derived from the module specs, and every relay-side control is relay-local. The model claims no external audit.

## Responsibilities

- Maintain the trust boundary diagram and asset list (keys, vault contents, signed statements, relay data, release artifacts) with data classes from CTR-PRV-001.
- [object Object]
- Review the model at every release (gate in F17.S03.M02) and on every new boundary, and record the review with date, reviewers and changed rows.
- Keep the model synchronized with module specs through a traceability check that every control and test reference exists and that every relay-held entity of class P2 or higher is named in a B3 information-disclosure row.
- Publish a user-readable summary of what the architecture protects and what it does not.

## Not responsible for

- Implementing controls (owning modules) and detecting incidents (F16.S03.M02).
- Runbooks (F16.S03.M03) and privacy-specific threat modelling of data classes (F10.S02.M01).
- Any claim of third-party audit or certification; none exists.
- Future: independent security review with published report; bug bounty programme; formal verification of consent protocol.

## User stories

- As a developer proposing a new feature, I see which trust boundaries it touches and which threat rows to extend before review.
- As a user, I can read in plain language what an attacker controlling a relay, a peer or the website host can and cannot do to me.
- As a release manager, I see a gate result showing the threat model was reviewed for this release and all rows have controls and tests.

## Edge cases

- A new module introduces a boundary not in the register; the traceability check fails with the module ID until a row set is added.
- A control module is renamed or removed; the check reports dangling references and blocks the release gate.
- A threat is accepted as residual risk; the row must state the accepted risk text, owner and review date no later than 6 months ahead.
- Two reviewers disagree on severity; the more severe rating stands until a recorded decision with reasoning is added.
- A vulnerability report arrives for a documented residual risk; the incident process (F16.S03.M02) is used and the threat row is updated with the finding.
- A new module adds a relay-stored entity of class P2 (for example a bid or a push subscription) without naming it in a B3 information-disclosure row; the check fails with SECURITY_THREATMODEL_COVERAGE_GAP naming the entity.
- The user summary says relays never hold plaintext without listing the exceptions; the forbidden-claim lint fails until the sentence names its exceptions or narrows its subject.

## UX and accessibility

- Threat register table: ID, boundary, STRIDE letter, threat, control, owning module, test ID, residual risk.
- Release gate report: counts of rows, rows without control or test (must be zero), date of last review.

**States:** current; review-due; gate-passed; gate-failed

**Accessibility:** Diagrams have text alternatives listing nodes and flows.; Tables use header rows and are readable linearly by screen readers.; The user-facing summary is written at reading level suitable for general users and is translated per F14.

Documentation and tooling module. Outputs are docs/security/threat_model/THREAT_MODEL.md (register and diagram), a user-readable SECURITY_SUMMARY.md, and the CI check report. Documents follow WCAG-friendly structure: headings, tables with headers, diagrams with text alternatives.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

F16.S01.M01, F16.S02.M02, F16.S02.M03, F12.S03.M03, CTR-PRV-001, CTR-CAP-001, CTR-FED-001, CTR-COM-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-133-01 | [Domain schema](domain_schema.md) | 3 |
| PS-133-02 | [Validation rules](validation_rules.md) | 4 |
| PS-133-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-133-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-133-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-133-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-133-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-133-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-133-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-133-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `docs/security/threat_model/index.ts`.

## Acceptance criteria

- All tests T01–T18 pass in CI and the register has zero dangling references.
- Every boundary B1 to B6 has all six STRIDE categories covered or a recorded reason, and X1 and X2 have rows.
- No document claims third-party audit, certification, guaranteed security or a relay that never holds plaintext without its exceptions, and every relay-held P2+ entity is named in a B3 row.
