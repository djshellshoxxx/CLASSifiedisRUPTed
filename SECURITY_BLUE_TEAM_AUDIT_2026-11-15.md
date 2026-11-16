# CLASSifiedisRUPTed — Blue-Team Security Audit

**Date:** 2026-11-15  
**Scope:** Default-branch architecture and security documentation  
**Review type:** Defensive security posture, detection, response, resilience, and control-assurance review  
**Status:** Planning-stage design review. Unspecified controls are recorded as documentation gaps, not proof that a deployed system lacks them.

## 1. Executive assessment

The repository describes a planned modular PWA and explicitly states that it contains no application implementation, production deployment, or security certification. This review therefore assesses whether the documented architecture gives a future blue team enough direction to prevent, detect, contain, investigate, and recover from security incidents. It does not claim to have inspected live telemetry, cloud configuration, code, or running services.

The project has several useful defensive foundations:
- The static PWA is treated as untrusted; authorization and durable state belong to independently deployed backends/relays.
- The design recognizes distinct trust boundaries for relays, wallets, chains, payment providers, and physical exchanges.
- Exact home addresses are intended to remain private and out of public listing/search/federation payloads.
- Offline writes remain pending until server acknowledgement.
- Material trade proposal changes require fresh consent.
- Commerce evidence is intended to be append-only and retention-controlled.
- The risk register records home-address leakage, partial N-party completion, false payment evidence, fraud/abuse, relay compromise, federation metadata leakage, regulatory exposure, and stale FX/rounding as open risks.

The central blue-team weakness is not a demonstrated breach. It is the lack of operationally testable defensive controls. F07 Identity, F09 Commerce, F10 Privacy, F11 Federation, F12 Moderation, F15 Platform, and F16 Security are marked PLANNED with unassigned owners. Their generic contracts defer exact interfaces and process behavior. The current risk register is a useful start, but it does not yet define detection signals, response playbooks, control owners, verification evidence, or recovery objectives.

**Disposition: NOT READY for operational security approval.** Complete the defensive control design and assign accountable owners before implementation. After implementation, validate controls against deployed infrastructure and real event flows.

## 2. Blue-team findings

### BT-01 — No documented security monitoring and alerting specification
**Severity:** Critical readiness gap  
**Confidence:** High (documentation evidence)

**Evidence:** F15 Platform and F16 Security are PLANNED. Their inspected specifications defer exact contracts. The risk register identifies relay compromise and fraud/abuse but does not define alert conditions, severity thresholds, on-call ownership, or escalation.

**Defensive impact:** Operators may not recognize account takeover, mass scraping, relay compromise, suspicious moderator activity, repeated transaction replay, or unusual federation behavior in time to contain it.

**Required controls:**
- Define security-relevant event taxonomy and event severity.
- Alert on unusual login/recovery patterns, privilege changes, session revocations, failed authorization spikes, high-rate object enumeration, repeated idempotency/replay failures, abnormal federation peer behavior, bulk exports, and moderation privilege use.
- Establish service-specific thresholds and baselines; avoid alerting on raw volume alone.
- Define alert routing, on-call coverage, acknowledgement deadlines, escalation, and closure criteria.
- Test alerts with synthetic events before production launch.

**Acceptance evidence:** Versioned event catalog, alert rules, sample alerts, ownership roster, and successful alert simulation results.

### BT-02 — Audit logging requirements do not define tamper resistance, completeness, or access controls
**Severity:** Critical readiness gap  
**Confidence:** High

**Evidence:** Project principles mention append-only commerce evidence and observability as a downstream integration, but the inspected specifications do not define a platform-wide security audit-log contract or privileged access model.

**Defensive impact:** Incident responders may be unable to establish what happened, who acted, which object version changed, or whether records were modified or selectively omitted.

