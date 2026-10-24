# CLASS architecture-to-acceptance roadmap

Status: specification **NO-GO**. [Client-owned architecture](planning/CLIENT_SIDE_ARCHITECTURE.md) is mandatory. All 18 features/148 modules/1,480 process contracts remain tracked. This sequence is not scope reduction.

| Milestone | Deliverable | Exit |
|---|---|---|
| M0 remote/source reconciliation | preserve main/PR1, ownership and clean isolated branch | recorded in WORK_OWNERSHIP and HANDOFF |
| M1 architecture and traceability repair | local-authority contracts, ADR conflict disposition, repaired inventories/requirements, reproducible audits | independent architecture review plus structural checks; whole-spec NO-GO remains |
| M2 foundational specifications | F15 local PWA/vault/adapters, F16 key/permission protocols, F07 identity/recovery, F10 privacy, F12/F18 local policy, F14 accessibility | domain-specific leaf contracts and reviewed dependency/schema/error/test mappings |
| M3 commerce and all remaining specifications | F01/F06/F08/F09/F02 then F03/F04/F05/F11/F13/F17 and every parent composition | complete 1,480 contracts or explicit owner-approved per-requirement deferrals; no hidden guarantee substitutions |
| M4 whole-spec gate | exhaustive semantic/cross-contract audit and independent security/architecture review | zero blockers, evidence-backed GO report |
| M5 implementation | reviewed static build/toolchain, local data/identity/privacy, features in dependency order, actual tests | requirements-to-code/test traceability; no product backend/accounts/secrets |
| M6 product acceptance | browser/offline/property/security/accessibility/recovery/performance evidence, independently reviewed enabled protocols | reproducible static build, all required acceptance passed; no deployment/release automatic |

Every small milestone requires restart-ready handoff, secret/workflow checks, named branch push and verified remote SHA. Reconcile other authors before integrating; preserve unique drafts. Specification approval is not product build success. Missing owner/source/security decisions are recorded in DECISIONS and cannot be generated into approval.
