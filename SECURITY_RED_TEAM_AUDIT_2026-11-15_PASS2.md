# CLASSifiedisRUPTed — Red-Team Architecture Audit (Pass 2)

**Date:** 2026-11-15  
**Scope:** Default-branch planning/specification repository  
**Review type:** Read-only adversarial architecture and security-design review  
**Status:** Findings are design gaps and attack scenarios, not confirmed runtime vulnerabilities.

## 1. Executive summary

This second pass reviewed the current project specification, feature inventory, dependency matrix, risk register, hierarchy audit, and representative specifications for identity, commerce, LocalMutiny cycle execution, communications, federation, moderation, platform operations, privacy boundaries, and security architecture.

The repository explicitly states that it is a planning/specification hierarchy. It does not claim an application implementation or production security certification. Accordingly, there is no running application here to penetration-test, and this review does not claim to have exploited a live endpoint.

The high-level trust-boundary decisions in `PROJECT_SPEC.md` are directionally sound: the static PWA is not trusted to enforce authorization; relays/backends are responsible for enforcement; external payment/wallet/blockchain systems remain outside platform control; signatures do not prove delivery; exact home addresses are excluded from public payloads; and offline writes remain pending until server acknowledgement.

The weakness is that these principles are not yet translated into enforceable, testable process contracts. Most inspected feature and subfeature specifications remain boilerplate PLANNED templates. Owners are unassigned, exact interfaces are deferred, and acceptance tests are pending.

**Overall assessment: NOT READY for implementation sign-off or production security approval.** The project is at architecture-planning stage. The findings below should become explicit requirements and acceptance tests before implementation.

## 2. Findings

### CR-09 — Shared dependency matrix contains self-dependencies and does not model a usable dependency graph
**Severity:** High (architecture integrity)  
**Confidence:** High  
**Evidence:** `DEPENDENCY_MATRIX.md` assigns F07, F10, F15, and F16 as dependencies to every listed module. The rows for F07, F10, F15, and F16 also list their own feature ID among their dependencies. The same blanket dependency set is repeated rather than expressing actual module-level relationships.

**Attack / failure consequence:**
- A build or deployment planner may interpret shared services as cyclic prerequisites.
- Teams may implement reciprocal interfaces without a stable dependency direction.
- Security controls can become circular: authorization depends on security, security depends on identity, and both are treated as generic upstream dependencies.
- Tests may mock away the very control whose integration needs verification.

**Required remediation:**
1. Define a directed acyclic dependency graph for build-time and runtime dependencies separately.
2. Remove self-dependencies.
3. Distinguish mandatory runtime dependencies, optional integrations, shared contracts, and governance references.
4. Give each shared service one canonical owner and publish versioned contracts.
5. Add automated validation rejecting self-edges, unresolved IDs, and cycles unless a cycle is explicitly documented as an event-driven relationship.

### CR-10 — Account recovery is a high-risk authentication bypass path with no specified security protocol
**Severity:** Critical design gap  
**Confidence:** High  
**Evidence:** `INDEX.md` identifies `F07.S01.M03 mod_recovery`; the identity specification lists recovery as a core account capability. The inspected F07 and module-level contracts defer exact behavior to future process specifications and leave ownership unassigned.

**Attack scenario:**
An attacker targets recovery rather than login: social engineering, compromised email/device, recycled phone number, stolen recovery token, support impersonation, or replay of an old recovery request. If recovery changes credentials without invalidating old sessions and linked devices, the attacker may retain access after the legitimate user regains the account.

**Required remediation:**
- Specify recovery factors and assurance levels; do not assume email possession alone proves identity.
- Use short-lived, single-use, high-entropy recovery tokens stored hashed server-side.
- Apply rate limits, progressive delays, abuse monitoring, and user notifications.
- Revoke or rotate all sessions, refresh tokens, device credentials, and relevant signing keys after recovery.
- Require step-up confirmation for high-risk actions after recovery.
- Define secure support-assisted recovery and prohibit silent operator account takeover.
- Add tests for token replay, concurrent recovery, expired tokens, account enumeration, session persistence, and recovery-channel compromise.

