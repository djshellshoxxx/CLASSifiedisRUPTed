# Full-registry follow-up: validation attempts

## Source identities

The original full-registry source `99cce1075e066acaefd863d59d23a6fea51f988c`
passed TypeScript and nine selected recovery cases. Its unchanged receipts,
first qualification and independent review remain in the first-round archive.

Independent review then identified a narrow oracle limit: the fixture matched
notification source IDs and dedupe keys, but did not separately require every
dedupe payload to point to the actual inbox item. The one-line assertion in
`4a693cba0483b92b0df2459f8c9794be202b7c9a`, tree
`bccd3e4c94abfc05f2c39d0072264e6f14a9df6b`, closes that limit. Removing that line
reproduces the earlier test bytes exactly. No production or project-config change
accompanies it. The following attempts all used this unchanged final source.

## Every recorded follow-up attempt

| Attempt directory under `evidence-round2/` | Full TypeScript outcome | Domain outcome |
|---|---|---|
| `g11-full-registry-recovery-round2` | Signal 9 (`-9`), 2.889 s, empty log; Node heap option 1,024 MiB | Not started |
| `g11-full-registry-recovery-round2-retry` | Signal 9 (`-9`), 10.921 s, empty log; same source/command/options | Not started |
| `g11-full-registry-recovery-round2-lowheap` | Signal 9 (`-9`), 2.436 s, empty log; Node heap option 512 MiB | Not started |
| `g11-full-registry-recovery-round2-native` | Exit 0, 13.447 s; Node heap option 1,024 MiB plus explicit native-runtime controls | 9 passed across 3 files, exit 0, 24.760 s |

The runner stopped after each killed compiler, so those attempts have no test
report and correctly list the three selected files as missing. They are failed
validation attempts, not partial domain passes. No earlier passing source is
substituted for them.

The successful attempt retained `tsc -p tsconfig.json --noEmit`, the same full
project configuration, the same three test files and unchanged test assertions.
Vitest used one fork worker, no file parallelism and the original per-case
timeouts. The outer compiler/test limits remained 300/900 seconds. The enlarged
barter lifecycle completed in 7.970 seconds inside its 30-second case limit.

## Native compiler observation and resource controls

Inspection of the installed TypeScript 7.0.2 package found that `bin/tsc` loads
`lib/tsc.js`, which resolves and executes a platform-native binary. On this
Node/platform combination the launcher can replace itself with that executable;
its fallback spawns the same binary. A Node V8 heap option does not by itself
limit the native compiler's memory.

The inspected Linux x64 executable has 24,101,026 bytes and SHA-256
`4f2de678286401759b3fb4475bafe35b8f32b4b3a07d92642bbf37eadc9b34a4`.
Its embedded runtime version is Go 1.26.4, and its bytes include the native
runtime controls used below. The path, size, digest and inspection are preserved
in [the executable receipt](evidence-round2/g11-native-compiler-inspection.json).
The package/executable matched the previously passing worktrees during the
independent read-only inspection.

The successful validation explicitly set `GOMAXPROCS=1` and
`GOMEMLIMIT=384MiB`. The [Go 1.26.4 runtime documentation](https://pkg.go.dev/runtime@go1.26.4)
defines these as a limit on simultaneous execution of Go code and a soft runtime
memory target. The latter is not a hard process RSS cap. The recorded cumulative
child maximum RSS was 728,624 KiB, so the result must not be described as a
384 MiB peak-memory measurement. Both compiler and test receipts retain the
exact environment values.

The process kills produced no diagnostic. Host cgroup kill counters were not
available to this inspection. The source/type review found a simple
`StoredRecord<unknown>` payload and a flat two-string expected value, with no
new recursive type or config expansion. These observations and the later pass
do not prove that the earlier cause was memory exhaustion, a compiler defect
or any other particular mechanism. The cause remains unconfirmed.

## Retained evidence and disposition

The [follow-up manifest](evidence-round2/archive-receipt.json) covers all three
killed attempts, the successful attempt and executable inspection: 16 entries,
16,022 original bytes and 12,203 stored bytes. The separate original six-entry
archive remains unchanged. Gzip timestamps are zero and both forms retain their
recorded SHA-256 digests.

The final source has a complete local compiler and selected recovery pass.
No further local rerun is needed for unchanged executable bytes. Actual
current-head hosted Alpha/domain/browser and applicable CLI qualification remain
required before integration. No workflow or product configuration was modified
to obtain this local result, and no restricted native-browser operation was
retried.
