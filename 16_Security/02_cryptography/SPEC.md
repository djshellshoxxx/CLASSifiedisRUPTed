# F16.S02 — 02_cryptography

**Status:** SPECIFIED. **Parent:** [F16](../SPEC.md).

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Modules

| Module | Name | Status | Responsibility |
|---|---|---|---|
| F16.S02.M01 | [Key lifecycle](mod_key/SPEC.md) | SPECIFIED | Ed25519 root and device key handles with X25519 derived from device keys, passphrase-wrapped storage (scrypt N=2^17,r=8,p=1 + XChaCha20-Poly1305), device-key rotation through the F07 device_link/keyrevocation flow (no root-key rotation in MVP) — client library. |
| F16.S02.M02 | [Key registry and revocation](mod_management/SPEC.md) | SPECIFIED | Ingest-only cache over the F07.S02.M01 KeyStatusPort for user keys with freshness, plus a registry of relay-owned keys (relay transport, VAPID) and pinned peer keys, a permanent revoked-key set and signed monotonic revocation-list heads. |
| F16.S02.M03 | [Signatures](mod_signatures/SPEC.md) | SPECIFIED | Domain-separated Ed25519 sign/verify helpers (context strings), signature envelope for consents/receipts/attestations. |

## Aggregation

Modules in this subfeature share the feature package `packages/security` (or the app path in each module) and integrate only through the events and ports below; no module reads another module's tables.

### Event dependencies

| Event | Producer | Consumer | Scope |
|---|---|---|---|
| identity.device_key.added | F07.S01.M01 | F16.S02.M02 | external |
| identity.device_key.revoked | F07.S01.M01 | F16.S02.M02 | external |
| identity.portable_doc.published | F07.S02.M01 | F16.S02.M02 | external |
| federation.peer.added | F11.S03.M01 | F16.S02.M02 | external |
| federation.peer.removed | F11.S03.M01 | F16.S02.M02 | external |
| platform.relay_identity.rotated | F15.S02.M01 | F16.S02.M02 | external |
