// IP truncation for logs (CTR-OBS-001 OBS-1): IPv4 to /24, IPv6 to /48. Isomorphic, no node:net.
const V4_RE = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

export function isIPv4(s: string): boolean {
  return V4_RE.test(s);
}

function v4ToHextets(v4: string): number[] {
  const p = v4.split('.').map(Number);
  return [((p[0] ?? 0) << 8) | (p[1] ?? 0), ((p[2] ?? 0) << 8) | (p[3] ?? 0)];
}

function parseGroups(part: string): number[] | undefined {
  if (part === '') return [];
  const out: number[] = [];
  const groups = part.split(':');
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i] ?? '';
    if (i === groups.length - 1 && isIPv4(g)) out.push(...v4ToHextets(g));
    else if (/^[0-9a-fA-F]{1,4}$/.test(g)) out.push(Number.parseInt(g, 16));
    else return undefined;
  }
  return out;
}

/** Parses an IPv6 literal (optionally with zone or embedded IPv4) into eight hextets. */
export function parseIPv6(input: string): number[] | undefined {
  const s = input.replace(/%.*$/, '');
  if (!s.includes(':')) return undefined;
  const halves = s.split('::');
  if (halves.length > 2) return undefined;
  const head = parseGroups(halves[0] ?? '');
  const tail = halves.length === 2 ? parseGroups(halves[1] ?? '') : [];
  if (!head || !tail) return undefined;
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return undefined;
  return [...head, ...new Array<number>(Math.max(missing, 0)).fill(0), ...tail];
}

export function isIP(s: string): boolean {
  return isIPv4(s) || parseIPv6(s) !== undefined;
}

/** Returns the truncated network, or undefined when the input is not an IP literal. */
export function truncateIp(ip: string): string | undefined {
  if (isIPv4(ip)) return `${ip.split('.').slice(0, 3).join('.')}.0/24`;
  const h = parseIPv6(ip);
  if (!h) return undefined;
  const mapped = h.slice(0, 5).every((x) => x === 0) && h[5] === 0xffff;
  if (mapped) return truncateIp(`${(h[6] ?? 0) >> 8}.${(h[6] ?? 0) & 0xff}.${(h[7] ?? 0) >> 8}.${(h[7] ?? 0) & 0xff}`);
  return `${h.slice(0, 3).map((x) => x.toString(16)).join(':')}::/48`;
}