**Required controls:**
- Define mandatory audit events for authentication, recovery, authorization decisions, role changes, key lifecycle, configuration changes, moderation actions, exports, deletion, federation trust changes, and transaction state transitions.
- Include actor/service identity, action, target, result, timestamp source, correlation/trace ID, and relevant object version. Avoid logging secrets, tokens, message bodies, or exact location unless specifically justified.
- Restrict log access separately from application administration.
- Protect log integrity with append-only or tamper-evident storage and independent backup.
- Define retention, time synchronization, redaction, legal hold, and access review.
- Alert on logging pipeline interruption, unexpected drops, and privileged log access.

**Acceptance evidence:** Event schema, access matrix, integrity verification, retention policy, and tests proving critical events cannot be silently suppressed by ordinary application roles.

### BT-03 — Incident response and breach management are not operationalized
**Severity:** Critical readiness gap  
**Confidence:** High

**Evidence:** F16 includes incident and response modules, but F16 and its assurance subfeature remain PLANNED; no operational playbook or response ownership was found in the reviewed material.

**Defensive impact:** A compromised relay, leaked signing key, exposed location dataset, or account takeover campaign could trigger improvised response, delayed containment, inconsistent user communication, and loss of forensic evidence.

**Required controls:**
- Define incident severity levels and who may declare an incident.
- Create playbooks for account takeover, signing-key compromise, relay compromise, privacy breach, abusive automation, malicious federation peer, data corruption, and ransomware/destructive operator activity.
- Specify containment actions, evidence preservation, decision authority, communications, legal/privacy review, recovery, and post-incident review.
- Provide emergency controls to disable federation peers, revoke keys, suspend affected accounts, pause transaction execution, disable vulnerable modules, and rate-limit abusive traffic.
- Exercise playbooks using tabletop and technical simulations.

**Acceptance evidence:** Named incident commander/on-call roles, approved playbooks, exercise reports, and measured response/recovery actions.

### BT-04 — Backup, restoration, and disaster-recovery guarantees are not defined
**Severity:** High  
**Confidence:** High

**Evidence:** The project mentions durable persistence and backups as a mitigation for relay compromise, but no recovery point objective (RPO), recovery time objective (RTO), backup isolation, restore validation, or restore-time privacy/deletion behavior appears in the reviewed specifications.

**Defensive impact:** An attacker who deletes or encrypts data, corrupts event history, or compromises production credentials may also compromise backups. Restoring stale data can resurrect deleted accounts, revoked keys, blocked users, or invalid transaction states.

**Required controls:**
- Define RPO/RTO by data class and service.
- Encrypt backups with separately controlled keys and restrict restore privileges.
- Maintain immutable/offline or logically isolated backup copies.
- Test restoration on a schedule and verify data integrity and application consistency.
- Reapply account deletion, key revocation, moderation, and legal-hold state after restoration.
- Define recovery ordering for identity, authorization, transaction records, evidence, and federation state.
- Document disaster communications and failover decision authority.

**Acceptance evidence:** Backup inventory, restore runbooks, successful restore-drill records, integrity checks, and measured RPO/RTO.

### BT-05 — Security ownership and control accountability are unassigned
**Severity:** High  
**Confidence:** High

**Evidence:** The inspected F07, F09, F10, F11, F12, F15, and F16 specifications explicitly show Owner: Unassigned.

**Defensive impact:** Findings can remain open indefinitely; alert queues, vulnerability reports, key rotation, privacy requests, and incident actions may have no accountable resolver.

**Required controls:**
- Assign a named role/team to each security control and risk.
- Define a RACI matrix for product owner, service owner, security lead, privacy lead, moderator lead, incident commander, and release approver.
- Every open risk must have an owner, due date, treatment decision, and evidence link.
- Require explicit risk acceptance by an authorized owner for any release-blocking exception.
- Review ownership and overdue controls on a fixed cadence.

**Acceptance evidence:** Maintained ownership register and signed risk acceptance records.

