# Communications runtime

The package now exposes a **subject-known signed consent core**, through
`consentDefinitions(options)` and the `consent` namespace. It is an opt-in domain
composition, not a completed messaging product. The PWA and existing alpha barter
protocol do not automatically use it.

## What the core provides

Register `consentDefinitions(options).all` with the kernel registry. It exposes
`comms.consent.sign`, `revoke`, `accept`, `verify`, and `list_for_subject`.

The composition requires the unlocked principal and signer, an immutable wording
registry, and a subject resolver that reads exact historical revisions from the
current transaction. The owning module must compute each revision hash from its
canonical bytes and return the participant roster with allowed roles and current
commitment state. Never populate that adapter from the untrusted command input.
The signing request includes `readConfirmed: true`, the subject revision/hash,
and the exact displayed wording hash. A UI must actually display those terms and
collect confirmation before invoking the command.

Consent signs UTF-8 `classrup.consent.v1`, one NUL byte, then canonical JSON of the
validated payload. The CID hashes canonical JSON of the payload and its signature.
It is deliberately a distinct format from the experimental alpha federation
statement envelope. Verification recomputes the CID and Ed25519 signature, checks
the subject hash, the signer's role, and the wording registry. A valid signature
records a key holder's assertion, not delivery, payment or performance.

Commands are restricted to the local unlocked principal. Inbound signatures may
come from another participant; read access still requires local participation in
the subject. Private terms and signatures do not enter emitted event payloads.
Consent and decline evidence coexist and produce a conflict, regardless of their
time claims. Revocation creates a signed record and irreversibly disables consent
for that same revision and wording key. A new subject revision requires fresh
consent. Claimed times more than 24 hours from the receiving clock are flagged,
not used for ordering. The verification query rechecks stored signatures and
original revocation references before returning an outcome.

At most 20 evidence rows are stored per signer/subject. Capacity is reserved for
one revocation per active consent, so filling normal evidence cannot block
withdrawal. Local nonterminal signing is limited to 60 per hour using a bounded
counter; clock rollback does not reset the active window. Revocation bypasses the
normal signing budget. Replaying a CID does not add a record or event. Local
signing also deduplicates the semantic request. Distinct inbound CIDs are retained
so a later revocation can resolve its exact original; full cross-device duplicate
aliasing remains future work.

## Boundaries still requiring implementation

- Root Ed25519 identities work directly. Delegated key import requires an explicit
  authenticated `keyFor(payload, firstSeenAt)` adapter. Device key discovery,
  rotation/revocation subscriptions, and delegated local signing are not supplied.
- Missing subjects and missing original revocations are rejected. The canonical
  seven-day quarantine, dependency-triggered replay and out-of-order recovery
  protocol are not implemented. Retry an unchanged statement after its dependency
  arrives; never treat the rejection as accepted evidence.
- The owning domain must integrate the commands, canonicalizer and wording UI.
  No PWA confirmation sheet, messaging, attachments, meetup or relay delivery is
  provided by this package yet.
- No vault backup codecs for this new domain are registered. A production
  composition must add cross-record validation and preserve revocation evidence
  during backup/restore before enabling this domain for users.
- Full canonical acceptance (browser vectors, fuzz/load gates, a11y and every
  requirement mapping) is pending. These tests establish the bounded core only.

The historical `claude/busy-cerf-vg3hz3` consent implementation was inspected. Its
server operations API and latest-by-time decision rules are incompatible with the
current client-owned kernel and monotonic revocation contract, so those behaviors
were not imported.
