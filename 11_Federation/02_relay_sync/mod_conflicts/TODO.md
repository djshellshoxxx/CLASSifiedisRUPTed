# TODO — F11.S02.M03 mod_conflicts

**Status:** IMPLEMENTED — Total order (revision, tombstone, smaller hash) so arrival order never matters; author-key continuity incl. migration successors; rollback/fork/override/author conflicts logged.

## Implemented
- [x] Deterministic total order: revision, tombstone precedence, smaller hash
- [x] Author-key continuity incl. migration successors; conflict log with kinds rollback/fork/tombstone_override/author_mismatch

## Code and tests
- Code: `packages/federation/src/sync/conflicts.ts`, `packages/federation/src/sync/inbound.ts`
- Tests: `packages/federation/test/sync.test.ts`

## Remaining
- [ ] Operator UI for conflict review
