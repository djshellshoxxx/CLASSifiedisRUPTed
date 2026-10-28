# TODO: F10.S02.M03 metadata minimisation

**Status:** IMPLEMENTED

## Implemented
- [x] filterByDisclosure deny-by-default
- [x] coarsenTimestamp minute/hour/day/week
- [x] truncateIp incl. mapped and compressed IPv6
- [x] assertNoSensitiveKeys/findSensitiveKeys (cycle-safe, depth-limited)

## Remaining
- [ ] Adoption by other packages: each feature should call assertNoSensitiveKeys in its public-DTO tests.
- [ ] Process specifications in this directory are still placeholders; requirements were taken from PROJECT_SPEC.md and docs/adr.
