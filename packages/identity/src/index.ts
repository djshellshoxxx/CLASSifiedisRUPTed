/**
 * @classrup/identity (F07): pseudonymous accounts, challenge-response sessions, recovery and key
 * rotation, profiles, portable identity, counterparty-verified reputation and trust evidence.
 *
 * Relay wiring:
 *  - `authenticate(token)` resolves the `Authorization` bearer token to an Actor for every request.
 *  - `accountLookup` implements the kernel AccountLookup port for other features.
 *  - Schedule the system commands `identity.session.expire_due` and `identity.evidence.expire_due`.
 *  - F10 integration: `privacy.registerExporter('identity', (id) => identity.accounts.exportData(id))` and
 *    `privacy.registerEraser('identity', (id) => identity.accounts.erase(systemCtx, { accountId: id }))`.
 *  - Provide `ports.interactions` (InteractionVerifier, owner: commerce/mutiny), `ports.blocks` (moderation),
 *    `ports.relations` (comms) and `ports.rateLimit`. Defaults deny feedback and never grant trust.
 * Responses of login, registration and recovery contain one-time secrets; the idempotency store keeps them for
 * its TTL, so the relay's store must be encrypted at rest or the relay should not send an Idempotency-Key for them.
 */
import type { AccountLookup, Actor, Deps, Operation } from '@classrup/kernel';
import { createDeviceService } from './accounts/devices';
import { createAccountService } from './accounts/pseudonyms';
import { createRecoveryService } from './accounts/recovery';
import { createSessionService } from './accounts/sessions';
import type { IdentityEnv } from './env';
import { buildOperations } from './operations';
import type { IdentityServices } from './operations';
import { createPortableService } from './profiles/portable';
import { createProfileService } from './profiles/profiles';
import type { IdentityPorts } from './ports';
import { resolvePorts } from './ports';
import { openStores } from './records';
import { createEvidenceService } from './trust/evidence';
import { createReputationService } from './trust/reputation';

export interface Identity extends IdentityServices {
  readonly accountLookup: AccountLookup;
  /** Resolves a bearer token to an Actor, or undefined when invalid, expired, revoked or the account is not active. */
  authenticate(token: string): Actor | undefined;
  readonly operations: readonly Operation[];
}

export function createIdentity(deps: Deps, ports: IdentityPorts = {}): Identity {
  const env: IdentityEnv = { deps, ports: resolvePorts(ports), stores: openStores(deps) };
  const accounts = createAccountService(env);
  const sessions = createSessionService(env);
  const services: IdentityServices = {
    accounts,
    sessions,
    devices: createDeviceService(env),
    recovery: createRecoveryService(env),
    profiles: createProfileService(env),
    portable: createPortableService(env),
    reputation: createReputationService(env),
    evidence: createEvidenceService(env),
  };
  return { ...services, accountLookup: accounts.accountLookup, authenticate: (token) => sessions.authenticate(token), operations: buildOperations(services) };
}

export { POLICIES } from './policies';
export { MODULES } from './modules';
export { COLLECTIONS } from './records';
export { EVENTS as IDENTITY_EVENTS, FLAGS as IDENTITY_FLAGS } from './env';
export type { IdentityPorts, InteractionVerifier, RelationPort } from './ports';
export { denyAllInteractions } from './ports';
export { normalizePseudonym } from './accounts/naming';
export { generateRecoveryCodes, normalizeRecoveryCode } from './accounts/recovery';
export { bayesianScore, PRIOR_MEAN, PRIOR_WEIGHT, FEEDBACK_EDIT_WINDOW_MS } from './trust/reputation';
export { PORTABLE_CONTEXT, PORTABLE_FORMAT, PORTABLE_VERSION } from './profiles/portable';
export { ATTESTATION_CONTEXT } from './trust/evidence';
export { CHALLENGE_TTL_MS, SESSION_ABSOLUTE_TTL_MS, SESSION_IDLE_TTL_MS } from './accounts/sessions';
export type { AccountDto, PublicAccountDto, DeviceDto } from './accounts/model';
export type { SessionDto, ChallengeDto, LoginDto } from './accounts/sessions';
export type { ProfileDto } from './profiles/profiles';
export type { ReputationDto, FeedbackDto } from './trust/reputation';
export type { PublicEvidenceDto, OwnerEvidenceDto, AttesterDto } from './trust/evidence';
export type { PortableDocument, PortableVerification } from './profiles/portable';
