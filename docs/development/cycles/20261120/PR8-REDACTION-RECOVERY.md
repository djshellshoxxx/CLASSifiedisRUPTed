# Selective PR #8 recovery: credential-field redaction

## Source and scope

This change starts from PR #58 source
`38ada90037d8176b0e0e319651b712cc396cad5d` in the isolated branch
`codex/classrup-redaction-20261120`.

The recovered naming rules come from
`packages/security/src/authz/secrets/redact.ts` at preserved PR #8 head
`a403614bb34d3d176d4693730e512e14959718b8`. That source identifies conventional
credential field names and the `RELAY_SECRET_*` namespace. Current canonical
`16_Security/01_authz/mod_secrets/module.spec.yaml` instead specifies
`CLASSRUP_SECRET_*`, including versioned and `_FILE` forms. The adaptation
therefore recognizes both documented namespaces.

Only the field-name vocabulary is recovered into the existing, used kernel
observability redactor. The incompatible PR #8 runtime, secret loader, token
helpers, secret-wrapper class, free-text scanner and relay dependencies are not
introduced. The wider secrets module and PR #8 remain incomplete.

## Resulting behavior

The existing structured logger now drops conventional credential, credential-set,
password-alias, bearer, pepper and API/data/signing/secret/access-key fields,
including supported case, hyphen and underscore variants. Fields in either
documented secret namespace are dropped even when a version or `_FILE` suffix
follows the secret name.

Existing field-dropping semantics, key normalization, IP truncation, recursion
limit, string limit and circular-reference handling remain unchanged. Public
key references, key identifiers, counters, policy fields and secret inventory
metadata such as `name`, `source` and `bytes` remain available.

The current logger's stronger safeguards also remain unchanged: messages must
be stable event identifiers, and Error messages, stacks and causes are removed
before field redaction. No public identifier, signature, protocol, database,
backup, configuration loader or user-facing workflow changes.

## Acceptance coverage

Three focused tests use harmless synthetic placeholders:

1. Nested structured records and arrays drop conventional credential fields and
   both secret namespaces without mutating caller input.
2. Public references, policy names, counters, identifiers and permitted secret
   inventory metadata survive.
3. Child logger bindings and event fields pass through the recovered rules
   while IP truncation, Error-detail removal and event-identifier validation
   retain their existing behavior.

The tests exercise observable redactor and logger results; they do not depend
on the internal vocabulary constants or add a parallel redaction implementation.

## Qualification

At preparation, root's existing full-suite run was active. This worker did not
start a concurrent compiler or test runner. New test execution, integration
typecheck and hosted qualification must be recorded by the integration owner;
no passing result is claimed here from static inspection.

An independent defensive reviewer was given the exact worktree, base and
changed source/test paths. Its final review and any subsequent validation
results belong to their own evidence. Keep the change unmerged until the
applicable current-source gates complete.

## Preserved work

This bounded recovery does not make the remaining PR #8 helpers ready to
integrate. Public-ID adoption still needs an explicit compatibility boundary;
canonical signature/CID work needs a versioned migration and identity
authority; relay secret loading needs a real consumer; tenant/local-settings
schemas need missing dependencies and enforcing handlers; the old storage
replacement still requires coherent adapters and migrations.
