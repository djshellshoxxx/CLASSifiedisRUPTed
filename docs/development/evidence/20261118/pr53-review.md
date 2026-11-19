# Independent PR #53 security and semantic review

## Decision

No blocking regression was found in the reviewed change. The public-record CLI and shared discovery validator are suitable for consolidation subject to qualification of the final integration commit. This is a scoped source review supported by independently retrieved candidate CI evidence, not a claim that every security property of the repository was audited.

## Source and method

- Repository: djshellshoxxx/CLASSifiedisRUPTed.
- PR: https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/53
- Reviewed head: d81094688ac116c84c09f3105c7b3f6b4c472793.
- Compared against main at 044c213d90d62f1f06edb8ca1b9c2141d3991c27.
- Read the actual diff, all of tools/cli/records.mjs and tests/cli/records.test.mjs, the CLI entry point, discovery retention logic, federation verification/canonicalization, public-key/DID validation, shared UUID/timestamp validators and existing alpha-security regressions.
- Confirmed the files read from the local integration checkout are identical to the reviewed PR source for the relevant paths.
- No product edits or repository mutations were performed by this review agent. After the root agent installed the pinned dependencies, this reviewer ran 10 independent adversarial probes with Node 24.22.3 against integration commit 2401a6cc2b200445d21da3268bd526f2ca19cb17. All 10 passed with zero failures/skips. Final full-suite integration execution belongs to the root agent.

Relevant blob identities:

| Path | Blob |
| --- | --- |
| tools/cli/records.mjs | 7387c4750a0a6a65bd803799578d6510f2082c50 |
| tools/cli/classrup.mjs | 7edb1db74400e4169719099bb8330a2e49d5f6dc |
| tests/cli/records.test.mjs | dcb88b5e35380114f0aa8e7982af31a4d7e580dd |
| packages/discovery/src/search/index.ts | 3c45e136ba33853302554609d368ec33f881fab0 |
| packages/federation/src/envelope.ts | 245a6493ca628318b46616894d02bc30d001d627 |

## Findings by review area

### File selection and bounded reads

The CLI accepts one explicit file argument, rejects unknown/duplicate options, stdin, control characters, URL syntax, and two-leading-separator UNC/device prefixes, including mixed slash/backslash variants. Relative local paths remain intentional.

The reader checks lstat before opening, refuses nonregular files, opens read-only with O_NOFOLLOW and O_NONBLOCK when supported, then checks the opened descriptor is a regular file with the same device/inode as the selected path. It reads from that descriptor rather than reopening by name. An allocation and read loop capped at MAX_ENVELOPE_BYTES + 1 detect growth after stat; input over 1,048,576 bytes is rejected. Descriptor cleanup is in finally.

This is explicit local-file selection, not a directory sandbox. Parent directory links, hard links and already-mounted filesystems are not prohibited, and the documentation correctly explains the mounted-filesystem boundary. The implementation does not add application network calls or persistent writes. An OS filesystem path can still refer to a mounted filesystem; the network guard test does not prove otherwise.

### Invalid input and output disclosure

Fatal UTF-8 decoding and JSON parsing precede the unchanged strict envelope verifier. That verifier detaches input before asynchronous hashing, rejects unknown top-level keys/non-JSON values/noncanonical identities, caps canonical complexity and size, checks the existing future-clock allowance, authenticates the CID and signature, and freezes the verified result.

Error messages are fixed and omit raw file paths, parser messages and record payload. JSON failure and success both use stdout with versioned schema; human failures use stderr. Human success interpolates only fields constrained by known record types, canonical DID/CID validators, UUIDv7 and timestamp validators. Arbitrary description and extension strings are omitted.

### Trust claims and supported formats

The CLI performs signature/hash validation before inspecting a payload as a supported public listing or alpha tombstone. It then applies strict payload schema, owner/author binding and listing expiry checks. Other signed types remain rejected.

Output explicitly says chain/history/revocation are unchecked, current ownership/trust are not established, and admission is not performed. The standalone withdrawal target is not validated against retained state, which is an intentional documented limit; the command does not claim that target history is verified.

