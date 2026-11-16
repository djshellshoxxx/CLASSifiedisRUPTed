# ClassRup ChatGPT Zero-Codex Continuation Specification

Status: proposed. This is an advisory ChatGPT-only engineering lane, not an automatic credit detector or merge authorization.

## Objective and costs
Continue development with ChatGPT's direct GitHub connector and available execution tools. Do not use Codex CLI/cloud, paid OpenAI API, or credit-consuming agents. ChatGPT and GitHub Actions have separate usage limits and potential costs.

## Source of truth and isolation
The main README describes a planning-only baseline, while draft PR #10 contains the current local-first signed-listing/barter alpha. Inspect the exact current main, active PRs, source-pinned handoffs, AGENTS.md and nested instructions, PROJECT_SPEC.md, PROJECT_TODO.md, planning/CONTRACTS.md and ADR-0016 before every run. Do not treat draft implementation as merged.

Use dedicated `chatgpt/zero-codex/` implementation branches and `docs/handoffs/CHATGPT_ZERO_CODEX_LATEST.md` for resumable state. This lane is reserved for ChatGPT by convention, not enforced identity. Do not rewrite, rebase, close, merge, or edit other workers' branches.

## Sequential feature queue
1. Inspect and qualify PR #10's local vault, signed listings, barter alpha and CLI setup on its exact source head; identify missing integration and CI gates.
2. Finish canonical federation/recovery contracts and cross-module specification traceability without contradicting accepted ADRs.
3. Harden local record confidentiality and private-record encryption, including migration, tamper handling, key recovery and negative tests.
4. Implement quantity-aware inventory and signed consent/hold safety, with bounded cyclic barter matching and adversarial tests.
5. Improve counteroffers, recovery, handover and mobile/accessibility UX, including CLI setup/doctor parity.
6. Add canonical trace closure, OS/browser CI coverage, reproducible builds, security and regression checks.
7. Prepare a consolidated alpha qualification handoff; no deployment or production readiness claims without evidence.

## Each hourly run
- Check the previous handoff, active branches, PRs, commits and CI. If prior work or CI remains active, do not duplicate; defer to the next hourly invocation.
- Select one highest-priority unblocked independently testable slice, complete and qualify it before advancing sequentially.
- Follow existing architecture and privacy constraints: local-first, user-controlled keys, optional untrusted relays, no platform custody, explicit consent and no false anonymity guarantees.
- Add a failing regression test for bugs; implement minimally; run available pnpm spec checks, domain/integration, CLI, browser and security tests. Never fabricate passing tests.
- Commit to an isolated branch, create/update draft PRs and update handoff with base/head SHA, changed files, test commands/results, CI links, blockers and next steps.
- Work on independent tasks when external approvals block a lane. Do not weaken tests, overwrite active work, merge to main, release or deploy without separate authorization.
- Continue across hourly invocations until features are complete or as near-complete as available tools and approvals permit; record remaining gates precisely instead of inventing percentages.
