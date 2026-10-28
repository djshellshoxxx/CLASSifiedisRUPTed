# TODO: F07.S02.M01 portable identity

**Status:** IMPLEMENTED

## Implemented
- [x] Unsigned document builder with public fields only
- [x] Stateless verification: signature, format, signer listed in document
- [x] Import requires signer key active on importing account; stale, future, duplicate documents rejected; optional profile apply

## Remaining
- [ ] Fetching documents from another relay over federation (belongs to F11).
- [ ] Key-rotation chains across relays (only same-key continuity).
- [ ] Process specifications in this directory are still placeholders; requirements were taken from PROJECT_SPEC.md and docs/adr.
