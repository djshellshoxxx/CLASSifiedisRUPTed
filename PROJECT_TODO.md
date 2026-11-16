# TODO

**Status:** PLANNED — hierarchy established, process specifications pending.

- [x] Define ownership and directory contract.
- [x] Enumerate module process specifications.
- [ ] Expand each process spec to developer-ready acceptance tests.
- [ ] Validate cross-feature contracts and risk controls.
- [ ] Implement (future prompt only).
- [ ] Verify tests, accessibility, privacy and security (future prompt).

## Stage 3 gate (blocks Stage 4)

- [ ] Stage 3 GO/NO-GO report: `planning/SPEC_COMPLETENESS_REPORT.md` (not yet written). Owner: Governance Lead.

### Decisions (DECISIONS.md, all OPEN; D01–D10 block Stage 3 GO)

- [ ] D01 Federated record protocol. Owner not yet assigned (DECISIONS.md has no owner column).
- [ ] D02 Cycle optimizer. Owner not yet assigned.
- [ ] D03 Mixed currency valuation. Owner not yet assigned.
- [ ] D04 Partial barter execution. Owner not yet assigned.
- [ ] D05 Geoprivacy. Owner not yet assigned.
- [ ] D06 Receipts. Owner not yet assigned.
- [ ] D07 Retention. Owner not yet assigned.
- [ ] D08 PWA offline writes. Owner not yet assigned.
- [ ] D09 Rentals and deposits. Owner not yet assigned.
- [ ] D10 Auth and portability. Owner not yet assigned.

### Canonical contracts (planning/contracts/, DRAFT; approve each)

- [ ] CTR-ID-001 Stable IDs and versioning. Owner: Platform Lead (F15).
- [ ] CTR-EVT-001 Event envelope. Owner: Platform Lead (F15).
- [ ] CTR-ERR-001 Typed errors and diagnostics. Owner: Platform Lead (F15).
- [ ] CTR-CAP-001 Capability and permission matrix. Owner: Security Lead (F16) with Identity&Trust Lead (F07).
- [ ] CTR-SCH-001 Schema registry and compatibility. Owner: Platform Lead (F15).
- [ ] CTR-PRV-001 Location, retention and disclosure classes. Owner: Privacy Lead (F10).
- [ ] CTR-COM-001 Payment evidence claims, verification and finality. Owner: Commerce Lead (F09).
- [ ] CTR-FED-001 Federated envelope, provenance and tombstones. Owner: Platform Lead (F11).

### Architecture decision records (ADR_INDEX.md; no ADR files exist)

- [ ] ADR-0001 PWA trust boundaries. Create record; status PROPOSED until approved.
- [ ] ADR-0002 Record ownership and domain event contracts. Create record; PENDING.
- [ ] ADR-0003 Cyclic matching and consent state machine. Create record; PENDING.
- [ ] ADR-0004 Federation and portable identity format. Create record; PENDING.
- [ ] ADR-0005 Noncustodial settlement evidence. Create record; PENDING.
- [ ] ADR-0006 Geoprivacy defaults and disclosure. Create record; PENDING.

### Security audit findings (planning/SECURITY_FINDINGS_TRACKER.md; 51 OPEN)

Gate tags are PROVISIONAL (by severity). Stage4-blocker = all Critical.

