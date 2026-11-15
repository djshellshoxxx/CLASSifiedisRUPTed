# Top-Down Architecture and Security Audit — 2026-11-15

## 1. Scope and method

This pass reviewed the repository from the project boundary down through the feature hierarchy, shared services, module contracts, process-specification inventory, dependency model, decision records, planning prompts, and release gates.

Reviewed artifacts include:

- `README.md`, `PROJECT_SPEC.md`, `PROJECT_TODO.md`
- `FEATURE_INVENTORY.md`, `INDEX.md`, `HIERARCHY_AUDIT.md`
- `DEPENDENCY_MATRIX.md`, `RISK_REGISTER.md`, `DECISIONS.md`, `ADR_INDEX.md`
- `planning/SPEC_REGISTRY.md` and planning prompts 2–4
- Representative identity, privacy, commerce, federation, security, platform, moderation, quality, and module/process specifications
- Repository-wide Git tree and blob identity statistics

The inspected `main` tree was commit `643b827e9cc93c862c1f7537fd15eb524baf0412`. It contained 2,308 tree entries (2,090 files; 2,088 Markdown, one JSON and one CSV), including 148 modules and 1,480 planned process-contract files. The tree was not truncated.

**Important scope boundary:** the README explicitly describes the repository as a planning/specification inventory, with no application implementation. Findings below are architecture, specification-quality, governance, and implementation-readiness gaps. They are not confirmed exploitable runtime vulnerabilities. No application runtime, API, database, cryptographic implementation, deployed infrastructure, or production data was available to test.

## 2. Executive assessment

**Disposition: NO-GO for implementation of sensitive or transaction-bearing features.**

The project has a useful high-level product boundary and several sound trust principles: the PWA is treated as untrusted, relays/backends are expected to enforce authorization and persistence, external settlement is not represented as platform custody, and exact home addresses are excluded from public payloads by default.

The main architectural weakness is the distance between those principles and enforceable system contracts. The repository has a very large hierarchy and process inventory, but the process files are still structured placeholders. The dependency matrix is a blanket dependency list rather than an executable architecture graph. Most architecture decisions remain open. The release sequence is sensible in outline, but it does not yet establish an independently reviewable approval and evidence chain.

The risk is not simply that individual specifications are incomplete. It is that the project could mistake inventory completeness for architecture completeness, then begin implementation with unresolved ownership, event, authorization, failure, and cross-feature behavior.

## 3. Findings

### TD-01 — Critical readiness gap: the process-specification inventory materially overstates design completeness

**Evidence**

- `planning/SPEC_REGISTRY.md` declares 1,480 planned process contracts across 148 modules, all with DRAFT status.
- The inspected process file `01_LocalBazaar/01_listings/mod_create/domain_schema.md` is explicitly a structured placeholder. Its schema, ownership, interfaces, workflow, security scenarios, tests, and acceptance criteria are checkboxes awaiting Prompt 3.
- The representative recovery, retention, and signature module specifications likewise list seven required process documents as not yet authored in developer-ready form.
- The 1480 process-contract files are inventory entries, not 1480 completed technical designs.
- Blob analysis found 217 TODO files sharing one identical content blob and 148 process checklists sharing one identical content blob. The shared checklist text itself says the files are placeholders and all substantive expansion tasks remain unchecked.

**Impact**

A project dashboard, agent, or reviewer could count files and checkmarks rather than inspect the actual contract content. This creates false confidence in coverage, hides which modules have genuinely been designed, and makes it easy for a later implementation prompt to treat a large document tree as a specification baseline.

**Required remediation**

1. Separate inventory existence from specification completion in the registry and status model.
2. Give every process contract explicit states such as INVENTORIED, DRAFT, TECHNICAL_REVIEW, SECURITY_REVIEW, APPROVED, IMPLEMENTED, and VERIFIED, with transition criteria.
3. Add machine-checkable quality criteria that reject generic boilerplate, unresolved required checkboxes, missing schemas, missing state transitions, missing authorization rules, missing negative tests, and unowned decisions.
4. Do not let a file's existence or a template checkbox satisfy a requirement.
5. Generate completion metrics from content and review evidence, not file counts.

**Acceptance evidence**

A repository-wide quality check reports the number of genuinely approved process contracts, lists every remaining gap, and fails when a placeholder is classified as complete.

