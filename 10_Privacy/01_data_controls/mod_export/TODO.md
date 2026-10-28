# TODO: F10.S01.M03 export

**Status:** IMPLEMENTED

## Implemented
- [x] registerExporter(area, fn)
- [x] Manifest with per-section contentHash and bundleHash
- [x] Expiry sweeper drops personal data
- [x] Failure marks export failed instead of partial

## Remaining
- [ ] Asynchronous/streamed builds for very large accounts.
- [ ] Encrypting the stored bundle at rest (relay storage concern).
- [ ] Process specifications in this directory are still placeholders; requirements were taken from PROJECT_SPEC.md and docs/adr.
