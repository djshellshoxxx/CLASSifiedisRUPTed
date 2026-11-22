# Qualification — encrypted attachment scope test

Parent PR #127 head `7a003dc6cb84555ac149018a19dddacc2f9661df` — Alpha 45080407537 **success**, domain 943 assertions passed and 26 selected browser journeys passed; CLI 45080407592 **success**, Ubuntu Node 22/24. Verified from actual run and domain job logs on 2026-11-22 UTC.

**Child exact-head status on publication: not yet tested.** Added one source-authored encrypted IndexedDB / fake-indexeddb integration case verifying record continuity and explicit attachment exclusion through v1 export, fresh named-vault restore and reopen. This is not portable attachment recovery, native-device interruption acceptance or a completed local RED/GREEN cycle. Local GitHub DNS prevented checkout/test execution. Obtain new Alpha/CLI and per-job results before qualification.

Independent code, normal bug and defensive security reviews: **pending, zero approvals**. PR #127 and ancestors remain unmerged/draft with review gates. Preserve original failures (#126 initial typecheck, #126 failed fixture initialization, #120 Firefox, #116 Alpha, #105 Firefox), PR #56 cancelled main-push Alpha and original full-domain exit 137. No timeout, product cap, cryptographic, wire or browser workflow changes.