### TD-02 — Critical readiness gap: the dependency matrix is not a usable dependency or execution graph

**Evidence**

- `DEPENDENCY_MATRIX.md` repeats the same four shared feature dependencies (F07, F10, F15, F16) across module rows.
- It does not define concrete producer/consumer relationships, event subscribers, interface versions, dependency direction at process level, or ordering constraints.
- The matrix includes shared features among their own dependencies (for example F07 rows list F07; F10 rows list F10; F15 rows list F15; F16 rows list F16).
- The registry itself says consuming modules are provisional cross-cutting dependencies and that specific subscribers remain unresolved.

**Impact**

The matrix cannot reliably drive implementation order, impact analysis, ownership validation, cycle detection, feature-flag safety, or integration-test generation. A blanket reference to shared services is not proof that a module has a compatible contract with those services. Self-dependencies also make naive graph processing unreliable.

**Required remediation**

1. Replace the flat matrix with typed edges: calls, events, shared data ownership, policy dependency, and optional integration.
2. For every edge, record source contract, consumer, version, trust boundary, failure behavior, data classification, and test.
3. Remove self-edges and distinguish a module's own ownership from an external dependency.
4. Add automated checks for missing nodes, unknown IDs, cycles, orphan consumers, unversioned edges, and disabled-feature behavior.
5. Derive implementation sequencing and integration tests from this graph only after it has been reviewed.

**Acceptance evidence**

A generated graph can identify valid build order, explain every dependency edge, detect cycles, and map each edge to a contract and test. Provisional relationships are visibly marked and block GO where they affect sensitive flows.

### TD-03 — Critical readiness gap: canonical cross-cutting contracts are referenced but not established as authoritative artifacts

**Evidence**

- `PROJECT_SPEC.md` requires versioned domain events and APIs, one canonical owner per record, explicit consent, and stable behavior across offline and federated flows.
- Module specifications repeatedly promise versioned commands, queries, events, and error schemas but defer their exact contracts to future process specifications.
- The sample process placeholder says to reference canonical entity IDs, schemas, command/query contracts, permissions, capabilities, events, and typed errors in planning/contracts, but the top-level architecture does not establish a single normative registry and compatibility policy for all of those contracts.
- The registry leaves concrete consumers/subscribers unresolved.

**Impact**

Different modules or implementation agents can independently invent incompatible meanings for the same identity, consent, listing, settlement, moderation, deletion, or federation event. Schema drift can then produce authorization bypasses, stale state, inconsistent deletion, replay acceptance, or silent data loss even if each module passes its own local tests.

**Required remediation**

1. Establish a canonical contract directory/registry for IDs, schemas, event envelopes, commands, queries, error codes, capabilities, permissions, consent proofs, and versioning.
2. Identify one authoritative owner for each contract and each persisted record.
3. Define compatibility rules, migration policy, deprecation windows, unknown-version behavior, and consumer-driven contract tests.
4. Define event authenticity, ordering, deduplication, replay protection, and delivery semantics once, then require all producers and consumers to conform.
5. Ensure privacy and security constraints are encoded in the canonical contracts rather than left to prose in individual modules.

**Acceptance evidence**

Every dependency edge resolves to an authoritative, versioned contract; no module defines a competing schema for another module's owned data; compatibility and negative-consumer tests pass.

### TD-04 — High: optional-module isolation conflicts with mandatory shared-service dependencies

**Evidence**

- `PROJECT_SPEC.md` says feature flags isolate optional modules.
- Feature and module specifications describe modules as independently configurable and disableable.
- The dependency matrix nevertheless assigns identity, privacy, platform, and security as shared dependencies to effectively every module.
- The project does not yet specify the behavior of a dependent feature when one of these shared services is disabled, degraded, unavailable, or undergoing migration.

**Impact**

A feature toggle could unintentionally disable authorization, privacy enforcement, auditability, or durable state for other features. Conversely, allowing dependent features to continue without a required shared service could create fail-open behavior. This is especially dangerous for authentication, location disclosure, messages, settlement evidence, moderation, and federation.

**Required remediation**

1. Classify shared capabilities as mandatory, optional, or conditionally required for each operation.
2. Define dependency health states and explicit fail-closed behavior for security-critical capabilities.
3. Define which user journeys remain available in degraded mode and which state-changing operations must stop.
4. Make feature-flag changes subject to dependency validation and safe rollout/rollback rules.
5. Test disablement, partial outage, stale configuration, and recovery for every critical dependency.

