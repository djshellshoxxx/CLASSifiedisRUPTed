# Classrupted continuation analysis — 2026-11-27

This is a source and qualification checkpoint, not release approval. The current
task is to analyze unfinished Classrupted work and continue useful implementation.
BlindMatch is the flagship direction; LocalBazaar and LocalMutiny are subsequent
products. Existing public-listing, barter, vault and recovery foundations remain
reusable. Private local intents must be erasable without identifying deletion
events, hashes, tombstones, request history or audit records.

## Sources and method

- Canonical repository: [djshellshoxxx/CLASSifiedisRUPTed](https://github.com/djshellshoxxx/CLASSifiedisRUPTed).
- Observed remote main: [`2ee8b924a71338617d6166679f3d33282ea17789`](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/commit/2ee8b924a71338617d6166679f3d33282ea17789).
- Published public direction: [PR #168](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/168),
  `f9e247f3285e5595aa2a619e73dfa7430c418d13`. This continuation preserves that
  source in ancestry and reconciles its prose with the newer local contract.
- Foundation: [PR #169](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/169),
  `9543224da6da794a2a0b9b923cc4ea718263c58b`; its
  [ownership](../20261126-blindmatch-local/OWNERSHIP.md) and
  [handoff](../20261126-blindmatch-local/HANDOFF.md) define the separate storage
  sequence and the next UI/composition slice.
- Documentation reconciliation starts from local continuation `9cd6a4cb`, after
  authenticated adapter and form-admission work. Final combined source, publication,
  CI and merge receipts must be recorded separately by the coordinator.

The review read current main's README and remaining-work register, the current
PR heads and discussions, the #169 local implementations and tests, the public
#168 documents, and actual hosted job output. It used the complete fetched git
history and `git merge-base --is-ancestor HEAD MAIN` for each open PR head.
There was no `AGENTS.md`, `CLAUDE.md` or general ownership file in main's tree.
This was not a reread of every historical handoff or a semantic revalidation of
every old patch.

## Branch and PR disposition

At the read-only census, **98 PRs were open**. **89 exact open heads were already
ancestors of main**: #60, #70, #73–#157, #159 and #160. Their disposition is
`ALREADY_IN_MAIN` at those observed heads. They need no new feature implementation
or repeat integration merely because their PRs remain open. This ancestry result
does not claim that every historical line survives later repairs unchanged.

There were **175 remote branches**, excluding the symbolic origin HEAD. Of these,
144 were ancestors of main and 31 were not. Non-ancestor refs include preserved
historical and superseded branches; 31 is not a count of unique unfinished
features. No branch was deleted, force-pushed or declared disposable by this work.

| PR | Observed head | Disposition and next gate |
|---|---|---|
| [#8](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/8) | `569fc61e1a61839578b9c34e06aed039a74ccf40` | `REFERENCE_ONLY`: paused/incompatible, 32 commits ahead and 490 behind main. Latest commit is documentation. Preserve for selective comparison; no wholesale merge or duplicate registry recovery. |
| [#162](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/162) | `aa53a52200e95974881e018408471a630e03302d` | Local record-incarnation candidate; current Alpha/CLI successful, independent review still required. First in the separately owned storage sequence. |
| [#163](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/163) | `473bc80396787b0ba6e3471d2bc26715a02e89ed` | Blocked-open lifecycle candidate; current Alpha/CLI successful. Review, synchronize and qualify after #162. |
| [#164](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/164) | `00ecaa044d3b0e62c9f2b275674d4c700bc9731d` | Terminal IndexedDB transaction settlement; current Alpha/CLI successful, independent review and prior integration required. |
| [#165](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/165) | `3f32f3aa876c6c76ed70f7aedd2d253fe51983ff` | Shared vault close settlement/inventory publication; current Alpha/CLI successful, independent review and prerequisite integration required. |
| [#166](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/166) | `33adf188b32e8eba83c9906076baaa4cc038e99f` | Await writer-lease settlement; current Alpha/CLI successful. Stacked on #165; retarget and requalify in sequence. |
| [#167](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/167) | `383c4a5e014358cf22473c9c45b0737f5ca32ab6` | `REHEARSAL_ONLY`: frozen combined qualification, not an integration shortcut. Contains older #162 `bc6866...`, not current `aa53a522...`; green results do not qualify the current combination. |
| [#168](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/168) | `f9e247f3285e5595aa2a619e73dfa7430c418d13` | Public specification candidate; preserve ancestry and reconcile stale priority/catalog/retention prose. Documentation alone does not complete runtime work. |
| [#169](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/169) | `9543224da6da794a2a0b9b923cc4ea718263c58b` | Disabled local foundation; Alpha failed in Firefox test-harness initialization. Continue in an isolated branch, preserving this source and its failure receipt. |

Submitted GitHub review lists for #162–#166, #168 and #169 were empty at inspection.
That observation does not erase cross-worker reviews recorded in their handoffs,
and those handoffs must not be represented as submitted GitHub approval.

## What is implemented and what remains

The following matrix distinguishes main, candidate code and uncompleted product
work. It is not a completion percentage. Source presence, generated requirements,
executed assertions, native acceptance and release approval are distinct.

| Area | Verified source status | Remaining work / boundary |
|---|---|---|
| Existing local alpha | Main contains encrypted vaults, owner listing lifecycle and signed-file exchange, retained public search, local barter coordination/inbox, backup codecs and explicit local recovery actions. | Development alpha; canonical federation, identity/device recovery, complete exchange recovery and broader product acceptance remain unfinished. See [main README](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/2ee8b924a71338617d6166679f3d33282ea17789/README.md). |
| BlindMatch ownership and intent store | #169 supplies PS-149, owner/revision guards, bounded private criteria, encrypted-vault composition, local erasure and draft-only backup restore. | Broader profile/inventory/account/content/derivative erasure is separate. Local erasure does not recall independent backups or peer copies. |
| BlindMatch matcher/session | #169 supplies PS-150, deterministic exact filtering, 128-candidate admission, minimal public references and abort-aware session/intent checks. | No confidential cross-user computation, externally effectful jobs or disclosure authority. Real-device resource acceptance remains open. |
| Authenticated public-candidate adapter | Continuation source `71557351` preserves the adapter change independently developed at `c97c2b702fdc93375ca05ed8a45c74555fe3f2e2`; 12 focused assertions were executed by its worker. | Combined qualification still required. More than 128 total retained records rejects the load; snapshot verification does not promise continuing global freshness or bound the whole-vault decryption cost. |
| Local editor/results composition | Chosen current implementation lane: explicit per-session opt-in, draft save/edit, explicit activation/match, pause, erase, immediate cancellation and private-view cleanup. | This analysis does not claim UI/native tests passed. Keep production launch false; verify actual lifecycle and mobile/keyboard/screen-reader behavior before activation. |
| Native browser harness | Original #169 harness failed at Firefox script insertion before domain assertions; continuation replaces that insertion with a parser-loaded same-origin fixture under unchanged production CSP. | Execute the changed harness in Chromium, Firefox and WebKit, then full exact-source gates. No unsafe-eval, CSP bypass, skipped engine or relaxed assertions. |
| Storage lifecycle | #162–#166 have source-specific hosted success and separate integration requirements. | Independent reviews and serial integration first; native connection invalidation and failed-unlock working-set cleanup remain follow-on work. This lane does not edit these owners' files. |
| Cross-party consent/disclosure | Opt-in consent foundations exist elsewhere; future BlindMatch introductions/remote authorizations are specified. | Complete owning-domain adapters, current revision/recipient/wording binding, revocation, erasure-compatible recovery and UI acceptance. Local opt-in is not cross-party consent. |
| Confidential matching/price overlap | Public requirements describe future bilateral and advanced modes. | Protocol/provider decision, leakage and trust model, real protocol evidence, independent review and target-device qualification; no provider or chain activated. |
| LocalBazaar / LocalMutiny extensions | Reusable alpha foundations exist. | Later product releases: published edits/reconsent, quantity/media, purchase/negotiation terms, exchange/handover and recovery completion. Preserve useful foundations without treating these products as the current flagship release. |
| Other product families | Specifications and partial foundations exist. | Services, rentals, auctions, live messaging, reputation and broader federation require their own qualified implementation; do not count specification files as finished features. |

## Why this continuation was selected

The failed foundation harness is a concrete qualification gap in the newest
flagship work. Authenticated candidate loading and editor/session composition are
explicit next tasks in #169's handoff. They form a useful bounded continuation
without competing with the separately owned kernel/vault sequence.

The foundation and storage candidates have no changed-path overlap, but combined
storage/backup compatibility remains a later gate. The public #168 specification
overlaps #169 in `INDEX.md`, `PROJECT_SPEC.md` and `PROJECT_TODO.md`; this documentation
merge preserves both histories, keeps F19 ownership authoritative, and marks
broader protocols as future work. No expanded private or patent-review material
is incorporated.

The implementation boundary remains explicit:

- F19 stays `FUTURE` and the production main launch gate stays false. A test-only
  mounted view can qualify component behavior without releasing the feature.
- Use the existing unlocked encrypted vault, intent codec, session controller,
  discovery schemas and real signature verifier. Never create a second private
  store or trust an unverified flag on a retained listing.
- Candidate loading receives only a fixed limit and abort signal. Private criteria
  remain inside the local matcher; no network, provider, telemetry or audit sink
  is introduced.
- Revoke the view synchronously on lock, account switch or disablement; cancel
  outside long-running job queues and reject all late callbacks. Fresh opt-in
  gets fresh store/session instances because previous revocation is permanent.
- Saving/editing produces a draft; matching and activation require explicit
  current-revision action. Reopening or restoring never resumes work automatically.
- Erase only through the existing owner-bound intent API, with no identifying
  deletion history. A late `FORBIDDEN` after persistence may conceal a committed
  write; it is not rollback evidence or permission for automatic retry.
- Results are public references to an authenticated local snapshot, not proof of
  current availability, contact permission, a reservation, a trade or settlement.

## Qualification evidence and remaining gates

The prior foundation's actual [Alpha job 140005454027](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45841309230/job/140005454027)
checked out #169 `9543224...` against main `2ee8b924...`. It reports 1,072 domain
assertions passed and 80/81 browser tests passed. Firefox failed at
`page.addScriptTag` under `script-src 'self'`; the failure happened before that
journey's domain assertions. Chromium and WebKit completed the journey. The
[CLI workflow 45841309313](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45841309313)
passed all seven jobs. The failed Alpha result remains failed; no new source
inherits a pass from those earlier results.

At the documentation base `9cd6a4cb`, the continuation coordinator reported 70
focused local assertions passing, along with specification, dependency, registry
and 27 tooling checks. The adapter worker separately executed its 12 focused
tests and typecheck; the reviewer inspected their assertions and source without
rerunning the unchanged suite. These numbers describe those sources, not completed
UI/native acceptance or this later combined candidate's full qualification.

Local native execution remains blocked: pinned browser downloads returned HTTP
403 and the system Chromium executable was missing. Successful bundling or test
discovery is not a browser pass. The combined continuation still needs its actual
Chromium/Firefox/WebKit journeys, full current-source required gates, source review,
normal integration and subsequent main-push verification. Real mobile devices,
manual screen-reader/keyboard qualification and activation decisions remain open.
No release or deployment is claimed.
