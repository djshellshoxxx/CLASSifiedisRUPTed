// F13.S02.M03 (PS-107) Channel opt-in/opt-out: signed per-channel consent for push and email, one-click unsubscribe.
// ADR-0016: the vault records the consent and signs the statement; a relay only registers statements it verified and never
// creates a consent for a user. Withdrawal always wins over a grant.
import { appError, canonicalJson, defineCommand, defineErrors, defineEvent, defineQuery, defineRepo, defineSubscriber, err, ok, sha256Hex, timestamp, z,
  type AppError, type CommandContext, type ConsumerContext, type QueryContext, type ReadScope, type Result, type SignedEnvelope, type StoredRecord } from '@classrup/kernel';
import { encodeBase64url } from '@classrup/security';

export const MODULE = 'F13.S02.M03';
export const CHANNEL_CONSENT_STATEMENT = 'classrup.notify.channel_consent/v1';
export const CHANNELS = ['push', 'email'] as const;
export type Channel = (typeof CHANNELS)[number];
const WITHDRAWN_VIA = ['settings', 'unsubscribe_link', 'privacy_withdrawal', 'account_deletion', 'relay_policy'] as const;
export type WithdrawnVia = (typeof WITHDRAWN_VIA)[number];
const DAY_MS = 86_400_000;
export const CONSENT_TTL_MS = 365 * DAY_MS;
export const RECONFIRM_LEAD_MS = 14 * DAY_MS;
export const MAX_CHANGES_PER_DAY = 20;
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

export const optErrors = defineErrors({
  NOTIFY_CHANNEL_UNSUPPORTED: { status: 422, retryable: false },
  NOTIFY_UNSUBSCRIBE_TOKEN_INVALID: { status: 404, retryable: false },
});

const did = () => z.string().startsWith('did:key:').max(128);
const consentSchema = z.strictObject({
  userDid: did(), relayId: z.string().min(1).max(253), channel: z.enum(CHANNELS), status: z.enum(['granted', 'withdrawn', 'expired']),
  privacyConsentId: z.string().max(64).optional(), grantedAtClaim: timestamp(), relayRegisteredAt: timestamp().optional(),
  withdrawnAtClaim: timestamp().optional(), withdrawnVia: z.enum(WITHDRAWN_VIA).optional(), expiresAt: timestamp(),
  statementCid: z.string().min(1).max(200), withdrawalCid: z.string().min(1).max(200).optional(),
  unsubscribeTokenHash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
});
export type ChannelConsent = z.output<typeof consentSchema>;
const slotKey = (userDid: string, relayId: string, channel: string) => `${userDid}\u0001${relayId}\u0001${channel}`;
export const consentRepo = defineRepo({ type: 'notify.channel_consent', schema: consentSchema, indexes: {
  owner: d => d.userDid,
  granted: d => (d.status === 'granted' ? slotKey(d.userDid, d.relayId, d.channel) : null),
  token: d => d.unsubscribeTokenHash ?? null,
  expiry: d => (d.status === 'granted' ? d.expiresAt : null),
} });
const changeRepo = defineRepo({ type: 'notify.consent_change', schema: z.strictObject({ count: z.int().min(0) }), indexes: {} });

/** Canonical statement body of classrup.notify.channel_consent/v1. The channel is a string so a relay can answer unknown channels as unsupported. */
export const consentStatementSchema = z.strictObject({
  consentId: z.string().min(1).max(64), userDid: did(), relayId: z.string().min(1).max(253), channel: z.string().min(1).max(32), status: z.enum(['granted', 'withdrawn']),
  privacyConsentId: z.string().max(64).optional(), grantedAtClaim: timestamp(), expiresAt: timestamp(),
  withdrawnAtClaim: timestamp().optional(), withdrawnVia: z.enum(WITHDRAWN_VIA).optional(),
}).refine(v => (v.status === 'granted' ? v.withdrawnAtClaim === undefined && v.withdrawnVia === undefined : v.withdrawnAtClaim !== undefined && v.withdrawnVia !== undefined));
export type ConsentStatement = z.output<typeof consentStatementSchema>;

