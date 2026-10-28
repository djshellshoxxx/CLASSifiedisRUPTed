/**
 * F15.S03.M01 metrics: counters, gauges and fixed-bucket histograms behind the kernel `Metrics` port,
 * with Prometheus text exposition. Metrics must never throw into a command, so invalid samples,
 * kind clashes and series beyond the cardinality cap are dropped and counted instead.
 */
import type { Metrics } from '@classrup/kernel';

export type Labels = Readonly<Record<string, string>>;

export const DEFAULT_BUCKETS: readonly number[] = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

type MetricKind = 'counter' | 'gauge' | 'histogram';

interface HistogramSeries {
  readonly labels: Labels;
  readonly counts: number[];
  sum: number;
  count: number;
}

interface ValueSeries {
  readonly labels: Labels;
  value: number;
}

export interface MetricsOptions {
  readonly prefix?: string;
  readonly buckets?: readonly number[];
  readonly maxSeriesPerMetric?: number;
}

export const sanitizeMetricName = (name: string): string => {
  const s = name.replace(/[^a-zA-Z0-9_:]/g, '_');
  return /^[a-zA-Z_:]/.test(s) ? s : `_${s}`;
};

export const sanitizeLabelName = (name: string): string => {
  const s = name.replace(/[^a-zA-Z0-9_]/g, '_');
  return /^[a-zA-Z_]/.test(s) ? s : `_${s}`;
};

/** Prometheus label value escaping: backslash, double quote and newline. */
export const escapeLabelValue = (value: string): string => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');

const formatNumber = (n: number): string => (n === Number.POSITIVE_INFINITY ? '+Inf' : n === Number.NEGATIVE_INFINITY ? '-Inf' : String(n));

function normalizeLabels(tags: Labels | undefined): Labels {
  const out: Record<string, string> = {};
  for (const k of Object.keys(tags ?? {}).sort()) out[sanitizeLabelName(k)] = String((tags as Labels)[k]);
  return out;
}

const seriesKey = (labels: Labels): string => JSON.stringify(Object.entries(labels));

function renderLabels(labels: Labels, extra?: Readonly<Record<string, string>>): string {
  const pairs = Object.entries({ ...labels, ...extra }).map(([k, v]) => `${k}="${escapeLabelValue(v)}"`);
  return pairs.length === 0 ? '' : `{${pairs.join(',')}}`;
}

export class MetricsRegistry implements Metrics {
  readonly #prefix: string;
  readonly #buckets: readonly number[];
  readonly #maxSeries: number;
  readonly #kinds = new Map<string, MetricKind>();
  readonly #values = new Map<string, Map<string, ValueSeries>>();
  readonly #histograms = new Map<string, Map<string, HistogramSeries>>();
  #dropped = 0;

  constructor(opts: MetricsOptions = {}) {
    this.#prefix = opts.prefix ?? 'classrup_';
    this.#buckets = [...(opts.buckets ?? DEFAULT_BUCKETS)].sort((a, b) => a - b);
    this.#maxSeries = opts.maxSeriesPerMetric ?? 500;
  }

  get droppedSamples(): number {
    return this.#dropped;
  }

