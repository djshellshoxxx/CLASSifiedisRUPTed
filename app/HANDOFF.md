# Restart handoff: ClassRup framework demo (app/)

Last updated: 2026-10-27. Scope: mock-only, synthetic-data framework demo. Not a product implementation.
The repository's specification completeness gate is NO-GO and no specification is approved. Do not treat
this demo, or any historical planning document, as approval to activate production payments, identity,
moderation, federation or privacy policy.

## Where things are

| Item | Value |
|---|---|
| Repository | `djshellshoxxx/CLASSifiedisRUPTed` |
| Integration branch | `work/classrup-haiku-framework` (also fast-forwarded into `claude/classifiedisrupted-continue-lcuuwg`, the designated branch for the continuation slice) |
| Last code commit | `f316f654f04342bba32dcf51d5db0d5f55cac394` before the continuation slice. The newest commit touching `app/scripts/checks/detail.mjs` is the latest code change: `git log -1 --format=%H -- app/scripts/checks/detail.mjs` |
| Head at handoff | the commit that adds this file (verify with `git ls-remote origin refs/heads/work/classrup-haiku-framework`) |
| Draft PR | #4 (draft, open, base `main`). Title starts with "[Draft]". Do not merge. |
| Superseded PR | #3 (`claude/pensive-mendel-30x81m`, `52bed39`). Fully contained in #4. Candidate to close. |
| Docs PRs | #2 (`docs/client-owned-foundations-20261024`, `d804b49`) and #1 (`docs/prompt3-foundations-20261022`, `39ac847`). #1 is contained in #2; #2's content is merged into #4. Candidates to close once you agree. |
| Local-only artifacts | Bundle and patches at `/mnt/session/outputs/classrup-haiku-framework/` (from before the docs merge; regenerate if needed). |

Commits added on top of PR #3's `52bed39`, oldest first:

1. `04a5764` test harness: `npm run check:browser` runs every `app/scripts/checks/*.mjs` file.
2. `fc62042` money: non-safe-integer amounts rejected; pagination handles NaN and fractional pages.
3. `735b7a3` editor: error-summary links focus their field; hrefs are `#/sell/<field>` so new tabs land on the sell page.
4. `3a4fb9e` account Save buttons work; browse paging focus moves to results.
5. `9aae16e` responsive overflow, 24px touch targets, placeholder/dark contrast CSS.
6. `bb1995f` editor/placeholder/pager fixes; `STATUS.md`.
7. `0c0124b`, `9b7e73e`, `2e0853f` barter scroll region keyboard access; browse focus after Save/Clear; check hygiene and title-bearing removal announcements.
8. `c1bd850` status update and detail.js removal wording.
9. `ce85313` import of PR #2 documentation hierarchy; `scripts/spec_audit.py` exemption for `app/`.
10. `f316f65` barter: outer section no longer a second "Trade offers" region. This is the last code commit.
11. Handoff commit (this file): the branch head after this commit is the one shown in the table above.

## How to verify

    cd app
    export NODE_PATH=/opt/npm-tools/node_modules   # only if Playwright is not installed in app/
    npm test                                       # 31 unit tests
    PORT=4173 npm start &                          # then, in another shell:
    BASE=http://localhost:4173/ npm run check:browser   # 7 files
    BASE=http://localhost:4173/ npm run smoke           # 26 checks
    cd .. && python3 -m unittest discover -s scripts -p 'test_*.py'   # 14 audit tests
    python3 scripts/spec_audit.py --check          # structural: PASS expected
    python3 scripts/spec_audit.py --semantic       # NO-GO expected (exit 1)

Last recorded results (continuation slices, Chromium only): unit 31/31; `check:browser` 7 of 7 files (221 PASS lines); smoke 26/26;
audit unit tests 14/14; structural audit exit 0; semantic audit exit 1 (NO-GO, by design). `check:browser` reports
5 focus checks skipped with a stated reason; these are not counted as passes.

## Features that work (mock-only)

- Browse: search, category, kind, max price, sort, pagination. Save toggles keep focus on the same button.
  Clear filters moves focus to the results.
- Listing detail: save toggle. "Message seller" is a labelled demo announcement; nothing is sent.
- Create listing: validation with error summary; links focus the field and do not change the route; double
  submit creates exactly one in-memory listing; draft autosave; discard dialog.
- Saved listings: persisted in browser storage; unsave updates the page; removal is announced with the title.
- Account: demo profile; Save toggles on the user's own listings.
- Barter: read-only fixtures in a keyboard-reachable scroll region. Nothing can be accepted or executed.

## Mock boundaries (must stay visible)

- Submitted listings live in memory for the page session only.
- No authentication, authorization, server, database, messaging, matching, consent, settlement or payments.
- The account page is a fixed demo profile.
- No service worker: installable manifest only, no offline behaviour.
- English strings only. No i18n framework.

## Decisions made (and where they can be changed)

- Specification hierarchy: PR #2 merged into the framework branch as-is, with only a README conflict resolved.
- Audit tooling: `app/` is exempt from the planning-hierarchy rule (`IMPLEMENTATION_TREES` in `scripts/spec_audit.py`).
  Other planning folders are still required to have SPEC and TODO files.