### CR-11 — Object-level authorization and role boundaries are not specified
**Severity:** Critical design gap  
**Confidence:** High  
**Evidence:** F16 authz is PLANNED and its public interfaces are deferred. Feature specifications refer generically to identity/authorization but do not define principal types, resource ownership rules, role scope, or authorization decision semantics.

**Attack scenarios:**
- Change a listing, message, trade, bid, or evidence record by substituting another object's identifier (IDOR/BOLA).
- A participant in one trade accesses another participant's private data.
- A moderator obtains broad access to identity or message contents unrelated to a case.
- A relay or service account gains permissions beyond its assigned function.

**Required remediation:**
1. Create a resource/action authorization matrix for every command and query.
2. Enforce authorization server-side on every object access, not only in UI routes.
3. Use deny-by-default policy and explicit tenant/participant scoping.
4. Separate user, moderator, support, operator, relay, and service identities.
5. Scope privileged access by purpose, case, duration, and auditable approval.
6. Add negative tests for cross-user, cross-trade, cross-relay, stale-role, and revoked-session access.

### CR-12 — Reputation and trust features are exposed to Sybil, collusion, retaliation, and evidence manipulation
**Severity:** High  
**Confidence:** High  
**Evidence:** `INDEX.md` identifies reputation and evidence modules under F07 trust. The risk register has a broad fraud/abuse item, but no explicit reputation-manipulation model or acceptance criteria were found in the inspected specifications.

**Attack scenarios:**
- A single actor creates multiple pseudonyms to manufacture positive ratings or overwhelm a target with negative ratings.
- Participants coordinate reciprocal trades to inflate reputation.
- A user threatens a bad review to coerce a counterparty.
- Moderators or operators alter, suppress, or selectively expose evidence.
- Reputation scores reveal sensitive association patterns or become a proxy for protected characteristics.

**Required remediation:**
- Define what constitutes a qualifying interaction and prevent self-rating and duplicate relationship inflation.
- Track reputation provenance and expose enough context to detect suspicious clusters without publishing private relationship data.
- Define dispute, appeal, correction, expiry, and moderation rules.
- Separate verified transaction facts from subjective ratings and unverified claims.
- Rate-limit reputation actions and detect coordinated behavior.
- Keep an append-only administrative audit trail for score/evidence changes, with access controls and retention rules.
- Test Sybil clusters, reciprocal-rating rings, retaliation, brigading, and moderator abuse.

### CR-13 — Geographic privacy controls are principles, not yet measurable guarantees
**Severity:** High  
**Confidence:** High  
**Evidence:** `PROJECT_SPEC.md` says exact home addresses are private and approximate discovery regions are deliberately coarse. `RISK_REGISTER.md` R01 calls for coarse search regions and data minimization. F06 is referenced in the risk register, but the inspected hierarchy does not define a concrete privacy budget or query policy.

**Attack scenarios:**
- Repeated searches with slightly different coordinates or filters narrow a user's location.
- Small result sets, rare listing attributes, timestamps, or availability patterns reveal a home or routine.
- Federation relays correlate otherwise pseudonymous location and activity metadata.
- A user infers a target's location by combining public listings with meetup messages.

**Required remediation:**
- Define minimum geographic cell sizes and minimum result-set thresholds.
- Apply per-user, per-IP, and per-relay query limits; detect repeated narrowing queries.
- Suppress or generalize results in sparse areas and for sensitive listing categories.
- Prevent exact coordinates from entering public events, logs, analytics, notifications, and federation payloads.
- Define retention limits for raw location, IP, and query history.
- Add adversarial triangulation tests across time, filters, multiple accounts, and federated instances.

### CR-14 — Offline PWA command queues can create stale-consent and replay risks unless server reconciliation is formalized
**Severity:** High  
**Confidence:** High  
**Evidence:** `PROJECT_SPEC.md` says offline writes remain pending until server acknowledgement, and requires explicit consent for every participant and material proposal revision. The exact offline queue protocol, conflict rules, and invalidation behavior are not defined in the inspected contracts.

