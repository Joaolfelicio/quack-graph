export interface Node {
  id: number;
  x: number;
  y: number;
  label?: string;
}

export interface Edge {
  id: number;
  u: number;
  v: number;
  weight: number;
  capacity?: number;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
  directed: boolean;
  weighted: boolean;
  /** adj[u] = list of edge ids. For undirected, each edge appears from both endpoints. */
  adj: number[][];
}

export function buildAdj(nodes: Node[], edges: Edge[], directed: boolean): number[][] {
  const adj: number[][] = Array.from({ length: nodes.length }, () => []);
  for (const e of edges) {
    adj[e.u].push(e.id);
    if (!directed) adj[e.v].push(e.id);
  }
  return adj;
}

export function makeGraph(
  nodes: Node[],
  edges: Edge[],
  directed: boolean,
  weighted: boolean,
): Graph {
  return { nodes, edges, directed, weighted, adj: buildAdj(nodes, edges, directed) };
}

/** Returns the neighbor node id for edge e traversed from node u. */
export function neighbor(e: Edge, u: number): number {
  return e.u === u ? e.v : e.u;
}

// ---------------------------------------------------------------------------
// Priority queue (min-heap by key)
// ---------------------------------------------------------------------------

export class PriorityQueue<T> {
  private heap: [number, T][] = [];

  push(key: number, val: T): void {
    this.heap.push([key, val]);
    this._bubbleUp(this.heap.length - 1);
  }

  pop(): [number, T] | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._siftDown(0);
    }
    return top;
  }

  get size(): number {
    return this.heap.length;
  }

  private _bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.heap[parent][0] <= this.heap[i][0]) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  private _siftDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.heap[l][0] < this.heap[smallest][0]) smallest = l;
      if (r < n && this.heap[r][0] < this.heap[smallest][0]) smallest = r;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}

// ---------------------------------------------------------------------------
// Union-Find with path compression + union by rank
// ---------------------------------------------------------------------------

export class UnionFind {
  parent: number[];
  rank: number[];

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
  }

  find(x: number): number {
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]];
      x = this.parent[x];
    }
    return x;
  }

  union(a: number, b: number): boolean {
    const ra = this.find(a), rb = this.find(b);
    if (ra === rb) return false;
    if (this.rank[ra] < this.rank[rb]) this.parent[ra] = rb;
    else if (this.rank[ra] > this.rank[rb]) this.parent[rb] = ra;
    else { this.parent[rb] = ra; this.rank[ra]++; }
    return true;
  }

  connected(a: number, b: number): boolean {
    return this.find(a) === this.find(b);
  }
}
