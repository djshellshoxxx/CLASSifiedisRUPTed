# Public CLI checkout-version reporting

## Gap and plan

The F1 CLI specification names help/version reporting, but the current entry
point treated `--version` as an unsupported command. It exited 1 and printed
help to stderr. This continuation completes that bounded interface:

1. Declare one tracked unreleased development version in the root manifest.
2. Report the same value in one human line or one schema-versioned JSON object.
3. Validate the small argument grammar before reading metadata; use fixed
   failures without argument, path or metadata disclosure.
4. Resolve metadata relative to the script and work before dependency
   installation or setup, from arbitrary working directories and space paths.
5. Preserve help precedence and existing setup/public-record behavior. Verify
   no network, child-process, key or persistent-write operation occurs.
6. Independently review and qualify the combined source on the supported
   platforms before normal integration.

## Implemented interface

The only version authority is root `package.json`, whose value is
`0.0.0-development` and whose `private: true` setting remains intact.

```text
node tools/cli/classrup.mjs --version
ClassRup 0.0.0-development (unreleased checkout)
```

```json
{"schemaVersion":1,"command":"version","ok":true,"name":"classrup","version":"0.0.0-development","releaseStatus":"unreleased"}
```

The JSON form is requested with `--version --json`. Both successful forms exit
0 with empty stderr. Invalid version arguments exit 2 with `USAGE`; unavailable
or invalid metadata exits 3 with `INFRASTRUCTURE_FAILURE`. Human failures use
stderr; JSON failures use the documented versioned result on stdout. Existing
`--help` precedence is unchanged. A development value can span multiple commits,
so exact-source qualification still requires the Git SHA.

## Verification checkpoint

Six new subprocess acceptance cases failed against unchanged source, then
passed after implementation. The complete existing/new CLI suite passed 52/52
with no failures, skips or cancellations, and full TypeScript and whitespace
checks passed. The tests include a copied checkout without dependencies,
unrelated cwd and spaces, metadata authority, fixed negative output, help
without metadata, and a preload that rejects side effects. Independent review
and hosted results are recorded on the pull request against its actual head.

The implementation originated as `966a9dca`, then was transplanted onto storage
completion `054e604a`. Only its six source/test/documentation files were carried.
No rehearsal ancestry is introduced.

## Scope limits

This completes checkout version reporting. Standalone executable packaging,
persisted retained-cache access, encrypted file-vault storage, private CLI
commands and full CLI/PWA parity remain unfinished. No release, package
publication, schema or private-data format change is implied.
