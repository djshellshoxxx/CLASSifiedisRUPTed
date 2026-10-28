import { defineOperations } from '@classrup/kernel';
import type { Operation } from '@classrup/kernel';
import type { DeviceService } from './accounts/devices';
import type { AccountService } from './accounts/pseudonyms';
import type { RecoveryService } from './accounts/recovery';
import type { SessionService } from './accounts/sessions';
import { FLAGS, operation } from './env';
import type { PortableService } from './profiles/portable';
import type { ProfileService } from './profiles/profiles';
import type { EvidenceService } from './trust/evidence';
import type { ReputationService } from './trust/reputation';

export interface IdentityServices {
  readonly accounts: AccountService;
  readonly devices: DeviceService;
  readonly sessions: SessionService;
  readonly recovery: RecoveryService;
  readonly profiles: ProfileService;
  readonly portable: PortableService;
  readonly reputation: ReputationService;
  readonly evidence: EvidenceService;
}

type Input<F> = F extends (ctx: never, input: infer I) => unknown ? I : never;

export function buildOperations(s: IdentityServices): readonly Operation[] {
  const { accounts: a, devices: d, sessions: ss, recovery: r, profiles: p, portable: pt, reputation: rep, evidence: ev } = s;
  return defineOperations([
    operation<Input<typeof a.register>>('command', { name: 'identity.account.register', flag: FLAGS.pseudonyms, summary: 'Register a pseudonymous account with a proven device key', public: true }, (c, i) => a.register(c, i)),
    operation<undefined>('query', { name: 'identity.account.me', flag: FLAGS.pseudonyms, summary: 'Read own account and devices' }, (c) => a.me(c)),
    operation<Input<typeof a.lookup>>('query', { name: 'identity.account.lookup', flag: FLAGS.pseudonyms, summary: 'Public lookup by pseudonym or id', public: true }, (c, i) => a.lookup(c, i)),
    operation<Input<typeof a.setStatus>>('command', { name: 'identity.account.set_status', flag: FLAGS.pseudonyms, summary: 'Admin: suspend, reactivate or deactivate an account' }, (c, i) => a.setStatus(c, i)),
    operation<Input<typeof a.deactivate>>('command', { name: 'identity.account.deactivate', flag: FLAGS.pseudonyms, summary: 'Deactivate own account' }, (c, i) => a.deactivate(c, i)),
    operation<Input<typeof a.grantRole>>('command', { name: 'identity.account.grant_role', flag: FLAGS.pseudonyms, summary: 'Admin: grant a role' }, (c, i) => a.grantRole(c, i)),
    operation<Input<typeof a.revokeRole>>('command', { name: 'identity.account.revoke_role', flag: FLAGS.pseudonyms, summary: 'Admin: revoke a role' }, (c, i) => a.revokeRole(c, i)),
    operation<Input<typeof a.erase>>('command', { name: 'identity.account.erase', flag: FLAGS.pseudonyms, summary: 'System: erase identity data for a deletion request' }, (c, i) => a.erase(c, i)),

    operation<Input<typeof d.add>>('command', { name: 'identity.device.add', flag: FLAGS.recovery, summary: 'Add a device key authorized by an active key' }, (c, i) => d.add(c, i)),
    operation<Input<typeof d.revoke>>('command', { name: 'identity.device.revoke', flag: FLAGS.recovery, summary: 'Revoke a device key authorized by an active key' }, (c, i) => d.revoke(c, i)),
    operation<undefined>('query', { name: 'identity.device.list', flag: FLAGS.recovery, summary: 'List own device keys' }, (c) => d.list(c)),

    operation<Input<typeof ss.issueChallenge>>('command', { name: 'identity.session.challenge', flag: FLAGS.sessions, summary: 'Issue a single-use login challenge', public: true }, (c, i) => ss.issueChallenge(c, i)),
    operation<Input<typeof ss.login>>('command', { name: 'identity.session.login', flag: FLAGS.sessions, summary: 'Exchange a signed challenge for a session token', public: true }, (c, i) => ss.login(c, i)),
    operation<undefined>('query', { name: 'identity.session.list', flag: FLAGS.sessions, summary: 'List own sessions' }, (c) => ss.list(c)),
    operation<Input<typeof ss.revoke>>('command', { name: 'identity.session.revoke', flag: FLAGS.sessions, summary: 'Revoke one own session (logout when current)' }, (c, i) => ss.revoke(c, i)),
    operation<Input<typeof ss.revokeAll>>('command', { name: 'identity.session.revoke_all', flag: FLAGS.sessions, summary: 'Revoke all own sessions' }, (c, i) => ss.revokeAll(c, i)),
    operation<undefined>('command', { name: 'identity.session.expire_due', flag: FLAGS.sessions, summary: 'System: expire lapsed sessions and purge old records' }, (c) => ss.expireDue(c)),

    operation<Input<typeof r.issue>>('command', { name: 'identity.recovery.issue', flag: FLAGS.recovery, summary: 'Issue a fresh set of ten recovery codes' }, (c, i) => r.issue(c, i)),
    operation<undefined>('query', { name: 'identity.recovery.status', flag: FLAGS.recovery, summary: 'Remaining recovery codes' }, (c) => r.status(c)),
    operation<Input<typeof r.recover>>('command', { name: 'identity.recovery.recover', flag: FLAGS.recovery, summary: 'Recover an account with a code and new device keys', public: true }, (c, i) => r.recover(c, i)),

    operation<Input<typeof p.update>>('command', { name: 'identity.profile.update', flag: FLAGS.profiles, summary: 'Update own profile and field visibility' }, (c, i) => p.update(c, i)),
    operation<Input<typeof p.get>>('query', { name: 'identity.profile.get', flag: FLAGS.profiles, summary: 'Read a profile filtered by viewer relation', public: true }, (c, i) => p.get(c, i)),

    operation<undefined>('query', { name: 'identity.portable.document', flag: FLAGS.portable, summary: 'Build the unsigned portable identity document' }, (c) => pt.document(c)),
    operation<Input<typeof pt.verify>>('query', { name: 'identity.portable.verify', flag: FLAGS.portable, summary: 'Verify a signed portable document', public: true }, (c, i) => pt.verify(c, i)),
    operation<Input<typeof pt.import>>('command', { name: 'identity.portable.import', flag: FLAGS.portable, summary: 'Import a signed document from another relay' }, (c, i) => pt.import(c, i)),

    operation<Input<typeof rep.submit>>('command', { name: 'identity.feedback.submit', flag: FLAGS.reputation, summary: 'Rate a verified counterparty' }, (c, i) => rep.submit(c, i)),
    operation<Input<typeof rep.edit>>('command', { name: 'identity.feedback.edit', flag: FLAGS.reputation, summary: 'Edit own feedback within 14 days' }, (c, i) => rep.edit(c, i)),
    operation<Input<typeof rep.remove>>('command', { name: 'identity.feedback.remove', flag: FLAGS.reputation, summary: 'Moderator: remove feedback' }, (c, i) => rep.remove(c, i)),
    operation<Input<typeof rep.list>>('query', { name: 'identity.feedback.list', flag: FLAGS.reputation, summary: 'List feedback received by an account', public: true }, (c, i) => rep.list(c, i)),
    operation<Input<typeof rep.get>>('query', { name: 'identity.reputation.get', flag: FLAGS.reputation, summary: 'Aggregate reputation of an account', public: true }, (c, i) => rep.get(c, i)),

    operation<Input<typeof ev.claim>>('command', { name: 'identity.evidence.claim', flag: FLAGS.evidence, summary: 'Record a self-attested claim' }, (c, i) => ev.claim(c, i)),
    operation<Input<typeof ev.attest>>('command', { name: 'identity.evidence.attest', flag: FLAGS.evidence, summary: 'Present an attester-signed attestation' }, (c, i) => ev.attest(c, i)),
    operation<Input<typeof ev.revoke>>('command', { name: 'identity.evidence.revoke', flag: FLAGS.evidence, summary: 'Revoke evidence' }, (c, i) => ev.revoke(c, i)),
    operation<Input<typeof ev.listPublic>>('query', { name: 'identity.evidence.list_public', flag: FLAGS.evidence, summary: 'Public evidence: kind and verified flag', public: true }, (c, i) => ev.listPublic(c, i)),
    operation<undefined>('query', { name: 'identity.evidence.list_mine', flag: FLAGS.evidence, summary: 'Own evidence with status and notes' }, (c) => ev.listMine(c)),
    operation<undefined>('command', { name: 'identity.evidence.expire_due', flag: FLAGS.evidence, summary: 'System: expire lapsed evidence' }, (c) => ev.expireDue(c)),
    operation<Input<typeof ev.registerAttester>>('command', { name: 'identity.attester.register', flag: FLAGS.evidence, summary: 'Admin: register a trusted attester key' }, (c, i) => ev.registerAttester(c, i)),
    operation<Input<typeof ev.revokeAttester>>('command', { name: 'identity.attester.revoke', flag: FLAGS.evidence, summary: 'Admin: revoke a trusted attester key' }, (c, i) => ev.revokeAttester(c, i)),
    operation<undefined>('query', { name: 'identity.attester.list', flag: FLAGS.evidence, summary: 'Admin: list trusted attesters' }, (c) => ev.listAttesters(c)),
  ]);
}
