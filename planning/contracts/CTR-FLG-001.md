# CTR-FLG-001 — Feature flags and module configuration

**Status:** APPROVED. **Owner:** F15.S04 (configuration).

- **FLG-1** Flag key = module ID (`F04.S01.M01`) or feature ID (`F04`); values `off | on | beta(roles)`; stored per tenant in configuration records owned by F15.S04.M02.
- **FLG-2** A feature flag off ⇒ all its modules off. Dependency rule: a module can be `on` only if all modules it lists in `depends_on` are on; the configuration command rejects violations with `PLATFORM_FLAG_DEPENDENCY`.
- **FLG-3** Disabled module ⇒ its commands/queries return `FEATURE_DISABLED`, its event consumers stop (events stay in outbox up to 7 days), UI hides entry points. Data is retained, not deleted.
- **FLG-4** Defaults: core MVP modules `on`; modules with `scope: FUTURE` are `off` and not registered.
