/**
 * Dot-path helpers for nested field editing.
 *
 * A field identifier may be a plain top-level key ("hero_title") or a dot-path
 * into nested arrays/objects ("teammembercards.3.image"). Purely-numeric
 * segments are treated as array indices. Field/section keys must therefore not
 * contain "." or be purely numeric themselves.
 */

export type PathSeg = string | number;

/** Parse "teammembercards.3.image" -> ["teammembercards", 3, "image"]. */
export function parsePath(path: string): PathSeg[] {
  return path
    .split(".")
    .filter((s) => s.length > 0)
    .map((s) => (/^\d+$/.test(s) ? Number(s) : s));
}

/**
 * Immutably set `value` at a dot-path, cloning each node along the way and
 * creating arrays for numeric segments (objects otherwise). Never mutates the
 * input. A path with no "." behaves exactly like a shallow `{ ...obj, [k]: v }`.
 */
export function setIn<T>(obj: T, path: string, value: unknown): T {
  const segs = parsePath(path);
  if (segs.length === 0) return value as T;

  const cloneFor = (node: unknown, seg: PathSeg): Record<string, unknown> | unknown[] =>
    typeof seg === "number"
      ? Array.isArray(node)
        ? node.slice()
        : []
      : node && typeof node === "object" && !Array.isArray(node)
        ? { ...(node as Record<string, unknown>) }
        : {};

  const root = cloneFor(obj, segs[0]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = root;
  for (let i = 0; i < segs.length - 1; i++) {
    const next = cloneFor(cur[segs[i]], segs[i + 1]);
    cur[segs[i]] = next;
    cur = next;
  }
  cur[segs[segs.length - 1]] = value;
  return root as T;
}

/** Read the value at a dot-path (undefined if any segment is missing). */
export function getIn(obj: unknown, path: string): unknown {
  return parsePath(path).reduce<unknown>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node, seg) => (node == null ? undefined : (node as any)[seg]),
    obj,
  );
}

/**
 * Deep-merge `overlay` onto `base`. Arrays merge element-wise by index, and an
 * `undefined` overlay value falls through to `base` — so the sparse arrays
 * produced by `setIn` on a fresh object update only the touched element and
 * preserve every sibling. For plain top-level overlays this is equivalent to
 * `{ ...base, ...overlay }`.
 */
export function deepMerge<T>(base: T, overlay: unknown): T {
  if (overlay === undefined) return base;

  if (Array.isArray(base) || Array.isArray(overlay)) {
    const b = Array.isArray(base) ? base : [];
    const o = Array.isArray(overlay) ? (overlay as unknown[]) : [];
    const len = Math.max(b.length, o.length);
    const out = new Array(len);
    for (let i = 0; i < len; i++) out[i] = deepMerge(b[i], o[i]);
    return out as unknown as T;
  }

  if (
    base &&
    typeof base === "object" &&
    overlay &&
    typeof overlay === "object"
  ) {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const k of Object.keys(overlay as Record<string, unknown>)) {
      out[k] = deepMerge(
        (base as Record<string, unknown>)[k],
        (overlay as Record<string, unknown>)[k],
      );
    }
    return out as T;
  }

  return overlay as T;
}
