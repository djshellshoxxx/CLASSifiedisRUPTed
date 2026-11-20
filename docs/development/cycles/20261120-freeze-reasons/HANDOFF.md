# Preserve the cause of terminal local coordination freezes

## Scope and source

This separate continuation starts at local integrated source
`796c16520365c57562c1328a73d313f3fa614ae4`, tree
`07a135e30d47c5284d120d4dad76f648c26e8444`. It must not replace a published
checkpoint while that checkpoint's hosted checks are pending.

The repair changes one production block in
`packages/mutiny/src/trade_proposals/repository.ts` and extends two existing
ordinary lifecycle cases in `tests/integration/mutiny-persistence.test.ts`.
There are no dependency, CI, codec-format, action-condition, limit or timeout
changes. The commit containing this handoff provides the worker source identity;
the integration owner must record any later integrated/published identity.

## Problem and result

Normal handlers distinguish an expired signed reservation from loss of the
actual local inventory hold. Both decisions freeze a previously committed
exchange. Reconstruction formerly passed either saved frozen decision through
the generic conflict helper before its final clock evaluation, so another
ordinary refresh could replace the recorded cause with `conflicting_promise`.

The existing verification record explicitly requires the UI to distinguish
expiry from other local loss:
[Mutiny persistence verification](../../../../planning/verification-mutiny-persistence.md).
The current [Mutiny README](../../../../packages/mutiny/README.md) requires
terminal freezes and refresh on unlock, return and timer ticks.

The reconstruction block now preserves `reservation_expired` and
`local_reservation_lost` when replay remains `proposed` or `committed`. It uses
the reconstructed state as its base, retaining genuine historical live commitment
metadata while external normalization still has no reused local verdict.
`restore_requires_review` retains its existing explicit null commitment and
feasibility fields. Already replayed terminal outcomes take precedence, and the
generic conflict fallback remains for other cached reasons.

The schema still accepts null or a reason string of at most 100 characters.
Recognized preserved causes describe local historical observations; they do not
become signed peer evidence or authority to recommit. Frozen coordination stays
terminal and requires a new negotiated proposal.

## Acceptance added to existing cases

The two extended cases use their existing real signing identities, ordinary
Bazaar reservations, signed proposals/consents and actual local commitments.
One releases the actual local inventory hold; the other advances the fake clock
past signed reservation expiry.

After the original first-freeze assertions, a shared helper checks:

- Another normal refresh, followed by IndexedDB reopen and another refresh,
  preserves the entire frozen state, cause and signed evidence.
- The inventory hold remains released, and live historical commitment metadata
  remains intact.
- Normalization of the actual saved record and repeat normalization retain the
  same cause/evidence while clearing local commitment and feasibility.
- Normalizing a detached record does not alter the live stored commitment.

These extend existing cases; they do not increase the case count. The existing
20-second default and every per-case override are unchanged. The fixture uses
real Ed25519 signatures and the ordinary IndexedDB adapter, not encrypted
identity/passphrase storage. It does not supply a native browser journey or a
whole-database recovery claim. The existing production barter acceptance covers
the separate encrypted restore-to-review lifecycle.

## Qualification state and next action

This worker performed source inspection and whitespace validation only. No
compiler or product test result is claimed. No dependencies were linked or
installed, and no remote write was performed.

An independent read-only static reviewer found no blocking issue in production
blob `0554e07aa0cead3ac61b44e75faa34dba5452a9b` and test blob
`6d1ac8b5851bc0884bd2cdf8f0e88e3a6ea288c7`. The reviewer checked active-state
gating, terminal replay precedence, reconstructed live versus normalized
commitment fields, compatibility fallback, and the ordinary fixture's exact
state expectations. This does not qualify runtime duration or native browsers,
nor every historical clock/evidence ordering in the broader replay algorithm.

The integration owner should install pinned dependencies in this worktree,
qualify full TypeScript and the affected existing Mutiny persistence/oracle and
production barter recovery suites serially, retain every actual result, and
obtain independent source review. Keep the prior checkpoint stable while doing
so. Ordinary publication remains draft until the actual current-source hosted
Alpha and applicable CLI/browser checks pass. Do not treat the earlier source's
811-case pass or a view fixture as qualification of this changed source.
