# PS-149-04 — Commands, queries and events: Private local intents

**Status:** SPECIFIED (Stage 3). **Module:** [F19.S01.M01 Private local intents](SPEC.md) · **Scope:** FUTURE · **Code:** `packages/blindmatch/src/intents/local` · **Contracts:** [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-149-04.R01** Expose create, read, list, revise, setState and erase as an owner-bound library with structured Result errors.
- **PS-149-04.R02** Register no command-bus operation and emit no events, idempotency hashes, outbox records or audit entries.
- **PS-149-04.R03** Return detached validated rows without raw exception details or remote operations.

## Specification

### Commands

_None._

### Queries

_None._

### Events produced

_None._

### Events consumed

_None._

### Module errors

_None._

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Headless library; no HTTP or command-bus registration, emitted event or audit sink.

### Example

```
create({criteria:{query:"bicycle"},expiresAt}) returns a private draft; erase({id,expectedRevision}) removes its row.
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-149-09.T04 | integration | PS-149-04.R01, PS-149-04.R02, PS-149-04.R03 | Inspect intent storage, outbox and errors after lifecycle operations | Only the current row exists; no bus event, idempotency record, input echo or deletion history |

## Dependencies

Module depends on: F15.S02.M03, CTR-ERR-001, CTR-PRV-001, CTR-IOX-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
