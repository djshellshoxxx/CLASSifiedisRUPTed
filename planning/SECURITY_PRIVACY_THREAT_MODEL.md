# Client-owned threat model and security acceptance

Status: design review required, no audit/pentest/security certification. Scope: installed static PWA, user-controlled local vault/keys, optional public interchange, reviewed encrypted messaging, chosen external sources and physical exchange. [Architecture](CLIENT_SIDE_ARCHITECTURE.md) controls; inherited API/SQL/account/session assumptions are superseded.

## Trust boundaries

B1 Distributor/dependency/update -> executing browser code: malicious update, XSS, compromised package or extension can read data/use unlocked keys. HTTPS/nonextractable keys do not solve malicious same-origin code.
B2 Browser/principal -> local storage: shared device, locked vault, wrong principal, eviction/quota, interrupted migration, rollback, export theft and key loss. Product has no recovery escrow or privileged account reset.
B3 Vault -> optional transport/peer: metadata leakage, false receipts, replay, signed lies, unknown/revoked keys, same-revision fork, withheld consent/revocation, stale discovery and Sybil floods.
B4 Client -> external wallet/source: untrusted UI, observation provenance, compromised RPC/provider, reorg/reversal. No product webhook service/secrets or fund custody.
B5 User -> other people/physical goods: double promises, unsafe meetup, counterfeit object, coercion, partial N-party handoff. Digital signatures cannot prove goods or enforce recovery.

## Threat register

| ID | Threat | Required client control and honest limit | Test obligation |
|---|---|---|---|
| SEC-01 | precise address/EXIF leak | local private storage, public allowlist, metadata stripping before explicit export; no automatic uploads | canary address/key/EXIF absent from projection/adapters/logs |
| SEC-02 | graph/network correlation | no private graph export; disclosure preview and bounded local query; peers still see timing/IP/public linkage | probing corpus and UI disclosures, no anonymity claim |
| SEC-03 | spam/Sybil/reputation fraud | recipient opt-in/block/quarantine and locally bounded inbox; no global account quota or Sybil-proof trust | flood cannot exhaust bounded local queue; known blocked peer hidden |
| SEC-04 | wrong principal/unlocked key use | vault selection/unlock, deny-by-default local capabilities and data segregation; compromised active script remains privileged risk | two-vault isolation and locked-vault error matrix |
| SEC-05 | replay/idempotency mismatch | scoped command ID and live canonical request/receipt; after deletion keep scope/ID/object-ID/deletion marker only, no body/fingerprint, and return OBJECT_DELETED for every payload | duplicate/reordered live command one local mutation, different live payload conflict; deleted command always OBJECT_DELETED |
| SEC-06 | double reservation | local atomic revision checks; peer commitments are evidence only; known cross-vault equivocation freezes coordination | two tabs one local hold; two vaults can conflict and quarantine exchanged evidence |
| SEC-07 | false payment | claim/ack/source observation distinct; selected rail/finality policy; no redirect/hash/screenshot as verified | forged/unknown source and reorg never silently confirmed |
| SEC-08 | key/crypto compromise | vetted primitives/protocol, domain separation, known-answer vectors, explicit device key verification and rotation/backup review | unsupported/revoked/unknown key fails; lost key cannot be server-recovered |
| SEC-09 | malicious peer | bounded parse/schema/signature/version/predecessor/local policy checks, quarantine forks; optional adapter isolation | mutated corpus, tombstone/replay/fork tests; no script execution/network fetching from payload |
| SEC-10 | reviewer overreach | reports local unless user selects disclosed evidence/recipient; no default private inbox/secret access | exact evidence preview and local sharing-consent tests |
| SEC-11 | media/script attacks | escaped text, restrictive CSP, strict size/MIME/decoder limits, EXIF strip; no unsupported AV service guarantee | malformed image/polyglot/SVG/zip bomb/oversize rejected locally; unsupported parsing fails closed |
| SEC-12 | offline confusion | local committed distinct from remote receipt, consent and observation; no closed-browser delivery promise | offline save succeeds but missing peers remain pending/unknown |
| SEC-13 | stale restore/deletion | explicit local purge and export consequences; preserve known revocation/fork markers on restore, copied public data cannot be recalled | old snapshot cannot silently reactivate known revoked key/consent; peer erase best effort |
| SEC-14 | physical fraud/coercion | explicit voluntary terms, coarse location, per-party handoff assertions, emergency local stop and evidence sharing | no automatic completion/reroute/real-world rollback after dropout |
| SEC-15 | provider/policy assumptions | selected source review and target jurisdiction before enabled verified rails/paid placement | unavailable policy/provider keeps affected path disabled, no legal certificate claim |
| SEC-16 | static update compromise | reviewed reproducible artifact/dependency/CSP policy, explicit schema/version compatibility, no automatic remote config execution | malicious update/config and wrong-origin import tests; browser trust limits disclosed |
| SEC-17 | data loss/backup secrets | local storage status, explicit encrypted export/restore using reviewed format; no default cloud/seed upload | eviction/denied persistence/quota/migration abort; backup corruption/wrong key fail closed |

## Protocol decisions still required

The current baseline does not select a production encryption/key-wrapping/KDF/device-recovery suite. It may specify local draft data and disabled send paths; it cannot enable remote private messaging or portable secret export merely because WebCrypto exists. F16/F07/F08 contracts must pin protocol/algorithms/version, byte canonicalization, key identity binding, nonces/epochs/replay, verification UX, loss/compromise/revocation and compatibility vectors. Independent review is a prerequisite to those security-sensitive specifications being accepted. No homemade cryptography.

## Acceptance evidence

Map SEC-01..17 and T-ARCH-01..07 to concrete leaf requirements, fixtures and attack oracles before spec GO. Later product acceptance needs actual browser/device storage/crypto tests, SAST/SCA/SBOM/license/secret scans, update review, privacy/export audit, restore exercise and independent security assessment of enabled money/peer protocols. Local permissions can constrain honest software only; they do not enforce policy on a malicious owner. No global rate-limit, account suspension, server-side encryption-at-rest, trusted timestamp or distributed lock may be smuggled into these gates.