**Attack / failure scenario:**
A device queues a trade acceptance while offline. The proposal is changed, withdrawn, expired, or accepted by another party before the device reconnects. A naïve retry may apply stale consent or duplicate a state transition. Local queue contents may also be modified by a compromised browser/device.

**Required remediation:**
- Treat client queues as untrusted requests, never as authoritative state.
- Bind consent to immutable proposal version/hash, participant identity, action, expiry, and nonce.
- Revalidate authorization, proposal version, inventory, deadline, and all participant consent at server commit time.
- Reject stale consent after any material revision.
- Use server-enforced idempotency keys and replay protection.
- Define conflict responses and user-visible reconciliation; never silently auto-accept or reroute.
- Test duplicate delivery, out-of-order delivery, queue tampering, device clock skew, revocation while offline, and partial network failure.

### CR-15 — Messaging and meetup safety requirements are not specified at the security boundary
**Severity:** High  
**Confidence:** High  
**Evidence:** `INDEX.md` includes messaging, negotiation, and meetups under F08. The F08 specification remains PLANNED and defers exact contracts. The risk register does not separately model harassment, account discovery, message metadata, or attachment threats.

**Attack scenarios:**
- A blocked user contacts a target through a new conversation, alternate account, or federated relay.
- Message previews or notifications expose sensitive content on a lock screen or shared device.
- Attachments contain malware, tracking pixels, active content, or oversized payloads.
- Reports require access to message content, creating a privacy conflict if end-to-end encryption is later adopted.
- Meetup coordination leaks precise location or reveals predictable routines.

**Required remediation:**
- Specify block semantics across new conversations, existing threads, group threads, notifications, and federation.
- Define report/evidence workflows and access boundaries before choosing encryption architecture.
- Treat attachments as hostile: size limits, content-type validation, safe storage, malware scanning where appropriate, and no inline active rendering.
- Minimize notification previews and provide user controls.
- Define abuse throttles, spam controls, retention, deletion, and metadata minimization.
- Require explicit user confirmation before sharing precise meetup locations.

### CR-16 — Federation event authenticity, replay protection, and revocation semantics remain underspecified
**Severity:** High  
**Confidence:** High  
**Evidence:** F11 covers protocol, relay sync, and interoperability but remains PLANNED; its exact interfaces are deferred. The project specification requires signatures, provenance, revocation, and abuse handling but does not define the wire protocol or canonical event representation.

**Attack scenarios:**
- A malicious relay replays an old signed listing, consent, or moderation event.
- A compromised key continues to be trusted after rotation.
- Different relays interpret the same signed payload differently.
- A malicious peer sends oversized, deeply nested, malformed, or resource-exhausting events.
- A federation peer claims an event was revoked but does not propagate the revocation consistently.

**Required remediation:**
- Define canonical serialization and domain-separated signatures.
- Bind signatures to event type, schema version, issuer, audience/recipient, object ID, sequence/version, and expiry where applicable.
- Define key rotation, revocation, compromise recovery, and trust-root changes.
- Add replay windows, deduplication, monotonic sequence or equivalent conflict rules, and idempotent processing.
- Enforce strict schema validation, size/depth limits, and resource quotas before expensive cryptographic or database work.
- Specify conflict resolution and revocation propagation across disconnected relays.
- Test malicious peers, stale events, equivocation, key compromise, clock skew, and partial sync.

### CR-17 — Append-only commerce evidence lacks a defined tamper-evidence and privileged-access model
**Severity:** High  
**Confidence:** Medium-High  
**Evidence:** `PROJECT_SPEC.md` calls for append-only commerce evidence with policy-driven retention. F09 is PLANNED and does not define storage guarantees, evidence integrity verification, privileged mutation controls, or dispute export format.

**Attack / failure scenario:**
An operator or compromised backend changes or deletes evidence while preserving a user-facing history that appears complete. A counterparty disputes a trade, but the system cannot prove which event was recorded first or whether evidence was altered.

