# Sensitive-Surface Security Audit — 2026-11-15 (Pass 3)

## Scope and method

This pass focused on the highest-impact trust boundaries in the current `main` branch:

- account identity, sessions, and recovery;
- authorization and secrets;
- cryptographic keys and signatures;
- private messaging and attachments;
- private location data and metadata;
- non-custodial payment evidence and settlement;
- federation protocol and relay delivery;
- offline PWA behavior and cross-cutting control ownership.

This repository is currently a planning/specification repository, not an implemented application. The project specification explicitly states that this phase creates no application code and that implementation follows later release gates. Findings below are therefore **design/readiness findings**, not claims that a live exploit or runtime vulnerability was reproduced. No application code, deployed endpoint, live account, wallet, relay, or production data was available for testing.

Severity describes the potential impact if the missing or ambiguous control is implemented unsafely. It does not mean an exploitable production vulnerability has been confirmed.

## Executive assessment

**Disposition: NOT READY for implementation sign-off on the sensitive surfaces.**

The project specification contains several sound trust-boundary principles: the PWA is untrusted; authorization and durable state belong on independently deployed backends/relays; exact home addresses are excluded from public payloads; offline writes remain pending until server acknowledgement; signatures are evidence of an assertion rather than proof of physical delivery; and the platform does not custody funds or keys.

The problem is that these principles are not yet translated into complete, testable contracts for the components that must enforce them. The most serious gaps are account recovery, object-level authorization, key lifecycle, message confidentiality and metadata handling, location privacy, payment evidence semantics, and federation signature/replay handling.

## Findings

### S3-01 — Critical: Account recovery has no implementable security contract

**Evidence**
- `07_Identity/01_accounts/mod_recovery/SPEC.md` marks the module PLANNED and lists its domain model, command/state transitions, validation/authorization, failure/idempotency, interfaces/events, privacy/security/abuse, and acceptance/property-test specifications as not yet authored.
- `07_Identity/01_accounts/mod_recovery/authorization_capabilities.md` is a structured placeholder with all substantive requirements unchecked.
- `07_Identity/01_accounts/mod_recovery/workflow_state_machine.md` is also a generic placeholder.

**Risk**
Recovery is an account-takeover path by design. Without a defined proof-of-control model, recovery factors, challenge binding, rate limits, notification/hold periods, revocation of existing sessions and keys, and recovery-abuse response, an attacker may be able to seize an account or retain access after legitimate recovery. A pseudonymous account may also have no conventional identity proof; the project has not specified what evidence is sufficient or how to avoid coercion and social-engineering attacks.

**Required gate**
Specify a recovery threat model and state machine. Require strong, independent proof or explicitly documented fallback assurance; bind challenges to account, purpose, and expiry; make recovery single-use and replay-resistant; notify through pre-existing trusted channels; revoke or rotate sessions and cryptographic credentials; impose risk-based delays for sensitive changes; provide a safe dispute/rollback process; and test lost-device, SIM/email compromise, insider abuse, concurrent recovery, replay, and denial-of-service cases. Do not make support staff able to silently override proof requirements.

### S3-02 — Critical: Authorization is not defined at the resource and operation level

**Evidence**
- `16_Security/01_authz/mod_authorization/SPEC.md` is PLANNED, owner unassigned, and lists all seven detailed process contracts as not yet authored.
- `domain_schema.md`, `validation_rules.md`, and `contract_and_acceptance_tests.md` in the same module are generic unchecked placeholders.
- `07_Identity/01_accounts/mod_sessions/SPEC.md` is PLANNED and leaves session validation, authorization, lifecycle, and abuse behavior to specifications not yet authored.

**Risk**
A role list alone will not prevent broken object-level authorization (BOLA/IDOR). The system has sensitive objects owned by different participants: profiles, pseudonyms, messages, attachments, listings, offers, barter-cycle proposals, evidence, disputes, payment claims, meetup details, moderation records, and federation events. If each service checks only that a user is authenticated—or trusts client-supplied owner/participant IDs—cross-account reads and unauthorized state changes become possible.

**Required gate**
Create a canonical authorization matrix for every object type and command. Specify actor, resource owner, participant relationship, allowed action, field-level visibility, state preconditions, tenant/instance boundary, and privileged override. Enforce authorization server-side on every read, write, export, event subscription, and attachment download. Derive actor identity from the authenticated principal, not request-body IDs. Add negative tests for cross-user IDs, changed participant lists, stale roles, revoked membership, guessed identifiers, bulk endpoints, and alternate API paths.

### S3-03 — Critical: Cryptographic key lifecycle and compromise recovery are unspecified

