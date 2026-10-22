# Threat model and security acceptance plan
Status: DESIGN REVIEW REQUIRED; no audit, pentest or security certification performed. Scope: browser PWA, authenticated API, SQL/outbox, media storage, notifications, imported federation records, external payment evidence and physical exchange. Threat frameworks: STRIDE, LINDDUN privacy lenses, OWASP ASVS 5.0 verification mapping.

## Trust boundaries and attacker capabilities
B1 Browser ↔ API: compromised device/browser script, XSS, CSRF, cookie theft, malicious network, replay, untrusted uploads.
B2 API ↔ datastore: tenant IDOR, injection, concurrent writes, rollback/recovery leakage, privileged insider, compromised backups.
B3 API ↔ event workers/cache/search: cross-tenant projections, missed tombstones, duplicated delivery, stale data.
B4 API ↔ external payment rails/wallets: untrusted redirect, forged webhook, stolen provider key, double-spend, reorg, chargeback.
B5 Local ↔ federation peers: Sybil peers, stolen/rotated keys, graph scraping, denial of service, malicious signed payloads, removal reintroduction.
B6 User ↔ user physical exchange: coercion, theft, unsafe meetup, counterfeit object, conflicting condition, incomplete N-party chain. Physical asset atomicity is impossible to guarantee through ClassRup; claims are not enforcement.
Assume a legitimate seller may be adversarial, a peer may possess a valid signature key and still publish falsehoods, and anonymous/low-cost accounts may be created en masse.

## Threat register and required controls
| ID | Attack / impact | Required mitigation | Verification gate |
|---|---|---|---|
| SEC-01 | exact home-address leak via listing, EXIF, uploads, search, geo coordinates | public coarse area only; EXIF strip all metadata at ingest; private address separate storage/explicit recipient access; suppress in events/logs/federation | synthetic canary secret never appears in public/index/export/telemetry/EXIF |
| SEC-02 | metadata correlation of trade graph | no private edge enumeration; bounded query; participant pseudonym consent reveal only after proposal; randomized public stats aggregation, no per-target graph queries | adversary probing tests reveal no hidden node identity; privacy UX documents residual risk |
| SEC-03 | Sybil, reputation farming, spam and scraping | account creation throttles, risk-evidenced reversible limits, per-tenant quotas, velocity/rate budgets, abuse escalation and appeal | 1,000 synthetic accounts do not bypass recipient invite/rate quotas in staging |
| SEC-04 | stolen auth / horizontal privilege escalation | secure cookie+CSRF, session rotation, actor/tenant binding, authorization before ID lookup, deny-by-default ABAC, token expiry | role/tenant/IDOR matrix across every endpoint; no data crossover |
| SEC-05 | replay/idempotency collision | signed scope, command receipts, content digest, revision guard, unique constraints, bounded retry | 100 duplicate/reordered operations produce one mutation; mismatched reuse 409 |
| SEC-06 | double-reserve/race across cycles | transactional row locks, deterministic ordering, CAS, lease sweeper, no cross-relay atomicity claim | race test with concurrent cycles accepts <=1 conflicting lock |
| SEC-07 | false payment confirmation | separate claims/verification, independent signed provider checks, chain finality/reorg policy, source provenance | forged webhook and screenshot never mark verified; reorg revokes |
| SEC-08 | crypto/key compromise | vetted library and WebCrypto/libSodium, no own primitives, secure secret vault, audited key rotation/revocation, domain-separated signed bytes | known-answer vectors, key rotation, revoked key and tamper tests |
| SEC-09 | malicious federated peer | explicit allowlist/feature OFF default, quarantine+moderation, size/shape limits, signature+version+origin checks, peer block, tombstones | malicious input corpus + replay and bulk-DOS tests; local moderation cannot be bypassed |
| SEC-10 | moderator overreach/privacy | separate scoped roles, evidence minimization and audit log, no unrestricted private message access, dual review of sensitive export | privileges verified; access auditable and user appeal retained |
| SEC-11 | unsafe file/media/script | content-type sniff & allowlist, malware scan, AV rejection fail closed, EXIF strip, filename randomization, CSP, sanitization | polyglot/XSS/zip bomb/oversize upload tests, no executable delivery |
| SEC-12 | offline/outage confusion | pending UI not success, epoch-based cache invalidation, retry receipt, no local verified claim | disconnected session cannot approve/revoke/payment-confirm remotely; consistency tests |
| SEC-13 | deletion and legal hold abuse | data-rights request validated, record scoped exception purpose/expiry, backup TTL enforcement, tombstone outbox | deletion audit over all stores incl media/cache/backup; peer deletion is best effort |
| SEC-14 | physical transaction fraud/coercion | safe meetup recommendations, opt-out exact location sharing, one-way cancellation/dispute, no platform guarantee of delivery | complaint, partial-hand-off and emergency stop workflows reviewed |
| SEC-15 | payment provider supply chain/regulatory compliance | separate vendor review, no direct platform custody, payment method disabled absent jurisdiction and provider signoff | approved providers, jurisdictional policy and signed verification tests |

## Defense detail
- Public location: no latitude/longitude or street/address field in exported public schema. Public-area taxonomy must be size/precision reviewed to avoid unique household inference in sparse regions; frequent randomized scanning must not reveal live moves. Never assert perfect anonymity; counterparties and peer timings remain correlation risks.
- Pseudonym identity: stable graph IDs permit linkage. Rotate public key only with signed proof-of-control and privacy warnings; old IDs must not be silently mapped across export. Reputation does not guarantee authenticity.
- Commerce: malicious sellers can claim completion, counterfeit receipt or social-engineer exchange. Distinguish actor attestations, partner acknowledgement and independent verifier. Contract cannot make physical exchanges atomic.
- Federation: exported signatures are integrity of assertions, not reliability or safety. Signed records still go through local moderation. A blocklisted peer's historical objects may be quarantined, and stale replicas will persist until peers cooperate.
- Noncustodial: no signing of funds by server or private-key storage. Native wallet UI under users' custody. External balances only observed with bounded proof and chain-specific confidence. Disable unreviewed crypto rail.
- Crypto: rely on WebCrypto/jose or vetted wrappers. Domain separation, exact canonical JCS bytes, test vectors, upgrade discipline. Confidentiality claims limited to actual implementation design.
- Observability: event payload redaction, deterministic correlation IDs with retention and access policy; logging high-cardinality user identifiers has privacy cost; use pseudonymized bounded metrics.
- Operations: secrets in secret manager, scoped IAM/DB roles, encryption at rest, restore tests and tamper-evident admin audit, reproducible builds, signed supply-chain provenance. Fail closed on authorization/provider verification outage.

## Security gate prerequisites
Signed risk acceptance for all SEC IDs, asset/control matrices, complete OWASP ASVS 5.0 mapping by feature, dependency SBOM and transitive license review, automated SAST/SCA/secret scan, structured threat simulation, independent pentest against staging before real-money integration, incident tabletop, restore and backup decryption rehearsal. Track exploitability not just checklist presence. Nothing in this file asserts tests have passed.
