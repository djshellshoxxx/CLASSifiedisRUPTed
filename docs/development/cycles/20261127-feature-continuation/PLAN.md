# Classrupted feature continuation — November 27, 2026

## Current scope and inspected source

The owner requested implementation of incomplete features, starting from current
main and unique unmerged work. The initial inspected main was
`95eb2f1762b0130e465539a2ff22d87632819f8f`, containing the gated BlindMatch local
editor and authenticated retained-listing matching from PR #170. BlindMatch is
the flagship direction. Its production launch gate remains false; confidential
protocol/provider selection and actual mobile/accessibility acceptance are
separate requirements.

The accompanying `PR_CENSUS.json` records the initial 96 open PRs against that
exact main. Eighty-nine heads were already ancestors of main. They are marked
`ALREADY_IN_MAIN` and need no repeated implementation or integration at those
heads. This is an ancestry census, not proof that every historical line is still
present after later fixes. PR #8 is a selective historical reference; the
registry has already been recovered. PR #167 is a qualification rehearsal and
must not be used as an integration shortcut. No historical branch is deleted.

## First feature: private BlindMatch page lifecycle

The BM-T02 acceptance register requires hiding to invalidate local matching.
The existing component handled cancel, disable, lock and account replacement,
but registered no visibility/page navigation handlers. The vault's five-minute
hidden-page timer left private form fields and match results in the view during
that interval.

1. Revoke the component's generation and opt-in synchronously on hidden
   `visibilitychange` or `pagehide`; cancel matching and clear forms, intent
   cards, results, errors and status.
2. Reject hidden/suspended-page admission, including delayed callbacks and
   programmatic opt-in. A visible page or `pageshow` permits only a new explicit
   opt-in; it never resumes matching or restores unsaved fields.
3. Remove lifecycle listeners during destruction and retain existing durable
   write semantics. Concealment does not claim that an in-flight committed save
   was rolled back or that saved encrypted intents were erased.
4. Qualify the actual component with synthetic data, real vaults and signatures:
   synchronous concealment, unsaved-edit clearing, aborted delayed loading,
   unchanged saved content, fresh matching and stale-result rejection.
5. Run current-source gates and independent review before normal integration.
   Synthetic lifecycle events in native browser tests do not establish actual
   OS backgrounding, mobile behavior or back/forward-cache qualification.

## Next feature: complete the bounded storage lifecycle sequence

Independent review identified five unique candidates. Integrate them serially,
refreshing main and qualification at each boundary:

| PR | Existing bounded change | Integration requirement |
|---|---|---|
| #162 | Local record incarnation, migration and failure recovery | Independent code/functional/defensive review, exact-head checks, ordinary merge, then actual main-push verification. |
| #163 | Abandon blocked IndexedDB opens safely | Synchronize with qualified main; preserve late-upgrade and late-success regressions. |
| #164 | Await terminal IndexedDB transaction settlement | Preserve all #163/#164 tests when resolving their shared insertion conflict; qualify the combined source. |
| #165 | Shared vault close settlement and guarded inventory publication | Review against the integrated terminal-settlement behavior and qualify. |
| #166 | Wait for writer-lease release settlement | Retarget from its stacked base after #165; preserve release failures and concurrent-close behavior. |

After these prerequisites, finish native connection invalidation and failed-
unlock maintenance cleanup as separate tested changes. Stop stale reads and
callbacks, drain terminal durable operations before lease release, and preserve
successful commit outcomes. Do not turn a local marker into authenticated
lineage or destructive authority.

## Verification boundaries

Pinned Node-compatible pnpm 10.28.0 dependencies installed successfully. The
money reference uses Python's standard library and needs no additional package.
Local pinned browser downloads returned HTTP 403; the installed Chromium
launcher points to a missing executable. Local compilation/discovery is not
native browser execution. Hosted Chromium/Firefox/WebKit gates remain required.

Each milestone records its actual source, observed checks and remaining gates.
No feature completion percentage, comprehensive security certification or
production release is inferred from source presence or generated trace counts.

