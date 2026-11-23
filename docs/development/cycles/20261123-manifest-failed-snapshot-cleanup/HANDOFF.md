# ClassRup — failed attachment manifest snapshot cleanup
Date: 2026-11-23 UTC. Isolated child of draft PR #145, exact remote parent `fba9f1883cec03ddc2ccabe797ebfaa9d41b3e38`, tree `576518e5f18fe916d4e52d8421736384106faf9e`. This is a narrow defensive repair in metadata export, NOT an attachment importer.

## Source-confirmed finding and change
In `exportAttachmentManifest`, detached blob copies were accumulated inside `storage.read` as each canonical parent was inspected. The existing cleanup `finally` ran **only after** `storage.read` resolved successfully. A later missing/invalid attachment, malformed parent, exceeded limit or adapter exception rejected the read before returning its snapshot, leaving previously copied bytes unwiped until GC. This is a transient memory-retention issue; no leak or attacker exploitation is claimed.

The producer now wraps its snapshot-gathering loop in an inner `try/catch`, clearing every already-copied blob before rethrowing. On successful reads, the existing outer `finally` continues to clear the snapshot after hashing/signing/sealing, preserving the caller's signed manifest, source storage and legacy v1 format. No cap, signature, identity, encryption or timeout is modified.

## Evidence and honest qualification
The source-specific regression sets two canonical attachment parents: one with stored bytes, one with missing bytes, and checks that an export rejection clears already-detached copies while leaving stored bytes intact. The regression is committed **test source, not a local test pass**. Native Git remote checkout and worktrees cannot be created in this host due `Could not resolve host: github.com`. GitHub Git objects from the exact published parent tree are used instead.

Parent PR #145 exact-head Alpha run [45211530385](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45211530385) and CLI run [45211530452](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45211530452) both completed successfully at `fba9f1883cec03ddc2ccabe797ebfaa9d41b3e38`. They do **not** qualify this child. Require child's own Alpha, CLI (including typecheck, domain, browser/build/CLI) and actual independent review evidence before merge. Preserve original #57 exit 137, #56 main Alpha cancellation, #140/#141 failed compiler runs and all other incomplete attempts.

## Next fresh review assignments, pending not approvals
- Code audit: inspect all synchronous/admission throws within `storage.read`, before/after Map population, and every outer cleanup path. Verify exact tree and static source; run focused tests if dependency install succeeds.
- Functional bug hunt: run the new regression and existing manifest/owner tests serially on memory and fake IndexedDB; include missing-second-parent, invalid metadata, full success, and retry without source corruption. Do not count setup failure as executed tests.
- Defensive security review: examine scratch-byte lifetime, read-transaction snapshot ownership, exception handling, signed principal binding and potential extra copies. Review/hardening only; do not resume interrupted offensive reproduction follow-ups.

Next P1 implementation still needs verified canonical parent recheck *inside* an authorized destination write, holder lifecycle, destination encryption, atomic import/rollback and encrypted reopen. No releases, deploys, merges, force pushes, branch deletion, paid APIs or unrelated automation changes in this child.
