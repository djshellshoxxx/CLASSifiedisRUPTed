# Qualification — canonical SHA-256 blob reference admission

## Source / ancestry
- Frozen draft parent PR #129: `6da3dd18e77c02c565f5368d6042199b77e2b79f`. Parent Alpha `45090870673` **success** (945 domain assertions passed/0 failed/pending/skipped, 27 tooling, typecheck and build, 26 Chromium journeys). Parent CLI `45090870633` **success**, Ubuntu Node 22/24.
- New production commit: `08c50d0bc80820e809ef35e0dc199e710991d7b4`. New regression commit: `70631bf8306ab0f85ca12d9f05c03ee42a419289`. This doc and handoff add documentation-only commits. Record the published PR's final exact head/tree independently.
- Parent success does **not** qualify this child. No merge, main push, deployment or release is claimed.

## What was actually executed locally
The runtime could not resolve `github.com` for `git ls-remote`, so no checkout/worktree, pinned `pnpm`, Vitest or browser test executed locally. A standalone Node 22-compatible JavaScript sanity check used `node:crypto` to generate 4,096 SHA-256 digests, verified all 4,096 canonical base64url references pass the new predicate, and verified all 12,288 alternate low-pad-bit strings are rejected. This is **not** a product test or an independent review.

## Required actual-current-head gates
- Hosted Alpha: full repository typecheck, static/spec/boundaries/registry, money vectors, tooling, domain suite including the newly added **three-adapter** regression, setup/build, applicable browser journeys.
- Hosted CLI: actual current-head operating-system/Node selection; exact completed jobs, not a plan step.
- Independent code audit, functional bug hunt and defensive security review: genuine separately performed reviews; zero submitted/approved at this publication stage.
- Preserve failed history: #126 TypeScript `45074487619`, #126 fixture `45074614282`, #120 Firefox, #116 and #105 Alpha failures, #56 cancelled main-push Alpha `44658477772`, and original local complete-domain exit 137 with no report. Main-push CLI `44658477821` succeeded. Do not overwrite evidence with later successes.

## Review boundaries
This child changes only canonical SHA-256 blob-reference **admission**, not digest generation, crypto, signed v1 wire, owner authority, blob format, existing data, tenant policy, test caps or selection. It intentionally does **not** implement portable attachment backup. Qualify ancestors and require genuinely independent reviews before any merge. The [handoff](HANDOFF.md) assigns three next-worker scopes.
