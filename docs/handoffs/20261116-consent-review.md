# Fresh communications review — November 16, 2026

Reviewed the communications team's handoff and current shared working tree on
`codex/parallel-completion-20261116`, relative to baseline PR #41 at
`560b328dd335aebdc12de01ec339c43ebd164be3`. This is independent review evidence
for the bounded consent core and notification signer fixes, not release approval.

## Required findings and resolutions

1. **Repeated revocations could consume reserved withdrawal capacity.** The
   inbound path accepted a new CID revoking an already revoked consent. An
   independent reproduction accepted ten consents, then ten distinct revocations
   of the first consent; withdrawing the second returned `RATE_LIMITED`. The
   writer now rejects a new-CID revocation of a terminal target while preserving
   exact-CID replay. The independent reproduction now accepts the first
   revocation, rejects the nine duplicate terminal attempts with
   `COMMS_CONSENT_NOT_REVOCABLE`, and permits withdrawal of another consent.
   A regression in the test suite also checks that the rejected attempt stores no row.

2. **A replay was checked against the wrong key-validity time.** Source review
   found that inbound verification used the current receipt time before checking
   whether the CID was already retained. A key revoked since first acceptance
   could therefore make a previously accepted statement fail on replay, while
   the read verifier still accepted its original first-seen evidence. The writer
   now parses the bounded statement, looks up its CID, and re-verifies signature
   and CID against the retained first-seen time when present. The new regression
   covers the original replay without another event and rejection of a fresh
   statement first seen after the key cutoff. An independent post-fix script
   also confirms replay acceptance after the cutoff; its older subject revision
   remains correctly `stale`.

## Verification performed

- Independent consent plus notification preference/channel run: **40/40 passed**
  after the first fix. This does not include the subsequently added first-seen
  regression.
- Independent final consent-only run: **12/12 passed**, including both review
  regressions, signature corruption, subject and wording binding, authorization,
  monotonic withdrawal, clock suspicion and saturation.
- Independently recomputed the initial withdrawal-saturation reproduction before
  and after its fix using the production module and real Ed25519 signatures.
- Reviewed the narrow notification changes: requested signer sequence and previous
  CID are checked before state changes; inbound mirror sequence must match its
  signed payload sequence. The passing combined run includes these regressions.

Reproduction commands for the regression suites:

```sh
corepack pnpm exec vitest run packages/comms/src/negotiation/consent/consent.test.ts --maxWorkers=1
corepack pnpm exec vitest run packages/comms/src/negotiation/consent/consent.test.ts packages/notify/src/preferences/in/in.test.ts packages/notify/src/preferences/opt/opt.test.ts --maxWorkers=1 --no-file-parallelism
```

## Integration boundary and next handoff

No remaining high-confidence defect was identified in the reviewed bounded core
after these fixes. This statement does not close the canonical module's missing
work. The package is deliberately opt-in and has no product composition or
registered backup codec. Missing subjects and original revocations are rejected;
the specified quarantine and out-of-order replay protocol are not implemented.
Delegated local signing/device lifecycle, owning-domain canonicalizers and wording
UI, cross-record backup validation, retention, transport and browser/acceptance
qualification remain pending as listed in the writer's handoff and package README.

Before enabling this core in the PWA, a fresh team must implement those owning
domain and backup boundaries, preserve revocation evidence on restore, and verify
the complete user journey. The existing alpha barter consent format is distinct;
do not silently interpret one format as the other or infer delivery/settlement
from a consent signature. Full project and F08/F13 completion are not claimed.
