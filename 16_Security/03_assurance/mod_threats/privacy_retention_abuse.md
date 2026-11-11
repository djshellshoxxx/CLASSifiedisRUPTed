# PS-133-07 — Privacy, retention and abuse: Security threat model

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M01 Security threat model](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/threat_model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-133-07.R01** The register contains no personal data, secrets or exploit details of unpatched issues, and describes threats at design level.
- **PS-133-07.R02** The register and summary are public repository documents retained indefinitely in history.
- **PS-133-07.R03** The model itself must not be weakened silently, so changes require two approvals and appear in the release notes.

## Specification

**Data classification**
- Register and summary: P0 public documents.
- Private advisories: handled outside the repository until fixed.

**Retention**
- Register versions: indefinite in repository history.
- CI reports: 90 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | B1 spoofing, a look-alike site or altered distributor serves a fake app | users are told the official origin; install flow shows origin; release manifest signed with the project release key and its fingerprint published in several places; PWA shows build hash |
| T02 | B1 tampering, a malicious static distributor serves altered JavaScript | detection and limitation, not prevention - subresource integrity and strict CSP without inline script stop third-party injection but not a malicious origin; the running service worker checks the signed release manifest before activating an update and asks for consent (F15.S01.M03); reproducible builds with published hashes, mirrors and out-of-band hash comparison let users and third parties detect a bad build; residual risk - a malicious origin can replace the service worker and app on next load (first install, eviction or a forced update), which the app cannot prevent |
| T03 | B1 repudiation, distributor denies serving a malicious build | detection - users and third parties compare served bundle hashes out of band with the signed release manifest, mirrors and reproducible build hashes; mismatches are reportable evidence and build transcripts are published; residual risk as in T02, a malicious origin can replace the app on next load and the evidence only shows it afterwards |
| T04 | B1 information disclosure, distributor logs IPs and access patterns | app has no analytics; distribution may be mirrored on several hosts; service worker caches the shell so repeat use makes no distributor requests; stated limits in user summary |
| T05 | B1 denial of service, host takes the app down | installed PWA works offline from cache; mirrors listed in the release manifest; vault export allows moving to another build |
| T06 | B1 elevation of privilege, compromised dependency in the build chain | lockfile with integrity hashes, minimal dependencies, pinned noble versions, CI secret scanning (F16.S01.M02), dependency review on every update |
| T07 | B2 spoofing, another origin or extension impersonates the vault UI | vault bound to the app origin; unlock only in the app origin; passphrase never requested by other contexts; users told to avoid untrusted extensions |
| T08 | B2 tampering, injected script alters stored records or signs on behalf of the user | records are signed statements and local integrity hashes; signing needs an unlocked key held in a worker; CSP and SRI reduce injection; residual risk of full compromise of the origin is stated |
| T09 | B2 repudiation, user denies a consent they signed | consents are Ed25519 signatures over exact revisions with context strings (F16.S02.M03); signatures evidence assertion by the key holder, not delivery or identity |
| T10 | B2 information disclosure, stolen device or cleared storage | private keys wrapped with scrypt N=2^17 and XChaCha20-Poly1305; auto-lock; P3 data stays local; export is encrypted when the user chooses |
| T11 | B2 denial of service, storage eviction or corruption destroys the vault | persistent storage request, last-export age warning after 30 days, backup file and recovery kit under user control, integrity self-check at start |
| T12 | B2 elevation of privilege, a statement from another party is treated as the user's own authority | vault policy accepts statements only if signed by the key the F11.S01.M01 registry requires for the role (F16.S01.M01 authorizeStatement); others are quarantined by F11.S01.M02 |
| T13 | B3 spoofing, an attacker impersonates a relay | relay identity is its did:key; vault pins the relay key at selection and verifies signed receipts; peers verify relay request signatures |
| T14 | B3 tampering, a relay alters or drops mailbox envelopes or index projections | envelopes are end-to-end encrypted and signed by senders; vaults verify author signatures on projections; delivery states never exceed what was acknowledged |
| T15 | B3 repudiation, a relay denies receiving a report or message | relay-signed receipts with relay sequence numbers are evidence of that relay clock only; vault keeps them |
| T16 | B3 information disclosure, a relay operator reads user data or metadata | relays never hold private message plaintext, user keys or vault contents - mailboxes hold ciphertext plus routing metadata (mailbox ID, size, time); relays do hold in plaintext the P2 and P3 data of services users choose there, each minimized, limited to that relay and retained per its module - bids and results on an auction host relay (F04.S01.M02, F04.S01.M03), push subscription endpoints (F13.S01.M01), email addresses for email notifications (F13.S01.M02), moderation reports, cases and evidence (F12), rate buckets, audit and incident records (F12.S03.M03, F16.S01.M01, F16.S03.M02), session token hashes and login challenges (F07.S01.M02), and public P0 handles (F07.S01.M01); IP and timing exposure is stated; the relay inventory is generated from the module specs (V06) |
| T17 | B3 denial of service, request flooding or storage exhaustion | relay-local rate limits per key and per prefix (F12.S03.M03), per-key storage quotas, relay-local per-key limits (F12.S03.M04), relay-wide read-only switch (F16.S03.M03) |
| T18 | B3 elevation of privilege, compromised moderator or operator role | relay roles per relay and scope only, bound to the principal and usable only with active device keys, expiry on non-admin roles, signed two-person admin approvals, hash-chained audit log with published anchors, no global role (F16.S01.M01) |
| T19 | B4 spoofing, a peer relay forges records from an author | federation envelopes are Ed25519 signed over JCS bytes by the author key and verified before storage (CTR-FED-001); invalid signatures rejected |
| T20 | B4 tampering, a peer modifies or reorders records in transit or at rest | cid dedup, hash chain with prev and seq per author, gap detection, signatures cover the whole envelope |
| T21 | B4 repudiation, a peer denies serving or relaying content | provenance records originRelay, receivedAt, via[] and verifiedAt locally; peers sign relay requests with their relay keys |
| T22 | B4 information disclosure, a peer collects data beyond what was shared | only P0 opted-in records are exported, L2 maximum location, peer allowlist with quotas; tombstones propagate but cannot recall copies already fetched, and the UI says so |
| T23 | B4 denial of service, a peer floods inbound batches | batches limited to 100 envelopes, per-peer quotas, the relay-local federation kill switch for relay-to-relay traffic (F16.S03.M03) and peer suspension (F11.S03.M01) |
| T24 | B4 elevation of privilege, a peer pushes moderation or policy authority across relays | no global takedown exists; peer advisories are advice only; blocklists apply locally by choice |
| T25 | B5 spoofing, fake payment page or address substitution | wallet addresses are signed in the deal statement; the vault shows the address from the signed statement and compares on payment claim; payments are claims between parties (CTR-COM-001) |
| T26 | B5 tampering, chain reorganization reverses a payment | confirmation depth policy and reorg events in F09.S01.M03; finality labelled in the UI; no platform custody |
| T27 | B5 repudiation, payer denies paying or payee denies receiving | signed payment claims and acknowledgements are evidence of assertions; chain proofs are evidence of transfer; neither proves delivery of goods |
| T28 | B5 information disclosure, chain analysis links identities | users are told on-chain activity is public and pseudonymity is not anonymity; no addresses in public projections |
| T29 | B5 denial of service, chain RPC unavailable | DEPENDENCY_UNAVAILABLE with retry and offline display of last known state; payment claims remain valid statements |
| T30 | B5 elevation of privilege, the app moves funds on behalf of a user | the product never holds keys or funds; it never signs transactions for the user in MVP |
| T31 | B6 spoofing, a person claims to be the counterparty at a meetup | meetup codes and mutual check-in statements signed by both keys; guidance in F08.S03.M01; attestations are claims |
| T32 | B6 tampering, goods swapped or misdescribed | evidence photos hashed and signed at handover; dispute flow in F09.S02.M02; no atomic physical exchange is claimed |
| T33 | B6 repudiation, a party denies handover or receipt | signed handover and receipt attestations by each party; absence of a counter-signature is shown as unconfirmed |
| T34 | B6 information disclosure, exact home address or live location leaks | addresses are P3 and never public; public location at most L2; meetup locations disclosed by explicit user action; live share TTL 24 h |
| T35 | B6 denial of service, no-show or harassment at the meetup | no-show signals (F12.S03.M02), block and report flows, safe public meetup guidance |
| T36 | B6 elevation of privilege, coercion into releasing goods or signing consent | consent must name the exact revision; users can decline at any step; support for cancelled legs in cycle recovery flows |
| T37 | X1 tampering by forked vaults, one principal signs two conflicting promises from two copies of the vault | receivers detect conflicting signed statements with the same sequence or reservation, freeze the affected coordination and require explicit renegotiation; no last-writer-wins for consent, money or inventory |
| T38 | X1 repudiation, a principal blames a fork for a conflicting promise | both signed statements are retained as evidence; a user who restores an older backup is warned about re-signing after the backup point |
| T39 | X2 elevation of privilege, a revoked key still accepted by an offline verifier | revocation freshness from signed list heads is reported on every verification (F16.S02.M02); high-stakes actions need fresh status from two sources or explicit acknowledgement; revocations travel in root-signed identity documents through any relay or peer |
| T40 | X2 spoofing, attacker uses a stolen key during the revocation lag window | consents received in the clamped claimed-compromise window are labelled; revocations by the key itself or the DID root key apply at once, another device key's revocation waits 7 days for the root key, recovery-driven revocations wait 72 hours (F07); users are told that revocation cannot reach offline parties instantly |
| T41 | X2 denial of service, revocation source suppressed or frozen by a relay | multiple sources polled, signed list heads with monotonic sequence so a replayed old list is detected, freshness from issuedAt, unknown after 7 days (F16.S02.M02) |
| T42 | B1 information disclosure, supply chain leaks secrets from the build | secrets scanning in CI, no production secrets in build, release signing key held offline |

**Abuse controls**
- The register changes only by pull request with two approvals and the CI check.
- Documents are scanned for forbidden claims (audit, certified, guaranteed, never holds plaintext without listed exceptions) by V05.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-133-09.T07 | abuse | PS-133-05.R01, PS-133-05.R03, PS-133-07.R03 | author self-approves register change; document containing 'externally audited'; draft with exploit details | merge blocked by required reviewers; SECURITY_THREATMODEL_FORBIDDEN_CLAIM; flagged by review checklist and kept in the private advisory |
| TEST-PS-133-09.T09 | integration | PS-133-07.R01 | scan register and summary for emails, IPs, keys and tokens | none found |
| TEST-PS-133-09.T15 | integration | PS-133-01.R03, PS-133-03.R01, PS-133-07.R02 | tag the reviewed model at a release; run the gate when the last tagged review is older than the previous release; inspect repository history | release tag present and older versions retained in history; gate fails with the review date |
| TEST-PS-133-09.T17 | unit | PS-133-02.R03, PS-133-07.R03, PS-133-02.R01 | summary sentence 'relays never hold plaintext' with no exceptions; the same sentence naming its exceptions; 'relays never hold private message plaintext'; register change without a release-notes entry | SECURITY_THREATMODEL_FORBIDDEN_CLAIM; accepted; accepted; release-notes check fails |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M02, F16.S02.M03, F12.S03.M03, CTR-PRV-001, CTR-CAP-001, CTR-FED-001, CTR-COM-001. Predecessor: [domain_schema.md](domain_schema.md).
