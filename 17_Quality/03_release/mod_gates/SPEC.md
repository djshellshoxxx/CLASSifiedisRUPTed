# F17.S03.M02 — Release gates

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F17.S03](../SPEC.md). **Process IDs:** PS-143-01…PS-143-10. **Code:** `tools/gates`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Release checklist automation (tools/gates). Before a release tag, one command evaluates the gates and prints a verdict with evidence: requirement-to-test traceability at 100 percent (tools/trace reads TEST-PS-NNN-PP.Tnn titles), no critical or high production vulnerabilities (pnpm audit --prod), accessibility with zero serious violations, performance budgets from the load and PWA budget reports, spec completeness (specgen check --strict --report GO), compatibility from reports/compat.json, the bundled governance seed packs (taxonomy core-1, the bundled rule pack and the generic jurisdiction profile) signed by the release-pinned project publisher key with a code-owner approved release review of their exact content identifiers, and a changelog entry for the version. Manual test rows count only through signed checklists, and a test-to-requirement mapping counts only when the test text shares a key term with the requirement or a code-owner approved mapping review is recorded for it. Any failed gate blocks the release; all evidence must come from the release commit, which the F17.S03.M01 release workflow regenerates before the gates run.

## Responsibilities

- Implement pnpm gates:release which runs the gates spec, traceability, audit, a11y, budgets, compat, governance and changelog, each producing a machine-readable result in reports/gates.json.
- Traceability gate: tools/trace maps each requirement ID PS-NNN-PP.Rnn from module.spec.yaml to test titles in code and to passing results in the JUnit reports of the release commit; rows with level manual count through a signed checklist under gates/manual/<version>/ instead of JUnit; an active tests/quarantine.yaml entry (F17.S01.M01) counts as a waiver; any requirement without a passing test (and without a documented untested reason) fails the gate.
- Audit gate: run pnpm audit --prod --audit-level=high and fail on any critical or high finding; moderate and low findings are listed but do not fail.
- Budget gate: read reports/load.json (OBS-4 relay budgets, F17.S02.M01), reports/pwa-budgets.json (classrup-pwa-budget-report/v1 with commitSha, profile, lcpMs, inpMs, cls, initialJsGzipBytes from F17.S01.M04: LCP 2.5 s, INP 200 ms, CLS 0.1, initial JS 150 KiB gzip; OBS-5) and the axe report with zero serious or critical issues.
- Changelog gate: CHANGELOG.md contains a section for the version being released with at least one entry and a link to the release notes.
- Spec gate: run node tools/specgen/specgen.mjs check --strict --report for the release commit and pass only with 0 errors and GO in SPEC_COMPLETENESS_REPORT.md.
- Compat gate: read reports/compat.json (F17.S03.M03) for the release commit and pass only when it shows no QUALITY_COMPAT_* failure and every browser cell passes or is policy-unsupported, including the manual real-Safari and iOS checklist cells; a missing report fails closed.
- Mapping relevance check (finding 47): tools/trace accepts a covers entry of a test row only when the test text (scenario and expected cells plus the code test title after its ID) shares at least one key term with the requirement text, or when gates/mapping-reviews.yaml holds a code-owner approved review of that exact mapping whose text hash still matches; any other mapping is rejected with QUALITY_GATE_TRACE_MAPPING and does not count as coverage.
- Governance bundle gate (F18 request): F18.S01.M03, F18.S01.M02 and F18.S01.M01 apply the bundled seed packs without policy decisions (provenance bundled), so the release must prove them; the gate reads gates/governance-bundles.yaml and, for each of the three required packs (classrup.governance.taxonomy_pack/v1 core-1, classrup.governance.rule_pack/v1 and classrup.governance.jurisdiction_profile/v1 with code generic), loads the envelope file from the release commit, recomputes its cid and verifies its Ed25519 signature over JCS bytes (CTR-FED-001 FED-2 and FED-7), checks that author and payload.publisherId equal the release-pinned projectPublisherDid and that the cid equals the reviewed packCid recorded for this release version; any failure is QUALITY_GATE_GOVERNANCE_BUNDLE.

## Not responsible for

- Running the tests and generating reports (F17.S01, F17.S02); this module only reads their outputs.
- Deployment of relays or hosting of the PWA.
- Legal and policy review of governance content (F18); this module only checks that each bundled seed pack is signed by the release-pinned project publisher key and that a code-owner approved release review of its exact cid is recorded.
- Changes to the spec validator tools/specgen, which keeps checking only the covers syntax and existence; the semantic mapping check runs in tools/trace inside this release gate.
- Future: SBOM generation and signed release provenance.

## User stories

- As a release manager, I run one command and see which gate blocks the release and why.
- As a developer, I add a test titled TEST-PS-142-09.T05 and the traceability report immediately shows the requirement covered.
- As a security reviewer, I get the audit findings with severity and affected package in the report.
- As a governance reviewer, I approve the bundled seed packs of a release once by their cid, and the gate blocks any pack bytes or signer key that differ from what I reviewed.

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
- A test row lists 03.R02 in covers but its scenario and expected text share no key term with that requirement; the mapping is rejected with QUALITY_GATE_TRACE_MAPPING unless a matching approved mapping review exists.
- A requirement text is rewritten after its mapping review was recorded; the stored text hash no longer matches, the review is stale and the mapping fails with QUALITY_GATE_TRACE_MAPPING until it is reviewed again.
- The bundled rule pack is edited after its release review was recorded; its recomputed cid no longer equals the reviewed packCid and the governance gate fails with QUALITY_GATE_GOVERNANCE_BUNDLE until it is reviewed again.
- The generic jurisdiction profile is signed by a developer key instead of the release-pinned project publisher key; the author check fails with QUALITY_GATE_GOVERNANCE_BUNDLE even though the signature itself is valid.
- gates/governance-bundles.yaml is missing, has no review entry for the release version, or lists only two of the three required packs; the governance gate fails closed with QUALITY_GATE_GOVERNANCE_BUNDLE (exit 2).
- A commit changes projectPublisherDid in gates/governance-bundles.yaml without code-owner approval; the gate fails with QUALITY_GATE_WAIVER_UNAPPROVED and prints the committer.

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

CTR-TST-001, CTR-OBS-001, CTR-SCH-001, F17.S01.M01, F17.S01.M04, F17.S02.M01, F17.S03.M03, CTR-FED-001, F18.S01.M01, F18.S01.M02, F18.S01.M03

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-143-01 | [Domain schema](domain_schema.md) | 3 |
| PS-143-02 | [Validation rules](validation_rules.md) | 7 |
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
- A test-to-requirement mapping without a shared key term and without a valid approved mapping review does not count as coverage and blocks the release.
- A bundled governance seed pack that is not signed by the release-pinned project publisher key, or whose cid differs from the code-owner approved release review, blocks the release.
