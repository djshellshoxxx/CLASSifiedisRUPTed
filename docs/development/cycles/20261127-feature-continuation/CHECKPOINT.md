# Feature continuation checkpoint — November 27, 2026

## Outcome and current boundary

The continuation analyzed current main and every open PR, preserved unique
unmerged work, normally integrated two storage prerequisites, and implemented
three bounded continuations: BlindMatch page concealment, failed-unlock/native
storage invalidation through the PWA, and public CLI version reporting.

The project is not feature-complete. The remaining candidates are implemented
and independently reviewed, but further integration is waiting for hosted
qualification and the actual main-push checks. New jobs have been queued before
runner allocation. No passing result is inferred from that state.

## Branch analysis

Initial main was `95eb2f1762b0130e465539a2ff22d87632819f8f`; the initial
96-PR inventory is retained in `PR_CENSUS.json`. Current inspected main is
`39cb2c7e35778ea74d8c30935f9a07b41a483262`.

The refreshed `CURRENT_PR_CENSUS.json` records 97 open PRs:

| Disposition | Count | Meaning |
|---|---:|---|
| Already in main | 89 | The exact current PR head is an ancestor of inspected main. Repeating its implementation or integration is unnecessary. |
| Qualification candidates | 6 | #164, #165, #166, #171, #172 and #173. |
| Reference only | 1 | #8 remains paused/incompatible reference material; its registry was already extracted. |
| Rehearsal only | 1 | #167 remains a qualification reference and is not an integration shortcut. |

Ancestry does not prove that every historical line remains unchanged after later
fixes. No historical branch was deleted. Publication candidates preserve their
original source parents and exclude the rehearsal ancestry.

## Normally integrated milestones

