# Qualification — atomic backup inspection interleaving regression

- Frozen parent: draft PR #125, head `9c348f88ec6ea9886b016135827e0a5667f50a51`, exact-head Alpha #45068797796 **completed success** and CLI #45068797718 **completed success**, all individual reported jobs successful, checked 2026-11-22 UTC.
- New isolated branch: `codex/classrup-atomic-backup-snapshot-regression-20261122`; regression added at commit `d07247ec8f45bfe6cb08fcd48ca981b2a67557af` then handoff documentation at `6d36e568ed263cec7dcc2f71064616d94c04728d`. Resolve final published source SHA and tree before claiming qualification.
- This is a source-authored regression with **no executed local RED/GREEN**; GitHub DNS prevents clone (`Could not resolve host: github.com`). No local Vitest, repository typecheck, static/build or browser check was performed.
- Hosted **new-head** full-domain, typecheck, static/setup/build, native browser journeys and CLI matrix are pending as of writing. Check actual workflow jobs after publication, not the older parent success.
- Actual independent code audit, functional bug-hunt and defensive security review are **pending**. The handoff enumerates assignments but cannot certify reviewers.
- No production code changed. Same v1 sealed wire, signing identities, encryption, canonical keys, product caps and unchanged test timeout.
- Historical original PR #120 Firefox fault-injection failure, #116 failed Alpha, #105 Firefox, cancelled #56 main-push Alpha and initial exit 137 local full runner remain recorded as their own failures/incomplete runs. No reruns were requested.
- Do not merge while draft, review or ancestor integration remains incomplete. Upon qualified integration verify actual merge tree and main's separate push qualification.

## First hosted exact-head attempt and targeted repair

- Initial draft #126 published at head `3eb57526e334155de4cdc7102ded72f7e9be747d`, tree `73aad55ffda03157d156ae36f0d17a25910e5d13`, 3 commits ahead / 0 behind its exact parent. Alpha [45074487619](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45074487619) **failed**, domain job `137368588898`, at `pnpm typecheck`. Exact observed diagnostics: TS2307 for unresolved `@classrup/kernel` import in a top-level integration test, TS2739 because the synchronous SQLite factory was assigned to `Promise<Storage>`, and ensuing TS7006 implicit-any errors from the missing type import. Domain runner, build and browser were not reached on this attempt. This is a genuine first-candidate failure, not a passing result.
- Targeted correction commit `79d2929374f8ec1b838f4107fc51e26b6d92925f`: import kernel types/functions through the existing integration-test relative path `../../packages/kernel/src/index.ts`; wrap synchronous SQLite construction in an async factory. No production code or timeout changed.
- First attempt CLI [45074487597](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45074487597) was still running when the repair was made. Do not count its outcome toward the amended head; it may complete on the earlier source. The corrected new-source Alpha and CLI runs are pending inspection.
