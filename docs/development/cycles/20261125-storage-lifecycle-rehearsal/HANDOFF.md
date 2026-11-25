# Storage lifecycle integration rehearsal — 2026-11-25

Isolated consolidation candidate, **not approval, merge authorization or a qualified replacement** for PRs #162–#166. Existing drafts remain unchanged; required sequential integration and review gates remain in force. Main base `2ee8b924a71338617d6166679f3d33282ea17789`, tree `9c38520eb99e16bbb360d21e8e3429c88e920063`. Original heads #162 `bc6866ddeff17f293a06cc977876d640a6b92d0b`, #163 `473bc80396787b0ba6e3471d2bc26715a02e89ed`, #164 `00ecaa044d3b0e62c9f2b275674d4c700bc9731d`, #165 `3f32f3aa876c6c76ed70f7aedd2d253fe51983ff`, #166 `33adf188b32e8eba83c9906076baaa4cc038e99f`.

All 20 distinct changed paths included, with 18 exact source blobs; #165 is already an ancestor of #166, and its encrypted-storage changes are included in #166. Two overlapping IndexedDB files were combined by deterministic line-diff replay, checking each individual replay exactly reproduces its original source. Same-position distinct test insertions retained in #163/#164/#166 order; identical import changes applied once. Five new standalone asynchronous close calls awaited; first cleanup matcher incorrectly included an existing awaited close, stopped before publication, then corrected. Prior rehearsal: #166 comment 7174175863. Original CI evidence preserved separately. Intermediate tree after #162 `6897125026ab5626815c76ee8a10ac4dc489d8f1`; after remaining unique files `f7133baea8a236b1e61263929f29b115d129e71c`.

## Reconciled source receipt

```json
[
  {
    "path": "packages/kernel/src/storage/indexeddb.ts",
    "blobs": [
      "fc1913208df8f8b02f821a88ceb2b3dc1a58d892",
      "910bed85d403cbeb14405d66433c6b6f8eab985d",
      "cd0b7a91e980a8f695b32036b009bbb2e7b8af62",
      "c2d3093c94e7d36216c2adf9598f96775b186f22"
    ],
    "counts": [
      4,
      7,
      10
    ],
    "lines": 266,
    "awaitChanges": 0
  },
  {
    "path": "packages/kernel/src/storage/indexeddb.test.ts",
    "blobs": [
      "870d3f5945631aa191b5fcf9d41b563efc70b8ea",
      "263255fc580464f59235f83050c8a9beaea113dd",
      "26f8c20cb07754f7982baf6ffcb55b537196a77d",
      "0cb289a9138fb0f7204f36f49ed8aa300bf784da"
    ],
    "counts": [
      2,
      2,
      1
    ],
    "lines": 367,
    "awaitChanges": 5
  }
]
```

No local compiler, product tests or independent reviewer executed. Native Git DNS previously failed; isolated Git objects do not constitute a local worktree. No existing PR pass qualifies this tree. Fresh code reviewer: compare all original blobs and combined source; functional worker: run unchanged serial TS/domain/static/build/Alpha/CLI and native browser acceptance; defensive source reviewer: examine lifecycle and direct sign revocation. Native invalidation is still unimplemented. Follow required sequential integration on fresh main; do not merge this rehearsal or close original drafts. No authority, crypto, schema/cap/timeout changes beyond existing candidates, no deployment, release, force push, branch deletion or paid API. No explicit exhausted usage condition.