**Acceptance evidence**

A feature-flag/dependency test suite demonstrates that disabling or degrading any shared service cannot silently bypass authorization, privacy, consent, audit, or transaction invariants.

### TD-05 — High: architecture decision governance does not provide a reliable approval boundary

**Evidence**

- `DECISIONS.md` states that all entries are OPEN and recommendations are not approved architecture decisions.
- `ADR_INDEX.md` marks key records proposed or pending.
- The decisions include security-critical choices such as federation protocol, identity portability/recovery, geoprivacy, retention, receipts, offline writes, and settlement behavior.
- Prompt 3 permits concrete defaults with ADR rationale when choices remain, and allows GO when every in-scope process is specified and dependency ambiguities are resolved. It does not require an explicit accountable approver or a recorded approval state for security-critical decisions.

**Impact**

A generated recommendation may be mistaken for an approved policy. Two implementation agents could choose different defaults while both believing they are following Prompt 3. Critical choices may be made implicitly in implementation, where changing them later becomes expensive or unsafe.

**Required remediation**

1. Add decision states: OPEN, PROPOSED, REVIEWED, APPROVED, REJECTED, SUPERSEDED.
2. Record decision owner, approver, rationale, alternatives, consequences, affected contracts, and review date.
3. Require explicit approval for security/privacy/identity/settlement/federation decisions before dependent specifications can become APPROVED.
4. Define which decisions may use documented defaults without approval and why.
5. Make the GO report link every critical requirement to an approved decision or a justified, bounded assumption.

**Acceptance evidence**

No security-critical implementation dependency is based solely on an OPEN or PROPOSED decision. The GO report names the approving authority and references approved ADRs.

### TD-06 — High: lifecycle and authority semantics are not consistently specified at the system boundary

**Evidence**

- The project promises one canonical owner per record, but module contracts use broad phrases such as “this directory owns only its domain records” while assigning credentials, messages, payment evidence, and geolocation to separate features.
- Project-wide flows include account recovery, pseudonym portability, consent revocation, dispute evidence, retention, export/deletion, backup/restore, and federation.
- Earlier sensitive-surface and cross-module passes documented the absence of end-to-end lifecycle contracts across these same boundaries. The top-down review confirms that the root architecture still does not define a single precedence model for authority when these policies conflict.

**Impact**

A module may correctly apply its local policy while another subsystem retains, restores, republishes, or acts on stale data. Examples include a deleted identity reappearing after backup restore, a federated peer accepting a revoked key, or a queued command being processed after consent changes.

**Required remediation**

1. Define system-level precedence for account suspension/deletion, consent revocation, key revocation, retention, legal holds, disputes, backup restoration, export, and federation.
2. Specify authoritative state and consistency requirements for primary stores, caches, queues, search indexes, backups, exports, and remote peers.
3. Define tombstones, revocation epochs, stale-event rejection, restore reconciliation, and audit evidence.
4. Require cross-module lifecycle scenarios as release-blocking tests, not merely local process tests.

**Acceptance evidence**

End-to-end lifecycle tests prove that deleted, revoked, expired, or legally restricted data cannot be silently reactivated by retries, offline queues, backup restore, import, or federation.

### TD-07 — High: the implementation GO gate lacks an independent evidence and sign-off model

**Evidence**

- Prompt 4 correctly requires a Prompt 3 report explicitly marked GO before implementation.
- Prompt 3 calls for a completeness report and GO/NO-GO decision, but the reviewed architecture does not define who independently validates the report, how security review findings are dispositioned, or how evidence is bound to the exact specification commit.
- The project TODO and module templates defer testing and verification to future phases; no implementation exists to demonstrate the proposed gates.

**Impact**

The same process that writes or expands specifications could effectively certify its own work. A GO report could become stale after a specification changes, or omit unresolved risks without an auditable exception. The existence of a gate is not sufficient unless its evidence, authority, and commit scope are controlled.

**Required remediation**

