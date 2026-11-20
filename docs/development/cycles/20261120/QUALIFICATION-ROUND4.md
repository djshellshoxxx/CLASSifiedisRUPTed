# Round 4 qualification and source evidence

## Source identities

Original PR #58 source: `38ada90037d8176b0e0e319651b712cc396cad5d`, tree
`8502bd83d5393a7513ee0a939df63d5d3665068d`.

Integrated runtime/test source: `d92f20bcdba146cd5d3d482ee830210e2bdb1ae2`,
tree `0238e6ad6a9add7d712e3b5bf5ff0eabf993d870`. This adds normal-reader
recovery acceptance and the narrow PR #8 redaction adaptation. Later
documentation/evidence commits do not change runtime or tests. Publication
must verify that equality and record the actual remote head/tree.

The local environment used Node 24.22.3 and a successful frozen installation
with pinned pnpm 10.28.0, TypeScript 7.0.2 and Vitest 5.1.0. No dependency,
workflow, product cap or test timeout changed.

## Executed checks

| Check | Source | Observed result |
|---|---|---|
| Complete TypeScript check | Original PR #58 | Passed, exit 0 |
| Mixed-codec/subset/rollback cases | Original PR #58 | 4 passed, 0 failed/pending |
| Complete monolithic local domain attempt | Original PR #58 | Incomplete: SIGKILL after 257.938 seconds; no final report |
| Complete TypeScript check | Integrated source | Passed, exit 0 |
| Reader and logger focused cases | Integrated source | 11 passed, 0 failed/pending |
| Complete domain suite in eight serial groups | Integrated source | 811 passed across all 89 files; 0 other statuses |
| Specification consistency | Integrated source | Passed |
| Dependency boundaries | Integrated source | Passed |
| Strict feature-registry check | Integrated source | Passed |
| Independent Python money vectors | Integrated source | Passed |
| Money browser bundle budget | Integrated source | Passed |
| Tooling tests | Integrated source | 27 passed; 0 failed/cancelled/skipped/todo |
| CLI unit/negative/repeat-setup tests | Integrated source | 46 passed; 0 failed/cancelled/skipped/todo |
| Setup, repeat setup, doctor and production build | Integrated source | Each passed |
| Pinned browser installation | Integrated source | HTTP 403 downloading Chromium; no browser journey |
| System Chromium smoke | Integrated source | Launch blocked by `socket() failed: Operation not permitted`; no page opened |
| Hosted Alpha and CLI workflows | Published head required | Pending current-source qualification |

The 11 focused cases overlap the complete 811-case suite. Do not add them to
that total. The earlier four cases qualify the original PR source. Local CLI
unit tests do not establish the hosted OS matrix or real-browser smoke gate.

## Complete-domain accounting

The original monolithic attempt used one thread worker and a 2,048 MiB Node
heap cap. The wrapper returned `-9` (SIGKILL); its cause is not established.
Its receipt and empty captured log remain archived. No case count is inferred.

The integrated run used eight finite sequential Vitest shards, isolated fork
workers, one worker at a time and a 1,024 MiB Node heap cap. Each subprocess
had a 900-second process cap; all existing per-test limits remained unchanged.
There were no retries, skipped cases, assertion changes or CI-selection changes.

| Shard | Files | Passed | Exit |
|---|---:|---:|---:|
| 1/8 | 12 | 65 | 0 |
| 2/8 | 11 | 60 | 0 |
| 3/8 | 11 | 74 | 0 |
| 4/8 | 11 | 97 | 0 |
| 5/8 | 11 | 152 | 0 |
| 6/8 | 11 | 92 | 0 |
| 7/8 | 11 | 129 | 0 |
| 8/8 | 11 | 142 | 0 |
| Total | 89 | 811 | All passed |

Vitest's manifest independently matches the configured file globs. Report
paths match the manifest exactly, without missing, unexpected or duplicate
files. Every suite succeeded and every case status was `passed`. Independent
review recounted all reports and checked all 16 log/report SHA-256 digests.
See [the integration review](INTEGRATION-REVIEW-ROUND4.md). This complete local
sharded execution does not relabel the killed attempt or replace hosted gates.

## Browser limitations

The pinned installer stopped on HTTP 403 for Chromium 156.0.8078.4. Firefox
and WebKit were not installed by that unsuccessful command. System Chromium
156.0.8078.79 was available, but the normal smoke script exited 1 when the
browser's singleton socket was denied at launch. No browser reached the app.
Its complete log and receipt are archived. No restriction was bypassed and
no application check was weakened.

Hosted Chromium/Firefox/WebKit journeys and applicable CLI jobs remain required.
Native WebKit existing-key import compatibility is a separate pre-existing
limitation; ordinary journey success does not close its diagnostic vectors.

## Evidence and review

[The archive receipt](evidence/round4/archive-receipt.json) records original and
stored byte lengths and SHA-256 digests. Full logs/reports use deterministic
gzip headers. Adjacent receipts retain sources, commands, process settings,
durations, return codes and counts.

- [PR #58 source review](CODE-REVIEW-ROUND4.md)
- [PR #58 defensive review](DEFENSIVE-REVIEW-ROUND4.md)
- [Normal-reader functional review](../20261120-reader-recovery/FUNCTIONAL-REVIEW.md)
- [Redaction adaptation review](PR8-REDACTION-REVIEW.md)
- [Integrated source/report verification](INTEGRATION-REVIEW-ROUND4.md)

No blocking defect was found in those reviewed changes. Static review, executed
checks and setup limitations remain separate. Follow-on notification/barter
branches have their own source identities and are outside this 811-case claim.

## Publication and merge gate

Keep the candidate draft until its actual published head passes required hosted
Alpha and CLI checks. Before publication, original PR #58 Alpha `44683798145`
was pending and CLI `44683798168` queued; changed source needs fresh results.
Preserve prior cancelled runs. Merge with an expected-head check only after
qualification and review, compare actual and tested merge trees, then inspect
main's separate push runs. Main's successful PR #57 runs `44671014883` and
`44671014863` do not qualify this source. No release or deployment is made.