**Evidence**
- `16_Security/02_cryptography/mod_key/SPEC.md` is PLANNED and lists the key domain, validation, lifecycle, failure, privacy, and test contracts as not yet authored.
- `16_Security/02_cryptography/mod_key/domain_schema.md` and `validation_rules.md` remain generic unchecked placeholders.
- `16_Security/02_cryptography/mod_management/SPEC.md` is likewise PLANNED with no concrete key-management contract.

**Risk**
The project depends on signatures and federation, but there is no complete specification for key generation, storage, access boundaries, rotation, revocation, backup, device migration, recovery, algorithm agility, or compromise response. An otherwise valid signature is not trustworthy if key ownership, validity interval, revocation state, or purpose is ambiguous. Export/backup flows can also become key-exfiltration paths.

**Required gate**
Define key classes and purposes; approved algorithms and parameter sizes; secure generation and storage; non-exportability where feasible; key-to-account binding; rotation and overlap rules; revocation propagation; compromise containment; device enrollment/removal; backup encryption and recovery; and audit events that never log secret material. Specify how verifiers treat signatures made before and after revocation, and how historical evidence remains verifiable without treating a compromised key as currently trusted. Require cryptographic review and negative test vectors before implementation.

### S3-04 — Critical: Signature verification does not yet have a canonical protocol contract

**Evidence**
- `11_Federation/01_protocol/mod_signatures/SPEC.md` and `16_Security/02_cryptography/mod_signatures/SPEC.md` are PLANNED.
- Their validation and domain-schema documents are generic placeholders rather than concrete wire-format or verification rules.
- `PROJECT_SPEC.md` requires signatures, provenance, revocation, and abuse handling for federated content but does not define the complete protocol.

**Risk**
If different services sign different byte representations, omit context, or validate different fields, attackers may exploit cross-protocol confusion, replay, signature substitution, stale-key acceptance, or event reordering. A signed event can also be authentic but unauthorized, stale, duplicated, or semantically invalid.

**Required gate**
Define a canonical, versioned signed envelope containing issuer, audience/recipient, event type, object ID, schema version, creation/expiry times, unique event ID, key ID, and a cryptographic digest of the exact payload. Define canonical serialization, domain separation, signature algorithm, verification order, timestamp tolerance, replay cache/deduplication, key discovery and revocation, unknown-version behavior, and rejection rules. Test tampering, cross-audience replay, duplicate delivery, clock skew, key rotation, revoked keys, malformed encodings, and downgrade attempts.

### S3-05 — High: Private messaging confidentiality and metadata protections are not specified

**Evidence**
- `08_Communications/01_messaging/mod_private/SPEC.md` is PLANNED and lists its core process contracts as not yet authored.
- `privacy_retention_abuse.md` for private messaging is a generic unchecked placeholder.
- The project specification names messaging delivery as a backend/relay responsibility but does not establish a concrete end-to-end confidentiality or metadata-minimization protocol.

**Risk**
Private messages can expose relationship graphs, negotiation history, identity clues, meetup plans, and sensitive personal information. Transport encryption alone does not protect message contents from the relay/operator. Even where content encryption is used, sender/recipient identifiers, timestamps, IP addresses, delivery receipts, attachment references, and push-notification previews can reveal sensitive information.

**Required gate**
Make an explicit product decision on end-to-end encryption and document the threat model. Define device identity, key verification, multi-device enrollment, forward secrecy, recovery trade-offs, group membership changes, blocking, reporting, abuse review, and what operators can technically access. Minimize metadata and notification previews; define retention/deletion behavior for sender, recipient, relay, backups, and exports. Do not describe the system as end-to-end encrypted unless the architecture and tests establish that operators cannot decrypt message content.

### S3-06 — High: Attachment handling has no concrete hostile-file boundary

**Evidence**
- `08_Communications/01_messaging/mod_attachments/validation_rules.md` is a generic placeholder.
- The module's broader SPEC is PLANNED and its required security/privacy/acceptance contracts are not authored.

**Risk**
Attachments create a separate attack and privacy surface: malicious files, parser exploits, active content, polyglots, oversized decompression, path traversal in archive handling, metadata leakage (EXIF/GPS), public object-store exposure, and authorization bypass through guessed or shared URLs.

**Required gate**
Define strict allowlists, size/count limits, content sniffing independent of filename/MIME headers, malware scanning or safe transformation, archive expansion limits, sandboxed processing, safe download headers, private storage, short-lived scoped download authorization, and deletion/retention. Strip or explicitly consent to image/document metadata where appropriate. Ensure object access is authorized on every download, not just at upload. Test malicious archives, MIME mismatch, SVG/HTML active content, EXIF GPS, oversized files, and cross-account access.