1. Bind each gate report to an exact commit SHA and immutable inventory of in-scope specifications.
2. Require separate architecture, security, privacy, and product-owner reviews for the applicable risk classes.
3. Record finding disposition, residual risk, compensating controls, approver, and expiry/review date for every exception.
4. Invalidate GO automatically when an approved contract, ADR, dependency edge, or critical process specification changes.
5. Keep implementation authorization separate from implementation completion and production release authorization.

**Acceptance evidence**

A reproducible gate can be rerun against a commit, independently reviewed, and shown to fail on a changed or incomplete critical specification.

### TD-08 — Medium-High: the hierarchy's quality controls measure structural presence more strongly than semantic correctness

**Evidence**

- `HIERARCHY_AUDIT.md` reports that all 18 features, 50 subfeatures, 148 modules, SPEC/TODO files, and module IDs exist, while explicitly noting that semantic overlaps remain.
- Prompt 2 emphasizes recursive inventory checks such as no empty folders, no missing SPEC/TODO, and no unowned placeholder.
- Prompt 3 later asks for consistency, aggregation, traceability, and end-to-end flows, but the current structural audit is not itself a semantic architecture validation.
- The high number of identical TODO/checklist blobs shows that structural uniformity is being achieved through templates.

**Impact**

A hierarchy can be complete and internally consistent as a directory tree while still containing duplicated responsibilities, missing system capabilities, contradictory lifecycle rules, or interfaces that cannot be implemented together. Structural completeness can therefore conceal architectural incompleteness.

**Required remediation**

1. Add semantic checks for overlapping ownership, duplicate responsibilities, missing actors, missing trust boundaries, and orphaned user journeys.
2. Require explicit parent-child aggregation and prove that each user journey crosses the correct module contracts.
3. Validate that every system invariant has an owner, enforcement point, failure behavior, and test.
4. Add adversarial review for feature boundaries and shared-service ownership, not just file existence and ID uniqueness.

**Acceptance evidence**

The hierarchy audit includes semantic overlap results, invariant-to-enforcement traceability, user-journey coverage, and unresolved architecture conflicts.

## 4. Positive architecture elements

These are useful foundations and should be preserved:

- The PWA is correctly treated as untrusted; sensitive enforcement belongs in independently operated backend/relay services.
- The project distinguishes external wallet/chain/payment behavior from platform-controlled state and avoids claiming that signatures prove physical delivery.
- Exact home addresses are private by default and excluded from public listing/search/federation payloads.
- Offline writes are pending until server acknowledgement.
- Material barter proposal changes require explicit consent, and N-party cycles are not silently rerouted after dropout.
- The project explicitly recognizes that pseudonyms do not guarantee anonymity and that real-world exchanges cannot be made atomic by software alone.

These principles need to become testable canonical contracts before implementation.

## 5. Top-down remediation order

Do not attempt to fill all 1,480 process files in arbitrary order. Resolve the architecture dependencies that determine their content first.

1. **System invariants and authority model:** define record ownership, identity, authorization, consent, revocation, deletion, retention, legal holds, and precedence.
2. **Canonical contracts:** define IDs, schemas, event envelopes, commands, errors, capabilities, versioning, and compatibility.
3. **Dependency graph:** replace blanket dependencies with typed producer/consumer relationships and failure semantics.
4. **Decision approval:** approve security-critical ADRs and record accountable owners.
5. **Critical vertical slices:** fully specify account/recovery, listing lifecycle, messaging, trade consent/execution, settlement evidence, dispute/moderation, privacy lifecycle, and federation.
6. **Independent specification gate:** validate the above against exact commit SHA with negative tests and cross-module scenarios.
7. **Remaining process inventory:** only then expand lower-risk modules, reusing canonical contracts rather than repeating boilerplate.

## 6. Release decision

**Current decision: NO-GO for sensitive-feature implementation.**

The repository is suitable for continued architecture and specification work. It is not yet a developer-ready or security-reviewed implementation baseline. The next best action is not another broad inventory expansion; it is to resolve the system invariants, canonical contracts, dependency graph, and decision approvals, then use those as binding inputs to the critical vertical slices.

## 7. Limitations

This audit reviewed repository documentation and Git metadata only. It did not execute code, because no application implementation is present in the reviewed repository state. It did not perform dependency scanning, secret scanning, dynamic testing, API testing, infrastructure review, cryptographic verification, or exploitation. Severity labels describe implementation-readiness and architectural risk, not confirmed production vulnerabilities.
