# ClassRup continuation — selective PWA attachment diagnostic consolidation

Date: 2026-11-22 UTC. Draft stacked engineering candidate; **not integrated or released**.

## Exact parent / source provenance

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`. Observed `main`: `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`.
- Remote parent: draft PR #123, branch `codex/classrup-notify-fault-hook-determinism-20261122`, head `e35d434cff9a670d95dba49ed02897347944e001`, tree `df4d0f61cedfc167fc4c4389a732dad5f72b0d8c`. PR #123 exact-head Alpha 45057438866 and CLI 45057438780 **completed success** on 2026-11-22; no submitted independent reviews observed.
- Selective unmerged donor: draft PR #79, head `44e3cfdfb60e657c1b62592fac104fc45eb804ff`, with successful donor-specific Alpha 44839558559 and CLI 44839558566. This change reuses its `apps/pwa/src/backup-coverage.ts` and `tests/integration/backup-coverage.test.ts` byte-for-byte, rather than rebuilding the proven formatter/validation tests. Earlier PR #72 supplies the browser-visible three-assertion acceptance, adapted onto the **current** PR #123 browser source without losing PR #123's Firefox notification fault edit.
- The only other production edit is a constrained import and `inspect-backup` action adaptation in `apps/pwa/src/main.ts`. This is selective source integration, **not** a merge of the donor's separate commit history. No ancestor branch is modified.
- This handoff is authored in the new candidate. Resolve its published commit/tree and current GitHub workflows before any qualification.

## Behavior and safety contract

The PWA's explicit **Check backup coverage** action now displays the session's required, runtime-validated record coverage **and** a separate optional attachment/reference holder diagnostic. A valid record report is preserved if the optional attachment read throws or returns malformed/contradictory counts; unavailable attachment counts are labeled unavailable, never zero. A failed or malformed **required** record report fails with a generic error without disclosing storage details or executing the optional read. A locked/replaced session cannot publish a stale result. The DOM never renders blob IDs, holder labels, private record types or error internals.

The diagnostic distinguishes referenced blobs, missing stored blobs, present-but-excluded blob references and holder rows, including the 10,000-holder overflow contract. It explicitly states that holder labels are unauthenticated, unheld bytes are not inventoried, and attachment bytes/references are **excluded from v1 backups**. These checks are sequential diagnostics, not one atomic snapshot, not an authority proof and **not portable attachment recovery**. The v1 wire, signing identity, encryption, storage schema, limits and timeouts are untouched.

## Verification and current blockers

- **Previously executed only on donor** PR #79 head: Alpha 44839558559 success; CLI 44839558566 success. This does not qualify this new combined source.
- **Previously executed only on parent** PR #123 head: Alpha 45057438866 success; CLI 45057438780 success. These do not qualify this new combined source.
- Local `git ls-remote` still fails `Could not resolve host: github.com`; isolated local worktrees / current-source TypeScript, Vitest, Firefox and build were **not executable** on this host. The GitHub connector permits source-preserving Git object publication, but no local RED/GREEN is claimed.
- Obtain exact-head Alpha and CLI runs, inspect all required actual jobs and failures; then obtain **genuinely independent** review before integration. Preserve PR #120's original Firefox failure, PR #116's original failed Alpha, PR #105 historical browser failure, PR #56's cancelled main-push Alpha, and the original complete local domain suite exit 137 without a report. Do not convert historic failures into successes.

## Three fresh distinct successor review lanes — assigned, not yet executed

1. **Code audit:** freeze published branch SHA/tree, compare with parent and donor, confirm byte-for-byte imported helper and tests, validate dynamic types, session locking and harmless UI rendering; review that no v1 scope/wire or original PR #123 browser hook changed. Report exact source, findings and commands.
2. **Functional bug hunt:** use separate fresh worktree from published remote ref; run serial TypeScript, `tests/integration/backup-coverage.test.ts`, attachment-reference lifecycle suites, PWA build and the backup-coverage Playwright journey on Chromium/Firefox/WebKit. Exercise unavailable optional data, zero and overflow, lock during read and actual error UI. Do not start concurrent heavy domain suites or relax timeouts.
3. **Defensive security review:** source-focused only: inspect tenant scoping, invalid count rejection, exception scrubbing, session revocation and no attachment authority/recovery claims. Record hardening candidates; no exploit reproduction or interrupted follow-ups.

Keep this child draft until **its exact-head** qualification, independent reviews and ancestor integration requirements resolve. The next substantive P1 milestones remain authenticated attachment/reference recovery manifest, persisted delivery/lease policy, rotation and interrupted-device acceptance. Preserve incompatible draft #8 for selective review only. No merge, deployment, release, force push, branch deletion, paid API or unrelated/paused automation modification. Owner credit balance is unobservable.