### S3-07 — Critical: Exact-location privacy is a stated principle without an enforceable data contract

**Evidence**
- `PROJECT_SPEC.md` says exact home addresses must remain private and must never appear in public listing/search/federation payloads; discovery regions should be deliberately coarse.
- `10_Privacy/02_security_boundaries/mod_metadata/domain_schema.md` is an unchecked placeholder.
- `RISK_REGISTER.md` records home-address leakage as open, with only broad mitigation wording.

**Risk**
Removing an address field from a public response is insufficient. Precise location can leak through coordinates, map tiles, geocoding results, image metadata, meetup messages, logs, analytics, search ranking, timing/correlation, exports, federation, backups, and repeated queries that narrow a coarse region. A pseudonym does not prevent re-identification when location and activity are correlated.

**Required gate**
Create a field-level data-flow inventory for precise location. Identify every writer, reader, processor, log, cache, backup, export, notification, and federation path. Define separate precision tiers and purpose-bound access; prevent exact coordinates from entering public payloads or telemetry; apply query throttling and anti-triangulation protections; use privacy-preserving meetup handoff; strip location metadata from uploaded media by default; and test re-identification through repeated searches and correlated events. Make deletion and retention behavior explicit for derived location data as well as source records.

### S3-08 — High: Payment evidence and settlement semantics can be confused

**Evidence**
- `PROJECT_SPEC.md` states there is no platform-held money or custodial keys; cash is self-attested with optional bilateral receipt evidence; signatures prove assertions, not physical handover; crypto transfers need independent confirmation and reorg/finality policy.
- `RISK_REGISTER.md` lists false payment evidence as open.
- `09_Commerce/01_payments/mod_noncustodial` and its detailed process documents are planning material; no executable payment verifier or integration was available in this repository snapshot.

**Risk**
A signed user assertion, screenshot, transaction hash, wallet notification, or bilateral receipt is not equivalent to independently verified settlement. If UI state or workflow logic treats “evidence submitted” as “paid,” participants can release goods/services prematurely. For on-chain transfers, chain reorganization, wrong network, wrong token/contract, underpayment, fee-on-transfer behavior, and confirmation policy matter.

**Required gate**
Use distinct, non-interchangeable states such as CLAIMED, EVIDENCE_SUBMITTED, INDEPENDENTLY_OBSERVED, CONFIRMED_FINAL, DISPUTED, and REVERSED/REORGED. Define chain/network/token/recipient/amount matching, confirmation thresholds, finality policy, reorg handling, duplicate event handling, and trusted source requirements. Cash must remain explicitly self-attested unless corroborated. Ensure user-facing wording never overstates what the platform verified. Test wrong-chain, wrong-recipient, partial payment, duplicate tx, reorg, stale evidence, fabricated screenshot, and provider outage.

### S3-09 — High: Federation trust and relay delivery lack enforceable peer lifecycle controls

**Evidence**
- `11_Federation/01_protocol/mod_signatures/SPEC.md`, `11_Federation/02_relay_sync/mod_delivery/SPEC.md`, and the interop trust module are PLANNED or generic placeholders.
- `PROJECT_SPEC.md` requires provenance, signatures, revocation, and abuse handling, but detailed peer admission, isolation, and revocation behavior is not present in the reviewed contracts.

**Risk**
A federation peer is an external trust domain. Without peer identity, admission, capability scoping, revocation, quarantine, rate limits, and delivery semantics, a malicious or compromised peer can inject spoofed content, replay old events, enumerate users, poison shared records, or continue delivering after trust is withdrawn.

**Required gate**
Define peer onboarding and proof of control; signed peer metadata; scoped capabilities; trust states (pending, trusted, restricted, quarantined, revoked); per-peer quotas; event provenance; delivery acknowledgements; replay protection; conflict policy; blocklist distribution; and revocation propagation. Make federation opt-in and disclose exactly what data leaves the home instance. Test compromised peer, revoked peer with queued messages, duplicate/reordered events, malicious payloads, and relay partition/recovery.

### S3-10 — High: Offline client state and local storage are not treated as a hostile environment in module-level contracts

**Evidence**
- `PROJECT_SPEC.md` correctly says the static PWA is untrusted and offline writes remain pending until server acknowledgement.
- The reviewed identity, messaging, privacy, and commerce modules do not yet define complete local-storage, queued-command, cache, logout, or device-compromise contracts.