- [ ] [Stage4-blocker] S3-01 Account recovery has no implementable security contract. Owner: Identity&Trust Lead.
- [ ] [Stage4-blocker] S3-02 Authorization undefined at resource and operation level. Owner: Security Lead.
- [ ] [Stage4-blocker] S3-03 Cryptographic key lifecycle and compromise recovery unspecified. Owner: Security Lead.
- [ ] [Stage4-blocker] S3-04 Signature verification lacks canonical protocol contract. Owner: Security Lead.
- [ ] [Stage3-GO] S3-05 Private messaging confidentiality and metadata unspecified. Owner: Platform Lead.
- [ ] [Stage3-GO] S3-06 Attachment handling lacks hostile-file boundary. Owner: Platform Lead.
- [ ] [Stage4-blocker] S3-07 Exact-location privacy lacks enforceable data contract. Owner: Privacy Lead.
- [ ] [Stage3-GO] S3-08 Payment evidence and settlement semantics can be confused. Owner: Commerce Lead.
- [ ] [Stage3-GO] S3-09 Federation peer lifecycle and relay delivery controls missing. Owner: Platform Lead.
- [ ] [Stage3-GO] S3-10 Offline client state not treated as hostile environment. Owner: Platform Lead.
- [ ] [Stage3-GO] S3-11 No named owner for critical security contracts. Owner: Governance Lead.
- [ ] [Stage5-release] S3-12 Risk register too coarse to drive verification. Owner: Governance Lead.
- [ ] [Stage4-blocker] S4-01 Deletion, evidence, legal hold, backup, federation lack lifecycle. Owner: Privacy Lead.
- [ ] [Stage4-blocker] S4-02 Consent revocation not bound to queued commands or versions. Owner: Marketplace Lead.
- [ ] [Stage3-GO] S4-03 Pseudonym and profile portability enable linkage attacks. Owner: Identity&Trust Lead.
- [ ] [Stage3-GO] S4-04 Dispute evidence access unbounded by purpose or confidentiality. Owner: Trust&Safety Lead.
- [ ] [Stage3-GO] S4-05 Federation revocation and deletion lack distributed guarantees. Owner: Platform Lead.
- [ ] [Stage5-release] S4-06 Reusable module templates hide missing assurance. Owner: QA Lead.
- [ ] [Stage3-GO] CR-09 Dependency matrix has self-edges and no usable graph. Owner: Platform Lead.
- [ ] [Stage4-blocker] CR-10 Account recovery is unspecified authentication bypass path. Owner: Identity&Trust Lead.
- [ ] [Stage4-blocker] CR-11 Object-level authorization and role boundaries unspecified. Owner: Security Lead.
- [ ] [Stage3-GO] CR-12 Reputation exposed to Sybil, collusion, retaliation. Owner: Identity&Trust Lead.
- [ ] [Stage3-GO] CR-13 Geoprivacy controls are principles, not measurable guarantees. Owner: Privacy Lead.
- [ ] [Stage3-GO] CR-14 Offline command queues risk stale consent and replay. Owner: Platform Lead.
- [ ] [Stage3-GO] CR-15 Messaging and meetup safety unspecified at security boundary. Owner: Trust&Safety Lead.
- [ ] [Stage3-GO] CR-16 Federation event authenticity, replay, revocation underspecified. Owner: Platform Lead.
- [ ] [Stage3-GO] CR-17 Append-only commerce evidence lacks tamper-evidence model. Owner: Commerce Lead.
- [ ] [Stage3-GO] CR-18 Auction race, timing, insider-abuse controls undefined. Owner: Commerce Lead.
- [ ] [Stage3-GO] CR-19 Retention, deletion, export, legal hold too generic. Owner: Privacy Lead.
- [ ] [Stage3-GO] CR-20 Security operations lack operational acceptance criteria. Owner: Security Lead.
- [ ] [Stage5-release] CR-21 Risk register incomplete versus declared attack surface. Owner: Governance Lead.
- [ ] [Stage4-blocker] BT-01 No security monitoring and alerting specification. Owner: Security Lead.
- [ ] [Stage4-blocker] BT-02 Audit logging lacks tamper resistance and access controls. Owner: Security Lead.
- [ ] [Stage4-blocker] BT-03 Incident response and breach management not operationalized. Owner: Security Lead.
- [ ] [Stage3-GO] BT-04 Backup, restore, and DR guarantees undefined. Owner: Platform Lead.
- [ ] [Stage3-GO] BT-05 Security ownership and control accountability unassigned. Owner: Governance Lead.
- [ ] [Stage3-GO] BT-06 Identity lifecycle monitoring and privileged-access review missing. Owner: Identity&Trust Lead.
- [ ] [Stage3-GO] BT-07 Vulnerability and secure-release management unspecified. Owner: Security Lead.
- [ ] [Stage3-GO] BT-08 Privacy-preserving telemetry requirements absent. Owner: Privacy Lead.
- [ ] [Stage3-GO] BT-09 Federation peer health, trust, containment undefined. Owner: Platform Lead.
- [ ] [Stage3-GO] BT-10 Control verification not tied to release gates. Owner: QA Lead.
- [ ] [Stage5-release] BT-11 Risk register lacks detection, response, recovery fields. Owner: Governance Lead.
- [ ] [Stage5-release] BT-12 Availability and abuse-resilience controls not measurable. Owner: Trust&Safety Lead.
- [ ] [Stage4-blocker] TD-01 Process inventory overstates design completeness. Owner: QA Lead.
- [ ] [Stage4-blocker] TD-02 Dependency matrix is not an execution graph. Owner: Platform Lead.
- [ ] [Stage4-blocker] TD-03 Cross-cutting contracts referenced but not authoritative. Owner: Platform Lead.
- [ ] [Stage3-GO] TD-04 Optional-module isolation conflicts with shared dependencies. Owner: Platform Lead.
- [ ] [Stage3-GO] TD-05 ADR governance lacks reliable approval boundary. Owner: Governance Lead.
- [ ] [Stage3-GO] TD-06 Lifecycle and authority semantics inconsistent at boundary. Owner: Platform Lead.
- [ ] [Stage3-GO] TD-07 Implementation GO gate lacks independent sign-off model. Owner: Governance Lead.
- [ ] [Stage5-release] TD-08 Quality controls measure presence, not semantic correctness. Owner: QA Lead.

