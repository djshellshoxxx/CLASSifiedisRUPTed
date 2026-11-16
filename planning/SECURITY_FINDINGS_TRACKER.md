# Security findings tracker

**Status:** OPEN. Tracks every finding in the five root `SECURITY_*.md` audits dated 2026-11-15. All findings are design or readiness gaps, not confirmed runtime vulnerabilities (per each audit's scope). No finding is closed, verified or approved.

**Total findings: 51** (BT 12, CR 13, S3 12, S4 6, TD 8). Table rows: 51 (verified by command, see Verification).

## Source audits (read-only; do not edit)

| Code | File |
|---|---|
| BT | `SECURITY_BLUE_TEAM_AUDIT_2026-11-15.md` |
| CR | `SECURITY_RED_TEAM_AUDIT_2026-11-15_PASS2.md` |
| S3 | `SECURITY_SENSITIVE_SURFACES_AUDIT_2026-11-15_PASS3.md` |
| S4 | `SECURITY_CROSS_MODULE_SENSITIVE_AUDIT_2026-11-15_PASS4.md` |
| TD | `SECURITY_TOP_DOWN_ARCHITECTURE_AUDIT_2026-11-15.md` |

## Gate rule (PROVISIONAL, unapproved)

ASSUMPTION: gate assignment follows severity. Lead to confirm.

- **Stage4-blocker:** every Critical finding (15). Affected modules do not start implementation until closed.
- **Stage3-GO:** every High finding (30). Required contract or spec text must exist before Stage 3 GO.
- **Stage5-release:** every Medium-High finding (6). Verification evidence required before release.

## Conventions

- **Severity** is taken from each audit. BT, CR, S3, S4 and TD headings or severity lines are the source.
- **Owner role** uses the role list in `planning/metaprompts/` (Identity&Trust, Privacy, Security, Commerce, Marketplace, Platform, Trust&Safety, Accessibility, QA, Governance). Provisional until the owner is confirmed (review M-08, S3-11).
- **Owning module IDs** are full `F-S-M` IDs matched from each audit's file paths and from `INDEX.md`. Feature-level IDs (`F07`) are used where the audit names no single module. Slugs reused across features (review B-06) are listed under the ID the audit path names; canonical-owner resolution is pending.
- **Test ID** is a tracker-level placeholder, `TEST-SEC-<finding ID>`. ASSUMPTION: these map to `TEST-<PS-ID>-nn` once Stage 3 writes the process specs.

## Findings

| ID | Source audit | Severity | Title | Owner role | Owning module ID(s) | Gate | Test ID | Status |
|---|---|---|---|---|---|---|---|---|
| S3-01 | S3 | Critical | Account recovery has no implementable security contract | Identity&Trust Lead | F07.S01.M03, F07.S01.M02 | Stage4-blocker | TEST-SEC-S3-01 | OPEN |
| S3-02 | S3 | Critical | Authorization undefined at resource and operation level | Security Lead | F16.S01.M01, F07.S01.M02 | Stage4-blocker | TEST-SEC-S3-02 | OPEN |
| S3-03 | S3 | Critical | Cryptographic key lifecycle and compromise recovery unspecified | Security Lead | F16.S02.M01, F16.S02.M02 | Stage4-blocker | TEST-SEC-S3-03 | OPEN |
| S3-04 | S3 | Critical | Signature verification lacks canonical protocol contract | Security Lead | F16.S02.M03, F11.S01.M03 | Stage4-blocker | TEST-SEC-S3-04 | OPEN |
| S3-05 | S3 | High | Private messaging confidentiality and metadata unspecified | Platform Lead | F08.S01.M01 | Stage3-GO | TEST-SEC-S3-05 | OPEN |
| S3-06 | S3 | High | Attachment handling lacks hostile-file boundary | Platform Lead | F08.S01.M03 | Stage3-GO | TEST-SEC-S3-06 | OPEN |
| S3-07 | S3 | Critical | Exact-location privacy lacks enforceable data contract | Privacy Lead | F10.S02.M03, F06.S02.M02 | Stage4-blocker | TEST-SEC-S3-07 | OPEN |
| S3-08 | S3 | High | Payment evidence and settlement semantics can be confused | Commerce Lead | F09.S01.M01, F09.S01.M03 | Stage3-GO | TEST-SEC-S3-08 | OPEN |
| S3-09 | S3 | High | Federation peer lifecycle and relay delivery controls missing | Platform Lead | F11.S02.M01, F11.S03.M01 | Stage3-GO | TEST-SEC-S3-09 | OPEN |
| S3-10 | S3 | High | Offline client state not treated as hostile environment | Platform Lead | F15.S01.M01, F15.S01.M02 | Stage3-GO | TEST-SEC-S3-10 | OPEN |
| S3-11 | S3 | High | No named owner for critical security contracts | Governance Lead | F18.S02.M01 | Stage3-GO | TEST-SEC-S3-11 | OPEN |
| S3-12 | S3 | Medium-High | Risk register too coarse to drive verification | Governance Lead | root `RISK_REGISTER.md` | Stage5-release | TEST-SEC-S3-12 | OPEN |
| S4-01 | S4 | Critical | Deletion, evidence, legal hold, backup, federation lack lifecycle | Privacy Lead | F10.S01.M02, F10.S01.M03, F10.S01.M04 | Stage4-blocker | TEST-SEC-S4-01 | OPEN |
| S4-02 | S4 | Critical | Consent revocation not bound to queued commands or versions | Marketplace Lead | F02.S03.M01, F10.S01.M01, F08.S02.M02 | Stage4-blocker | TEST-SEC-S4-02 | OPEN |
| S4-03 | S4 | High | Pseudonym and profile portability enable linkage attacks | Identity&Trust Lead | F07.S01.M01, F07.S02.M01, F07.S03.M01 | Stage3-GO | TEST-SEC-S4-03 | OPEN |
| S4-04 | S4 | High | Dispute evidence access unbounded by purpose or confidentiality | Trust&Safety Lead | F09.S02.M02, F12.S01.M02, F08.S01.M01 | Stage3-GO | TEST-SEC-S4-04 | OPEN |
| S4-05 | S4 | High | Federation revocation and deletion lack distributed guarantees | Platform Lead | F11.S01.M03, F11.S02.M01, F11.S03.M01 | Stage3-GO | TEST-SEC-S4-05 | OPEN |
| S4-06 | S4 | Medium-High | Reusable module templates hide missing assurance | QA Lead | F17.S03.M02 | Stage5-release | TEST-SEC-S4-06 | OPEN |
| CR-09 | CR | High | Dependency matrix has self-edges and no usable graph | Platform Lead | F07, F10, F15, F16 (feature-level; root `DEPENDENCY_MATRIX.md`) | Stage3-GO | TEST-SEC-CR-09 | OPEN |
| CR-10 | CR | Critical | Account recovery is unspecified authentication bypass path | Identity&Trust Lead | F07.S01.M03 | Stage4-blocker | TEST-SEC-CR-10 | OPEN |
| CR-11 | CR | Critical | Object-level authorization and role boundaries unspecified | Security Lead | F16.S01.M01 | Stage4-blocker | TEST-SEC-CR-11 | OPEN |
| CR-12 | CR | High | Reputation exposed to Sybil, collusion, retaliation | Identity&Trust Lead | F07.S03.M01 | Stage3-GO | TEST-SEC-CR-12 | OPEN |
| CR-13 | CR | High | Geoprivacy controls are principles, not measurable guarantees | Privacy Lead | F06.S02.M01, F06.S02.M02, F06.S02.M03 | Stage3-GO | TEST-SEC-CR-13 | OPEN |
| CR-14 | CR | High | Offline command queues risk stale consent and replay | Platform Lead | F15.S01.M01, F02.S03.M01 | Stage3-GO | TEST-SEC-CR-14 | OPEN |
| CR-15 | CR | High | Messaging and meetup safety unspecified at security boundary | Trust&Safety Lead | F08.S03.M01, F08.S03.M03 | Stage3-GO | TEST-SEC-CR-15 | OPEN |
| CR-16 | CR | High | Federation event authenticity, replay, revocation underspecified | Platform Lead | F11.S01.M03, F11.S02.M02, F11.S03.M01 | Stage3-GO | TEST-SEC-CR-16 | OPEN |
| CR-17 | CR | High | Append-only commerce evidence lacks tamper-evidence model | Commerce Lead | F09.S02.M01, F09.S02.M03 | Stage3-GO | TEST-SEC-CR-17 | OPEN |
| CR-18 | CR | High | Auction race, timing, insider-abuse controls undefined | Commerce Lead | F04.S01.M02, F04.S01.M03, F04.S02.M01, F04.S02.M02, F04.S02.M03 | Stage3-GO | TEST-SEC-CR-18 | OPEN |
| CR-19 | CR | High | Retention, deletion, export, legal hold too generic | Privacy Lead | F10.S01.M02, F10.S01.M04 | Stage3-GO | TEST-SEC-CR-19 | OPEN |
| CR-20 | CR | High | Security operations lack operational acceptance criteria | Security Lead | F16.S03.M02, F16.S03.M03, F15.S03.M01 | Stage3-GO | TEST-SEC-CR-20 | OPEN |
| CR-21 | CR | Medium-High | Risk register incomplete versus declared attack surface | Governance Lead | root `RISK_REGISTER.md` | Stage5-release | TEST-SEC-CR-21 | OPEN |
| BT-01 | BT | Critical | No security monitoring and alerting specification | Security Lead | F15.S03.M01, F16.S03.M01 | Stage4-blocker | TEST-SEC-BT-01 | OPEN |
| BT-02 | BT | Critical | Audit logging lacks tamper resistance and access controls | Security Lead | F15.S03.M01 | Stage4-blocker | TEST-SEC-BT-02 | OPEN |
| BT-03 | BT | Critical | Incident response and breach management not operationalized | Security Lead | F16.S03.M02, F16.S03.M03 | Stage4-blocker | TEST-SEC-BT-03 | OPEN |
| BT-04 | BT | High | Backup, restore, and DR guarantees undefined | Platform Lead | F15.S03.M02, F15.S03.M03 | Stage3-GO | TEST-SEC-BT-04 | OPEN |
| BT-05 | BT | High | Security ownership and control accountability unassigned | Governance Lead | F07, F09, F10, F11, F12, F15, F16 (feature-level) | Stage3-GO | TEST-SEC-BT-05 | OPEN |
| BT-06 | BT | High | Identity lifecycle monitoring and privileged-access review missing | Identity&Trust Lead | F07.S01.M02 | Stage3-GO | TEST-SEC-BT-06 | OPEN |
| BT-07 | BT | High | Vulnerability and secure-release management unspecified | Security Lead | F17.S03.M01 | Stage3-GO | TEST-SEC-BT-07 | OPEN |
| BT-08 | BT | High | Privacy-preserving telemetry requirements absent | Privacy Lead | F15.S03.M01, F10.S02.M03 | Stage3-GO | TEST-SEC-BT-08 | OPEN |
| BT-09 | BT | High | Federation peer health, trust, containment undefined | Platform Lead | F11.S02.M01, F11.S03.M01 | Stage3-GO | TEST-SEC-BT-09 | OPEN |
| BT-10 | BT | High | Control verification not tied to release gates | QA Lead | F17.S03.M02 | Stage3-GO | TEST-SEC-BT-10 | OPEN |
| BT-11 | BT | Medium-High | Risk register lacks detection, response, recovery fields | Governance Lead | root `RISK_REGISTER.md` | Stage5-release | TEST-SEC-BT-11 | OPEN |
| BT-12 | BT | Medium-High | Availability and abuse-resilience controls not measurable | Trust&Safety Lead | F12.S03.M03, F12.S03.M04, F15.S02.M01 | Stage5-release | TEST-SEC-BT-12 | OPEN |
| TD-01 | TD | Critical | Process inventory overstates design completeness | QA Lead | F17.S03.M02; root `planning/SPEC_REGISTRY.md` | Stage4-blocker | TEST-SEC-TD-01 | OPEN |
| TD-02 | TD | Critical | Dependency matrix is not an execution graph | Platform Lead | F15 (feature-level; root `DEPENDENCY_MATRIX.md`) | Stage4-blocker | TEST-SEC-TD-02 | OPEN |
| TD-03 | TD | Critical | Cross-cutting contracts referenced but not authoritative | Platform Lead | CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-SCH-001 (F15); CTR-CAP-001 (F16); CTR-PRV-001 (F10); CTR-COM-001 (F09); CTR-FED-001 (F11) | Stage4-blocker | TEST-SEC-TD-03 | OPEN |
| TD-04 | TD | High | Optional-module isolation conflicts with shared dependencies | Platform Lead | F15.S04.M01, F15.S04.M02 | Stage3-GO | TEST-SEC-TD-04 | OPEN |
| TD-05 | TD | High | ADR governance lacks reliable approval boundary | Governance Lead | F18.S02.M01; root `DECISIONS.md`, `ADR_INDEX.md` | Stage3-GO | TEST-SEC-TD-05 | OPEN |
| TD-06 | TD | High | Lifecycle and authority semantics inconsistent at boundary | Platform Lead | F15.S03.M02, F10.S01.M02, F11.S02.M01 | Stage3-GO | TEST-SEC-TD-06 | OPEN |
| TD-07 | TD | High | Implementation GO gate lacks independent sign-off model | Governance Lead | F18.S02.M01, F17.S03.M02 | Stage3-GO | TEST-SEC-TD-07 | OPEN |
| TD-08 | TD | Medium-High | Quality controls measure presence, not semantic correctness | QA Lead | F17.S03.M02 | Stage5-release | TEST-SEC-TD-08 | OPEN |

## Notes

- **CR-01 to CR-08 are absent.** The red-team audit (CR) starts at CR-09. CR-01 to CR-08 do not appear in that file or elsewhere in the repo. No rows are created for them and the existing numbering is kept. Tracked as review finding B-10 in `planning/REVIEW_2026-11-16.md`.

## Verification

Counts by gate (must sum to the total above): Stage4-blocker 15, Stage3-GO 30, Stage5-release 6. Sum 51.
