# Feature catalog and dependency registry

This package contains the read-only F15.S04.M01 feature catalog, extracted from
PR #8 at `a403614bb34d3d176d4693730e512e14959718b8` and qualified against the current
kernel. No old storage, identifier, identity or wire-format implementation is imported.

Run `corepack pnpm registry:generate` after editing `planning/modules.yaml` or a
`module.spec.yaml`. `corepack pnpm registry:check`, the normal `corepack pnpm build`
command, and Alpha CI reject stale output. The generated TypeScript data module
contains 18 features and 148 modules. Generation checks identifiers, surfaces,
unknown/self dependencies, cycles, default-state consistency and missing specs.
It uses repository-local paths, rejects symbolic links and replaces output atomically.
Scoped Git attributes keep digest inputs and generated output at LF line endings
on Windows as well as Unix, so checkout conversion cannot create false staleness.

The exported `registry` is deeply frozen. Its digest covers canonical JSON of the
catalog body; `generatedFrom` separately covers the exact catalog and spec texts.
Public query results are copies. Four read-only query definitions are exported
through `@classrup/platform` and `@classrup/platform/feature`, together with pure
list, dependency, order and hash-comparison helpers. Queries retain the kernel's
capability, flag and rate checks. Optional relay composition must explicitly grant
`platform.feature.read_registry` and supply its 100-per-minute client rate policy.
The package does not create a relay endpoint or send telemetry.

## Scope

`defaultState` and `registered` describe the specification's compiled default
policy: MVP entries default on/registered and FUTURE entries default off/unregistered.
These fields do **not** prove that a feature has runtime code, is mounted in a
composition, or is enabled for a user. Runtime completion remains tracked in
`docs/status/FEATURE_STATUS.md`. The catalog cannot grant a capability, enable a
module, change a user's flags, or admit an imported backup.

This integration completes the catalog generator, immutable data API and opt-in
query definitions. PWA Settings controls, feature-flag evaluation, relay mounting,
backup manifest diagnostics, unknown-module quarantine and target-device performance
qualification remain separate work. No claim is made that all acceptance criteria
of the wider F15.S04.M01 specification are complete. Existing application workflows,
vault records, public identifiers and signed-file protocols keep their current formats.