### BT-06 — Identity lifecycle monitoring and privileged-access review are missing
**Severity:** High  
**Confidence:** High

**Evidence:** F07 includes accounts, sessions, recovery, profiles, and reputation, but its specifications are PLANNED and do not define lifecycle events, session inventory, access reviews, or privileged-action monitoring.

**Defensive impact:** Dormant sessions, stale service credentials, compromised accounts, and excessive operator permissions may persist unnoticed.

**Required controls:**
- Maintain server-side session/device inventory with revocation and expiry.
- Notify users of sensitive events such as recovery, new device/session, credential/key changes, and privilege changes.
- Require step-up authentication for sensitive actions where supported by the chosen identity model.
- Review operator, moderator, relay, and service-account access periodically.
- Alert on unusual geography/device changes only with privacy-preserving safeguards and documented retention.
- Revoke access promptly when roles, employment, devices, or peer trust are removed.

**Acceptance evidence:** Session lifecycle tests, privileged-access review records, and simulated account takeover alerts.

### BT-07 — Vulnerability and secure-release management are not specified
**Severity:** High  
**Confidence:** High

**Evidence:** README says no implementation is present. The reviewed architecture does not define a release pipeline, dependency update policy, vulnerability intake, security review gates, or artifact provenance.

**Defensive impact:** Once implementation begins, vulnerable dependencies, exposed secrets, unreviewed changes, or compromised build artifacts could reach deployment without reliable detection.

**Required controls:**
- Establish protected branches, mandatory review, least-privilege CI identities, and short-lived deployment credentials.
- Add dependency/SCA scanning, secret scanning, static analysis, infrastructure-as-code scanning, and container/image scanning where applicable.
- Generate and retain software bills of materials (SBOMs) and build provenance.
- Pin and verify build inputs; protect release signing keys.
- Define vulnerability severity, remediation SLAs, exception expiry, and coordinated disclosure intake.
- Require security tests and risk-owner approval for release-blocking findings.
- Separate build, staging, and production permissions.

**Acceptance evidence:** CI policy, sample scan reports, SBOM, provenance verification, and documented vulnerability handling process.

### BT-08 — Privacy-preserving telemetry requirements are absent
**Severity:** High  
**Confidence:** High

**Evidence:** Project principles prohibit exact home addresses in public payloads and acknowledge metadata risks. F10 is PLANNED; no telemetry schema or redaction policy was found in inspected specifications.

**Defensive impact:** Defensive monitoring itself could create a sensitive dataset containing IP addresses, location, pseudonym linkage, message metadata, or behavioral patterns. Broad access or long retention could undermine the privacy model.

**Required controls:**
- Define which security signals are necessary and collect the minimum fields.
- Prohibit credentials, access tokens, private message bodies, exact home coordinates, and payment secrets in routine logs.
- Pseudonymize identifiers where incident correlation permits.
- Restrict raw telemetry access and record access to it.
- Set retention periods by signal class and support deletion/legal-hold rules.
- Document the privacy/security trade-off for IP/device fingerprinting and anomaly detection.
- Test redaction in application logs, reverse-proxy logs, analytics, crash reports, and support exports.

**Acceptance evidence:** Approved telemetry data dictionary, redaction tests, access matrix, and retention configuration.

### BT-09 — Federation peer health, trust state, and containment operations are not defined
**Severity:** High  
**Confidence:** High

**Evidence:** F11 includes protocol, relay synchronization, and interoperability but is PLANNED. The project states federation requires signatures, provenance, revocation, and abuse handling, without specifying operator workflows.

**Defensive impact:** A malicious, compromised, or malfunctioning peer may continue sending events, leaking metadata, or propagating abusive content because operators lack clear health signals and containment actions.

