# CLASSifiedisRUPTed architecture-to-release roadmap
Status: PLANNING / SPECIFICATION NO-GO. Owners: project lead plus F01..F18 accountable feature reviewers. Dependency ordering is binding; no runtime code authorized by this document. Gate details: [SPEC_COMPLETENESS_REPORT.md](SPEC_COMPLETENESS_REPORT.md).

## Milestones (not calendar promises)
| Gate | Entry | Deliverable | Exit criteria |
|---|---|---|---|
| P1 hierarchy | Product boundaries | 18 features, 50 subfeatures, 148 modules, unique parent links | COMPLETE for initial hierarchy inventory; inspect changes in tree |
| P2 inventory | P1 stable | 1,480 planned process-spec files and ID/test registry | PLACEHOLDERS WRITTEN; not developer-ready |
| P3a shared foundations | P2 inventory | API/event/data, privacy/threat model, scope/ADR, module aggregation, E2E flows | PROPOSED docs written, reviewers outstanding |
| P3b leaf specifications | P3a contracts ratified | For every in-scope process, typed API+SQL/JSON, errors, ACL, concurrency, privacy, timing, unit/integration/e2e acceptance | Current 10 review-pending, 1,470 DRAFT; cannot declare GO |
| P3c interop quality audit | P3b leaf coverage | Full recursive link/ID/ownership check, consistent enum/schema/event versions, no unknown decision, approved deferral ledger | Zero blockers and reviewed GO report |
| P4a platform foundation | P3c GO | Build/test/CI deploy core identity auth, privacy, moderation, API, migration, event outbox, basic PWA | Automated integration/security gates passing |
| P4b local exchange MVP | P4a | Listings, coarse discovery, private messages, money claim labels, 2-party barter, 3/4/N <=8 matcher and consent recovery | Privacy/race/acceptance and device accessibility passing |
| P4c resilience and pilot | P4b | Reliability, backups/recovery, abuse controls, staged release candidate | Signed QA, third-party security and measured SLO proof |
| P4d optional feature waves | P4c, per-domain approvals | Services, auctions, rentals, provider-paid placement, crypto or FX verification, federation, identity portability, E2EE | Independent flag/ADR, legal/security approval, contract and interoperability tests |

## Versioned dependency constraints
F15/F16/F07/F10/F12/F18/F14 -> F01/F06/F08/F09 claims -> F02 -> F13/F17 integration -> controlled pilot. F03/F04/F05/F11, verified payment rails, cross-currency and >8-party routes remain disabled until their own specifications and review gates. Features may be independently scoped for MVP, but an unapproved deferral is NOT equivalent to completion.

## Acceptance artifact chain
Requirement ID -> owner module SPEC -> ten process files -> canonical contract version -> test fixture ID -> executable test file -> CI outcome -> reviewer/ADR decision -> staged release build and monitoring evidence. A changing upstream API requires dependency propagation to all consuming modules and regeneration of this trace before GO.

## Current boundary
No application implementation, runtime CI, deployment, paid rails, external federation or security audit has been conducted as part of Prompt 3. This document does not authorize them. 
