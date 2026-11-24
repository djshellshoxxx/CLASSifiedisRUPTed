# ClassRup — bounded non-final attachment owner retirement (2026-11-23)

Frozen parent draft #149: `4bf7ef957a86e99c71fd05b145ca4ef49fa6e539`, tree `578162473620bd710ab71e099e5de8915f0dd092`. Main observed `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e` (merged full production codec recovery #63). Open PR inventory shows #149 as latest continuation tip, with separate drafts preserved. Child branch codex/classrup-nonfinal-owner-retirement-20261123-t33; no edits to parent or main. Native git ls-remote failed DNS; Git object publication is not a local worktree.

## Bounded feature
Add optional explicit single managed-holder retirement to P0 import. Capture type/id/ref before async work; require the actual authenticated current parent still be present in the current signed manifest, no longer reference that ref, and another current canonical owner still references it. Only after complete parent/byte verification and attachment of every current holder in the same write transaction, detach the stale canonical label. Unexpected removal or shred rolls back. Unknown labels untouched; no final-holder deletion, deleted-parent authorization, retention policy, key shredding, private/source-encrypted import, transport encryption or production codec opt-in. Old v1 backup format, identity, crypto and caps unchanged. Reuse existing bounded copy helper for stored-byte deduplication verification.
 
Regression source seeds two actual records with distinct public refs, a stale holder and unmanaged holder without the current holder, rejects attempted current-owner retirement with no bytes written, then imports and repeats stale retirement; verifies bytes and label cardinalities. Not locally executed. This is a narrow lifecycle slice, not complete deletion or retention.

## Qualification and independent review
Parent Alpha 45252915440 and CLI 45252915453 completed success at exact parent head; actual domain/typecheck/static/build/browser and Ubuntu Node 22/24 steps inspected. Zero submitted parent reviews. Child own CI and reviews pending. Historical #56 main Alpha cancellation/CLI success and #57 local exit 137 remain distinct; #57 and #63 already merged. Native worktrees and local product execution blocked by DNS. Initial handoffs, remaining-work register and relevant lifecycle/latest handoffs inspected; not an exhaustive reread of all historical handoffs. No independent worker runtime available.

Fresh review assignments, not completed:
- Code audit: inspect exact child source and tree, typed optional argument compatibility, transaction ordering and rollback, current manifest scope and stale request capture.
- Functional bug hunt: execute new ordinary lifecycle regression, existing shared import, rollback/reopen, and stale-manifest rejection serially; add dedicated encrypted reopen for retirement and verify unknown holders. Record real commands, counts and setup failures.
- Defensive security review: source-only authority/retention review; ensure no final purge, no stale current-owner authorization, no private or foreign access, no key-shred effect. Do not resume interrupted reproduction follow-ups.

Next: qualify child, independently review and add encrypted reopen/late persistence failure acceptance for this limited lifecycle; explicitly decide retention and absent-parent authority before any final deletion. Define private attachment destination-key contract separately. Merge only qualified ancestors in order after actual independent review and exact-source CI; verify actual merge tree and main push. No release, deploy, force push, deletion or paid API.