export const optedIn = defineEvent('notify.channel.opted_in', 1, 'P2', z.strictObject({ consentId: z.string(), userDid: z.string(), relayId: z.string(), channel: z.enum(CHANNELS), expiresAt: timestamp() }));
export const optedOut = defineEvent('notify.channel.opted_out', 1, 'P2', z.strictObject({ consentId: z.string(), userDid: z.string(), relayId: z.string(), channel: z.enum(CHANNELS), via: z.enum([...WITHDRAWN_VIA, 'expired']) }));
// Consumed events are declared by their spec names; payloads are read leniently because the producers are other packages.
const privacyWithdrawn = defineEvent('privacy.consent.withdrawn', 1, 'P2', z.looseObject({ consentId: z.string().min(1).max(64) }));
const deletionRequested = defineEvent('privacy.deletion.requested', 1, 'P2', z.looseObject({}));

/** Statement as accepted by a verifier: author is the signer's DID; the payload is what was signed. */
export interface VerifiedStatement { readonly author: string; readonly type: string; readonly payload: unknown; readonly cid: string; readonly seq: number }
export interface PrivacyConsentPort {
  /** privacy.consent.check for the notify_push / notify_email purpose (N6); consentId narrows the check to one F10 consent. */
  check(input: { purpose: 'notify_push' | 'notify_email'; consentId?: string }): { granted: boolean; consentId?: string };
}
export interface ChannelRelayOptions {
  /** Hostname identity of this relay. */
  readonly relayId: string;
  /** Channels this relay offers. */
  readonly offers: readonly string[];
  /** Relay-signed receipt over the registration (evidence of the relay clock only). */
  signReceipt(payload: unknown): Promise<string>;
  /** CSPRNG bytes; module code never uses Math.random. */
  randomBytes(length: number): Uint8Array;
  /** Mailbox destination for relay-signed statements addressed to the user's vault. */
  returnDestination?(userDid: string): string;
}
export interface ChannelOptions {
  /** The unlocked local principal of this vault (or the relay's own identity on the relay). */
  localPrincipal(): string;
  /** Channels a relay advertises in its capability list (V01). */
  relayChannels(relayId: string): readonly string[];
  readonly privacy: PrivacyConsentPort;
  /** Signs a statement with the local identity (or the relay identity), like BazaarOptions.signProjection. */
  signStatement(type: string, payload: unknown, seq: number, previousCid: string | null): Promise<SignedEnvelope>;
  /** Verifies signature, envelope and signer key; throws when invalid. */
  verifyStatement(envelope: unknown): Promise<VerifiedStatement>;
  /** True when `author` is the signing identity of the relay named `relayId`. */
  isRelaySigner?(relayId: string, author: string): boolean;
  /** Present only in a relay process. */
  readonly relay?: ChannelRelayOptions;
}

type WriteCtx = Pick<CommandContext, 'tx' | 'emit' | 'clock' | 'ids'>;
const iso = (ms: number) => new Date(ms).toISOString();
const effective = (d: ChannelConsent, now: number): ChannelConsent['status'] => (d.status === 'granted' && Date.parse(d.expiresAt) <= now ? 'expired' : d.status);

function timingSafeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/** Granted, unexpired consent a relay may send on (T02 of the specification: no consent, no send). */
export function activeConsent(tx: ReadScope, userDid: string, relayId: string, channel: string, nowMs: number): StoredRecord<ChannelConsent> | undefined {
  const page = tx.repo(consentRepo).query({ where: { granted: slotKey(userDid, relayId, channel) }, limit: 2 });
  if (!page.ok) return undefined;
  return page.value.items.find(r => effective(r.data, nowMs) === 'granted');
}
export function hasActiveConsent(tx: ReadScope, userDid: string, relayId: string, channel?: Channel, nowMs = Date.now()): boolean {
  return (channel ? [channel] : CHANNELS).some(c => activeConsent(tx, userDid, relayId, c, nowMs) !== undefined);
}

