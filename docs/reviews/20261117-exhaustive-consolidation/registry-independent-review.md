# Independent review of the feature-registry extraction

Review target: the isolated registry port in `classrupted-registry`, based on main
`c4f733e8f2e13c38844acc84b2401209bedf4e24`, with source extracted from PR #8 at
`a403614bb34d3d176d4693730e512e14959718b8`. This reviewer did not modify product
source, tests or Git state. Review used the Caveman investigate-first and review
instructions, source inspection and isolated fault-injection probes.

## Confirmed recovery defect, repaired and independently verified

The original filesystem writer set its `created` flag only after
`writeFileSync(temp, ...)` completed. If a write created the temporary file and
then failed, its own partial `.PID.tmp` file remained. A second call in the same
process failed with `EEXIST`, even after the original write failure was removed.
The previous generated output remained intact.

An isolated Node process injected `ENOSPC` after writing a partial temporary file.
Before repair, the output was:

```json
{"first":"ENOSPC","retry":"EEXIST","prior":"previous","tempRemains":true,"temp":"partial"}
```

The integration owner changed the writer to create the temporary file using
`openSync(..., 'wx')`, track ownership immediately, write through its descriptor,
close it and clean up only an owned temporary file. The independent follow-up
injected the same failure through the descriptor path and produced:

```json
{"first":"ENOSPC","retry":"ok","prior":"previous","tempRemains":false,"final":"next"}
```

This is a low-severity generation/recovery defect, not a user-data loss or vault
vulnerability. The separate rule preserving pre-existing temporary files is retained.

## Confirmed line-ending portability issue, repaired and independently verified

No `.gitattributes` file existed in the reviewed checkout. The generator hashes
exact YAML source texts, and staleness compares the exact generated file text.
Converting the same inputs from LF to CRLF without changing their YAML meaning
therefore changes the digest and fails the normal build's stale check. This affects
checkouts configured to convert text line endings, including Windows installations
using `core.autocrlf=true`.

A read-only adapter converted every source and existing-output newline to CRLF:

- LF registry hash: `sha256-tTCcMiLdFtldMU8BIh3ooR6qsHOe4UE6OddOcSPQwWQ`.
- CRLF registry hash: `sha256-62886--b0EpcyEYwv_yajG7qk1MBkxa8HGfMYPQp_GY`.
- Strict check result: `PLATFORM_FEATURE_REGISTRY_STALE`.

The owner added scoped `.gitattributes` entries forcing LF for
`planning/modules.yaml`, all `**/module.spec.yaml` files and the generated registry
TypeScript file. This preserves exact-text digest semantics and avoids unrelated
source reformatting. Independent `git -c core.autocrlf=true check-attr eol` checks
reported `lf` for the catalog, module-spec paths and generated output.

The independent targeted command was:

```sh
node --test --test-name-pattern='line endings|partial write|disk-full|interrupted temporary' tests/tooling/feature-registry.test.mjs
```

It executed three tests and passed all three, with zero failures or skips:
pre-existing temporary-file preservation, owned partial-write cleanup/retry, and
LF attributes under `core.autocrlf=true`. `git diff --check` also passed. This is
attribute verification on Linux, not a claim that a Windows runner was executed.

## Additional checks and scope

Reviewed dependency ordering, cycle identification, unknown/self dependency
rejection, default-state validation, source/spec binding, canonical digest
construction, frozen output, copied query results, path validation, symlink
rejection, structured I/O failures, build/CI stale gates, capability checks and
optional metrics isolation.

The owner added explicit matching of parsed spec IDs to catalog IDs, rejected
null dependency lists and fixed shallow-frozen nested values. The compiled registry
and finalized values are deeply frozen, with mutable query-result copies and
private indexes. Catalog defaults are documented as specification metadata;
`registered` is not used as evidence of runtime implementation or as an authority
to enable a feature.

The module is an opt-in read-only package. This change does not mount a relay
endpoint or PWA Settings screen, mutate vault storage, replace identities or
signed-file formats, admit unknown backup modules, or enforce a new relay policy.
Capability/rate policy remains the composition owner's responsibility and is
documented as such. Target-device performance and wider feature acceptance
remain unqualified.

No additional blocking runtime/security defect was found in this bounded review.
This statement does not constitute whole-product security or release qualification.
