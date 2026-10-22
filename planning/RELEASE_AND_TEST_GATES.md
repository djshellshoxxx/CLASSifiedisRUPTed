# Specification verification, build and deployment reliability gates
Status: PROPOSED test and deployment design; no implementation/test run. Documents only.
Owners F17 F15 F16. Every candidate build requires complete per-process cross-reference to tests; no gate can be satisfied by text existence alone.

## Implementation order and dependencies (QG-001)
0. Ratify canonical contracts, ADRs, privacy and forbidden-jurisdiction policy; resolve all cross-feature shared ownership.
1. Set up CI, Node/TypeScript release pin, PostgreSQL migration/test harness, outbox/inbox and basic structured logging (F15/F17); threat gating (F16).
2. Sessions, account recovery, roles, tenant scoping (F07/F16), privacy retention/export and coarse geography (F10), moderation + policy (F12/F18), accessible base UI (F14).
3. Fixed-price listings, inventory guarded locking, index/search and messages (F01/F06/F08).
4. Settlement claim evidence (F09), offers and 2-party exchange (F02).
5. 3/4/N bounded cycle matching + unanimous consent + dropout/dispute (F02).
6. Notifications and field operations, read-only offline PWA (F13/F15).
7. Controlled pilot, backup/recovery, privacy impact assessment and rate abuse tuning (F15/F17).
8. Independent feature gates: services F03; auction F04; rentals F05; paid placement provider; external payment verification F09; federation F11; cross-currency FX and expanded cycle scope. Do not enable unreviewed components.

## Verifiable checks (QG-002)
- Spec lint: parse INDEX.md and registry 1480 rows, check referenced files exist, every owner module parent SPEC/TODO exists, ID path uniqueness, process header IDs match registry, every process has non-placeholder requirements and test fixtures, registry status matches content.
- Schema drift: generate/validate JSON schema and SQL DDL contracts; verify field type/enum and canonical source on all consumers; reject unknown fields and inconsistent versions.
- Unit and property: validation Unicode/overflow, permission matrix, states and forbidden transitions, money normalization and rounding, graph cycle completeness under fixed bounds, dedup and event schemas.
- Integration: test real PostgreSQL transactional reserve races, outbox after crash, consumer dedup, search takedown consistency, stale revisions, account deletion, event payload privacy, provider signature mocks and federated quarantine.
- E2E: every FLOW-01..FLOW-15 supported or explicitly disabled as deferred, keyboard-only and screen readers, localization and mobile narrow widths, offline forced disconnect and reconnect, cancellation/dispute. Test against Chromium, Firefox and WebKit.
- Security: ASVS5 mapping, code review/SAST/SCA, secret scan, SBOM/transitive-license review, privacy threats SEC-01..15, load-based anti-abuse throttling and incident drills.
- Performance (proposed baseline): P95 GET 300ms, write 700ms @100 requests/sec; barter matcher <=250ms CPU/query at <=500 vertices & <=2k edges; search result stale deletion <=60s P99; 99.9% monthly service availability. Load tests must provide fixture volume, hardware and repeated confidence intervals. No measured claim until run.
- Reliability: CI reproducible clean build with locked dependencies, lint/typecheck/migrations+rollback simulation, test gating, artifact checksums and supply chain signatures; staged rollout with health/rollback metrics; Redis/search/notification outages do not permit authorization bypass, partial write, or fabricated payment confirmation.
- Backup & restore: encrypted immutable DB PITR and object storage, RPO <=15m, RTO <=4h target; quarterly restoration to isolated environment proves decrypt/migrate/role ACLs. Retention must preserve revocation/tombstone state or purge in defined compliant manner.
- Deployment: separate API, worker, SQL, object storage, secret manager, static PWA host; health/readiness, migrating with expand/contract, ACME TLS, strict CSP, service-worker rollback and offline cache schema/version invalidation; API backward compatibility N-1 contract for 30d.
- Observability: SLO probes, redacted structured logs, tracing correlation, per-event delivery lag, queue DLQ, lock contention, payment verification provenance, abuse metrics with privacy controls. Never include message plaintext/home address in telemetry.

## Acceptance protocol (QG-003)
For every registry process: owner-approved behavior + schema + validation/error matrix + authorization policy + concurrency/idempotency + data rights + negative cases + unit/integration/e2e mapping + per-budget acceptance + test fixture. Attach links to tests/PRs/CI evidence after implementation. Only a coordinated NO-GO -> GO transition approved through SPEC_COMPLETENESS_REPORT.md can permit application implementation; specification GO does NOT imply production security or actual passing tests.
