# Specification and client build acceptance gates

Status: planned obligations, no product implementation/test/build claim. Owners F17/F15/F16. Architecture: [client-side mandate](CLIENT_SIDE_ARCHITECTURE.md).

## QG-001 — Order

1. Reconcile hierarchy/registry/requirements, ARCH/ADR and shared contracts; complete independent architecture review.
2. Complete all required leaf and parent contracts; resolve owner/security/source decisions; independent whole-spec review gives evidence-backed GO or NO-GO.
3. Only after specification GO: pin reviewed browser tooling/dependencies and create static build/test harness, local storage/keys/permissions/disclosure. No API, SQL server, cookie sessions, secret manager or product account infrastructure.
4. Implement local listings/discovery/evidence, approved encryption/peer exchange and bounded 2/3/4/N barter; integrate in-app notices/accessibility.
5. Implement remaining specified features with exact dependency/failure contracts, then product security/device/acceptance review and reproducible build. No deployment/release authorized by this plan alone.

## QG-002 — Verifiable checks

| Gate | Required evidence |
|---|---|
| Structural documentation | audit all 1,480 IDs/paths/owners, hierarchy SPEC/TODO, real inventory paths, CSV/MD/content/checklist statuses and requirement IDs; broken links/duplicates rejected |
| Semantic documentation | exact fields/bounds/unknown-field rules, interfaces, state preconditions, typed errors, permissions, privacy/retention, concurrency/retry/offline behavior, fixtures/oracles and parent integration for every required contract; independent review evidence |
| Protocol consistency | shared canonical schema/version and real consumer compatibility matrix; reviewed signature/key lifecycle/encryption/backup format; no server authority inherited |
| Unit/property | Unicode/overflow/amount/rounding, local permission matrices, state transitions, bounded cycle oracle, duplicate/reordered messages/events and canonical signature vectors |
| Local integration | real IndexedDB abort/quota/migration/tab-race tests, local receipts/events atomic, restore/fork/revocation/quarantine, projection takedown; independent vaults explicitly may conflict |
| Peer/network faults | offline and missing adapter, lost/lying/reordered receipt, signature failure, stale revocation and clock, peer equivocation, source outage/reorg; no fabricated global lock/consent/payment confirmation |
| Privacy/security | canary key/address/message never exported/logged, XSS/CSP/dependency/update/key-use audit, unknown peer denied, local reports require sharing consent; no product telemetry or plaintext relay |
| Browser/accessibility | Chromium/Firefox/WebKit, narrow mobile, install/cache/update, keyboard and screen reader, WCAG 2.2 AA, localized canonical money, all FLOW-01..15 implemented or individually owner-approved deferral with exact disabled-path tests |
| Performance | reference hardware/fixtures/browser fixed in test plan; proposed 500 vertices/2,000 edges, matching 250ms CPU budget, incomplete flag; local draft commit target p95 200ms/p99 1000ms excluding unlock and local indexed query p95 100ms over 10k records; targets await measurement/review |
| Reliability | clean lockfile build, lint/typecheck/tests, static artifact checksum, storage denial/eviction, local export/restore, service-worker schema/update rollback; no forced remote backup or unverifiable RPO |
| Supply chain | exact release versions/hashes/licenses, SCA/SBOM/advisories, secret scan, offline/static-host origin and CSP review; no credential acquisition or package purchase |

## QG-003 — Specification versus build approval

Specification GO requires complete behavior/test contracts and independent review; executable product tests cannot be required before permission to implement them. Product acceptance later requires those tests actually run with fixture/source/build/CI evidence. Audit tooling tests prove tooling only. A simple marker scan cannot certify developer readiness or security. `SPECIFIED_REVIEW_PENDING` and structural PASS never mean APPROVED. Production money-moving protocols require separate independent security/policy review; no autonomous release.

## QG-004 — Milestone checkpoint

For each small milestone record completion/remaining scope, base and checkpoint refs, ownership, exact commands/results/failures, blockers/decisions and reproducible next steps in HANDOFF.md. Review changes/secret scan and workflow side effects before push; verify remote SHA after push. Re-read remote heads to detect concurrent authors. Merge only the concrete reviewed/tested scope; preserve unique drafts and never merge unfinished specifications as completed.
