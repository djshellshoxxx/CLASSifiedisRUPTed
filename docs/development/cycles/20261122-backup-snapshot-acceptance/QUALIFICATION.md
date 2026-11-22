# Qualification — atomic backup inspection interleaving regression

- Frozen parent: draft PR #125, head `9c348f88ec6ea9886b016135827e0a5667f50a51`, exact-head Alpha #45068797796 **completed success** and CLI #45068797718 **completed success**, all individual reported jobs successful, checked 2026-11-22 UTC.
- New isolated branch: `codex/classrup-atomic-backup-snapshot-regression-20261122`; regression added at commit `d07247ec8f45bfe6cb08fcd48ca981b2a67557af` then handoff documentation at `6d36e568ed263cec7dcc2f71064616d94c04728d`. Resolve final published source SHA and tree before claiming qualification.
- This is a source-authored regression with **no executed local RED/GREEN**; GitHub DNS prevents clone (`Could not resolve host: github.com`). No local Vitest, repository typecheck, static/build or browser check was performed.
- Hosted **new-head** full-domain, typecheck, static/setup/build, native browser journeys and CLI matrix are pending as of writing. Check actual workflow jobs after publication, not the older parent success.
- Actual independent code audit, functional bug-hunt and defensive security review are **pending**. The handoff enumerates assignments but cannot certify reviewers.
- No production code changed. Same v1 sealed wire, signing identities, encryption, canonical keys, product caps and unchanged test timeout.
- Historical original PR #120 Firefox fault-injection failure, #116 failed Alpha, #105 Firefox, cancelled #56 main-push Alpha and initial exit 137 local full runner remain recorded as their own failures/incomplete runs. No reruns were requested.
- Do not merge while draft, review or ancestor integration remains incomplete. Upon qualified integration verify actual merge tree and main's separate push qualification.
