// Privacy classes, location levels, sinks and the flow matrix of CTR-PRV-001. Pure values and total orders.
export const PRIVACY_CLASSES = ['P0', 'P1', 'P2', 'P3', 'P4'] as const;
export type PrivacyClass = (typeof PRIVACY_CLASSES)[number];
export const LOCATION_LEVELS = ['L0', 'L1', 'L2', 'L3', 'L4'] as const;
export type LocationLevel = (typeof LOCATION_LEVELS)[number];
export const SINKS = ['log', 'event', 'federation', 'notification', 'projection', 'export', 'ui_public', 'ui_participant', 'ui_owner'] as const;
export type Sink = (typeof SINKS)[number];
export type RedactionStrategy = 'drop' | 'hash' | 'truncate' | 'snap';

export const MODEL_MAJOR = 1;

export function classRank(c: PrivacyClass): number {
  return PRIVACY_CLASSES.indexOf(c);
}
export function levelRank(l: LocationLevel): number {
  return LOCATION_LEVELS.indexOf(l);
}
export function isPrivacyClass(v: unknown): v is PrivacyClass {
  return typeof v === 'string' && (PRIVACY_CLASSES as readonly string[]).includes(v);
}
export function isLocationLevel(v: unknown): v is LocationLevel {
  return typeof v === 'string' && (LOCATION_LEVELS as readonly string[]).includes(v);
}
export function isSink(v: unknown): v is Sink {
  return typeof v === 'string' && (SINKS as readonly string[]).includes(v);
}

/** The more sensitive of two classes (total order P0 < P1 < P2 < P3 < P4). */
export function maxClass(a: PrivacyClass, b: PrivacyClass): PrivacyClass {
  return classRank(a) >= classRank(b) ? a : b;
}

// Rows: class; columns follow SINKS. CTR-PRV-001: P3 and P4 never reach log, federation, notification or projection;
// P1 and P2 never reach logs (IDs only), federation or public projections; P4 never leaves the device through these helpers.
const MATRIX: Readonly<Record<PrivacyClass, readonly boolean[]>> = {
  //      log    event  fed    notif  proj   export pub    part   owner
  P0: [true, true, true, true, true, true, true, true, true],
  P1: [false, true, false, true, false, true, false, true, true],
  P2: [false, true, false, true, false, true, false, true, true],
  P3: [false, true, false, false, false, true, false, false, true],
  P4: [false, false, false, false, false, false, false, false, false],
};

/** Static sink matrix: may data of this class flow to this sink at all (for its owner or a legitimate participant). */
export function canFlow(cls: PrivacyClass, sink: Sink): boolean {
  return MATRIX[cls][SINKS.indexOf(sink)] === true;
}

export interface FlowContext {
  /** The viewer owns the record. */
  readonly owner?: boolean;
  /** Output goes inside an end-to-end encrypted participant envelope (PRV-5). */
  readonly encrypted?: boolean;
  /** The user opted in to federation for this data. */
  readonly optIn?: boolean;
}

/** canFlow plus the viewer conditions: P2 only to the owner or in E2E envelopes (V05), P3 only to the owner. */
export function canFlowTo(cls: PrivacyClass, sink: Sink, ctx: FlowContext = {}): boolean {
  if (!canFlow(cls, sink)) return false;
  const owner = ctx.owner === true || sink === 'ui_owner';
  if (cls === 'P2' && (sink === 'event' || sink === 'notification' || sink === 'export')) return owner || ctx.encrypted === true;
  if (cls === 'P3' && (sink === 'event' || sink === 'export')) return owner;
  if (sink === 'federation') return ctx.optIn === true;
  return true;
}

const LOCATION_CAP: Readonly<Record<Sink, LocationLevel>> = {
  log: 'L2', event: 'L4', federation: 'L2', notification: 'L2', projection: 'L2', export: 'L4', ui_public: 'L2', ui_participant: 'L3', ui_owner: 'L4',
};

/** Finest location level a sink may carry: L2 (geohash 5) in any public, search, federated or notification payload. */
export function capLocation(level: LocationLevel, sink: Sink): LocationLevel {
  const cap = LOCATION_CAP[sink];
  return levelRank(level) <= levelRank(cap) ? level : cap;
}

/** i18n key for a class badge. */
export function labelKey(cls: PrivacyClass): string {
  return `privacy.class.${cls.toLowerCase()}`;
}