- Money: no maximum price. Choosing a cap is a monetary rule owned by the product owner.
- Pagination: a fractional page is floored (2.7 becomes page 2). A non-finite page becomes page 1. Before the
  change, `Infinity` returned the last page; it now returns page 1. This is a behaviour change that you may want to revert.
- Error links use `#/sell/<field>` so that a middle-click or new tab lands on the sell page.

## Open items

1. **Firefox and WebKit have not been run.** They are not installed in this environment, and installing them was
   not in scope for the work so far. Run the browser checks on them before any release-like claim.
2. **Screen-reader behaviour** is untested: editor summary focus (possible double announcement), barter region
   naming, and browse focus after Save.
3. **Infinity page behaviour** (see Decisions). Confirm or revert.
4. **Browse fallback** that focuses the results when a saved listing leaves the page is code-only. The UI cannot reach it today.
5. **Closed in the second continuation slice.** `layout.mjs` only sees the empty saved page. `scripts/checks/saved-layout.mjs`
   seeds three saved listings and checks overflow at 320/390/768/1280px and 24px touch targets at 390px. Unsave behaviour
   stays covered by `account-browse.mjs`. A shrunken Save/Unsave button fails the new check (self-check on a scratch copy).
6. **Closed in the continuation slice.** `scripts/checks/detail.mjs` now checks the detail page's Save, Unsave and demo-messaging announcements. A deliberately broken Unsave wording fails it (self-check on a scratch copy, not committed).
7. **Stale historical claims**: the `docs/...` PRs describe the NO-GO state as of their dates. Re-check them before
   relying on them.
8. **Closing PRs #1, #2 and #3** is a decision for the repository owner. Their content is in #4.

## Security and access notes

- A GitHub token was pasted into a chat earlier. It was used for pushes and to open and edit PR #4, through a
  temporary askpass helper that was deleted afterwards. It was never written to git config, the repository or
  any file. **Revoke and rotate that token.** Use a fresh token with the narrowest scope that works.
- Commit signing is configured globally but verification reports no allowed-signers file. Commits are unsigned in
  effect. Treat that as a known gap, not a verified signature.
- No credentials, secrets or private data are in the repository. The last pattern scan of added lines found none.

## Process notes

- Work was split into bounded tasks, one writer per file, one git worktree per worker, and a separate reviewer per
  diff. Workflows were pinned to `claude-haiku-5-5`. The runtime accepted that model name. The coordinator's own
  model could not be confirmed from inside the session.
- Coordinator edits after review were made directly and are noted in the commit messages. They were checked by
  rerunning the affected checks, not by a second review.
- Earlier worker checkpoints were kept on local `worker/*` branches. They are not needed to rebuild the branch.

## Next steps, in order

1. Rotate the exposed token. Then close PRs #1–#3 if you agree.
2. Decide the Infinity behaviour (keep page 1, or revert to last page).
3. Run the browser checks on Firefox and WebKit, or record that they are out of scope.
4. Do a screen-reader pass on the editor and barter pages.
5. If the demo is to be extended, pick work that does not need an approved specification and keep it mock-only.
   Do not start payments, identity, moderation or federation behaviour from these documents.
6. Before any merge to `main`, the repository's NO-GO gate must be resolved by its owner.

## Continuation slice log (mock-only; no spec approval implied)

- DONE: added `scripts/checks/detail.mjs`, a browser regression for the listing detail page: Save and Unsave announce
  `Listing saved: <title>.` / `Listing removed from saved: <title>.` and toggle `aria-pressed`; demo messaging announces
  that nothing was sent. Closes open item 6. No application source changed.
- DONE (slice 2): added `scripts/checks/saved-layout.mjs`, layout checks for the populated saved page (3 seeded cards;
  no horizontal overflow at 320/390/768/1280px; 24px touch targets at 390px). Closes open item 5 as narrowed. No application source changed.
- TESTS: all results listed under "How to verify" above, run on the working tree before this handoff was written.
  Each new check passes on current code and fails on a deliberately broken scratch copy (exit 1): Unsave wording for
  slice 1; a 10px Save/Unsave button for slice 2. Self-review of the diffs only; not independent review.
- PUSHED: branch `claude/classifiedisrupted-continue-lcuuwg`. Slice 1 is `a88dc33`, fast-forwarded from `main` `95c46be`
  through `work/classrup-haiku-framework` `0ac7f96`. Slice 2 is the commit after it. Verify with `git ls-remote --heads origin`.
  Draft PR #5 (base `main`) carries the branch. PR #4 is unchanged.
- BLOCKED: Firefox/WebKit (not installed); screen-reader pass (no assistive technology here); rotating the pasted token
  (owner action); the Infinity pagination decision (owner decision, see Decisions).
- NEXT (at most three ready tasks, each mock-only with an objective acceptance test):
  1. Open item 2 (editor part): after a failed submit, the error summary receives focus and its focus outline is visible (computed-style check).
  2. Open item 4: read `browse.js`, then either remove the unreachable results-focus fallback or cover it with a unit test. Pick whichever keeps behaviour unchanged.
  3. Open item 3 stays BLOCKED on an owner decision; do not change pagination behaviour without it.
