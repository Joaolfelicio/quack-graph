import { memo, useRef, useState, useEffect } from 'react';
import type { Graph } from '../lib/graph';
import type { GraphVisualState } from '../hooks/useGraphRunner';
import type { NodeRole, EdgeRole } from '../algorithms/types';
import { NODE_FILL, NODE_STROKE, NODE_STROKE_WIDTH, EDGE_STROKE, EDGE_WIDTH } from '../lib/visualColors';

const NODE_R = 20;
const ARROW_OFFSET = NODE_R + 5;
const CURVE_OFFSET = 22; // perpendicular offset for anti-parallel pairs

interface Props {
  graph: Graph;
  visual: GraphVisualState;
  showDuck: boolean;
  sourceNode?: number;
  targetNode?: number;
}

/**
 * For straight edges: shorten endpoint along the straight line.
 * For curved (anti-parallel) edges: shorten along the tangent at the endpoint
 * of the quadratic bezier (tangent = P2 - controlPoint).
 */
function computeEdgePath(
  x1: number, y1: number,
  x2: number, y2: number,
  directed: boolean,
  hasTwin: boolean,
): { d: string; labelX: number; labelY: number } {
  if (!hasTwin) {
    if (directed) {
      // Shorten start and end so line doesn't overlap node circles
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const ux = dx / len, uy = dy / len;
      const sx = x1 + ux * NODE_R;
      const sy = y1 + uy * NODE_R;
      const ex = x2 - ux * ARROW_OFFSET;
      const ey = y2 - uy * ARROW_OFFSET;
      return {
        d: `M ${sx} ${sy} L ${ex} ${ey}`,
        labelX: (x1 + x2) / 2,
        labelY: (y1 + y2) / 2 - 8,
      };
    }
    return {
      d: `M ${x1} ${y1} L ${x2} ${y2}`,
      labelX: (x1 + x2) / 2,
      labelY: (y1 + y2) / 2 - 6,
    };
  }

  // Quadratic bezier for anti-parallel pairs
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  // Perpendicular offset
  const nx = -dy / len * CURVE_OFFSET;
  const ny = dx / len * CURVE_OFFSET;
  const cpx = mx + nx, cpy = my + ny;

  if (directed) {
    // Shorten start: direction from x1,y1 toward control point
    const d0x = cpx - x1, d0y = cpy - y1;
    const l0 = Math.sqrt(d0x * d0x + d0y * d0y) || 1;
    const sx = x1 + (d0x / l0) * NODE_R;
    const sy = y1 + (d0y / l0) * NODE_R;

    // Shorten end: tangent at P2 is P2 - controlPoint
    const t2x = x2 - cpx, t2y = y2 - cpy;
    const l2 = Math.sqrt(t2x * t2x + t2y * t2y) || 1;
    const ex = x2 - (t2x / l2) * ARROW_OFFSET;
    const ey = y2 - (t2y / l2) * ARROW_OFFSET;

    return {
      d: `M ${sx} ${sy} Q ${cpx} ${cpy} ${ex} ${ey}`,
      labelX: cpx,
      labelY: cpy - 6,
    };
  }

  return {
    d: `M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`,
    labelX: cpx,
    labelY: cpy - 6,
  };
}

function arrowId(role: EdgeRole) { return `arrow-${role}`; }

