// @classrup/kernel — isomorphic core (no node: imports). Node adapters: ./node; browser vault: ./browser.
export { createSystemClock, createFakeClock, parseIso, toIso, type Clock, type FakeClock } from './clock/clock.ts';
export {
  checkIdSkew,
  createDeterministicIds,
  createSeededRandom,
  createUuidV7Generator,
  isUuidV7,
  MAX_ID_SKEW_MS,
  parseId,
  uuidV7Timestamp,
  webCryptoRandom,
  type Id,
  type IdGen,
  type RandomFill,
} from './ids/uuidv7.ts';
export { andThen, err, mapResult, ok, unwrap, type Err, type Ok, type Result } from './errors/result.ts';
export { appError, AppErrorException, defineErrors, isAppError, messageKeyFor, type AppError, type AppErrorExtra, type ErrorRegistry, type FieldIssue } from './errors/app-error.ts';
export { COMMON_ERRORS, PLATFORM_ERRORS, type CommonCode, type ErrorSpec, type PlatformCode } from './errors/codes.ts';
export { PROBLEM_CONTENT_TYPE, toProblemJson, type ProblemJson } from './errors/problem.ts';
export { canonicalJson, requestHash, sha256Hex } from './hash/canonical.ts';
export { issuesToFields, parseInput } from './validation/parse.ts';
export { boundedString, codePointLength, isTimestamp, money, revision, strictObject, timestamp, uuidv7, z, type MoneySign } from './validation/schemas.ts';
export {
  buildEnvelope,
  collectingSink,
  defineEvent,
  EVENT_TYPE_RE,
  type AggregateRef,
  type EmitInput,
  type EventDef,
  type EventEnvelope,
  type EventSink,
  type PayloadOf,
  type PrivacyClass,
} from './events/envelope.ts';
export { defineMachine, type Machine, type MachineDef, type Transition } from './machine/machine.ts';
export {
  createBus,
  IDEMPOTENCY_TTL_MS,
  type Bus,
  type BusOptions,
  type CommandOutcome,
  type DispatchContext,
  type DispatchOptions,
  type QueryOutcome,
} from './bus/bus.ts';
export {
  createRegistry,
  defineCommand,
  defineQuery,
  defineSubscriber,
  type AnyCommand,
  type AnyDefinition,
  type AnyQuery,
  type AnySubscriber,
  type CommandContext,
  type CommandDef,
  type CommandSpec,
  type ConsumerContext,
  type Emit,
  type HandlerContext,
  type QueryContext,
  type QueryDef,
  type QuerySpec,
  type Registry,
  type SubscriberDef,
  type SubscriberSpec,
  type Surface,
} from './bus/define.ts';
export {
  actorKey,
  allFlagsOn,
  allowAllAuthz,
  ANONYMOUS,
  createFixedWindowRateLimiter,
  createMemoryAudit,
  createRoleTableAuthz,
  createStaticFlags,
  denyAllAuthz,
  errorFromCode,
  noopAudit,
  requirePort,
  unlimitedRate,
  type Actor,
  type ActorKind,
  type AuditEntry,
  type AuditPort,
  type AuthzContext,
  type AuthzDecision,
  type AuthzPort,
  type FlagPort,
  type FlagQuery,
  type Origin,
  type Ports,
  type RateDecision,
  type RateLimitPort,
  type RateQuery,
  type ResourceRef,
  type RoleTable,
  type Session,
  type SessionPort,
} from './bus/ports.ts';
export { createRelayAccess, loginMessage, type Challenge, type RelayAccess, type RelayAccessOptions, type SignatureVerifier } from './bus/access.ts';
export { createStorage, createMemoryStorage, type Storage, type TxMode } from './storage/storage.ts';
export { DEFAULT_LEASE_TTL_MS, type DeadLetter, type IdempotencyRecord, type Lease, type SignedEnvelope, type StoredRecord, type SyncEntry, type Tx } from './storage/tx.ts';
export { defineRepo, type IndexFn, type Page, type Range, type ReadRepo, type Repo, type RepoDef, type RepoQuery } from './storage/repo.ts';
export { recordPeerAck, type ReadScope, type ScopedLeases, type ScopedSync, type WriteScope } from './storage/scope.ts';
export { migrationStatus, runMigrations, type Migration, type MigrationStatus } from './storage/migrations.ts';
export { inboxMachine, syncMachine } from './storage/machines.ts';
export type { DriverKind, DriverTx, StorageDriver, SyncState } from './storage/driver.ts';
export { createMemoryDriver } from './storage/memory-driver.ts';
export { createOutboxDispatcher, MAX_DELIVERY_ATTEMPTS, type DeliveryOutcome, type DispatchStats, type OutboxDispatcher, type OutboxDispatcherOptions } from './outbox/dispatcher.ts';
export { fullJitterDelay, type BackoffOptions } from './outbox/backoff.ts';
export { createSyncSender, SYNC_EXPIRY_MS, syncOk, type SyncSender, type SyncSenderOptions, type SyncStats, type SyncTransport, type TransportReceipt } from './sync/sender.ts';
export { consoleSink, createLogger, createRingBufferSink, noopLogger, type LogFields, type Logger, type LoggerOptions, type LogLevel, type LogSink, type RingBufferSink } from './observability/logger.ts';
export { redact, REDACTED } from './observability/redact.ts';
export { isIP, truncateIp } from './observability/ip.ts';
export {
  ALLOWED_LABELS,
  createMetricsRegistry,
  DEFAULT_MS_BUCKETS,
  PROMETHEUS_CONTENT_TYPE,
  type Counter,
  type Gauge,
  type Histogram,
  type LabelName,
  type Labels,
  type MetricsRegistry,
} from './observability/metrics.ts';
export { createReadiness, type ReadinessProbe, type ReadinessReport } from './observability/readiness.ts';
