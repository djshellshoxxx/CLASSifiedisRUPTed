# Engineering conventions

Binding for all code in this repository. Authoritative product rules: [PROJECT_SPEC.md](../PROJECT_SPEC.md); accepted decisions: [docs/adr](adr/README.md).

## Layout and dependency direction

```
packages/kernel     shared kernel: CTR-ID/EVT/ERR/SCH/CAP/PRV contracts, ports, money, geo, command pipeline
packages/security   F16 crypto (Ed25519, X25519+XChaCha20-Poly1305, SHA-256), authorization, secrets, replay
packages/<feature>  one package per feature (F01..F18); depends ONLY on kernel and security
apps/relay          Node relay/backend: composes packages, wires ports, HTTP API, SQLite storage
apps/pwa            installable mobile-first client
tools/              CI gates (boundaries, traceability)
```

`pnpm check:boundaries` enforces: feature packages never import each other, never deep-import, never use `node:` builtins (packages must run in the browser and in Node).
Cross-feature calls go through ports in `packages/kernel/src/contracts.ts`; the relay wires the owner's implementation.

## Module shape

- Package public API is `src/index.ts` only. Export: a factory `create<Feature>(deps, ports)` returning typed methods plus `operations: Operation[]`; `POLICIES: PolicyRule[]`; `MODULES: ModuleDescriptor[]`.
- Code path per hierarchy module: `src/<subfeature>/<module>.ts` (e.g. `src/listings/create.ts`). Tests in `test/`.
- Every state change goes through `runCommand(deps, ctx, {name, flag, request}, handler)`: flag check, idempotency, atomic writes + events, publish after commit.
- Validate every input at the operation boundary with zod via `parse(schema, input)`. Inputs are `unknown`.
- Authorize every command and every non-public query with `deps.authz.authorize(actor, permission, resourceRef)`.
- Optimistic concurrency: mutating commands accept `expectedVersion`; check with `assertVersion`.
- State machines: explicit `Record<State, State[]>` transition table + `assertTransition`.
- Time from `deps.clock`, ids from `deps.ids`. No `Date.now()`, no `Math.random()` in domain code.
- Money: `Money {currency, minor: bigint}` internally; `MoneyJson {currency, minor: string}` on the wire. No floats.
- Location: public payloads carry only `regionCell` (geohash, length <= 5). Never store or emit raw coordinates or addresses in public records.
- Errors: throw `DomainError` via helpers (`validationError`, `forbidden`, `conflict`, `precondition`, `notFound`...). Codes `AREA.REASON`. `details` never contain secrets, message bodies or locations.
- No fake success: payments, settlement, delivery and receipts are recorded as claims until independently verified.

## Naming registry

| Kind | Rule | Example |
|---|---|---|
| Operation | `<area>.<aggregate>.<verb>` | `bazaar.listing.publish` |
| Event | `<area>.<aggregate>.<verb_past>` | `bazaar.listing.published` |
| Permission | `<area>.<aggregate>:<action>` | `bazaar.listing:publish` |
| Collection | `<area>_<plural>` | `bazaar_listings` |
| Feature flag | `<area>.<subfeature>` | `bazaar.listings` |
| Error code | `<AREA>.<REASON>` | `LISTING.NOT_EDITABLE` |

`<area>` is the package name. ID prefixes are reserved per package in [ID_PREFIXES.md](ID_PREFIXES.md).

## Traceability

Each package keeps `traceability.json`: one entry per hierarchy module it owns
`{ "module": "F01.S01.M01", "path": "01_LocalBazaar/01_listings/mod_create", "code": [...], "tests": [...], "status": "implemented" | "partial" | "deferred", "notes": "..." }`.
`node tools/traceability.mjs` aggregates these into [TRACEABILITY.md](../TRACEABILITY.md) and checks that every module in INDEX.md is mapped and every listed file exists.

## Testing

Vitest (`pnpm test`), fast-check for properties. Each module: happy path, validation failures, authorization denial, invalid transitions, idempotent replay, version conflicts, privacy (no exact location/PII in public DTOs/events). Use `createTestDeps()`, `testActor()`, `ctxFor()` from kernel.
