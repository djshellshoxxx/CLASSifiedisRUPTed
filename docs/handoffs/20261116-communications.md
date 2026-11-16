# Communications and notifications milestone — November 16, 2026

Baseline: PR #41 `560b328dd335aebdc12de01ec339c43ebd164be3`.
Working branch: `codex/parallel-completion-20261116`.
Owner: communications team. Changes are in the shared tree for root integration;
this handoff is not evidence of a pushed commit, CI qualification or release.

## Changes delivered for review

- `packages/comms/src/negotiation/consent/{statement,index,consent.test}.ts`:
  exact domain-separated signed consent core, participant and wording binding,
  historical revision checks, immutable signature evidence, local authorization,
  conflicts and monotonic signed revocation, content-address replay protection,
  read-side cryptographic verification, bounded evidence and withdrawal reserves.
- `packages/comms/src/index.ts` and package manifest expose that real runtime.
  `packages/comms/README.md` documents its ports and incomplete surrounding paths.
- `packages/notify/src/preferences/{in,opt}/index.ts` bind verified signer output
  to the requested sequence and previous CID. The relay preference mirror also
  checks envelope sequence against payload sequence. Corresponding tests use
  genuinely signed but mismatched outputs and check transaction rollback.

## Verification

The final focused run passed 41/41 assertions across three files (12 consent
tests and 29 existing/new notification preference and channel tests). Fresh review
found and the implementation fixed repeated-revocation saturation and first-seen
key validity on CID replay. Regression tests cover both fixes, corrupted stored
signatures, exact remote revocation targets and signer sequence/previous-CID
rollback. The tests completed in 14.76 seconds on this host.

Commands:

```sh
GOMEMLIMIT=256MiB GOMAXPROCS=2 corepack pnpm exec tsc -p packages/comms/tsconfig.json --noEmit --singleThreaded
GOMEMLIMIT=256MiB GOMAXPROCS=2 corepack pnpm exec tsc -p packages/notify/tsconfig.json --noEmit --singleThreaded
corepack pnpm exec vitest run packages/comms/src/negotiation/consent/consent.test.ts packages/notify/src/preferences/in/in.test.ts packages/notify/src/preferences/opt/opt.test.ts --maxWorkers=1 --no-file-parallelism
git diff --check
```

Scoped TypeScript checks passed; a final retry includes the review regressions.
Root must run aggregate typecheck/tests after all teams have converged; this handoff does
not reuse predecessor CI as evidence for these changes.

## Fresh team review targets

1. Independently review signature bytes/CID binding and subject/key/wording ports.
   Fresh reviewer found and verified fixes for terminal revocation admission and
   exact-CID replay using the original key first-seen time; do not regress these.
2. Exercise conflicting consent, decline and revocation; time claims must never
   select a winner and a saturated normal evidence budget must permit withdrawal.
3. Check stored-record and backup boundaries. Read verification rechecks signatures;
   no backup codec is registered, so enabling the domain in the PWA is blocked.
4. Check missing original/subject handling and semantic duplicate behavior against
   canonical requirements. This version safely rejects missing dependencies and
   retains distinct inbound CIDs. It does not claim full quarantine or aliasing.
5. Check the narrow notification fixes against all inbox/preferences/channel tests.

## Next dependency-ready work

- Owning-domain adapters and actual wording/confirmation UI, with transactional
  canonical subject reads; commerce team was notified of the interface.
- Seven-day quarantine with bounded admission, key/subject arrival replay and
  revocation-before-original handling; independent abuse tests before enabling it.
- Cross-record encrypted backup/restore codecs preserving all terminal evidence.
- Authenticated device-key lifecycle and canonical transport acknowledgement.
- Quiet-hours schedule/dispatch: current contract requires pinned IANA tzdata,
  a DST-correct pure evaluator and real external channel dispatch gates. None of
  these is supplied by the current runtime. No setting that falsely claims to
  suppress alerts was added. Local inbox remains immediate, as the contract says.

Private messaging/attachments, meetup workflows and the full notification release
contract remain unfinished. This milestone completes a bounded reusable core and
repairs existing signer validation; it is not full F08/F13 completion.
