# TODO — F11 Federation and portability

**Status:** IMPLEMENTED in `packages/federation` (8 modules implemented, 1 partial). See `packages/federation/README.md` and `packages/federation/traceability.json`.

- [x] Protocol, relay sync and interop implemented with malicious-peer tests (`packages/federation/test/`)
- [ ] Relay wiring: transport adapter, consent port, listing lookup, sweeper schedule (`apps/relay`)
- [ ] Destination-side migration import; transitive forwarding
- [ ] External protocol review before enabling federation by default
