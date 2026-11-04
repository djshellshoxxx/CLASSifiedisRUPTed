// Metrics registry with Prometheus text rendering (CTR-OBS-001 OBS-2/OBS-3). Isomorphic.
export const ALLOWED_LABELS = ['tenant', 'module', 'code', 'outcome'] as const;
export type LabelName = (typeof ALLOWED_LABELS)[number];
export type Labels = Partial<Readonly<Record<LabelName, string>>>;

/** Millisecond buckets aligned with OBS-4 budgets (150 ms read, 300 ms write). */
export const DEFAULT_MS_BUCKETS: readonly number[] = [5, 10, 25, 50, 100, 150, 250, 300, 500, 1000, 2500, 5000];
export const PROMETHEUS_CONTENT_TYPE = 'text/plain; version=0.0.4; charset=utf-8';
const NAME_RE = /^classrup_[a-z][a-z0-9]*(_[a-z0-9]+)+$/;
const RESERVED_SUFFIX = /_(bucket|count|sum)$/;

export interface MetricSpec {
  readonly name: string;
  readonly help: string;
  readonly labels?: readonly LabelName[];
}
export interface HistogramSpec extends MetricSpec {
  readonly buckets?: readonly number[];
}

export interface Counter {
  inc(labels?: Labels, value?: number): void;
}
export interface Gauge {
  set(labels: Labels, value: number): void;
  inc(labels?: Labels, value?: number): void;
  dec(labels?: Labels, value?: number): void;
}
export interface Histogram {
  observe(labels: Labels, value: number): void;
}

export interface MetricsRegistry {
  counter(spec: MetricSpec): Counter;
  gauge(spec: MetricSpec): Gauge;
  histogram(spec: HistogramSpec): Histogram;
  /** Prometheus text exposition format 0.0.4. */
  render(): string;
  /** Current value of a counter/gauge series, or histogram count; for tests and readiness. */
  value(name: string, labels?: Labels): number | undefined;
}

type Kind = 'counter' | 'gauge' | 'histogram';
interface HistState {
  readonly counts: number[];
  sum: number;
  count: number;
}
interface Family {
  readonly kind: Kind;
  readonly spec: MetricSpec;
  readonly labels: readonly LabelName[];
  readonly buckets: readonly number[];
  readonly series: Map<string, { labels: Labels; value: number; hist?: HistState }>;
}

export interface MetricsOptions {
  readonly maxSeriesPerMetric?: number;
}

function validateSpec(spec: MetricSpec, buckets: readonly number[] | undefined): void {
  if (!NAME_RE.test(spec.name) || RESERVED_SUFFIX.test(spec.name)) throw new Error(`metric name ${spec.name} must match classrup_<slug>_<name>_<unit>`);
  for (const l of spec.labels ?? []) if (!(ALLOWED_LABELS as readonly string[]).includes(l)) throw new Error(`metric ${spec.name}: label ${l} not allowed`);
  if (buckets) {
    if (buckets.length === 0 || buckets.some((b, i) => !Number.isFinite(b) || (i > 0 && b <= (buckets[i - 1] ?? 0)))) throw new Error(`metric ${spec.name}: buckets must be finite and increasing`);
  }
}

function escapeLabel(v: string): string {
  return v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');
}

function escapeHelp(v: string): string {
  return v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n');
}

function labelText(names: readonly LabelName[], labels: Labels, extra?: readonly [string, string]): string {
  const parts = names.filter((n) => labels[n] !== undefined).map((n) => `${n}="${escapeLabel(labels[n] ?? '')}"`);
  if (extra) parts.push(`${extra[0]}="${escapeLabel(extra[1])}"`);
  return parts.length ? `{${parts.join(',')}}` : '';
}

function num(v: number): string {
  if (v === Infinity) return '+Inf';
  if (v === -Infinity) return '-Inf';
  return Number.isNaN(v) ? 'NaN' : String(v);
}

