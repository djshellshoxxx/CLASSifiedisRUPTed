# F17.S03.M02 — Release gates

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F17.S03](../SPEC.md). **Process IDs:** PS-143-01…PS-143-10. **Code:** `tools/gates`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Release checklist automation (tools/gates). Before a release tag, one command evaluates the gates and prints a verdict with evidence: requirement-to-test traceability at 100 percent (tools/trace reads TEST-PS-NNN-PP.Tnn titles), no critical or high production vulnerabilities (pnpm audit --prod), accessibility with zero serious violations, performance budgets from the load and PWA budget reports, spec completeness (specgen check --strict --report GO), compatibility from reports/compat.json, and a changelog entry for the version. Manual test rows count only through signed checklists. Any failed gate blocks the release; all evidence must come from the release commit, which the F17.S03.M01 release workflow regenerates before the gates run.

## Responsibilities

- Implement pnpm gates:release which runs the gates spec, traceability, audit, a11y, budgets, compat and changelog, each producing a machine-readable result in reports/gates.json.
- Traceability gate: tools/trace maps each requirement ID PS-NNN-PP.Rnn from module.spec.yaml to test titles in code and to passing results in the JUnit reports of the release commit; rows with level manual count through a signed checklist under gates/manual/<version>/ instead of JUnit; an active tests/quarantine.yaml entry (F17.S01.M01) counts as a waiver; any requirement without a passing test (and without a documented untested reason) fails the gate.
- Audit gate: run pnpm audit --prod --audit-level=high and fail on any critical or high finding; moderate and low findings are listed but do not fail.
- Budget gate: read reports/load.json (OBS-4 relay budgets, F17.S02.M01), reports/pwa-budgets.json (classrup-pwa-budget-report/v1 with commitSha, profile, lcpMs, inpMs, cls, initialJsGzipBytes from F17.S01.M04: LCP 2.5 s, INP 200 ms, CLS 0.1, initial JS 150 KiB gzip; OBS-5) and the axe report with zero serious or critical issues.
- Changelog gate: CHANGELOG.md contains a section for the version being released with at least one entry and a link to the release notes.
- Spec gate: run node tools/specgen/specgen.mjs check --strict --report for the release commit and pass only with 0 errors and GO in SPEC_COMPLETENESS_REPORT.md.
- Compat gate: read reports/compat.json (F17.S03.M03) for the release commit and pass only when it shows no QUALITY_COMPAT_* failure and every browser cell passes or is policy-unsupported, including the manual real-Safari and iOS checklist cells; a missing report fails closed.

## Not responsible for

- Running the tests and generating reports (F17.S01, F17.S02); this module only reads their outputs.
- Deployment of relays or hosting of the PWA.
- Legal and policy review gates (F18).
- Future: SBOM generation and signed release provenance.

## User stories

- As a release manager, I run one command and see which gate blocks the release and why.
- As a developer, I add a test titled TEST-PS-142-09.T05 and the traceability report immediately shows the requirement covered.
- As a security reviewer, I get the audit findings with severity and affected package in the report.

## Edge cases

- A requirement is listed untested with a reason in the spec; the trace gate accepts it and lists it in the report as waived.
- A test title has a typo in the ID; the trace gate reports an unknown test ID and does not count it.
- pnpm audit cannot reach the registry; the gate fails closed with QUALITY_GATE_AUDIT_UNAVAILABLE instead of passing.
- A test is present but skipped or failing in the JUnit report; it does not count as passing.
- A vulnerability is in a dev-only dependency; --prod excludes it and the report notes the scope.
- Two modules reuse the same TEST ID; the trace gate fails with QUALITY_GATE_TRACE_DUPLICATE.
- A test row with level manual has no signed checklist entry for this version and commit; it does not count and the gate fails with QUALITY_GATE_MANUAL_MISSING.
- reports/compat.json is missing or from another commit; the compat gate fails closed with QUALITY_GATE_COMPAT.
- The spec report says NO-GO or the strict check prints one error; the spec gate fails with QUALITY_GATE_SPEC.
- A waiver or checklist file was committed without code-owner approval; the gate fails with QUALITY_GATE_WAIVER_UNAPPROVED and prints the committer.
- A test listed in tests/quarantine.yaml has an active entry; the trace gate lists it as waived; once the entry is expired it fails as an expired waiver.

## UX and accessibility



Headless CLI. Output is a table of gates with PASS or FAIL, evidence links and exit code; reports/gates.json and reports/gates.md are produced for the release notes.

## Owned data

_No persisted entities (library/view module)._

## Interfaces

- Commands: none
- Queries: none
- Emits: none
- Consumes: none

## Dependencies

CTR-TST-001, CTR-OBS-001, CTR-SCH-001, F17.S01.M01, F17.S01.M04, F17.S02.M01, F17.S03.M03

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-143-01 | [Domain schema](domain_schema.md) | 3 |
| PS-143-02 | [Validation rules](validation_rules.md) | 5 |
| PS-143-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-143-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-143-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-143-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-143-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-143-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-143-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-143-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `tools/gates/index.ts`.

## Acceptance criteria

- The release gate fails when any requirement lacks a passing test and passes at 100 percent traceability.
- A critical or high production vulnerability or an unavailable audit blocks the release.
- Any serious accessibility violation or exceeded budget blocks the release.
- The gate report is attached to every release and waivers expire within 14 days.
- A spec NO-GO, a compatibility failure, a missing compat report or a missing manual checklist blocks the release.
