# TODO: F16.S03.M01 threats

**Status:** IMPLEMENTED; statuses need integration verification.

## Implemented
- [x] 37 STRIDE entries over accounts/keys, locations, messages, trade graph, payment evidence and relay (`packages/platform/src/assurance/threats.ts`; `packages/platform/test/assurance.test.ts`)
- [x] Control paths verified to exist when written; `mitigated` requires a control; summary and top-risk ranking
- [x] Ops `platform.threat.list` and `platform.threat.review` with per-tenant reviews (`packages/platform/src/assurance/threat-ops.ts`)

## Remaining
- [ ] T-011 (EXIF stripping) is open and has no code
- [ ] Controls in other packages are referenced at directory level; re-verify when those packages are final
- [ ] No external security review has been done

Package overview: `packages/platform/README.md`. Traceability: `packages/platform/traceability.json`.