function renderFamily(f: Family): string[] {
  const lines = [`# HELP ${f.spec.name} ${escapeHelp(f.spec.help)}`, `# TYPE ${f.spec.name} ${f.kind}`];
  const keys = [...f.series.keys()].sort();
  for (const key of keys) {
    const s = f.series.get(key);
    if (!s) continue;
    if (f.kind !== 'histogram' || !s.hist) {
      lines.push(`${f.spec.name}${labelText(f.labels, s.labels)} ${num(s.value)}`);
      continue;
    }
    let cumulative = 0;
    f.buckets.forEach((b, i) => {
      cumulative += s.hist?.counts[i] ?? 0;
      lines.push(`${f.spec.name}_bucket${labelText(f.labels, s.labels, ['le', num(b)])} ${cumulative}`);
    });
    lines.push(`${f.spec.name}_bucket${labelText(f.labels, s.labels, ['le', '+Inf'])} ${s.hist.count}`);
    lines.push(`${f.spec.name}_sum${labelText(f.labels, s.labels)} ${num(s.hist.sum)}`);
    lines.push(`${f.spec.name}_count${labelText(f.labels, s.labels)} ${s.hist.count}`);
  }
  return lines;
}

export function createMetricsRegistry(opts: MetricsOptions = {}): MetricsRegistry {
  const maxSeries = opts.maxSeriesPerMetric ?? 1000;
  const families = new Map<string, Family>();
  let droppedCounter: Counter | undefined;

  const seriesKey = (f: Family, labels: Labels): string => {
    for (const k of Object.keys(labels)) if (!f.labels.includes(k as LabelName)) throw new Error(`metric ${f.spec.name}: unexpected label ${k}`);
    return f.labels.map((n) => `${n}=${labels[n] ?? ''}`).join('\u0001');
  };
  const seriesOf = (f: Family, labels: Labels) => {
    const key = seriesKey(f, labels);
    let s = f.series.get(key);
    if (s) return s;
    if (f.series.size >= maxSeries) {
      if (f.spec.name !== 'classrup_metrics_dropped_series_total') droppedCounter?.inc({ module: f.spec.name });
      return undefined;
    }
    s = { labels: { ...labels }, value: 0, ...(f.kind === 'histogram' ? { hist: { counts: f.buckets.map(() => 0), sum: 0, count: 0 } } : {}) };
    f.series.set(key, s);
    return s;
  };
  const family = (kind: Kind, spec: MetricSpec, buckets?: readonly number[]): Family => {
    validateSpec(spec, buckets);
    const existing = families.get(spec.name);
    const labels = [...(spec.labels ?? [])];
    if (existing) {
      const same = existing.kind === kind && existing.labels.join() === labels.join() && (!buckets || existing.buckets.join() === buckets.join());
      if (!same) throw new Error(`metric ${spec.name} re-registered with a different definition`);
      return existing;
    }
    const f: Family = { kind, spec, labels, buckets: buckets ?? [], series: new Map() };
    families.set(spec.name, f);
    return f;
  };
  const add = (f: Family, labels: Labels, v: number): void => {
    const s = seriesOf(f, labels);
    if (s) s.value += v;
  };

  const registry: MetricsRegistry = {
    counter: (spec) => {
      const f = family('counter', spec);
      return {
        inc: (labels = {}, v = 1) => {
          if (v < 0) throw new RangeError('counter increments must be >= 0');
          add(f, labels, v);
        },
      };
    },
    gauge: (spec) => {
      const f = family('gauge', spec);
      return {
        set: (labels, v) => {
          const s = seriesOf(f, labels);
          if (s) s.value = v;
        },
        inc: (labels = {}, v = 1) => add(f, labels, v),
        dec: (labels = {}, v = 1) => add(f, labels, -v),
      };
    },
    histogram: (spec) => {
      const f = family('histogram', spec, spec.buckets ?? DEFAULT_MS_BUCKETS);
      return {
        observe: (labels, v) => {
          const s = seriesOf(f, labels);
          if (!s?.hist) return;
          const i = f.buckets.findIndex((b) => v <= b);
          if (i >= 0) s.hist.counts[i] = (s.hist.counts[i] ?? 0) + 1;
          s.hist.sum += v;
          s.hist.count += 1;
        },
      };
    },
    render: () => {
      const names = [...families.keys()].sort();
      const lines = names.flatMap((n) => renderFamily(families.get(n) as Family));
      return lines.length ? `${lines.join('\n')}\n` : '';
    },
    value: (name, labels = {}) => {
      const f = families.get(name);
      if (!f) return undefined;
      const s = f.series.get(seriesKey(f, labels));
      return s ? (s.hist ? s.hist.count : s.value) : undefined;
    },
  };
  droppedCounter = registry.counter({ name: 'classrup_metrics_dropped_series_total', help: 'Label combinations dropped by the per-metric series cap.', labels: ['module'] });
  return registry;
}
