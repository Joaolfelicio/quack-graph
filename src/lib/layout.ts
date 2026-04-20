import type { Node, Edge } from './graph';

export function circularLayout(n: number, cx = 400, cy = 300, r = 200): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, i) => ({
    x: cx + r * Math.cos((2 * Math.PI * i) / n - Math.PI / 2),
    y: cy + r * Math.sin((2 * Math.PI * i) / n - Math.PI / 2),
  }));
}

export function gridLayout(
  n: number,
  cols: number,
  cellW = 90,
  cellH = 90,
  offX = 80,
  offY = 80,
): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, i) => ({
    x: offX + (i % cols) * cellW,
    y: offY + Math.floor(i / cols) * cellH,
  }));
}

/** Seeded PRNG (mulberry32) */
export function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 10-iteration Fruchterman-Reingold, computed once at generation time. */
export function frLayout(
  n: number,
  edges: Edge[],
  seed: number,
  width = 700,
  height = 500,
  iterations = 80,
): { x: number; y: number }[] {
  const rand = mulberry32(seed);
  const pad = 60;
  const pos = Array.from({ length: n }, () => ({
    x: pad + rand() * (width - 2 * pad),
    y: pad + rand() * (height - 2 * pad),
  }));

  const area = width * height;
  const k = Math.sqrt(area / n);

  for (let iter = 0; iter < iterations; iter++) {
    const disp: { x: number; y: number }[] = Array.from({ length: n }, () => ({ x: 0, y: 0 }));
    const temp = k * (1 - iter / iterations);

    // Repulsive
    for (let u = 0; u < n; u++) {
      for (let v = u + 1; v < n; v++) {
        const dx = pos[u].x - pos[v].x;
        const dy = pos[u].y - pos[v].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 0.01);
        const f = (k * k) / dist;
        disp[u].x += (dx / dist) * f;
        disp[u].y += (dy / dist) * f;
        disp[v].x -= (dx / dist) * f;
        disp[v].y -= (dy / dist) * f;
      }
    }

    // Attractive
    for (const e of edges) {
      const dx = pos[e.u].x - pos[e.v].x;
      const dy = pos[e.u].y - pos[e.v].y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 0.01);
      const f = (dist * dist) / k;
      disp[e.u].x -= (dx / dist) * f;
      disp[e.u].y -= (dy / dist) * f;
      disp[e.v].x += (dx / dist) * f;
      disp[e.v].y += (dy / dist) * f;
    }

    // Apply
    for (let u = 0; u < n; u++) {
      const d = Math.max(Math.sqrt(disp[u].x ** 2 + disp[u].y ** 2), 0.01);
      const capped = Math.min(d, temp);
      pos[u].x = Math.min(width - pad, Math.max(pad, pos[u].x + (disp[u].x / d) * capped));
      pos[u].y = Math.min(height - pad, Math.max(pad, pos[u].y + (disp[u].y / d) * capped));
    }
  }

  return pos;
}

export function autoLayout(
  n: number,
  edges: Edge[],
  seed: number,
): { x: number; y: number }[] {
  if (n <= 12) return circularLayout(n);
  const cols = Math.ceil(Math.sqrt(n));
  if (n <= 30) return gridLayout(n, cols);
  return frLayout(n, edges, seed);
}

export function applyLayout(nodes: Node[], positions: { x: number; y: number }[]): Node[] {
  return nodes.map((n, i) => ({ ...n, x: positions[i].x, y: positions[i].y }));
}