**Required controls:**
- Maintain an inventory of peers, trust status, supported protocol versions, keys, and last successful sync.
- Monitor signature failures, replay rates, schema violations, queue growth, latency, and abnormal event volume.
- Provide quarantine/suspend controls that stop new inbound/outbound sync without corrupting local records.
- Define peer key rotation, compromise revocation, re-admission, and evidence preservation.
- Rate-limit and resource-bound all inbound peer traffic.
- Test malicious peer quarantine and safe resynchronization.

**Acceptance evidence:** Peer inventory, health dashboard/alerts, quarantine runbook, and federation abuse simulation.

### BT-10 — Security control verification is not tied to measurable release gates
**Severity:** High  
**Confidence:** High

**Evidence:** PROJECT_SPEC defines staged planning gates, and feature specs require later tests, but the reviewed material does not define measurable security-control coverage or required pass/fail evidence for release.

**Defensive impact:** A feature may be considered complete because its happy-path behavior works even though access control, abuse resistance, logging, recovery, or privacy controls are untested.

**Required controls:**
- Create a security control matrix mapping each threat/risk to preventive, detective, responsive, and recovery controls.
- Link each control to a test, owner, evidence artifact, and release gate.
- Require negative tests for authorization, replay, concurrency, privacy leakage, rate limits, privileged access, and deletion.
- Track control coverage and exceptions; do not equate a module existing with a control being implemented.
- Require independent review of critical controls before production launch.

**Acceptance evidence:** Traceable control matrix, CI results, test reports, exception register, and security sign-off.

### BT-11 — Risk register lacks detection, response, and recovery fields
**Severity:** Medium-High  
**Confidence:** High

**Evidence:** RISK_REGISTER.md contains eight open risks with owner, mitigation, and status columns, but no detection signal, response action, recovery procedure, verification test, or residual-risk field. Owners are feature IDs rather than accountable people/roles.

**Defensive impact:** The register describes what might go wrong but does not tell operators how they will know, what to do, or how to prove recovery.

**Required controls:**
Expand each risk record to include:
- Asset and threat actor
- Preventive controls
- Detection signals and alert rule
- Containment/response playbook
- Recovery and validation steps
- Accountable owner and review date
- Verification test/evidence
- Inherent and residual risk
- Status and approved exception

**Acceptance evidence:** Updated risk register reviewed by engineering, security, privacy, and operations owners.

### BT-12 — Service availability and abuse-resilience controls are not measurable
**Severity:** Medium-High  
**Confidence:** High

**Evidence:** Project rules mention bounded cycle search, rate limits as a backend responsibility, and relays/backends as enforcement points. The inspected specifications do not provide capacity limits, quotas, service-level objectives, or tested degradation behavior.

**Defensive impact:** Scraping, spam, expensive cycle searches, malformed federation payloads, or traffic spikes may exhaust resources and degrade all users. Overly broad emergency blocking may also deny legitimate users.

**Required controls:**
- Define per-endpoint and per-principal quotas, payload size limits, concurrency caps, and computational budgets.
- Use bounded pagination and search complexity; impose timeouts and cancellation.
- Apply backpressure, queue limits, circuit breakers, and graceful degradation.
- Monitor saturation, queue depth, error rates, latency, and abuse patterns.
- Define emergency rate-limit tuning and appeal/escalation paths for false positives.
- Load-test normal and adversarial workloads.

**Acceptance evidence:** Capacity model, quota policy, load-test results, and tested degradation runbooks.

## 3. Defensive control coverage snapshot

| Control area | Documentation status | Blue-team disposition |
|---|---|---|
| Client/backend trust boundary | Explicit at project level | Preserve and test |
| Server-side authorization | Intended, exact policy deferred | Blocking design gap |
| Authentication/recovery | Feature identified, protocol deferred | Blocking design gap |
| Key lifecycle/signatures | Feature identified, details deferred | Blocking design gap |
| Security logging/monitoring | Observability referenced, controls unspecified | Blocking readiness gap |
| Incident response | Modules identified, playbooks not specified | Blocking readiness gap |
| Backup and disaster recovery | Mentioned generally, objectives/tests unspecified | High-priority gap |
| Privacy and telemetry minimization | Principles present, operational schema absent | High-priority gap |
| Federation peer defense | Trust requirements stated, operations unspecified | High-priority gap |
| Secure build/release | Not established in planning docs reviewed | High-priority gap |
| Abuse and availability controls | Rate limiting/bounded work mentioned, thresholds absent | High-priority gap |
| Security verification | Future tests referenced, release evidence undefined | Blocking readiness gap |