### Review findings (planning/REVIEW_2026-11-16.md; 15 BUG, 16 MISSING, 4 High)

- [ ] [H] M-01 Sensitive-surface audit (S3) findings not tracked. Now in planning/SECURITY_FINDINGS_TRACKER.md; module TODO gate rows still missing.
- [ ] [H] M-02 Cross-module audit (S4) findings not tracked. Now in planning/SECURITY_FINDINGS_TRACKER.md; module TODO gate rows still missing.
- [ ] [H] M-03 Top-down audit (TD-01 to TD-03) findings not tracked at gate level. Now in planning/SECURITY_FINDINGS_TRACKER.md.
- [ ] [H] M-06 Risk register omits Critical and High risks. R09–R18 added; verify test IDs and detection fields.
- [ ] [M] B-01 Module SPEC inventories name files that do not exist.
- [ ] [M] B-04 Dependency matrix has self-dependencies.
- [ ] [M] B-05 Dependency matrix is one identical string; omits F09 and F12.
- [ ] [M] B-06 Thirteen module slugs reused across features.
- [ ] [M] B-08 Module SPEC purpose and risk text is boilerplate; TODO and checklist identical.
- [ ] [M] B-09 Placeholder text copied into all 1480 process files.
- [ ] [M] B-10 Red-team numbering starts at CR-09; CR-01 to CR-08 absent.
- [ ] [M] B-12 Prompt 2 gate not recorded as passed.
- [ ] [M] M-04 Red-team findings not tracked. See tracker.
- [ ] [M] M-05 Blue-team findings not tracked. See tracker.
- [ ] [M] M-07 Risk owners are feature codes; no test, detection or response fields (R01–R08 still feature codes).
- [ ] [M] M-08 No accountable owner for any module or registry entry.
- [ ] [M] M-09 Decisions D01–D10 not referenced by any spec.
- [ ] [M] M-10 Canonical contracts CTR-* not written, and nothing references them.
- [ ] [M] M-14 PROJECT_TODO had no tracked item for open gates. Addressed by this section; close when gates are tracked.
- [ ] [M] M-16 Valuation responsibilities overlap with no resolved owner (F02.S04 vs F09.S03).
- [ ] [L] B-02 README says process specs still to be written in Prompt 2.
- [ ] [L] B-03 Release-gate labels differ from metaprompt titles.
- [ ] [L] B-07 Non-descriptive module slugs (mod_two, mod_n, etc.).
- [ ] [L] B-11 Top-down audit miscounts identical TODO files (217 vs 216).
- [ ] [L] B-13 Inventory audit says JSON checklist lists owners; it does not.
- [ ] [L] B-14 Stale unchecked prerequisite item in planning/TODO.md.
- [ ] [L] B-15 No root SPEC.md or TODO.md; "PROJECT" parent is not a node.
- [ ] [L] M-11 Glossary misses terms used in root docs and contracts.
- [ ] [L] M-12 Six ADR entries have no records.
- [ ] [L] M-13 Research notes not linked to modules or decisions.
- [ ] [L] M-15 DECISIONS.md has no owner, due gate or resolution column.
