# ClassRup — bounded attachment copies and shared-owner acceptance (2026-11-23)

## Frozen source and ownership
Parent draft #148 `codex/classrup-existing-blob-integrity-20261123-t31` head `2a8e9186750da79d14eb77b14015c46df47cb2a8`, tree `2ecf698e6d3d9a85927227d566d231726f9c7599`. Main observed `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`. New isolated child `codex/classrup-bounded-attachment-copy-20261123-t32`; no parent branch edits. Open PR inventory showed #148 as newest continuation tip; existing independent branches and all prior failures remain intact. Native git ls-remote failed DNS; Git object publication is not native worktree execution.

## Source findings and code
The verifier allocated a fixed declared byte size but trusted an overridable byteLength property; the destination import's second copy used new Uint8Array(item), whose allocation follows the actual view rather than the declared size. Share an intrinsic-size check and bounded fixed-size copy across both admission and write preparation, clear failed copies, and preserve digest verification, aggregate and per-blob caps. This is source-based hardening, not an observed product exploit. No offensive reproduction was performed.

Add a normal functional shared-owner acceptance case: two canonical records share one content-addressed public blob, signed manifest has two links and one blob, v1 record restore and repeated P0 import leave two holders and correct bytes. This is a prerequisite for holder lifecycle; it does not implement detachment. Do not let final-holder purge remove bytes still referenced by a canonical record whose holder is missing. Future detach must reconcile actual records and all affected holders under the write transaction, preserve unknown/unmanaged holders, reject stale/replayed owner evidence, and defer final deletion and private-key shredding until the explicit retention and key contract is reviewed.

## Qualification
Parent exact head Alpha 45243828900 and CLI 45243829445 completed success; Alpha domain/typecheck/build/browser steps and both Ubuntu CLI jobs verified. Zero submitted reviews on #148. Child CI must qualify its own exact source; no locally executed repository tests or independent workers. Original 20261119 exit 137 and separate #56 main Alpha cancellation/CLI success remain recorded.

## Next fresh assignments (not executed)
- Code audit: check intrinsic view size, allocation, digest recheck and cleanup, shared holder semantics; verify exact source and tree.
- Functional bug hunt: execute new view-copy and two-owner cases, existing idempotence/rollback/reopen tests serially, record commands and outcomes.
- Defensive review: assess bounded copying, privacy and canonical holder lifecycle without offensive reproduction, including no deletion of still-referenced bytes.
No independent worker runtime was available. Keep these pending, not approvals. Next: explicit authenticated holder lifecycle and destination-key contract for private attachments; no release, deployment, forced update, branch deletion or paid API. Merge only after actual exact-source gates and independent reviews, then verify main.
