# Client-side specification reconciliation plan

> **For agentic workers:** execute disjoint documentation tasks with one integration owner; use independent review before product implementation. Current user delegation authorizes autonomous execution without repeated permission requests.

**Goal:** reconcile the mandatory client-owned architecture, repair traceability and complete developer-ready specifications before any product build.

**Architecture:** static PWA, local vault authority, explicit optional transport, local-only atomicity and verifiable peer assertions. No mandatory product backend/accounts/server secrets.

**Tech stack:** documentation and Python stdlib audit tooling now; IndexedDB/WebCrypto browser contracts are proposals, no application stack or dependencies installed.

**Spec:** [CLIENT_SIDE_ARCHITECTURE.md](CLIENT_SIDE_ARCHITECTURE.md), [PROJECT_SPEC.md](../PROJECT_SPEC.md), [SPEC_REGISTRY.csv](SPEC_REGISTRY.csv).

## Global constraints

All 1,480 process contracts remain tracked. Generated text and successful structural checks cannot grant approval. Preserve old branch/PR and requirement IDs. No release, deployment, purchases, payments, credential changes, destructive reset or force push. Secret-check every milestone and verify pushed branch SHA.

## Review focus

Remote receipt mistaken for consent; local lock mistaken for global exclusion; remote plaintext/key leakage; stale backup/revocation forks; closed-browser notification assumptions. Each is mapped to T-ARCH-02..07 and must propagate into affected process tests.

## Ordered tasks

- [x] Reconcile saved checkout, remote heads/PR ownership and workflow side effects. Evidence: WORK_OWNERSHIP.md.
- [x] Establish ARCH-001..010 baseline, supersede incompatible ADRs and align shared CR/CL/CB/MPF contracts. Integration owner: root files/ADRs/dependency+threat+flow+gate docs; contracts worker: four shared files plus PS-002 process bodies. Keep review pending.
- [x] Inventory worker: implement `scripts/spec_audit.py` using stdlib; produce path/ID/status/requirement/checklist/legacy-inventory findings. Repair module inventories and checklist only. Unit fixtures must catch duplicates, omissions and status drift. `python3 -m unittest discover -s scripts -p 'test_*.py'` must pass; structural audit must pass after repair, semantic gate must remain fail when drafts remain.
- [x] Independent reviewer: read actual integrated diff, verify no remaining mandatory backend claims in active foundations and no global guarantee substitutions. Write exact path/requirement findings; integration owner resolves each and reruns relevant checks. Review architecture separately from global leaf-spec completeness.
- [ ] Record milestone in HANDOFF.md with base/checkpoint refs, ownership, commands/results, blockers and exact next steps. Check staged content for secrets, inspect workflow diff, push new named branch and verify SHA. Preserve old PR; merge only an appropriate fully reviewed/tested scope.
- [ ] Complete dependency-ready F15 local vault/cache/offline, F16 key lifecycle/authz, F07 identities/recovery, F10 disclosure/export, F12 local policy and F18 jurisdiction choices. Each process must name interfaces, field bounds, state machine, errors, permissions, data rights, abuse/offline limits, test inputs/oracles and dependencies. Do not mass-label template expansions developer-ready.
- [ ] Complete F01/F06/F08/F09/F02 and all remaining features, then parent composition and every stable requirement/test mapping. A policy/crypto/owner decision that cannot be derived safely must stay explicit with exact affected requirements.
- [ ] Re-run structural+semantic audits and independent whole-spec review. Only zero blockers and evidence-backed GO permit product implementation. Implementation plan must then bind each approved requirement to code/test files and build evidence; it is not yet dependency-ready.

## Reproducible exit

Initial milestone exits with documented architecture review and structural audit, **not** project GO. Whole-task exit requires every required spec and review gate, then actual product build/acceptance. If an external owner/security/source requirement blocks continuation, record the precise action/decision and remaining work in HANDOFF.md; never silently reduce scope.
