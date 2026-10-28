import { defineModules } from '@classrup/kernel';
import { COLLECTIONS } from './records';
import { EVENTS, FLAGS } from './env';

export const MODULES = defineModules([
  {
    id: 'F07.S01.M01',
    path: '07_Identity/01_accounts/mod_pseudonyms',
    flag: FLAGS.pseudonyms,
    summary: 'Pseudonymous accounts with device key pairs, status lifecycle, role grants, erasure hook and AccountLookup',
    permissions: ['identity.account:register', 'identity.account:lookup', 'identity.account:read', 'identity.account:deactivate', 'identity.account:set_status', 'identity.account:grant_role', 'identity.account:erase'],
    events: [EVENTS.accountRegistered, EVENTS.accountStatusChanged, EVENTS.accountRoleGranted, EVENTS.accountRoleRevoked, EVENTS.accountErased, EVENTS.recoveryCodesIssued],
    collections: [COLLECTIONS.accounts, COLLECTIONS.pseudonyms],
  },
  {
    id: 'F07.S01.M02',
    path: '07_Identity/01_accounts/mod_sessions',
    flag: FLAGS.sessions,
    summary: 'Challenge-response login, hashed bearer tokens, sliding idle expiry, session list and revocation',
    permissions: ['identity.session:challenge', 'identity.session:login', 'identity.session:read', 'identity.session:revoke', 'identity.session:expire'],
    events: [EVENTS.sessionCreated, EVENTS.sessionRevoked, EVENTS.sessionExpired],
    collections: [COLLECTIONS.sessions, COLLECTIONS.challenges],
  },
  {
    id: 'F07.S01.M03',
    path: '07_Identity/01_accounts/mod_recovery',
    flag: FLAGS.recovery,
    summary: 'Single-use recovery codes, recovery with new device keys, signed device add/revoke key rotation',
    permissions: ['identity.recovery:issue', 'identity.recovery:read', 'identity.recovery:recover', 'identity.device:add', 'identity.device:revoke', 'identity.device:read'],
    events: [EVENTS.recoveryCodesIssued, EVENTS.recoveryCompleted, EVENTS.deviceAdded, EVENTS.deviceRevoked, EVENTS.sessionRevoked],
    collections: [COLLECTIONS.recovery, COLLECTIONS.accounts],
  },
  {
    id: 'F07.S02.M01',
    path: '07_Identity/02_profiles/mod_portable',
    flag: FLAGS.portable,
    summary: 'Versioned signed portable identity document: client-signed export, verification and key-continuity import',
    permissions: ['identity.portable:export', 'identity.portable:import', 'identity.portable:verify'],
    events: [EVENTS.portableImported],
    collections: [COLLECTIONS.profiles],
  },
  {
    id: 'F07.S02.M02',
    path: '07_Identity/02_profiles/mod_profiles',
    flag: FLAGS.profiles,
    summary: 'Profiles with per-field visibility, coarse regionCell only, viewer-filtered DTOs',
    permissions: ['identity.profile:update', 'identity.profile:read'],
    events: [EVENTS.profileUpdated],
    collections: [COLLECTIONS.profiles],
  },
  {
    id: 'F07.S03.M01',
    path: '07_Identity/03_trust/mod_reputation',
    flag: FLAGS.reputation,
    summary: 'Counterparty-verified feedback, 14-day edit window, Bayesian aggregate score',
    permissions: ['identity.feedback:submit', 'identity.feedback:edit', 'identity.feedback:remove', 'identity.feedback:read', 'identity.reputation:read'],
    events: [EVENTS.feedbackSubmitted, EVENTS.feedbackEdited, EVENTS.feedbackRemoved],
    collections: [COLLECTIONS.feedback, COLLECTIONS.feedbackIndex, COLLECTIONS.reputation],
  },
  {
    id: 'F07.S03.M02',
    path: '07_Identity/03_trust/mod_evidence',
    flag: FLAGS.evidence,
    summary: 'Self-attested claims vs attester-signed verified evidence with revocation, expiry and trusted attester registry',
    permissions: ['identity.evidence:claim', 'identity.evidence:attest', 'identity.evidence:read_own', 'identity.evidence:revoke', 'identity.evidence:read', 'identity.evidence:expire', 'identity.attester:manage'],
    events: [EVENTS.evidenceClaimed, EVENTS.evidenceAttested, EVENTS.evidenceRevoked, EVENTS.evidenceExpired, EVENTS.attesterRegistered, EVENTS.attesterRevoked],
    collections: [COLLECTIONS.evidence, COLLECTIONS.attesters],
  },
]);
