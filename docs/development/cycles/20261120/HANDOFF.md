# Mixed production-codec recovery continuation — 2026-11-20

## Source and ownership

Base is the actual qualified PR #57 merge on main: \`137d88e36cc6b1611b062daa33cf84c3d29c86b3\`, tree \`c2232f469560799d51fb6cacec2adfcc91a7897c\`. Scope is isolated to \`codex/classrup-mixed-codec-recovery-20261120\`. No other live worker's files or old local-only mapped commits are merged here. Historical draft PR #8 remains untouched.

## Changes prepared for current-source verification

- Move the PWA's existing full backup codec registry unchanged into \`apps/pwa/src/backup-codecs.ts\`, preserving order, signed validators, ownership checks, record keys, and recovery normalizers.
- Both normal PWA create/unlock and restore now pass \`productionBackupCodecs\`. The imported registry is also available headlessly for a true mixed-codec test without booting the DOM.
- Add \`tests/integration/mixed-production-backup.test.ts\`: real signed publication plus archived listing and vault-local location preferences, encrypted IndexedDB export/restore/reopen, signing identity equality, CID and owner key identity, rebuilt multi-slot indexes, and the documented location anti-probing-window reset.

This is bounded record recovery, **not** attachment/blob/delivery recovery, database-wide backup, key rotation, WebKit compatibility or a release. Existing v1 envelopes, signatures, encryption parameters, record/type caps and test timeouts are unchanged.

## Qualification and next reviewers

The new source requires fresh hosted gates. Until those jobs execute, no test pass is claimed for this new branch; the historical 803/803 domain, 78/78 three-browser and Ubuntu CLI 46-case results qualify only PR #57's exact tree, not this feature. Review this new change independently for (1) codec registry parity/source factoring, (2) normal mixed-record functional state and missing cases, and (3) defensive restore authority and key/index invariants. Record executed tests separately from static review and setup failures.

Previous PR #57 actual main merge verification: \`137d88e36cc6b1611b062daa33cf84c3d29c86b3\` has tree equal to tested PR merge \`a13b23e2227c210499f6a6ef9c8496b1d15aea28\` and candidate head \`e4bce5196e5086293234a576e3cb03697994cad8\`. PR #56 main-push Alpha run \`44658477772\` was cancelled during browser execution; its CLI \`44658477821\` succeeded. Do not rewrite that cancellation as a pass. Inspect PR #57's own main-push workflows before claiming main qualification.

Next unblocked checks after this slice: old subset backup into the expanded production registry, mixed malformed owner/key failure with destination unopened, interrupted restore rollback and normal listing/publication reader acceptance. Full attachments and delivery-state recovery require a distinct policy and authenticated manifest.
