# Feature continuation checkpoint

Initial main: `95eb2f1762b0130e465539a2ff22d87632819f8f`.
See `PLAN.md` for the implementation sequence and `PR_CENSUS.json` for the
source-specific no-repeat-work census.

## BlindMatch page lifecycle

The source and four new browser cases implement the first planned milestone.
Hidden visibility and page navigation revoke current opt-in synchronously,
cancel matching, clear private view state and reject late callbacks. Returning
requires a new explicit opt-in. Existing saved content remains encrypted and
unchanged. Destruction removes lifecycle listeners. The production launch gate
remains false.

The new browser cases cover both visibility and page-transition events, with
real native vault/crypto composition and a deliberately delayed candidate
loader. They compare a fresh result against a different exact-price candidate
before releasing the old result, so stale overwrites cannot pass unnoticed.
Synthetic events are identified explicitly; physical-device backgrounding and
actual BFCache behavior are not claimed.

Independent source review found no blocking privacy/lifecycle defect. Local
TypeScript, strict specifications (150/150, no warnings), dependency/registry
checks, setup/build, fixture bundling and browser discovery passed. The
independent Python reference passed all 331 money vectors. The 12 new engine
executions remain unexecuted locally because browser download/executable setup
is unavailable. Hosted final-source gates are required before merge.

## Storage sequence

PR #162 reviewed exact head `e0751c15b5f2e6cd32ef3d8e9a2aa57c23f3e92f`, tree
`508db4573f629018038d5007259299a36bc91fa8`. Independent code, functional and
defensive review found no blocker; the focused four-file suite passed 30/30 and
full TypeScript passed. Hosted Alpha `46072537925` and CLI `46072538126` passed.
The existing qualification receipt records 1,106 domain assertions and 99
browser journeys; CLI PR selection covered Ubuntu Node 22 and 24.

The normal head-pinned merge produced main
`c85ae69cc6d44400ee2ec1ded81487e1c211694f`. Its separate push workflows are
Alpha `46083029532` and CLI `46083029499`; they were in progress at this
checkpoint. Do not substitute the PR checks for their eventual outcome.

The sealed identity root's marker remains visible outer metadata and becomes
inventory-authenticated after unlock. It is not a secret or an authority grant.
Future authority-bearing lineage must exclude this root or specify a separate
authenticated contract. Local markers remain excluded from portable v1 backups.

Independent source review of #163 `473bc803` and #164 `00ecaa04` found no blocking
defect. Their original source-specific hosted checks passed; #164's Alpha pass
is attempt two, and its cancelled first attempt remains historical. Their test
files conflict at a shared insertion point; retain all four new cases. They
still need serial synchronization and qualification against actual main.

