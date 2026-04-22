import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Controls } from '../Controls';
import { Visualizer } from '../Visualizer';
import { SettingsPanel } from '../SettingsPanel';
import type { GraphVisualState } from '../../hooks/useGraphRunner';
import type { Graph } from '../../lib/graph';

// jsdom doesn't implement ResizeObserver
beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

describe('Controls', () => {
  const noop = () => {};
  const defaultProps = {
    status: 'idle' as const,
    canStepBack: false,
    canStepForward: true,
    onToggle: noop,
    onStepBack: noop,
    onStepForward: noop,
    onReset: noop,
    onRegenerate: noop,
  };

  it('renders play button when idle', () => {
    render(<Controls {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });

  it('renders pause button when playing', () => {
    render(<Controls {...defaultProps} status="playing" canStepBack={true} />);
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });

  it('renders restart button when done', () => {
    render(<Controls {...defaultProps} status="done" canStepForward={false} />);
    expect(screen.getByRole('button', { name: 'Restart' })).toBeInTheDocument();
  });

  it('step back disabled when canStepBack=false', () => {
    render(<Controls {...defaultProps} canStepBack={false} />);
    expect(screen.getByRole('button', { name: 'Step back' })).toBeDisabled();
  });

  it('step forward enabled when canStepForward=true', () => {
    render(<Controls {...defaultProps} canStepForward={true} />);
    expect(screen.getByRole('button', { name: 'Step forward' })).not.toBeDisabled();
  });

  it('calls onToggle when play clicked', () => {
    const onToggle = vi.fn();
    render(<Controls {...defaultProps} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('calls onStepForward when step forward clicked', () => {
    const onStepForward = vi.fn();
    render(<Controls {...defaultProps} onStepForward={onStepForward} />);
    fireEvent.click(screen.getByRole('button', { name: 'Step forward' }));
    expect(onStepForward).toHaveBeenCalledOnce();
  });

  it('calls onReset when reset clicked', () => {
    const onReset = vi.fn();
    render(<Controls {...defaultProps} onReset={onReset} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('does not call onStepBack when disabled', () => {
    const onStepBack = vi.fn();
    render(<Controls {...defaultProps} canStepBack={false} onStepBack={onStepBack} />);
    fireEvent.click(screen.getByRole('button', { name: 'Step back' }));
    expect(onStepBack).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Visualizer
// ---------------------------------------------------------------------------

const mockGraph: Graph = {
  directed: false,
  weighted: false,
  nodes: [
    { id: 0, x: 0, y: 0 },
    { id: 1, x: 100, y: 0 },
    { id: 2, x: 50, y: 100 },
  ],
  edges: [
    { id: 0, u: 0, v: 1, weight: 1 },
    { id: 1, u: 1, v: 2, weight: 1 },
  ],
  adj: [[0], [0, 1], [1]],
};

const emptyVisual: GraphVisualState = {
  nodeRoles: {},
  edgeRoles: {},
  dist: {},
  parent: {},
  mstEdges: [],
  topoOrder: [],
  sccGroup: {},
  stack: [],
  flow: {},
  disc: {},
  fin: {},
};

describe('Visualizer', () => {
  it('renders all nodes', () => {
    render(
      <Visualizer graph={mockGraph} visual={emptyVisual} showDuck={false} />,
    );
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('all nodes have tabIndex=0 and role=button', () => {
    render(
      <Visualizer graph={mockGraph} visual={emptyVisual} showDuck={false} />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    buttons.forEach(b => expect(b).toHaveAttribute('tabindex', '0'));
  });

  it('aria-label includes "source" for sourceNode', () => {
    render(
      <Visualizer graph={mockGraph} visual={emptyVisual} showDuck={false} sourceNode={0} />,
    );
    expect(screen.getByLabelText(/Node 0.*source/i)).toBeInTheDocument();
  });

  it('aria-label includes "target" for targetNode', () => {
    render(
      <Visualizer graph={mockGraph} visual={emptyVisual} showDuck={false} targetNode={2} />,
    );
    expect(screen.getByLabelText(/Node 2.*target/i)).toBeInTheDocument();
  });

  it('calls onNodeClick with correct id on click', () => {
    const onNodeClick = vi.fn();
    render(
      <Visualizer graph={mockGraph} visual={emptyVisual} showDuck={false} onNodeClick={onNodeClick} />,
    );
    fireEvent.click(screen.getByLabelText(/Node 1/));
    expect(onNodeClick).toHaveBeenCalledWith(1, false);
  });

  it('calls onNodeClick with shiftKey=true on shift-click', () => {
    const onNodeClick = vi.fn();
    render(
      <Visualizer graph={mockGraph} visual={emptyVisual} showDuck={false} onNodeClick={onNodeClick} />,
    );
    fireEvent.click(screen.getByLabelText(/Node 1/), { shiftKey: true });
    expect(onNodeClick).toHaveBeenCalledWith(1, true);
  });

  it('Enter key triggers onNodeClick', () => {
    const onNodeClick = vi.fn();
    render(
      <Visualizer graph={mockGraph} visual={emptyVisual} showDuck={false} onNodeClick={onNodeClick} />,
    );
    fireEvent.keyDown(screen.getByLabelText(/Node 0/), { key: 'Enter' });
    expect(onNodeClick).toHaveBeenCalledWith(0, false);
  });

  it('shows dist label when dist is set in visual', () => {
    const visual = { ...emptyVisual, dist: { 0: 0, 1: 3 } };
    render(
      <Visualizer graph={mockGraph} visual={visual} showDuck={false} />,
    );
    // Node id 0 and dist 0 both render "0"; getAllByText handles multiples
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('3')).toBeInTheDocument(); // dist for node 1
  });

  it('aria-label includes role when nodeRole is set', () => {
    const visual = { ...emptyVisual, nodeRoles: { 1: 'visited' as const } };
    render(
      <Visualizer graph={mockGraph} visual={visual} showDuck={false} />,
    );
    expect(screen.getByLabelText(/Node 1.*visited/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// SettingsPanel
// ---------------------------------------------------------------------------

describe('SettingsPanel', () => {
  const noop = () => {};
  const baseProps = {
    algorithmId: 'bfs',
    graphSource: { type: 'preset' as const, id: 'tree-8' as const },
    speed: 1,
    soundEnabled: false,
    sourceNode: 0,
    targetNode: 7,
    nodeCount: 8,
    onAlgorithmChange: noop,
    onGraphSourceChange: noop,
    onSpeedChange: noop,
    onSoundToggle: noop,
    onSourceNodeChange: noop,
    onTargetNodeChange: noop,
  };

  it('renders speed label', () => {
    render(<SettingsPanel {...baseProps} speed={2} />);
    expect(screen.getByText('2×')).toBeInTheDocument();
  });

  it('renders sound toggle switch', () => {
    render(<SettingsPanel {...baseProps} />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('sound switch aria-checked=false when disabled', () => {
    render(<SettingsPanel {...baseProps} soundEnabled={false} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('sound switch aria-checked=true when enabled', () => {
    render(<SettingsPanel {...baseProps} soundEnabled={true} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onSoundToggle when switch clicked', () => {
    const onSoundToggle = vi.fn();
    render(<SettingsPanel {...baseProps} onSoundToggle={onSoundToggle} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onSoundToggle).toHaveBeenCalledWith(true);
  });

  it('renders source and target sliders', () => {
    render(<SettingsPanel {...baseProps} />);
    expect(screen.getByText('Source: 0')).toBeInTheDocument();
    expect(screen.getByText('Target: 7')).toBeInTheDocument();
  });
});