“Not specified” does not mean a control is absent from an unreviewed implementation; the README says no implementation is currently claimed.

## 4. Recommended blue-team operating model

Before launch, establish these minimum operational functions:

1. **Asset and service inventory:** identify every backend, relay, database, queue, object store, signing key, third-party integration, and data category.
2. **Identity and access management:** document human and service identities, privileges, authentication strength, session lifecycle, and periodic access review.
3. **Central security telemetry:** collect privacy-minimized authentication, authorization, configuration, key, federation, moderation, and transaction events.
4. **Detection engineering:** maintain alert rules for account takeover, privilege escalation, data scraping, replay, peer compromise, unusual exports, and service abuse.
5. **Incident response:** assign on-call roles and rehearse containment, evidence preservation, communications, and recovery.
6. **Resilience:** isolate backups, test restores, set RPO/RTO, and validate consistency after recovery.
7. **Secure delivery:** protect source, CI, dependencies, secrets, build artifacts, and deployment credentials.
8. **Control assurance:** map each material risk to a control, test, owner, and release gate.

## 5. Prioritized action plan

### Before implementation
- Assign owners for F07, F09, F10, F11, F12, F15, and F16.
- Define the security event and audit-log schemas.
- Write account recovery, session revocation, and privileged access specifications.
- Define the incident severity model and initial playbooks.
- Define backup, restore, retention, and deletion-replay requirements.
- Add detection, response, recovery, and verification fields to the risk register.
- Fix dependency matrix self-dependencies and establish clear ownership/flow for shared services.

### Before first production deployment
- Implement central privacy-minimized logging and alerting.
- Demonstrate account takeover, relay compromise, federation peer quarantine, and data breach exercises.
- Complete restore drills and validate RPO/RTO.
- Enforce least privilege for users, operators, CI, relays, and service accounts.
- Establish vulnerability intake, dependency/secret scanning, SBOMs, and release provenance.
- Pass negative security tests and independent review for critical controls.

### After launch
- Review alerts and false positives regularly.
- Rehearse incident and restore procedures at defined intervals.
- Reassess threat models after major feature or federation changes.
- Review privileged access, secrets, peer trust, and unresolved risks periodically.
- Publish a security contact and coordinated vulnerability disclosure process.

## 6. Scope and limitations

- Reviewed the default-branch README, project specification, risk register, dependency matrix, prior red-team audit note, and selected identity, commerce, privacy, federation, moderation, platform, security, and LocalMutiny specifications.
- No running service, cloud account, CI configuration, production logs, network endpoint, or deployed relay was available in the reviewed material.
- No live monitoring, configuration inspection, vulnerability scan, exploit attempt, restore test, or incident exercise was performed.
- Findings are documentation/readiness gaps and defensive recommendations, not confirmed runtime vulnerabilities.
- The README explicitly says the repository currently contains planning/specification inventories and no application implementation or production deployment.

## 7. Final blue-team verdict

The project has a reasonable set of defensive architectural principles, but it does not yet define an operational security program. The most urgent missing pieces are accountable ownership, security event logging, alerting, incident response, recovery testing, and measurable release gates.

Do not treat the existence of F15/F16 modules or a mitigation sentence in the risk register as proof that a control is operating. A control is ready only when it has an owner, an implementation, a test, observable evidence, and a response path when it fails.

**Final status: BLUE-TEAM READINESS — NOT READY; design work required before implementation sign-off.**
