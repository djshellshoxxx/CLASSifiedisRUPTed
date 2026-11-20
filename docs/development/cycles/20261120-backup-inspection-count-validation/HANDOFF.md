# ClassRup PWA backup inspection — coherent optional counts

Date: 2026-11-20. Repository: `djshellshoxxx/CLASSifiedisRUPTed`.

## Frozen source, branch ownership and scope

- Observed `main`: `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e` (merged PR #63).
- Frozen parent: draft PR #76 `codex/classrup-backup-inspection-error-boundary-20261120` at `0c68777462a6a1a910ade94bf5dd5a0bc0332df6`. That branch remains untouched; earlier drafts #69–#75 retain their own owners and qualification.
- Child `codex/classrup-backup-inspection-count-validation-20261120` created from the exact published PR #76 SHA, not a local-only counterpart.
- Code commit `8cba8d5f392fce8eefe55602ac1aa027ffd2a565` changes only `apps/pwa/src/backup-coverage.ts`.
- Test commit `51bd2b06716375e5606dda3c443e13d180bc9ae3` changes only `tests/integration/backup-coverage.test.ts`.
- Initial GitHub compare from frozen parent: **2 ahead, 0 behind, exactly two modified files**. Fetch this branch's final head/tree again after this handoff publication; do not assume these first two commits represent the final head.

## Bounded correctness repair

Source inspection of `readBackupInspection` and `describeAttachmentCoverage` found that an optional diagnostic **resolving** with a malformed/contradictory object would be forwarded to the formatter; source typing alone does not validate a runtime value. Examples include negative/NaN counts, a distinct reference count exceeding holder rows, mismatched missing/present totals, non-null overflow totals, or an unrecognized change to the two explicit exclusion/authority flags. This is a source-observed defensive consistency gap; there is no demonstrated storage-corruption incident.

The child now validates that successful non-overflow counts are safe integers 0–10,000, that missing + stored/excluded equals referenced, that holders are at least as numerous as distinct refs, and that both authority and v1-inclusion flags remain explicitly false. Overflow must report all four counts as unavailable (null). Invalid results are handled exactly like a failed **optional** diagnostic: return `attachments: null` and retain the valid **required** record coverage result. No raw exception text, malformed values, refs, blob bytes or holder strings enter the UI via this code path. Normal valid reports and explicit overflow reports retain existing rendering.

This presentation validation is **not** a cryptographic/authenticated attachment check. It does not improve physical backup completeness, and does not alter signed/encrypted v1 data, canonical records, signing identity, persistent storage, holder cap, transaction semantics, export admission, codecs, CI selection, timeouts or dependency versions.

## Tests authored and execution limits

Added a parameterized-in-loop invalid-report regression covering undefined values, negative and nonfinite counts, inconsistency, excessive holders, an impossible holder/reference relationship, unexpected authority/inclusion flags, and malformed overflow. Added valid overflow acceptance verifying the warning remains intact. These are **authored but not run**. Do not call them passing or count each loop iteration as a distinct Vitest case.

The exact PR #76 Alpha run `44806263595` and CLI run `44806263720` returned **queued planning jobs** at inspection, not passes. Current child needs new source-bound Alpha/domain/browser and CLI checks. `git ls-remote` failed on this host with `Could not resolve host: github.com`, preventing isolated local checkout and native product execution. Prior PR #69 exact-source hosted Alpha `44775792417` and CLI `44775792011` passed their selected gates, but that branch lacks independent review and those runs do not qualify the child. PR #56 separate main-push Alpha was cancelled; its CLI succeeded. Original Nov 19 local full domain runner exited 137 without a report. Preserve all failures, skips, cancellations, and incomplete runs separately.

## Next three distinct fresh worker assignments (not performed by this invocation)

1. **Code audit:** freeze current remote head and complete tree. Review `isCoherentAttachmentCoverage` against `AttachmentCoverage` and the kernel adapter semantics; confirm every valid adapter result (including zero counts and >10,000 overflow) is accepted, typecheck passes and no hidden contract drift exists. Examine malformed-object properties and whether false flags must be immutable at the producer.
2. **Functional bug hunt:** use a fresh isolated worktree from the remote child ref. Run `corepack pnpm typecheck`, then `corepack pnpm test -- tests/integration/backup-coverage.test.ts` and the related attachment/session suites **serially**. Check UI browser backup-inspection normal, optional fail, malformed-success, overflow and session lock. Record actual exit statuses and assertions; do not upgrade setup failures or static review to product tests.
3. **Defensive security review:** read-only source review of untrusted optional diagnostic object, tenant/reference data non-disclosure, UI DOM `textContent`, error normalization, session revocation, immutable exclusion warning, and false impression of certified backup completeness. No interrupted security reproduction follow-ups.

Independent workers were not launched by this invocation; assignments are not reviews. Inspect real submitted GitHub reviews before any merge. Finish the parent PR chain and current-source required gates first; verify actual merge tree and main's **separate** push checks. Preserve source-mapped history, original failures and all paused/unrelated automations. No release, deployment, force push, branch deletion, workflow rerun or paid external API.