function consumeChange(ctx: WriteCtx, userDid: string, relayId: string): boolean {
  const repo = ctx.tx.repo(changeRepo);
  const id = `${userDid}/${relayId}/${Math.floor(ctx.clock.now() / DAY_MS)}`;
  const cur = repo.get(id);
  if ((cur?.data.count ?? 0) >= MAX_CHANGES_PER_DAY) return false;
  return repo.put(id, { count: (cur?.data.count ?? 0) + 1 }, { expectedRevision: cur?.revision ?? 0 }).ok;
}

export function optDefinitions(options: ChannelOptions) {
  const localActor = (ctx: Pick<CommandContext, 'actor'>) => ctx.actor.kind === 'user' && ctx.actor.id === options.localPrincipal() ? ctx.actor.id : undefined;

  async function sign(payload: ConsentStatement, seq: number, previous: string | null, signer: string): Promise<Result<SignedEnvelope, AppError>> {
    try {
      const envelope = structuredClone(await options.signStatement(CHANNEL_CONSENT_STATEMENT, payload, seq, previous));
      const verified = await options.verifyStatement(envelope);
      if (verified.author !== signer || verified.type !== CHANNEL_CONSENT_STATEMENT || canonicalJson(verified.payload) !== canonicalJson(payload) || verified.cid !== envelope.cid) return err(appError('FORBIDDEN'));
      return ok(envelope);
    } catch { return err(appError('VALIDATION_FAILED')); }
  }
  const statementOf = (id: string, d: ChannelConsent, status: 'granted' | 'withdrawn', via?: WithdrawnVia, at?: string): ConsentStatement => ({
    consentId: id, userDid: d.userDid, relayId: d.relayId, channel: d.channel, status,
    ...(d.privacyConsentId ? { privacyConsentId: d.privacyConsentId } : {}), grantedAtClaim: d.grantedAtClaim, expiresAt: d.expiresAt,
    ...(status === 'withdrawn' && via && at ? { withdrawnAtClaim: at, withdrawnVia: via } : {}),
  });
  const optedOutPayload = (id: string, d: ChannelConsent, via: WithdrawnVia | 'expired') => ({ consentId: id, userDid: d.userDid, relayId: d.relayId, channel: d.channel, via });

  /** Vault side: sign and queue a withdrawal, record it, emit the event. */
  async function withdrawLocal(ctx: WriteCtx, rec: StoredRecord<ChannelConsent>, via: WithdrawnVia): Promise<Result<StoredRecord<ChannelConsent>, AppError>> {
    const at = iso(ctx.clock.now());
    const signed = await sign(statementOf(rec.id, rec.data, 'withdrawn', via, at), 2, rec.data.statementCid, rec.data.userDid);
    if (!signed.ok) return signed;
    const { unsubscribeTokenHash: _hash, ...rest } = rec.data;
    const saved = ctx.tx.repo(consentRepo).put(rec.id, { ...rest, status: 'withdrawn', withdrawnAtClaim: at, withdrawnVia: via, withdrawalCid: signed.value.cid }, { expectedRevision: rec.revision });
    if (!saved.ok) return saved;
    ctx.tx.sync.enqueue(rec.data.relayId, signed.value);
    ctx.emit(optedOut, { aggregate: { type: 'channel_consent', id: rec.id }, revision: saved.value.revision, payload: optedOutPayload(rec.id, rec.data, via) });
    return ok(saved.value);
  }
  function expireRecord(ctx: WriteCtx, rec: StoredRecord<ChannelConsent>): Result<StoredRecord<ChannelConsent>, AppError> {
    const { unsubscribeTokenHash: _hash, ...rest } = rec.data;
    const saved = ctx.tx.repo(consentRepo).put(rec.id, { ...rest, status: 'expired' }, { expectedRevision: rec.revision });
    if (!saved.ok) return saved;
    ctx.emit(optedOut, { aggregate: { type: 'channel_consent', id: rec.id }, revision: saved.value.revision, payload: optedOutPayload(rec.id, rec.data, 'expired') });
    return ok(saved.value);
  }

  const optIn = defineCommand({ name: 'notify.channel.opt_in', module: MODULE, capability: 'notify.channel.opt_in', idempotent: true, deliveryEligible: true,
    input: z.strictObject({ channel: z.string().min(1).max(32), relayId: z.string().min(1).max(253), privacyConsentId: z.string().min(1).max(64).optional() }),
    async handler(ctx, input) {
      const principal = localActor(ctx);
      if (!principal) return err(appError('FORBIDDEN'));
      if (input.channel !== 'push' && input.channel !== 'email') return err(optErrors.make('NOTIFY_CHANNEL_UNSUPPORTED'));
      const channel: Channel = input.channel;
      if (!options.relayChannels(input.relayId).includes(channel)) return err(optErrors.make('NOTIFY_CHANNEL_UNSUPPORTED'));
      const privacy = options.privacy.check({ purpose: channel === 'push' ? 'notify_push' : 'notify_email', ...(input.privacyConsentId ? { consentId: input.privacyConsentId } : {}) });
      if (!privacy.granted) return err(appError('PRECONDITION_FAILED'));
      const privacyConsentId = input.privacyConsentId ?? privacy.consentId;
      const repo = ctx.tx.repo(consentRepo);
      const slot = repo.query({ where: { granted: slotKey(principal, input.relayId, channel) }, limit: 2 });
      if (!slot.ok) return slot;
      for (const existing of slot.value.items) {
        if (effective(existing.data, ctx.clock.now()) === 'granted') return ok({ consentId: existing.id, status: 'granted' as const, expiresAt: existing.data.expiresAt, syncState: 'local_committed' as const });
        const expired = expireRecord(ctx, existing);
        if (!expired.ok) return expired;
      }
      if (!consumeChange(ctx, principal, input.relayId)) return err(appError('RATE_LIMITED', { retryAfterMs: DAY_MS }));
      const consentId = ctx.ids.next();
      const now = ctx.clock.now();
      const data: ChannelConsent = { userDid: principal, relayId: input.relayId, channel, status: 'granted', ...(privacyConsentId ? { privacyConsentId } : {}),
        grantedAtClaim: iso(now), expiresAt: iso(now + CONSENT_TTL_MS), statementCid: 'pending' };
      const signed = await sign(statementOf(consentId, data, 'granted'), 1, null, principal);
      if (!signed.ok) return signed;
      const saved = repo.put(consentId, { ...data, statementCid: signed.value.cid }, { expectedRevision: 0 });
      if (!saved.ok) return saved;
      ctx.tx.sync.enqueue(input.relayId, signed.value);
      ctx.emit(optedIn, { aggregate: { type: 'channel_consent', id: consentId }, revision: saved.value.revision, payload: { consentId, userDid: principal, relayId: input.relayId, channel, expiresAt: data.expiresAt } });
      return ok({ consentId, status: 'granted' as const, expiresAt: data.expiresAt, syncState: 'local_committed' as const });
    },
  });

  const optOut = defineCommand({ name: 'notify.channel.opt_out', module: MODULE, capability: 'notify.channel.opt_out', idempotent: true, deliveryEligible: true,
    input: z.strictObject({ consentId: z.string().min(1).max(64), expectedRevision: z.int().min(1) }),
    async handler(ctx, input) {
      const principal = localActor(ctx);
      const rec = ctx.tx.repo(consentRepo).get(input.consentId);
      if (!principal || !rec || rec.data.userDid !== principal) return err(appError('NOT_FOUND'));
      if (rec.data.status === 'withdrawn') return ok({ consentId: rec.id, status: 'withdrawn' as const, revision: rec.revision });
      if (effective(rec.data, ctx.clock.now()) === 'expired') return err(appError('CONFLICT_STATE'));
      if (rec.revision !== input.expectedRevision) return err(appError('CONFLICT_REVISION'));
      if (!consumeChange(ctx, principal, rec.data.relayId)) return err(appError('RATE_LIMITED', { retryAfterMs: DAY_MS }));
      const saved = await withdrawLocal(ctx, rec, 'settings');
      return saved.ok ? ok({ consentId: rec.id, status: 'withdrawn' as const, revision: saved.value.revision }) : saved;
    },
  });

  const register = defineCommand({ name: 'notify.channel.register', module: MODULE, capability: 'notify.channel.register', surface: 'relay', idempotent: true,
    input: z.strictObject({ statement: z.unknown() }),
    async handler(ctx, input) {
      if (ctx.actor.kind === 'anonymous') return err(appError('UNAUTHENTICATED'));
      const relay = options.relay;
      if (!relay) return err(appError('FEATURE_DISABLED'));
      let verified: VerifiedStatement;
      let snapshot: unknown;
      try { snapshot = structuredClone(input.statement); verified = await options.verifyStatement(snapshot); } catch { return err(appError('VALIDATION_FAILED')); }
      const parsed = verified.type === CHANNEL_CONSENT_STATEMENT ? consentStatementSchema.safeParse(verified.payload) : undefined;
      if (!parsed?.success) return err(appError('VALIDATION_FAILED'));
      const p = parsed.data;
      // V02/T03: the relay receives only the user's own statements for this relay; the signer must be the consenting user.
      if (p.relayId !== relay.relayId || verified.author !== p.userDid) return err(appError('VALIDATION_FAILED'));
      if (p.channel !== 'push' && p.channel !== 'email') return err(optErrors.make('NOTIFY_CHANNEL_UNSUPPORTED'));
      const channel: Channel = p.channel;
      if (!relay.offers.includes(channel)) return err(optErrors.make('NOTIFY_CHANNEL_UNSUPPORTED'));
      const now = ctx.clock.now();
      if (p.status === 'granted' && (Date.parse(p.expiresAt) <= now || Date.parse(p.expiresAt) > Date.parse(p.grantedAtClaim) + CONSENT_TTL_MS)) return err(appError('VALIDATION_FAILED'));
      const repo = ctx.tx.repo(consentRepo);
      const receipt = async (rec: StoredRecord<ChannelConsent>) => {
        const registeredAt = rec.data.relayRegisteredAt ?? iso(now);
        const status = effective(rec.data, now);
        return ok({ consentId: rec.id, status, relayRegisteredAt: registeredAt, relayReceiptSig: await relay.signReceipt({ consentId: rec.id, status, statementCid: verified.cid, relayRegisteredAt: registeredAt }) });
      };
      const existing = repo.get(p.consentId);
      if (existing) {
        const d = existing.data;
        if (d.userDid !== p.userDid || d.relayId !== p.relayId || d.channel !== channel) return err(appError('CONFLICT_STATE'));
        if (d.statementCid === verified.cid || d.withdrawalCid === verified.cid) return receipt(existing);
        if (p.status === 'granted') return d.status === 'granted' ? err(appError('CONFLICT_STATE')) : receipt(existing); // a late grant never revives a withdrawn record
        if (d.status !== 'granted') return receipt(existing);
        if (!consumeChange(ctx, p.userDid, p.relayId)) return err(appError('RATE_LIMITED', { retryAfterMs: DAY_MS }));
        const { unsubscribeTokenHash: _hash, ...rest } = d;
        const saved = repo.put(existing.id, { ...rest, status: 'withdrawn', withdrawnAtClaim: p.withdrawnAtClaim ?? iso(now), withdrawnVia: p.withdrawnVia ?? 'settings', withdrawalCid: verified.cid, relayRegisteredAt: iso(now) }, { expectedRevision: existing.revision });
        return saved.ok ? receipt(saved.value) : saved;
      }
      if (p.status === 'granted' && activeConsent(ctx.tx, p.userDid, p.relayId, channel, now)) return err(appError('CONFLICT_STATE'));
      if (!consumeChange(ctx, p.userDid, p.relayId)) return err(appError('RATE_LIMITED', { retryAfterMs: DAY_MS }));
      const base = { userDid: p.userDid, relayId: p.relayId, channel, ...(p.privacyConsentId ? { privacyConsentId: p.privacyConsentId } : {}), grantedAtClaim: p.grantedAtClaim, relayRegisteredAt: iso(now), expiresAt: p.expiresAt, statementCid: verified.cid };
      // A withdrawal that arrives before its grant is stored as a withdrawn record, so the late grant cannot revive it.
      const data: ChannelConsent = p.status === 'granted' ? { ...base, status: 'granted' } : { ...base, status: 'withdrawn', withdrawnAtClaim: p.withdrawnAtClaim ?? iso(now), withdrawnVia: p.withdrawnVia ?? 'settings', withdrawalCid: verified.cid };
      const saved = repo.put(p.consentId, data, { expectedRevision: 0 });
      return saved.ok ? receipt(saved.value) : saved;
    },
  });

  const unsubscribe = defineCommand({ name: 'notify.channel.unsubscribe', module: MODULE, capability: 'notify.channel.unsubscribe', surface: 'relay', auth: 'public', idempotent: true, deliveryEligible: true,
    input: z.strictObject({ token: z.string().max(512) }),
    async handler(ctx, input) {
      const invalid = () => err(optErrors.make('NOTIFY_UNSUBSCRIBE_TOKEN_INVALID'));
      if (!TOKEN_RE.test(input.token)) return invalid();
      const hash = await sha256Hex(input.token);
      const page = ctx.tx.repo(consentRepo).query({ where: { token: hash }, limit: 2 });
      const rec = page.ok ? page.value.items.find(r => r.data.unsubscribeTokenHash !== undefined && timingSafeEqual(r.data.unsubscribeTokenHash, hash)) : undefined;
      if (!rec) return invalid();
      const d = rec.data;
      if (d.status === 'withdrawn' && d.withdrawnVia === 'unsubscribe_link') return ok({ channel: d.channel, status: 'withdrawn' as const });
      if (effective(d, ctx.clock.now()) !== 'granted') return invalid();
      const at = iso(ctx.clock.now());
      // The hash stays on a record withdrawn by its own link so a second click is an idempotent success.
      const saved = ctx.tx.repo(consentRepo).put(rec.id, { ...d, status: 'withdrawn', withdrawnAtClaim: at, withdrawnVia: 'unsubscribe_link' }, { expectedRevision: rec.revision });
      if (!saved.ok) return saved;
      const destination = options.relay?.returnDestination?.(d.userDid);
      if (destination) {
        const signed = await sign(statementOf(rec.id, d, 'withdrawn', 'unsubscribe_link', at), 2, d.statementCid, options.localPrincipal());
        if (!signed.ok) return signed;
        ctx.tx.sync.enqueue(destination, signed.value);
      }
      return ok({ channel: d.channel, status: 'withdrawn' as const });
    },
  });

  const getMine = defineQuery({ name: 'notify.channel.get_mine', module: MODULE, capability: 'notify.channel.read_own',
    input: z.strictObject({ channel: z.enum(CHANNELS).optional() }),
    handler(ctx: QueryContext, input) {
      if (ctx.actor.kind !== 'user' || ctx.actor.id !== options.localPrincipal()) return err(appError('FORBIDDEN'));
      const page = ctx.tx.repo(consentRepo).query({ where: { owner: ctx.actor.id }, limit: 500 });
      if (!page.ok) return page;
      const now = ctx.clock.now();
      const items = page.value.items.filter(r => !input.channel || r.data.channel === input.channel).map(r => {
        const { unsubscribeTokenHash: _hash, ...data } = r.data;
        const status = effective(r.data, now);
        return { id: r.id, revision: r.revision, ...data, status, needsReconfirmation: status === 'granted' && Date.parse(r.data.expiresAt) - now <= RECONFIRM_LEAD_MS };
      });
      return ok({ items });
    },
  });

  /** Relay sweep (every 5 minutes): marks consents past expiresAt as expired; run by the composition root inside a transaction. */
  function sweepExpiredConsents(ctx: WriteCtx, limit = 500): number {
    const page = ctx.tx.repo(consentRepo).query({ where: { expiry: { lte: iso(ctx.clock.now()) } }, limit });
    if (!page.ok) return 0;
    let n = 0;
    for (const rec of page.value.items) if (expireRecord(ctx, rec).ok) n++;
    return n;
  }
  /** Relay send path: mints (or rotates) the 256-bit unsubscribe token of a granted consent and stores only its SHA-256 hash. */
  async function mintUnsubscribeToken(ctx: WriteCtx, consentId: string): Promise<Result<string, AppError>> {
    const relay = options.relay;
    if (!relay) return err(appError('FEATURE_DISABLED'));
    const rec = ctx.tx.repo(consentRepo).get(consentId);
    if (!rec || effective(rec.data, ctx.clock.now()) !== 'granted') return err(appError('NOT_FOUND'));
    const token = encodeBase64url(relay.randomBytes(32));
    const saved = ctx.tx.repo(consentRepo).put(rec.id, { ...rec.data, unsubscribeTokenHash: await sha256Hex(token) }, { expectedRevision: rec.revision });
    return saved.ok ? ok(token) : saved;
  }

  /**
   * Inbound statement handlers for the composition root router (statement already verified by the router). The vault accepts a
   * relay-signed withdrawal of its own consent and never a relay-signed grant; withdrawal wins over a late grant.
   */
  const statementHandlers = {
    [CHANNEL_CONSENT_STATEMENT]: (ctx: WriteCtx, statement: VerifiedStatement): Result<{ consentId: string; status: ChannelConsent['status'] }, AppError> => {
      const parsed = statement.type === CHANNEL_CONSENT_STATEMENT ? consentStatementSchema.safeParse(statement.payload) : undefined;
      if (!parsed?.success) return err(appError('VALIDATION_FAILED'));
      const p = parsed.data;
      if (p.status !== 'withdrawn' || !options.isRelaySigner?.(p.relayId, statement.author)) return err(appError('FORBIDDEN'));
      const repo = ctx.tx.repo(consentRepo);
      const rec = repo.get(p.consentId);
      if (!rec || rec.data.userDid !== options.localPrincipal() || rec.data.relayId !== p.relayId) return err(appError('NOT_FOUND'));
      if (rec.data.status !== 'granted') return ok({ consentId: rec.id, status: rec.data.status });
      const via: WithdrawnVia = p.withdrawnVia === 'relay_policy' ? 'relay_policy' : 'unsubscribe_link';
      const saved = repo.put(rec.id, { ...rec.data, status: 'withdrawn', withdrawnAtClaim: p.withdrawnAtClaim ?? iso(ctx.clock.now()), withdrawnVia: via, withdrawalCid: statement.cid }, { expectedRevision: rec.revision });
      if (!saved.ok) return saved;
      ctx.emit(optedOut, { aggregate: { type: 'channel_consent', id: rec.id }, revision: saved.value.revision, payload: optedOutPayload(rec.id, rec.data, via) });
      return ok({ consentId: rec.id, status: 'withdrawn' as const });
    },
  };

  async function withdrawMatching(ctx: ConsumerContext, via: WithdrawnVia, pick: (d: ChannelConsent) => boolean): Promise<Result<void, AppError>> {
    const page = ctx.tx.repo(consentRepo).query({ where: { owner: options.localPrincipal() }, limit: 500 });
    if (!page.ok) return page;
    for (const rec of page.value.items) {
      if (effective(rec.data, ctx.clock.now()) !== 'granted' || !pick(rec.data)) continue;
      const done = await withdrawLocal(ctx, rec, via);
      if (!done.ok) return done;
    }
    return ok(undefined);
  }
  const onPrivacyWithdrawn = defineSubscriber({ name: 'notify.channel_privacy_withdrawn', module: MODULE, events: [privacyWithdrawn], deliveryEligible: true,
    handler: (ctx, env) => withdrawMatching(ctx, 'privacy_withdrawal', d => d.privacyConsentId === env.payload.consentId) });
  const onDeletionRequested = defineSubscriber({ name: 'notify.channel_deletion_requested', module: MODULE, events: [deletionRequested], deliveryEligible: true,
    handler: ctx => withdrawMatching(ctx, 'account_deletion', () => true) });

  return { optIn, optOut, register, unsubscribe, getMine, onPrivacyWithdrawn, onDeletionRequested, statementHandlers, sweepExpiredConsents, mintUnsubscribeToken,
    all: [optIn, optOut, register, unsubscribe, getMine, onPrivacyWithdrawn, onDeletionRequested] as const };
}