**Risk**
A PWA running on a shared or compromised device can expose cached profiles, messages, attachments, location data, and pending offers. Queued actions may be submitted after consent or authorization has been revoked, or after the underlying offer/inventory has changed. Service-worker caches can outlive logout or account switching.

**Required gate**
Inventory all client-persisted data and define sensitivity, encryption, expiry, logout purge, account-switch isolation, cache-control, and device-loss behavior. Treat queued commands as untrusted proposals: re-authenticate, re-authorize, revalidate current state and consent, enforce idempotency, and reject expired/revoked commands server-side. Never let local UI state imply durable completion. Test shared devices, offline logout, account switching, revoked sessions, stale consent, duplicate replay, and service-worker cache persistence.

### S3-11 — High: No named owner is accountable for the critical security contracts

**Evidence**
- Sensitive module specifications reviewed for recovery, sessions, private messaging, authorization, key management, and federation are marked PLANNED with owner unassigned.
- The associated process specifications repeatedly state that consumers and subscribers are unresolved.

**Risk**
A control without a named owner, review authority, and operational escalation path can remain indefinitely incomplete or be implemented inconsistently by downstream teams.

**Required gate**
Assign a directly responsible owner and security reviewer to each critical contract. Identify downstream consumers, sign-off authority, change-control process, and operational responder. Make unresolved security decisions blocking dependencies rather than advisory TODOs.

### S3-12 — Medium-High: Risk register is too coarse to drive verification

**Evidence**
- `RISK_REGISTER.md` contains eight open risks with broad mitigations, but no concrete test IDs, affected interfaces, control owners, detection signals, incident actions, or residual-risk approvals.

**Risk**
High-impact threats can be marked “mitigated” based on prose without evidence that controls exist or work.

**Required gate**
For each risk, record assets, threat actor, attack path, affected data/actions, likelihood/impact rationale, preventive control, detection, response, recovery, owner, linked specification, test ID/evidence, residual risk, and approval. Link every Critical/High finding in this report to a release-blocking acceptance test.

## Prioritized implementation blockers

Do not begin implementation of the affected sensitive modules until these minimum contracts exist:

1. **Identity and authorization:** canonical principal model, session lifecycle, resource/action authorization matrix, account recovery state machine, privileged-access rules.
2. **Cryptography:** key classes, secure storage, rotation/revocation/recovery, signed envelope format, canonical serialization, replay protection.
3. **Privacy:** precise-location data-flow map, field-level disclosure policy, retention/deletion rules, telemetry and export restrictions.
4. **Communications:** explicit message confidentiality model, metadata minimization, attachment processing/storage/download controls, meetup location disclosure.
5. **Commerce:** clear distinction between user claims and independently verified payment/finality states.
6. **Federation:** peer admission/trust lifecycle, scoped permissions, signed event validation, revocation and replay handling.
7. **PWA/offline:** local data inventory, cache purge, queued-command revalidation, account-switch isolation.
8. **Assurance:** named owners, security review gates, negative/property/contract tests, and evidence-backed risk register.

## Validation checklist for the next engineering phase

- [ ] Cross-account authorization tests cover every read/write/export/download/subscription path.
- [ ] Recovery tests cover compromised channels, concurrent attempts, replay, session revocation, and key rotation.
- [ ] Cryptographic test vectors cover malformed, altered, expired, revoked, wrong-audience, and duplicate messages.
- [ ] Privacy tests inspect API payloads, logs, analytics, push payloads, exports, backups, and federation output for precise location.
- [ ] Attachment tests cover active content, malware, archive bombs, MIME mismatch, EXIF GPS, and unauthorized downloads.
- [ ] Payment tests distinguish self-attested evidence from independent verification and cover chain reorg/finality.
- [ ] Federation tests cover malicious/revoked peers, replay, duplicate/reordered delivery, and quarantine.
- [ ] Offline tests cover stale consent, revoked sessions, shared devices, logout, account switching, and service-worker cache.
- [ ] Critical/High risks have accountable owners and passing evidence before release.

## Limitations

This pass reviewed the current repository documentation and planning contracts. It did not execute application code, perform dependency or secret scanning, run a dynamic/API test, inspect production infrastructure, or attempt exploitation. No confirmed exploitable runtime vulnerability is asserted. The findings identify concrete gaps in the current specifications that must be resolved before implementation and security approval.

## Final verdict

The project specification establishes a sensible high-level trust model, but the sensitive modules are not yet specified to a level that can reliably enforce it. The highest-priority blockers are account recovery, object-level authorization, cryptographic key/signature lifecycle, and exact-location privacy. Treat these as **release-blocking design requirements**, not as optional hardening work.
