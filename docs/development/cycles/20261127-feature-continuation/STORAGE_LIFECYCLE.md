# Storage lifecycle completion candidate

This is the follow-on implementation checkpoint for the bounded storage
lifecycle work in `PLAN.md`. It does not declare all ClassRup features complete,
activate BlindMatch, or establish migration/deletion authority.

## Problem and implementation sequence

The existing storage candidates fix abandoned opens, terminal transaction
settlement, shared vault closure and actual writer-lease release. They leave two
observable gaps: failed unlock maintenance can expose a decrypted candidate,
and native IndexedDB invalidation can leave an apparently usable session and
private screen behind.

1. Keep unlock candidates private until authentication and maintenance settle.
   During opening, the public handle remains root-only and rejects writes or a
   competing unlock. On failure, discard keys, header and inventory; drain the
   candidate and refresh the sealed root from the actual durable snapshot.
   Migration may already have committed. Retry is allowed only after successful
   cleanup; otherwise the handle closes while preserving the original failure.
2. Add one native invalidation signal with fixed causes `versionchange` or
   `connection_closed`. Install native listeners before the writer claim.
   Reserve shared close settlement before notifying subscribers, request native
   close immediately, drain admitted native work to complete/abort, then await
   the lock manager's release settlement.
3. Propagate invalidation through generic and encrypted storage and the exposed
   vault session. Revoke fresh and queued admission, retained transaction
   methods, active reads and the signer. Check reads at each public publication
   boundary. A successful admitted durable write still reports success; closure
   must not falsely report rollback. Preserve operation and cleanup failures at
   their respective interfaces.
4. Subscribe during PWA composition before publishing the workspace. Invoke the
   existing lock path directly when invalidated, clearing private views and
   forms synchronously before awaiting cleanup. Remove the listener when the
   view is disposed and retain the existing reopen barrier.
5. Qualify the native connection and production page in Chromium, Firefox and
   WebKit, then normally integrate after the prerequisite chain and verify the
   actual main push. Source presence, compilation and browser discovery are not
   substitutes for these execution gates.

The source commits used to assemble this candidate are failed-unlock cleanup
`f9bbf044`, native invalidation `363af780`, PWA wiring `6788c7f7`, and native
browser acceptance `93ebe729` plus `c79df111`. Only their changes were
transplanted. The rehearsal branch is not an ancestor of the publication
candidate.

## Prerequisite provenance

| Milestone | Reviewed qualification source | Observed checkpoint |
|---|---|---|
| #162 record incarnation | `e0751c15` | Normally merged as `c85ae69c`; actual main Alpha `46083029532` and all six platform/Node CLI jobs in `46083029499` passed. Main log records 1,106 domain assertions and 99 browser journeys passing. |
| #163 abandoned opens | `3f32a0b7` | Alpha `46083463521` passed 1,108 domain assertions and 99 browser journeys; CLI `46083463478` passed. Normally merged as `39cb2c7e`; its actual main checks remain pending at this checkpoint. |
| #164 terminal settlement | `d6b922e1` / tree `8cf4aea7` | All eight IndexedDB cases and TypeScript passed locally; independent composition review found no missing regression or source change. Hosted current-source qualification remains pending. |
| #165 shared vault close | `3b676dd1` / tree `c1b21b5e` | Four close cases and TypeScript passed. Independent review confirmed original changes plus controlled decrypt, digest and durable-commit interleavings. Hosted current-source qualification remains pending. |
| #166 writer-lease release | `9a05e3f2` / tree `44e28cd2` | Sixteen focused cases and TypeScript passed. All ten distinct IndexedDB cases survive; five inherited direct close calls now await release. Independent composition review found no blocker. Hosted current-source qualification remains pending. |

BlindMatch candidate `9f1100a0` passed Alpha `46083389081` (1,106 domain
assertions, 111 browser journeys) and CLI `46083389029`. Its twelve new browser
executions use synthetic page lifecycle events with real vault/signature
composition. They do not establish physical-device backgrounding or actual
BFCache behavior. Synchronization with current main is a separate gate.

## New regression evidence

Failed-unlock cleanup adds six cases, all reproduced failing before the fix.
The focused combined encrypted/vault run passed 27 cases. Native invalidation
adds fourteen cases: six generic storage, five native adapter and three vault
cases. Two independently found read-publication races were reproduced failing
and then fixed at the direct read-mode transaction and exposed session read
boundaries. The reviewed native source passed generic lifecycle coverage (39
cases), native/encrypted/vault coverage (43 cases), the existing close test,
and a final six-case close-interleaving/vault-invalidation run. These executions
overlap and must not be summed into a unique test count.

Independent source review found no remaining blocker in the final native
implementation, failed-unlock composition or PWA listener. Local TypeScript,
150/150 specification checks, dependency checks, strict registry checks and the
PWA build passed on the assembled source. One broad local run was killed with
exit 137 without an assertion report; a two-worker retry is recorded separately
when it finishes. The new production browser file typechecks, bundles and is
discovered as six engine executions; hosted execution is still required.

The native fixture requests a real IndexedDB version upgrade and aborts it to
preserve schema/data. It checks revocation of held/queued/fresh reads, retained
transaction methods and signing, then reopens the same principal and exact
saved row. The production-page case checks private DOM and form clearing inside
`onupgradeneeded`, followed by recovery of only saved owner and peer records.
Unexpected native connection failure is covered through fake IndexedDB; no
browser test claims to force a real browser process/storage failure.

## Limits and remaining features

Ordinary explicit close does not fabricate a native invalidation event. Read
revocation and durable-write outcome reporting have deliberately different
publication rules. Clearing JavaScript references is not a claim of secure
physical memory erasure. There is no new schema, backup format, protocol,
destructive journal, provider, release or launch-gate change.

The relevant native ordering is specified by [IndexedDB database closing
steps](https://www.w3.org/TR/IndexedDB/#database-closing-steps) and the
[Web Locks request lifecycle](https://www.w3.org/TR/web-locks/#locks).

The broader backlog still includes confidential BlindMatch protocols and
device/accessibility evidence, consent composition and recovery, authenticated
attachment retirement, identity rotation/delegation, canonical federation,
feature controls, private messaging/exchange workflows and the private CLI.
The public CLI's missing version command is a separate bounded continuation;
finishing it will not establish standalone packaging or private-vault parity.