**Required remediation:**
- Define append-only enforcement at the storage boundary, not merely in application conventions.
- Use tamper-evident event chaining or independently verifiable signed receipts where justified.
- Record actor, action, timestamp source, object version, and causal reference.
- Separate evidence creation from evidence adjudication.
- Restrict and audit privileged correction, redaction, retention expiry, and legal hold.
- Provide portable dispute bundles with integrity verification while minimizing third-party personal data.
- Test administrator compromise, backup restoration, event deletion, and conflicting evidence.

### CR-18 — Auction integrity requirements do not yet define race, timing, and insider abuse controls
**Severity:** High  
**Confidence:** Medium-High  
**Evidence:** `INDEX.md` includes reserve, bids, close, anti-sniping, and fraud modules under F04. The inspected project-level specification mentions auctions in product scope but does not define authoritative clock, bid ordering, tie-breaking, or confidential bid access.

**Attack scenarios:**
- Two bids arrive concurrently and are ordered inconsistently.
- A client clock manipulates a close-time decision.
- An operator or insider sees confidential bids and places a strategic bid.
- A bidder exploits retries or duplicate requests to create inconsistent bid state.
- Shill accounts manipulate apparent demand.

**Required remediation:**
- Use server-authoritative time and deterministic bid ordering.
- Define atomic bid acceptance, tie-break rules, reserve handling, and anti-sniping extensions.
- Ensure bid history and private bidder identity have separate visibility policies.
- Add idempotency and concurrency controls to bid submission.
- Audit privileged access to bid data and auction configuration.
- Test race conditions, clock skew, duplicate submissions, insider access, and collusive bidding.

### CR-19 — Retention, deletion, export, and legal-hold behavior is too generic for privacy-sensitive data
**Severity:** High  
**Confidence:** High  
**Evidence:** Multiple feature specifications repeat that export and deletion follow retention and legal-hold policies, but the inspected documents do not define schedules, precedence, data categories, or deletion verification. The project promises privacy and data rights, while F10 remains PLANNED.

**Attack / failure scenario:**
A user deletes an account, but message copies, location history, federation replicas, backups, analytics, and notification payloads remain indefinitely. Alternatively, a legal hold is applied too broadly and prevents unrelated data deletion.

**Required remediation:**
- Create a data inventory and retention schedule by data category and purpose.
- Define deletion propagation to relays, processors, caches, search indexes, backups, and exports.
- Specify backup expiry and restoration-time deletion replay.
- Separate narrowly scoped legal holds from ordinary retention and require authorization/audit.
- Define what can be exported, redacted, or deleted when records contain multiple participants' data.
- Provide a deletion completion record without retaining the deleted content itself.
- Test account deletion across offline devices and disconnected federation peers.

### CR-20 — Security operations controls are not yet defined as operational acceptance criteria
**Severity:** High  
**Confidence:** High  
**Evidence:** F15 Platform and F16 Security are PLANNED with unassigned owners. The inspected specifications do not establish concrete operational controls for secret rotation, backup restoration, incident response, audit-log access, vulnerability disclosure, or service abuse limits.

**Attack / failure scenario:**
A compromised relay credential remains active; logs containing tokens or location data are broadly accessible; backups cannot be restored safely; or an incident is detected but there is no defined containment and notification path.

**Required remediation:**
- Define secret storage, rotation, revocation, and workload identity.
- Require encrypted backups, restore drills, and least-privilege restore access.
- Define security event logging with redaction and restricted access.
- Establish incident severity, containment, evidence preservation, notification, and recovery procedures.
- Define vulnerability intake and coordinated disclosure.
- Specify rate limits, quotas, abuse monitoring, and emergency feature-disable controls.
- Add operational runbooks and recurring restore/incident exercises.

### CR-21 — Risk register is materially incomplete relative to the product's declared attack surface
**Severity:** Medium-High  
**Confidence:** High  
**Evidence:** `RISK_REGISTER.md` contains eight risks: address leakage, invalid N-party cycles, false payment evidence, fraud/abuse, relay compromise, federation metadata leakage, regulatory exposure, and stale FX/rounding. It does not separately track account takeover/recovery, object-level authorization, reputation manipulation, offline replay, messaging abuse, attachment handling, auction integrity, retention/deletion, or supply-chain compromise.

