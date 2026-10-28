/** Deny-by-default authorization rules for area `identity`. `public: true` only on anonymous-safe operations. */
import type { PolicyRule } from '@classrup/security';
import { anyOf, anyone, authenticated, hasAnyRole, isOwner, isSystem } from '@classrup/security';

const adminOrSystem = anyOf(hasAnyRole('admin'), isSystem);
const moderation = anyOf(hasAnyRole('moderator', 'admin'), isSystem);

export const POLICIES: readonly PolicyRule[] = Object.freeze([
  { permission: 'identity.account:register', allow: anyone, public: true, description: 'Anyone may register a pseudonymous account' },
  { permission: 'identity.account:lookup', allow: anyone, public: true, description: 'Pseudonyms are public; lookup returns id, pseudonym, activity flag' },
  { permission: 'identity.account:read', allow: isOwner, description: 'Owner reads own account and devices' },
  { permission: 'identity.account:deactivate', allow: isOwner, description: 'Owner deactivates own account' },
  { permission: 'identity.account:set_status', allow: adminOrSystem, description: 'Admin suspends or reactivates accounts' },
  { permission: 'identity.account:grant_role', allow: adminOrSystem, description: 'Admin grants or revokes roles' },
  { permission: 'identity.account:erase', allow: isSystem, description: 'Privacy deletion workflow erases identity data' },

  { permission: 'identity.device:add', allow: isOwner, description: 'Owner adds a device key' },
  { permission: 'identity.device:revoke', allow: isOwner, description: 'Owner revokes a device key' },
  { permission: 'identity.device:read', allow: isOwner, description: 'Owner lists device keys' },

  { permission: 'identity.session:challenge', allow: anyone, public: true, description: 'Anonymous client requests a login challenge' },
  { permission: 'identity.session:login', allow: anyone, public: true, description: 'Anonymous client answers a login challenge' },
  { permission: 'identity.session:read', allow: isOwner, description: 'Owner lists own sessions' },
  { permission: 'identity.session:revoke', allow: isOwner, description: 'Owner revokes own sessions' },
  { permission: 'identity.session:expire', allow: isSystem, description: 'Scheduler expires and purges sessions' },

  { permission: 'identity.recovery:issue', allow: isOwner, description: 'Owner issues a new recovery code set' },
  { permission: 'identity.recovery:read', allow: isOwner, description: 'Owner reads recovery code status' },
  { permission: 'identity.recovery:recover', allow: anyone, public: true, description: 'Anonymous holder of a recovery code rotates keys' },

  { permission: 'identity.profile:update', allow: isOwner, description: 'Owner edits own profile' },
  { permission: 'identity.profile:read', allow: anyone, public: true, description: 'Profiles are readable; fields are filtered by visibility' },

  { permission: 'identity.portable:export', allow: isOwner, description: 'Owner builds a portable identity document' },
  { permission: 'identity.portable:import', allow: isOwner, description: 'Owner imports a signed document from another relay' },
  { permission: 'identity.portable:verify', allow: anyone, public: true, description: 'Anyone may verify a portable document signature' },

  { permission: 'identity.feedback:submit', allow: authenticated, description: 'Members rate verified counterparties' },
  { permission: 'identity.feedback:edit', allow: isOwner, description: 'Rater edits own feedback inside the edit window' },
  { permission: 'identity.feedback:remove', allow: moderation, description: 'Moderators remove abusive feedback' },
  { permission: 'identity.feedback:read', allow: anyone, public: true, description: 'Feedback received is public' },
  { permission: 'identity.reputation:read', allow: anyone, public: true, description: 'Aggregate reputation is public' },

  { permission: 'identity.evidence:claim', allow: isOwner, description: 'Owner records a self-attested claim' },
  { permission: 'identity.evidence:attest', allow: isOwner, description: 'Owner presents an attester-signed attestation' },
  { permission: 'identity.evidence:read_own', allow: isOwner, description: 'Owner lists own evidence with notes' },
  { permission: 'identity.evidence:revoke', allow: anyOf(isOwner, moderation), description: 'Owner or moderator revokes evidence' },
  { permission: 'identity.evidence:read', allow: anyone, public: true, description: 'Public evidence shows kind and verified flag only' },
  { permission: 'identity.evidence:expire', allow: isSystem, description: 'Scheduler expires lapsed evidence' },
  { permission: 'identity.attester:manage', allow: adminOrSystem, description: 'Admin manages trusted attester keys' },
]);