export const Visualizer = memo(function Visualizer({ graph, visual, showDuck, sourceNode, targetNode }: Props) {
  const containerRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 800, h: 500 });

  useEffect(() => {
    const el = containerRef.current?.parentElement;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: Math.max(400, width), h: Math.max(300, height) });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const nodes = graph.nodes;
  const allX = nodes.map(n => n.x);
  const allY = nodes.map(n => n.y);
  const minX = Math.min(...allX), maxX = Math.max(...allX);
  const minY = Math.min(...allY), maxY = Math.max(...allY);
  const pad = 60;
  const scaleX = nodes.length > 1 ? (size.w - 2 * pad) / Math.max(1, maxX - minX) : 1;
  const scaleY = nodes.length > 1 ? (size.h - 2 * pad) / Math.max(1, maxY - minY) : 1;
  const scale = Math.min(scaleX, scaleY, 1.8);

  function sx(x: number) { return pad + (x - minX) * scale; }
  function sy(y: number) { return pad + (y - minY) * scale; }

  const edgePairs = new Set<string>();
  for (const e of graph.edges) edgePairs.add(`${e.u}-${e.v}`);
  function hasTwin(u: number, v: number) {
    return graph.directed && edgePairs.has(`${v}-${u}`);
  }

  const lastVisited = (() => {
    const entries = Object.entries(visual.nodeRoles);
    for (let i = entries.length - 1; i >= 0; i--) {
      const [id, role] = entries[i];
      if (role === 'current' || role === 'visited') return Number(id);
    }
    return null;
  })();

  const edgeRoles = Object.keys(EDGE_STROKE) as EdgeRole[];

  return (
    <div className="relative w-full" style={{ height: size.h }}>
      <svg
        ref={containerRef}
        viewBox={`0 0 ${size.w} ${size.h}`}
        className="h-full w-full"
        aria-label="Graph visualization"
      >
        <defs>
          {edgeRoles.map(role => (
            <marker
              key={role}
              id={arrowId(role)}
              markerWidth="8" markerHeight="8"
              refX="7" refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L8,3 z" fill={EDGE_STROKE[role]} />
            </marker>
          ))}
        </defs>

        {graph.edges.map(e => {
          const role: EdgeRole = (visual.edgeRoles[e.id] as EdgeRole) ?? 'default';
          const x1 = sx(nodes[e.u].x), y1 = sy(nodes[e.u].y);
          const x2 = sx(nodes[e.v].x), y2 = sy(nodes[e.v].y);
          const twin = hasTwin(e.u, e.v);
          const { d, labelX, labelY } = computeEdgePath(x1, y1, x2, y2, graph.directed, twin);
          const stroke = EDGE_STROKE[role] ?? EDGE_STROKE.default;
          const sw = EDGE_WIDTH[role] ?? 1.5;
          const flowInfo = visual.flow[e.id];

          return (
            <g key={e.id}>
              <path
                d={d}
                stroke={stroke}
                strokeWidth={sw}
                fill="none"
                strokeLinecap="round"
                markerEnd={graph.directed ? `url(#${arrowId(role)})` : undefined}
                opacity={role === 'default' ? 0.5 : 1}
              />
              {graph.weighted && (
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  fontSize="10"
                  fill={stroke}
                  stroke="white"
                  strokeWidth={3}
                  strokeLinejoin="round"
                  paintOrder="stroke"
                  className="select-none font-mono dark:[stroke:#0f172a]"
                >
                  {flowInfo ? `${flowInfo.flow}/${flowInfo.capacity}` : e.weight}
                </text>
              )}
            </g>
          );
        })}

        {nodes.map(n => {
          const role: NodeRole = (visual.nodeRoles[n.id] as NodeRole) ?? 'default';
          const cx = sx(n.x), cy = sy(n.y);
          const fill = NODE_FILL[role] ?? NODE_FILL.default;
          const stroke = NODE_STROKE[role] ?? NODE_STROKE.default;
          const dist = visual.dist[n.id];
          // Static source/target indicator (shown even before algo runs)
          const isStaticSource = role === 'default' && n.id === sourceNode;
          const isStaticTarget = role === 'default' && n.id === targetNode;
          const effectiveFill = isStaticSource ? NODE_FILL.source : isStaticTarget ? NODE_FILL.target : fill;
          const effectiveStroke = isStaticSource ? NODE_STROKE.source : isStaticTarget ? NODE_STROKE.target : stroke;
          const disc = visual.disc[n.id];
          const fin = visual.fin[n.id];
          const dfLabel = disc !== undefined
            ? (fin !== undefined ? `${disc}/${fin}` : `${disc}/…`)
            : null;

          return (
            <g key={n.id} transform={`translate(${cx},${cy})`}>
              <ellipse rx={NODE_R + 6} ry={NODE_R + 3} fill="#86efac" opacity={0.4} />
              <circle r={NODE_R} fill={effectiveFill} stroke={effectiveStroke} strokeWidth={NODE_STROKE_WIDTH[role] ?? 2} />
              <text textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="bold" fill="#1e3a5f" className="select-none">
                {n.id}
              </text>
              {dist !== undefined && dist !== null && (
                <text y={-NODE_R - 8} textAnchor="middle" fontSize="10" fill={stroke} fontWeight="600" className="select-none">
                  {dist === Infinity ? '∞' : dist.toFixed(dist % 1 === 0 ? 0 : 1)}
                </text>
              )}
              {dfLabel && (
                <text
                  y={-NODE_R - 8}
                  textAnchor="middle"
                  fontSize="9"
                  fill={stroke}
                  fontWeight="600"
                  stroke="white"
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  paintOrder="stroke"
                  className="select-none font-mono dark:[stroke:#0f172a]"
                >
                  {dfLabel}
                </text>
              )}
            </g>
          );
        })}

        {showDuck && lastVisited !== null && (
          <g transform={`translate(${sx(nodes[lastVisited].x) - 10},${sy(nodes[lastVisited].y) - NODE_R - 22})`}>
            <DuckSVG />
          </g>
        )}
      </svg>
    </div>
  );
});

function DuckSVG() {
  return (
    <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
      <ellipse cx="20" cy="28" rx="14" ry="10" fill="#FCD34D" />
      <circle cx="20" cy="16" r="9" fill="#FCD34D" />
      <circle cx="23" cy="13" r="3" fill="white" />
      <circle cx="24" cy="13" r="1.5" fill="#1e293b" />
      <path d="M27 17 Q33 15 31 20 Q27 20 27 17Z" fill="#F97316" />
      <ellipse cx="20" cy="28" rx="7" ry="5" fill="#3B82F6" />
    </svg>
  );
}
