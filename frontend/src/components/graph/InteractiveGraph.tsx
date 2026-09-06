import React, { useState, useRef } from 'react';
import { GraphNode, GraphLink } from '../../types';
import { useApp } from '../../context';

interface InteractiveGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onNodeSelect?: (node: GraphNode | null) => void;
  selectedNodeId?: string | null;
  height?: number;
  highlightPath?: string[];
}

export const InteractiveGraph: React.FC<InteractiveGraphProps> = ({
  nodes: initialNodes,
  links,
  onNodeSelect,
  selectedNodeId: controlledSelectedId,
  height = 560,
  highlightPath,
}) => {
  const { diffGlowEnabled } = useApp();
  const [draggedPositions, setDraggedPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const selectedNodeId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId;
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const nodes = initialNodes.map((n) => {
    const pos = draggedPositions[n.id];
    return pos ? { ...n, x: pos.x, y: pos.y } : n;
  });

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const panStartRef = useRef({ x: 0, y: 0 });
  const nodeDragStartRef = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const activeId = hoveredNodeId || selectedNodeId;

  // Find connected node IDs
  const connectedNodeIds = new Set<string>();
  if (activeId) {
    connectedNodeIds.add(activeId);
    links.forEach((link) => {
      if (link.source === activeId) connectedNodeIds.add(link.target);
      if (link.target === activeId) connectedNodeIds.add(link.source);
    });
  }

  // Handle Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Node Dragging & Canvas Panning
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'graph-bg') {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggedNodeId(nodeId);
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      nodeDragStartRef.current = {
        x: (e.clientX - pan.x) / zoom - (node.x || 0),
        y: (e.clientY - pan.y) / zoom - (node.y || 0),
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
    } else if (draggedNodeId) {
      const newX = (e.clientX - pan.x) / zoom - nodeDragStartRef.current.x;
      const newY = (e.clientY - pan.y) / zoom - nodeDragStartRef.current.y;
      setDraggedPositions((prev) => ({
        ...prev,
        [draggedNodeId]: { x: newX, y: newY },
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
  };

  const handleNodeClick = (node: GraphNode) => {
    const newId = selectedNodeId === node.id ? null : node.id;
    setInternalSelectedId(newId);
    if (onNodeSelect) {
      onNodeSelect(newId ? node : null);
    }
  };

  // Node Category Colors & Styling
  const getNodeFill = (node: GraphNode) => {
    if (node.category === 'changed') return '#ffb4ab'; // Red alert
    if (node.category === 'impacted') return '#aff825'; // Lime spark
    if (node.category === 'api') return '#7bd0ff'; // Cyan
    if (node.category === 'storage') return '#8c947a'; // Muted olive/slate
    if (node.category === 'test') return '#34d399'; // Green emerald
    return '#e2e2e9';
  };

  const getNodeBorder = (node: GraphNode) => {
    if (node.id === selectedNodeId) return '#ffffff';
    if (node.category === 'changed') return '#93000a';
    if (node.category === 'impacted') return '#aff825';
    return 'var(--color-surface-container-highest)';
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="relative w-full rounded-xl bg-surface-container-lowest border border-surface-container-high overflow-hidden shadow-inner flex flex-col">
      {/* Top Graph Controls Bar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 p-1 rounded-lg bg-surface-container-low/90 backdrop-blur-sm border border-surface-container-highest shadow-md">
        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded hover:bg-surface-container text-outline hover:text-on-surface transition-colors"
          title="Zoom In"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded hover:bg-surface-container text-outline hover:text-on-surface transition-colors"
          title="Zoom Out"
        >
          <span className="material-symbols-outlined text-[18px]">remove</span>
        </button>
        <button
          onClick={handleResetView}
          className="p-1.5 rounded hover:bg-surface-container text-outline hover:text-on-surface transition-colors"
          title="Reset View"
        >
          <span className="material-symbols-outlined text-[18px]">center_focus_strong</span>
        </button>
        <div className="h-4 w-px bg-surface-container-highest mx-1" />
        <span className="px-2 font-code text-[11px] text-outline">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Legend Indicator Overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 p-2 rounded-lg bg-surface-container-low/90 backdrop-blur-sm border border-surface-container-highest text-[10px] font-code">
        <span className="text-outline uppercase font-semibold">Nodes:</span>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab]" />
          <span className="text-on-surface">Changed Target</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#aff825]" />
          <span className="text-on-surface">Blast Radius</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#7bd0ff]" />
          <span className="text-on-surface">API Gateway</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#34d399]" />
          <span className="text-on-surface">Test Suite</span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <svg
        ref={svgRef}
        id="graph-bg"
        className="w-full cursor-grab active:cursor-grabbing select-none"
        style={{ height }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Background Grid Pattern */}
        <defs>
          <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="var(--color-surface-container-highest)"
              strokeWidth="0.5"
              strokeOpacity="0.4"
            />
            <circle cx="0" cy="0" r="1" fill="var(--color-surface-container-highest)" fillOpacity="0.8" />
          </pattern>

          {/* Arrow markers */}
          <marker
            id="arrowhead-default"
            markerWidth="8"
            markerHeight="6"
            refX="20"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="var(--color-outline)" fillOpacity="0.7" />
          </marker>

          <marker
            id="arrowhead-active"
            markerWidth="8"
            markerHeight="6"
            refX="20"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="var(--color-primary-container)" />
          </marker>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid-pattern)" />

        {/* Zoom & Pan Group */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Edge Links */}
          {links.map((link, idx) => {
            const sourceNode = nodes.find((n) => n.id === link.source);
            const targetNode = nodes.find((n) => n.id === link.target);
            if (!sourceNode || !targetNode) return null;

            const isLinkActive =
              activeId && (link.source === activeId || link.target === activeId);
            const isPathActive =
              highlightPath &&
              highlightPath.includes(link.source) &&
              highlightPath.includes(link.target);

            const sx = sourceNode.x || 0;
            const sy = sourceNode.y || 0;
            const tx = targetNode.x || 0;
            const ty = targetNode.y || 0;

            const strokeColor = isPathActive || isLinkActive
              ? 'var(--color-primary-container)'
              : link.isCritical
              ? '#ffb4ab'
              : 'var(--color-surface-container-highest)';

            const strokeWidth = isPathActive || isLinkActive ? 2.5 : link.isCritical ? 2 : 1.2;

            return (
              <g key={`link-${idx}`}>
                <line
                  x1={sx}
                  y1={sy}
                  x2={tx}
                  y2={ty}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={link.type === 'imports' ? '4 4' : undefined}
                  markerEnd={isLinkActive || isPathActive ? 'url(#arrowhead-active)' : 'url(#arrowhead-default)'}
                  className="transition-colors duration-200"
                />
                {/* Edge Label for Type */}
                <text
                  x={(sx + tx) / 2}
                  y={(sy + ty) / 2 - 6}
                  fill="var(--color-outline)"
                  fontSize="9"
                  fontFamily="JetBrains Mono"
                  textAnchor="middle"
                  className="pointer-events-none opacity-80"
                >
                  {link.type}
                </text>
              </g>
            );
          })}

          {/* Graph Nodes */}
          {nodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            const isHovered = node.id === hoveredNodeId;
            const isDimmed = activeId ? !connectedNodeIds.has(node.id) : false;
            const isHighlighted = highlightPath ? highlightPath.includes(node.id) : false;

            const x = node.x || 100;
            const y = node.y || 100;

            return (
              <g
                key={node.id}
                transform={`translate(${x}, ${y})`}
                className={`cursor-pointer transition-opacity duration-200 ${isDimmed ? 'opacity-25' : 'opacity-100'}`}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onClick={() => handleNodeClick(node)}
              >
                {/* Node Ripple Glow for Changed or Selected */}
                {(isSelected || node.category === 'changed' || isHighlighted) && diffGlowEnabled && (
                  <circle
                    r="42"
                    fill="none"
                    stroke={node.category === 'changed' ? '#ffb4ab' : 'var(--color-primary-container)'}
                    strokeWidth="1.5"
                    className="animate-ripple"
                  />
                )}

                {/* Node Outer Container Card */}
                <rect
                  x="-65"
                  y="-26"
                  width="130"
                  height="52"
                  rx="8"
                  fill="var(--color-surface-container)"
                  stroke={getNodeBorder(node)}
                  strokeWidth={isSelected || isHovered ? 2.5 : 1}
                  className="transition-all duration-200"
                />

                {/* Left chromatic category strip */}
                <rect
                  x="-65"
                  y="-26"
                  width="4"
                  height="52"
                  rx="2"
                  fill={getNodeFill(node)}
                />

                {/* Node Label */}
                <text
                  x="-52"
                  y="-6"
                  fill="var(--color-on-surface)"
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="Inter"
                  className="select-none"
                >
                  {node.label}
                </text>

                {/* SubLabel / Component path */}
                <text
                  x="-52"
                  y="12"
                  fill="var(--color-outline)"
                  fontSize="9.5"
                  fontFamily="JetBrains Mono"
                  className="select-none"
                >
                  {node.subLabel || node.category}
                </text>

                {/* Risk or Status Mini-badge */}
                {node.risk && (
                  <circle
                    cx="50"
                    cy="-14"
                    r="4"
                    fill={node.risk === 'critical' ? '#ffb4ab' : node.risk === 'high' ? '#f59e0b' : '#aff825'}
                  />
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Selected Node Inspector Drawer (Bottom-right overlay) */}
      {selectedNode && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-96 p-4 rounded-xl bg-surface-container-low/95 backdrop-blur-md border border-surface-container-highest shadow-2xl z-20 animate-slide-up">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-on-surface">{selectedNode.label}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-surface-container-highest text-primary-container">
                  {selectedNode.category}
                </span>
              </div>
              <span className="font-code text-xs text-outline mt-0.5">
                {selectedNode.subLabel || selectedNode.id}
              </span>
            </div>
            <button
              onClick={() => {
                setInternalSelectedId(null);
                if (onNodeSelect) onNodeSelect(null);
              }}
              className="text-outline hover:text-on-surface p-1 rounded hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>

          {/* Module Metrics */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-surface-container-highest text-center font-code">
            <div className="p-1.5 rounded bg-surface-container">
              <div className="text-[10px] text-outline">Afferent (Ca)</div>
              <div className="text-xs font-bold text-on-surface">
                {selectedNode.metrics?.afferentCoupling ?? 3}
              </div>
            </div>
            <div className="p-1.5 rounded bg-surface-container">
              <div className="text-[10px] text-outline">Efferent (Ce)</div>
              <div className="text-xs font-bold text-on-surface">
                {selectedNode.metrics?.efferentCoupling ?? 2}
              </div>
            </div>
            <div className="p-1.5 rounded bg-surface-container">
              <div className="text-[10px] text-outline">Instability (I)</div>
              <div className="text-xs font-bold text-primary-container">
                {selectedNode.metrics?.instability?.toFixed(2) ?? '0.40'}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs font-body-sm">
            <span className="text-outline">Risk Vector Severity</span>
            <span className={`font-semibold capitalize ${selectedNode.risk === 'critical' ? 'text-error' : 'text-primary-container'}`}>
              {selectedNode.risk || 'Low'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