**Required remediation:**
Expand the register into distinct risks with owner, affected assets, threat actor, attack path, impact, likelihood, mitigations, residual risk, verification test, and status. Do not mark a risk mitigated solely because a future feature/module exists.

## 3. Positive security architecture decisions to preserve

These are meaningful foundations and should not be lost during implementation:

- Static PWA code is explicitly treated as untrusted.
- Authorization and durable state are assigned to backend/relay services rather than the client.
- External wallets, chains, payment providers, and physical exchanges are recognized as separate trust boundaries.
- Signatures are not treated as proof of delivery or receipt.
- Home addresses are private by default and excluded from public listing/search/federation payloads.
- Offline writes are pending until server acknowledgement.
- Material proposal revisions require fresh consent.
- N-party cycles are intended to fail or renegotiate on dropout rather than silently reroute assets.
- Integer minor units and pinned FX source/time are required for value calculations.

These principles need process-level tests and concrete contracts before they provide real protection.

## 4. Required pre-implementation security gates

Do not begin feature implementation until the following minimum gates are satisfied:

1. **Architecture graph:** fix self-dependencies and publish an acyclic dependency model.
2. **Identity and authorization:** define account lifecycle, recovery, sessions, object-level access policy, privileged roles, and revocation.
3. **Transaction protocol:** define immutable proposal versions, consent binding, locking, expiry, idempotency, atomic commit, rollback/recovery, and offline reconciliation.
4. **Privacy:** define location precision, query throttling, data inventory, retention, deletion propagation, and federation disclosure.
5. **Federation:** define canonical signed events, key lifecycle, replay protection, schema/resource limits, and revocation.
6. **Communications:** define block/report/attachment/notification safety and privacy boundaries.
7. **Commerce evidence:** define tamper-evidence, audit access, dispute exports, and retention.
8. **Operations:** define secrets, backups, incident response, logs, quotas, and emergency controls.
9. **Verification:** attach negative acceptance tests to every security-sensitive process spec and require them in CI before release.
10. **Independent review:** perform implementation-level threat modeling, dependency/SAST/secret scanning, and penetration testing after a deployable system exists.

## 5. Verification limitations

- This review examined repository documentation and selected specification files on the default branch.
- No application runtime, API, database, relay, deployment, or production environment was available to test.
- No exploit attempts, destructive tests, dependency installation, secret scanning, or dynamic testing were performed.
- Findings are therefore architecture/design deficiencies and test requirements, not proof of exploitable deployed vulnerabilities.
- The project README explicitly says process specifications remain to be written and no application implementation is claimed.

## 6. Files reviewed

- `README.md`
- `PROJECT_SPEC.md`
- `FEATURE_INVENTORY.md`
- `DEPENDENCY_MATRIX.md`
- `RISK_REGISTER.md`
- `INDEX.md`
- `HIERARCHY_AUDIT.md`
- `02_LocalMutiny/SPEC.md`
- `02_LocalMutiny/03_cycle_execution/SPEC.md`
- `02_LocalMutiny/03_cycle_execution/TODO.md`
- `07_Identity/SPEC.md`
- `08_Communications/SPEC.md`
- `09_Commerce/SPEC.md`
- `10_Privacy/02_security_boundaries/SPEC.md`
- `11_Federation/SPEC.md`
- `12_Moderation/SPEC.md`
- `15_Platform/SPEC.md`
- `16_Security/SPEC.md`
- `16_Security/01_authz/SPEC.md`
- `16_Security/02_cryptography/SPEC.md`
- `16_Security/03_assurance/SPEC.md`

---
**Audit conclusion:** The architecture contains several sound trust-boundary principles, but the current repository does not yet contain the developer-ready security contracts or implementation needed to demonstrate that those principles are enforced. Treat all Critical/High items above as blocking design work, then retest against the eventual implementation.
