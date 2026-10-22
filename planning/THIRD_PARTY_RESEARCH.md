# Dependency research — recorded evidence (2026-10-22)
Status: candidate inventory only. Versions are observed published versions, not installed, pinned, reviewed or audited for this project. Before implementation freeze exact versions and lockfile hashes, inspect current advisories, maintenance and transitive license obligations; no direct copying from dependencies unless license obligations are met.

| Role | Candidate version | Reported license | Evidence | Alternative | Assessment |
|---|---|---|---|---|---|
| API/server | fastify 5.12.7 | MIT | https://www.npmjs.com/package/fastify | Hono, Express | schema support, plugin boundaries; benchmark and CVE review pending |
| Auth/JWS and JWK | jose 6.2.12 | MIT | https://www.npmjs.com/package/jose | native WebCrypto + dedicated JOSE | use standards-based signatures/tokens, avoid handwritten JOSE |
| Ed25519 signatures | @noble/ed25519 3.2.0 | MIT | https://www.npmjs.com/package/@noble/ed25519 | libsodium-wrappers, WebCrypto | verify canonicalization/vectors, runtime compatibility and vendor claims before selecting |
| Sodium bindings | libsodium-wrappers 0.8.4 | ISC | https://www.npmjs.com/package/libsodium-wrappers | WebCrypto | tested cryptographic primitives candidate, not license/security signoff |
| Graph core | graphology 0.26.0 | MIT | https://www.npmjs.com/package/graphology | adjacency lists written as noncrypto business code | useful graph representation, NOT cycle optimizer; benchmark bounded DFS |
| Property tests | fast-check 4.10.2 | MIT | https://www.npmjs.com/package/fast-check | Hypothesis (Python) | model-based and property oracles |
| Browser E2E | @playwright/test 1.64.1 | Apache-2.0 | https://www.npmjs.com/package/@playwright/test?activeTab=versions | Cypress | Chromium/Firefox/WebKit automation and a11y keyboard coverage |

## Standards/research references
- RFC 8785 JSON Canonicalization Scheme (JCS): https://www.rfc-editor.org/rfc/rfc8785.html ; defines deterministic wire-independent cryptographic JSON serialization, INFORMATIONAL standard (not on Internet Standards Track). Consider library implementing RFC8785 rather than custom canonicalizer; verify numeric and Unicode round-trip fixtures.
- OWASP ASVS 5.0.0: https://asvs.owasp.org/ ; verification criteria, not a compliance certificate.
- W3C WCAG 2.2: https://www.w3.org/WAI/standards-guidelines/wcag/ ; accessibility objective AA.
- W3C ActivityPub: https://www.w3.org/TR/activitypub/ ; interoperability option, not automatically compatible with ClassRup signed-record format. Evaluate adapter and security boundaries.
- IETF RFC 8032 (EdDSA): https://www.rfc-editor.org/rfc/rfc8032 ; use library test vectors.
- OWASP threat modelling: https://owasp.org/www-community/Threat_Modeling ; validation source.
- PostgreSQL official supported versions / licensing: https://www.postgresql.org/support/versioning/ and https://www.postgresql.org/about/licence/ ; proposed 17 major must be validated for hosting support.
- SQL migrations: recommend a reversible migration tool with explicit schema version and checksum, product/version selection deferred to implementation ADR.

## License and security diligence
Verify license in exact release tarball, not only npm sidebar; SPDX and source attribution + binary redistribution; check notices and GPL/copyleft transitives. Pin package hashes via lockfile and SBOM; run automated dependency and license checks on every CI build. Do not describe OSS as formally audited absent independent evidence. Crypto library selection requires review of sign/verify canonicalization, nonce/key management, implementation version, malleability and malicious inputs. Payments require provider onboarding and independent documentation; these libraries do not satisfy custody, PCI or legal requirements.

## Remaining evaluation gaps
Private messaging end-to-end encryption protocol selection; secure upload parser and scanner; hash canonicalization implementation; robust currency metadata/exponents; fiscal/regional policies; walletConnect providers and crypto finality observers; federated actor key lifecycle; map/geo precision partitioning; backup/monitoring suite and managed KMS; TypeScript/Node/browser compatibility matrix. These are NO-GO blockers for enabled affected modules, and separate ADRs are required.
