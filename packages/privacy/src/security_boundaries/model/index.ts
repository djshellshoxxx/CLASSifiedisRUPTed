// F10.S02.M02 Data classification model: pure, isomorphic library (no storage, network, clock or randomness).
export { modelErrors } from './errors.ts';
export {
  canFlow, canFlowTo, capLocation, classRank, isLocationLevel, isPrivacyClass, isSink, labelKey, levelRank, LOCATION_LEVELS, maxClass, MODEL_MAJOR, PRIVACY_CLASSES, SINKS,
  type FlowContext, type LocationLevel, type PrivacyClass, type RedactionStrategy, type Sink,
} from './classes.ts';
export {
  checkEventClass, classOf, createClassificationRegistry, defaultClassificationRegistry, fieldPathsOfZod, lintClassification, loadClassification, MAX_MAP_PATHS, parseClassificationMap, registerClassification, validateCoverage,
  type ClassificationMap, type ClassificationRegistry, type FieldClassification, type LintEntry, type LintFinding, type LintReport,
} from './classification.ts';
export {
  assertSinkSafe, MAX_DEPTH, MAX_NODES, MAX_RECORD_BYTES, redactFor, redactForEvent, redactForExport, redactForFederation, redactForLog, redactForNotification, redactForProjection,
  type RedactionContext, type RedactionResult,
} from './redact.ts';
export { geohashBounds, geohashEncode } from './geohash.ts';