### PWA ingestion preservation

The extracted validator preserves the pre-existing listing/tombstone allowlist, strict schemas, owner binding, exact rejection-code distinctions and expiry boundary. In particular:

- Unsupported type and malformed tombstone: VALIDATION_FAILED.
- Listing schema failure or owner mismatch: FORBIDDEN.
- Tombstone owner mismatch: FORBIDDEN.
- Listing expiry equal to or before the check clock: PRECONDITION_FAILED.

The PWA still clones before verification and runs validation before mutation. Existing retained-state checks for target/revision conflicts, duplicate CIDs, conflict evidence, quotas, expected revisions and event creation remain in the PWA handler and were not moved into the standalone CLI. Backup validation is unchanged. No private mutation or vault access was added.

### Included test consolidation

The shared DOM test fake is a superset of the replaced local fakes. CI symlink tests are strengthened to fail rather than silently skip when CI cannot create required links. Test-discovery globs remove currently empty unit/property/chaos and absent relay paths; no existing test file was found in those removed paths.

If later consolidation recovers actual tests into tests/unit, tests/property, tests/chaos or apps/relay, the corresponding test/typecheck discovery must be restored. This is a forward integration caveat, not a present skipped-test finding.

## Test evidence independently retrieved

### Fresh independent execution

Command: node --test evidence/ci/pr53-adversarial.mjs, run from the scratch workspace.

Results: 10 passed, 0 failed, 0 cancelled, 0 skipped; exit 0. Probe code and full output are retained as pr53-adversarial.mjs and pr53-adversarial-results.txt beside this review.

The probes covered exact 1 MiB acceptance and rejection of one additional byte; regular-file and symlink substitution between lstat/open; post-open rename/replacement preserving the original descriptor; partial reads; descriptor closure on metadata failure; caller mutation during async verification; signed terminal-control metadata rejection; multiple JSON documents/truncated UTF-8 rejection; and rejecting duplicate options before any filesystem lookup. Test files were confined to temporary directories; source and shared checkout files were unchanged.

### Hosted candidate execution

Candidate Alpha run https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44320887748, job 134882697116, completed successfully:

- 701 domain assertions, zero failed/pending/skipped.
- 27 tooling assertions, zero failed/skipped.
- 72 Chromium/Firefox/WebKit product journeys passed.
- Typecheck, strict 148-module specs, dependency boundaries, registry, independent money vectors, bundle budget, setup and build passed.

CLI run https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44320887774 has all six platform/Node cells successful. Ubuntu and macOS each pass 32 CLI assertions per Node version; Windows passes 31 with one explicit POSIX FIFO/device skip per version. Tests include 14 focused public-record test cases, with independently signed Ed25519 fixtures, PWA acceptance/error parity, tampering/invalid JSON/invalid UTF-8, private-field refusal, bounded reads including concurrent file growth, file-type refusal, fixed error disclosure and denied application networking.

The original macOS Node 22 job was cancelled before any step ran. Its replacement passed without source changes; this is not evidence of a source defect.

## Limits and remaining concern

The reader's behavior against hostile local kernel/filesystem implementations, every Windows reparse-point variant, and indefinitely stalled mounted filesystems was not exhaustively proved. No requirement claims such a filesystem sandbox or time bound.

The separate pinned WebKit raw-native crypto diagnostics still fail for leading-zero/all-zero private-key imports and occasional native key generation. This predates PR #53 and is documented separately. Current main already contains the bounded new-key-generation mitigation; product CI passing does not close the unresolved native import compatibility issue.

Final integration must retain the exact tests and security checks and be qualified at its actual head. No test weakening or security-control removal is recommended.



## Portable reproduction

The original scratch execution is retained above. From the repository root, rerun the archived probes with `node --test docs/development/evidence/20261118/pr53-adversarial.mjs`. The archived [probe source](pr53-adversarial.mjs) adjusts only its relative import for this evidence directory; [original execution output](pr53-adversarial-results.txt) is preserved unchanged.