| PR | Actual main merge | Observed checks |
|---|---|---|
| [#162 record incarnation](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/162) | `c85ae69cc6d44400ee2ec1ded81487e1c211694f` | Original-head Alpha/CLI passed; actual main Alpha `46083029532` passed 1,106 domain assertions and 99 browser journeys. Main CLI `46083029499` passed all six Windows/macOS/Ubuntu × Node 22/24 jobs. |
| [#163 abandoned blocked opens](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/163) | `39cb2c7e35778ea74d8c30935f9a07b41a483262` | Reviewed head `3f32a0b7` passed Alpha `46083463521` with 1,108 domain assertions and 99 browser journeys, plus CLI `46083463478`. Actual main Alpha `46085231997` and CLI `46085231965` remain separate pending gates. |

## Active candidates and behavior

| PR | Reviewed source at this checkpoint | Resulting behavior and evidence |
|---|---|---|
| [#171 BlindMatch page lifecycle](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/171) | `66324330f7330727a8db27706e3ea26b329b5551`, tree `c818de7d` | Hiding/navigation synchronously clears the private view, revokes matching and requires fresh opt-in. The preceding unchanged BlindMatch source `9f1100a0` passed 1,106 domain assertions and all 111 browser journeys in Alpha `46083389081`, plus CLI `46083389029`. Current source includes normally integrated #163 and requires its own checks `46085521802` / `46085521801`. |
| [#164 terminal transaction settlement](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/164) | `d6b922e1a658137d8df8fe362ec2f379ecfba8f9`, tree `8cf4aea7` | Request/scheduling errors abort and drain the terminal transaction before returning. All eight focused cases and TypeScript passed. Review confirmed both #163 and both #164 added tests survive the shared insertion conflict. Hosted runs: `46084847455` / `46084847393`. |
| [#165 shared vault close](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/165) | `3b676dd1085370ecf9bf2fba20890ddc57d41f0d`, tree `c1b21b5e` | Concurrent close callers share the drain; delayed inventory work cannot restore closed state. Four close cases passed, including new controlled decrypt, digest and actual committed-write interleavings. TypeScript and independent composition review passed. Hosted runs: `46085178373` / `46085178374`. |
| [#166 writer-lease release](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/166) | `9a05e3f211b1a31c1eaa147877b01032a1c0a747`, tree `44e28cd2` | Closure awaits actual lock-manager settlement and preserves primary failures. Sixteen focused cases and TypeScript passed. All ten distinct IndexedDB cases survive; five inherited direct closes now await settlement. Independent composition review passed. Hosted runs: `46085295942` / `46085295892`. |
| [#172 storage lifecycle completion](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/172) | `054e604aac092dd34f2e1fd57fc41fb011f91e6f`, tree `c0ff79db` | Failed unlock candidates stay private and clean up before retry. Native invalidation revokes storage/signing and clears the PWA synchronously while durable operations retain their true outcomes. Twenty new domain regressions and two three-engine browser scenarios are added. Independent implementation/PWA/test review passed. Hosted runs: `46085573066` / `46085573135`. |
| [#173 CLI checkout version](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/173) | Source `7431d06f13872fb82ef4243c79222f49df136ee4`, tree `23a1da69`, before this documentation checkpoint | `--version [--json]` reports one tracked unreleased version with fixed errors and no setup/network/key/write side effects. All six new cases failed on unchanged source, then passed; the complete 52-case CLI suite and TypeScript passed both in isolation and on the combined storage source. Independent final review passed. Hosted qualification must follow the final PR head, including this documentation checkpoint. |

The detailed plans and acceptance are in `PLAN.md`, `STORAGE_LIFECYCLE.md` and
`CLI_VERSION.md`. Initial and subsequent source-specific results remain distinct.
The added close-interleaving tests reproduced the earlier close defect; the
failed-unlock tests reproduced six failures before their fix. Two independently
identified read-publication races were also reproduced before repair.

## Local qualification record

Pinned dependencies installed successfully. TypeScript, all 150 specification
checks, dependency validation, the strict registry check and PWA setup/build
passed on the combined storage source. The independent standard-library Python
money reference passed all 331 vectors earlier in the continuation.

The first broad combined run was killed with exit 137 before an assertion report.
The two-worker run then completed with 1,133 passed assertions and three timeouts
in existing encrypted-backup integration cases, for 1,136 total assertions. All
new lifecycle regressions passed. All three affected suites were rerun serially
on the clean publication source: 27/27 passed, including the previously timed-out
cases, without changing code, assertions or timeouts. The final ten-case
IndexedDB composition also passed.

The subsequent single-worker full run recorded 1,134 passes, the same backup
timeout, and a failure in the unchanged currency batch-timing benchmark
(`per[47]` measured 0.06784275 ms against the existing 0.05 ms limit). The two
affected suites then passed 42/42 unchanged in isolation. Independent inspection
found broad timing variation in unchanged identity-only work and established
that both failures occurred before any new lifecycle test body ran. It found no
concrete test leak or demonstrated correctness regression; the exact cause of
the timing variation remains unproven.

Finally, a controlled full run with two workers and other local workloads
stopped passed **all 1,136 assertions across 132 test files**, with no failed,
pending, skipped or todo assertions, in 319.1 seconds. This used the unchanged
publication tree `c0ff79db0a9dae7ed2590b71842b7c2eb7afcb9f`. No source, assertion,
timeout or benchmark limit was changed between the failed and passing runs.
The passing result does not erase the earlier observations or substitute for
hosted current-source and actual-main qualification.

The new browser file typechecks, bundles and is discovered as six engine
executions. Local browser installation returned HTTP 403, and the installed
Chromium launcher has no executable behind it. Hosted native execution remains
necessary. Synthetic page lifecycle events do not establish physical-device
backgrounding or BFCache behavior, and fake unexpected-close tests do not claim
to force a real browser process failure.

## Hosted queue observation

The oldest new run was queued at `2026-11-27T23:52:18Z`. Read-only inspection
found unassigned `ubuntu-latest` jobs with no steps, null conclusions and no
failure annotations. Pending-deployment and approval-history endpoints exposed
no approval gate. The workflow files and per-workflow/per-branch concurrency
configuration are unchanged from a successful source. #166's planning job ran,
and #164's planning job later ran, while their domain jobs and other plans waited.
At `2026-11-28T00:32:38Z`, #166 Alpha had entered `in_progress`; the current main
Alpha/CLI and the other listed candidate checks were still queued. The oldest
remaining verification sequence had been waiting since 23:52:18Z.

This supports a hosted scheduling/admission delay. The API does not establish
the underlying cause or prove an account-wide capacity condition. No workflow,
billing, timeout, browser matrix or test was weakened to bypass the queue.

## Resume order and completion criteria

1. Inspect current remote refs and actual main `39cb2c7e`; obtain successful
   outcomes for main Alpha `46085231997` and CLI `46085231965`.
2. Require current-head #171 Alpha/CLI and unchanged independent review, then
   normally merge with an expected-head guard and verify the actual main push.
3. Integrate #164, #165 and #166 serially after their own current-source checks
   and each preceding main-push check. Retarget #166 from its stacked base to
   main after #165. Confirm prospective merge source matches the qualified
   source; a newly introduced source change requires fresh qualification.
4. Retarget #172 to main after #166 and qualify its six new native browser
   executions with the full suite. Merge normally and verify actual main.
5. Retarget #173 after #172, require the final Node/platform CLI and Alpha
   results, then normally merge and verify actual main. Keep prior failed,
   timed-out, cancelled and successful evidence identified by its source.
6. Only then choose the next bounded product milestone from the reconciled
   remaining-work register, with explicit acceptance and independent review.

## Larger unfinished features

The remaining-work register still includes confidential BlindMatch protocol and
disclosure composition, actual mobile/accessibility evidence, trusted consent
UI/recovery, authenticated attachment retirement and purge, identity
delegation/rotation/recovery, canonical federation, feature settings, expanded
listing/inventory workflows, messaging/exchange, and private CLI persistence and
parity. Services, auctions, rentals and reputation depend on those foundations.

Some completion evidence requires inputs outside this checkout: actual supported
devices/manual assistive-technology review, a browser with the upstream existing-
key import repair, an authentic currency release snapshot and signer authority,
and selected independently reviewed confidential protocols or actual external
delivery services. Those requirements are not satisfied by placeholder adapters
or by setting a launch flag. Production BlindMatch remains disabled.
