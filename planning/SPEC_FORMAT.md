# Module specification format (`module.spec.yaml`)

**Status:** APPROVED (ADR-0015). Every module directory holds one `module.spec.yaml`. The ten process documents, the module `SPEC.md`, `PROCESS_CHECKLIST.md` and `TODO.md` are generated from it by `tools/specgen`; registries and the completeness report are generated from all modules.

Reference example: [01_LocalBazaar/04_pricing/mod_offers/module.spec.yaml](../01_LocalBazaar/04_pricing/mod_offers/module.spec.yaml).

## Top level

| Key | Rule |
|---|---|
| `id` | Module ID from [modules.yaml](modules.yaml) |
| `scope` | `MVP` or `FUTURE` (`deferral` reason required for FUTURE) |
| `summary` | One paragraph: business behavior and boundary |
| `responsibilities` / `non_responsibilities` | ≥ 2 / ≥ 1 bullets; name the owning module for excluded work |
| `depends_on` | Module IDs and `CTR-*` contract IDs required at runtime; graph must be acyclic |
| `user_stories` | ≥ 2 |
| `edge_cases` | ≥ 4 (invalid, expired, duplicate, concurrent, offline, adversarial as relevant) |
| `ux` | `screens`, `states`, `a11y` lists, or `notes` for headless modules |
| `processes` | All ten keys below; each has `requirements` (≥ 3 sentences, ≥ 20 chars). Requirement IDs are positional: the n-th requirement of process `pp` is `PS-NNN-pp.Rnn`. **Never reorder or delete published requirements; append.** |

## Processes

| # | Key | Required content |
|---|---|---|
| 01 | `domain_schema` | `entities[]` each with `name` (from catalog `owns`), `schema` (`classrup.<slug>.<entity>/v1`), `storage` (relay, device, relay+device, derived), `privacy` (P0–P4), `retention` (RET-*), `fields` (`"name?: type — constraint"`, ≥ 3), `invariants` (≥ 1); optional `sql`. Empty `entities` needs `note`. |
| 02 | `validation_rules` | `rules[]`: `"Vnn | check | ERROR_CODE"` (≥ 3) |
| 03 | `workflow_state_machine` | `machines[]`: `entity`, `initial`, `terminal[]`, `transitions[]` as `"from -> to | trigger | guard/effect"`; `timeouts[]` (may be empty). Empty `machines` needs `note`. Terminal states have no outgoing transitions. |
| 04 | `commands_queries_events` | `commands[]` {name `<slug>.<entity>.<verb>`, capability, input, output, errors[], emits[], idempotent}, `queries[]` {name, capability, input, output, errors[]}, `events_produced[]` {type, privacy, payload}, `events_consumed[]` {type, effect}, `errors[]` `"CODE | http | yes/no | meaning"`, `example`. No commands/queries needs `note`. |
| 05 | `authorization_capabilities` | `capabilities[]`: `"<slug>.<entity>.<action> | roles | conditions"`; every command/query capability declared here |
| 06 | `failure_recovery_idempotency` | `idempotency`, `concurrency`, `retries`, `offline`, `partial_failure` |
| 07 | `privacy_retention_abuse` | `data[]`, `retention[]`, `threats[]` `"Tnn | threat | control"` (≥ 2), `abuse_controls[]` |
| 08 | `observability_performance` | `metrics[]`, `logs[]`, `budgets[]` |
| 09 | `contract_and_acceptance_tests` | `tests[]` `"Tnn | level | covers | scenario | expected"` (≥ 6; levels: unit, property, contract, integration, e2e, a11y, abuse, load, chaos, manual; covers = `pp.Rnn` list); `acceptance[]` (≥ 3); optional `fixtures`, `untested` map `pp.Rnn: reason` |
| 10 | `import_export_backup_rollback` | `export`, `import`, `backup`, `migration_rollback` |

## Validation (`pnpm spec:check [--strict] [--only IDS]`)

Error codes referenced by rules or commands must be common (CTR-ERR-001), defined in the module, or defined by a module listed in `depends_on` (define once in the owner). Errors: missing sections, placeholder words (TBD/TODO/FIXME/placeholder/to be determined), undefined error codes or capabilities, events emitted but not produced, event or capability prefixes not matching the feature slug, catalog-owned entities or catalog events not specified, uncovered requirements, invalid state machines, unknown dependencies, duplicate event producers or capability owners. In `--strict` mode, missing modules, unresolved consumed events and dependency cycles are also errors. `--report` writes `SPEC_COMPLETENESS_REPORT.md` with GO/NO-GO.