  increment(name: string, value = 1, tags?: Labels): void {
    if (!Number.isFinite(value) || value < 0) return this.#drop();
    this.#value('counter', name, tags, (s) => {
      s.value += value;
    });
  }

  gauge(name: string, value: number, tags?: Labels): void {
    if (!Number.isFinite(value)) return this.#drop();
    this.#value('gauge', name, tags, (s) => {
      s.value = value;
    });
  }

  observe(name: string, value: number, tags?: Labels): void {
    if (!Number.isFinite(value)) return this.#drop();
    const key = this.#claim('histogram', name);
    if (key === undefined) return this.#drop();
    const series = this.#series(this.#histograms, key, normalizeLabels(tags), (labels) => ({ labels, counts: this.#buckets.map(() => 0), sum: 0, count: 0 }));
    if (!series) return this.#drop();
    this.#buckets.forEach((le, i) => {
      if (value <= le) series.counts[i] = (series.counts[i] as number) + 1;
    });
    series.sum += value;
    series.count += 1;
  }

  /** Current value of a counter or gauge series (0 when absent). */
  value(name: string, tags?: Labels): number {
    return this.#values.get(sanitizeMetricName(name))?.get(seriesKey(normalizeLabels(tags)))?.value ?? 0;
  }

  histogram(name: string, tags?: Labels): { count: number; sum: number } | undefined {
    const s = this.#histograms.get(sanitizeMetricName(name))?.get(seriesKey(normalizeLabels(tags)));
    return s && { count: s.count, sum: s.sum };
  }

  /** Prometheus text exposition format 0.0.4. Output order is deterministic. */
  render(): string {
    const lines: string[] = [];
    for (const name of [...this.#kinds.keys()].sort()) {
      const kind = this.#kinds.get(name) as MetricKind;
      const full = this.#prefix + name;
      if (kind === 'histogram') this.#renderHistogram(lines, name, full);
      else this.#renderValues(lines, name, full, kind);
    }
    lines.push(`# TYPE ${this.#prefix}metrics_dropped_samples_total counter`, `${this.#prefix}metrics_dropped_samples_total ${this.#dropped}`);
    return `${lines.join('\n')}\n`;
  }

  #renderValues(lines: string[], name: string, full: string, kind: 'counter' | 'gauge'): void {
    const exposed = kind === 'counter' ? `${full}_total` : full;
    lines.push(`# TYPE ${exposed} ${kind}`);
    for (const s of this.#sortedSeries(this.#values.get(name))) lines.push(`${exposed}${renderLabels(s.labels)} ${formatNumber(s.value)}`);
  }

  #renderHistogram(lines: string[], name: string, full: string): void {
    lines.push(`# TYPE ${full} histogram`);
    for (const s of this.#sortedSeries(this.#histograms.get(name))) {
      this.#buckets.forEach((le, i) => lines.push(`${full}_bucket${renderLabels(s.labels, { le: formatNumber(le) })} ${s.counts[i]}`));
      lines.push(`${full}_bucket${renderLabels(s.labels, { le: '+Inf' })} ${s.count}`);
      lines.push(`${full}_sum${renderLabels(s.labels)} ${formatNumber(s.sum)}`, `${full}_count${renderLabels(s.labels)} ${s.count}`);
    }
  }

  #sortedSeries<T extends { labels: Labels }>(map: Map<string, T> | undefined): T[] {
    return [...(map?.entries() ?? [])].sort(([a], [b]) => (a < b ? -1 : 1)).map(([, s]) => s);
  }

  #value(kind: 'counter' | 'gauge', name: string, tags: Labels | undefined, apply: (s: ValueSeries) => void): void {
    const key = this.#claim(kind, name);
    if (key === undefined) return this.#drop();
    const series = this.#series(this.#values, key, normalizeLabels(tags), (labels) => ({ labels, value: 0 }));
    if (!series) return this.#drop();
    apply(series);
  }

  /** Reserve a metric name for one kind; returns the sanitized name or undefined on a kind clash. */
  #claim(kind: MetricKind, name: string): string | undefined {
    const key = sanitizeMetricName(name);
    const existing = this.#kinds.get(key);
    if (existing !== undefined && existing !== kind) return undefined;
    this.#kinds.set(key, kind);
    return key;
  }

  #series<T>(store: Map<string, Map<string, T>>, name: string, labels: Labels, create: (labels: Labels) => T): T | undefined {
    let bySeries = store.get(name);
    if (!bySeries) {
      bySeries = new Map();
      store.set(name, bySeries);
    }
    const key = seriesKey(labels);
    const existing = bySeries.get(key);
    if (existing) return existing;
    if (bySeries.size >= this.#maxSeries) return undefined;
    const created = create(labels);
    bySeries.set(key, created);
    return created;
  }

  #drop(): void {
    this.#dropped += 1;
  }
}
