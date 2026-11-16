# Risk register

Owner = accountable role (role list in `planning/metaprompts/`). R01–R08 still hold feature codes and are pending migration (review M-07). R09 onward use roles. Finding IDs (S3-, S4-, CR-, BT-, TD-) and test IDs (TEST-SEC-*) are defined in `planning/SECURITY_FINDINGS_TRACKER.md`.

| ID | Risk | Owner | Mitigation | Status |
|---|---|---|---|---|
| R01 | Home-address leakage | F10/F06 | Coarse search regions, data minimization, privacy tests | Open |
| R02 | Invalid N-party cycle / partial completion | F02 | Atomic proposal state, unanimous consent, expiry and rollback of reservations | Open |
| R03 | False payment evidence | F09 | Distinguish claims from independently verified settlement | Open |
| R04 | Fraud and abuse | F12 | Reporting, anti-spam, appeals, evidence integrity | Open |
| R05 | Relay compromise | F16/F15 | Least privilege, encryption, audit, backups | Open |
| R06 | Federation metadata leakage | F11 | Explicit disclosure controls and provenance | Open |
| R07 | Regulatory exposure | F18 | Jurisdiction and prohibited category review | Open |
| R08 | Stale FX and rounding | F09/F02 | Pinned rates, integer amounts, expiration | Open |
| R09 | Account recovery is an authentication bypass (S3-01, CR-10) | Identity&Trust Lead | Recovery threat model and state machine; single-use hashed tokens bound to account and expiry; notice via pre-existing trusted channel; revoke sessions and keys on recovery; risk-based delay for sensitive changes. Tests: TEST-SEC-S3-01, TEST-SEC-CR-10 | Open |
| R10 | Signing key compromise or ambiguous key lifecycle accepts forged or stale signatures (S3-03) | Security Lead | Key classes and purposes; rotation and revocation propagation; compromise containment; no secret material in logs or backups; cryptographic review and negative test vectors. Tests: TEST-SEC-S3-03 | Open |
| R11 | Broken object-level authorization gives cross-account read or write (S3-02, CR-11) | Security Lead | Canonical authorization matrix per object and command; server-side checks on every read, write, export and download; actor from authenticated principal only. Tests: TEST-SEC-S3-02, TEST-SEC-CR-11 | Open |
| R12 | Signed events verified over ambiguous bytes allow substitution, replay or stale-key acceptance (S3-04) | Security Lead | Canonical versioned signed envelope; domain separation; defined verification order; replay cache; revoked-key and clock-skew rules. Tests: TEST-SEC-S3-04 | Open |
| R13 | Exact location leaks via payloads, logs, telemetry, exports, backups or repeated narrowing queries (S3-07, CR-13) | Privacy Lead | Field-level location data-flow inventory; precision tiers; query throttling and anti-triangulation; location metadata stripped from media; re-identification tests. Tests: TEST-SEC-S3-07, TEST-SEC-CR-13 | Open |
| R14 | Queued offline command executes after consent revocation or against a changed proposal version (S4-02, CR-14) | Marketplace Lead | Consent bound to immutable proposal version; revocation as ordered server transition; re-authorize and revalidate queued commands at execution; idempotency keys. Tests: TEST-SEC-S4-02, TEST-SEC-CR-14 | Open |
| R15 | Revoked or quarantined federation peer keeps delivering, or replays older events (S3-09, S4-05, CR-16) | Platform Lead | Peer trust states; signed revocation and deletion events; replay and stale-event rejection; fail-closed sensitive reads when trust is unknown; quarantine and reconciliation. Tests: TEST-SEC-S3-09, TEST-SEC-S4-05, TEST-SEC-CR-16 | Open |
| R16 | Sybil clusters and collusion manufacture reputation or retaliation (CR-12) | Identity&Trust Lead | Verified transaction facts kept separate from ratings; defined qualifying interaction; self-rating and duplicate-relationship blocks; abuse review. Tests: TEST-SEC-CR-12 | Open |
| R17 | Auction race, timing manipulation or insider abuse alters bids or outcomes (CR-18) | Commerce Lead | Concurrency-controlled bid ordering; defined close and anti-sniping rules; privileged bid and close actions audited; dual control where warranted. Tests: TEST-SEC-CR-18 | Open |
| R18 | Security events go undetected and incidents lack containment and recovery path (BT-01, BT-03, CR-20) | Security Lead | Security event taxonomy and alert rules with routing; tamper-evident audit log with restricted access; severity model and playbooks; drills and simulated alerts before launch. Tests: TEST-SEC-BT-01, TEST-SEC-BT-03, TEST-SEC-CR-20 | Open |
