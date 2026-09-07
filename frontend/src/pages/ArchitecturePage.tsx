import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { architectureService } from '../services/api';
import { GraphNode, GraphLink } from '../types';
import { InteractiveGraph } from '../components/graph/InteractiveGraph';

export const ArchitecturePage: React.FC = () => {
  const { activeRepo } = useApp();
  const navigate = useNavigate();

  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    architectureService.getGraph(activeRepo?.id).then((graph) => {
      setNodes(graph.nodes);
      setLinks(graph.links);
    });
  }, [activeRepo]);

  return (
    <div className="space-y-space-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
              Architecture Topology
            </h1>
            <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-surface-container text-primary-container font-mono">
              SYSTEM TOPOLOGY
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Topological layer mapping, structural boundaries for{' '}
            <span className="font-code text-on-surface font-semibold">{activeRepo?.name}</span> and UML Based Architecture.
          </p>
        </div>

        <div className="flex items-center gap-space-sm self-start sm:self-auto">
          <button
            onClick={() => navigate('/blast-radius')}
            className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container font-headline-sm text-body-sm font-semibold transition-all shadow-glow-lime"
          >
            <span className="material-symbols-outlined text-[18px]">radar</span>
            <span>Simulate Blast Vectors</span>
          </button>
        </div>
      </div>

      {/* Layer Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <span className="text-outline text-xs uppercase font-label-caps font-semibold">
            Architectural Layers
          </span>
          <div className="text-2xl font-bold font-code text-on-surface mt-1">4 Layers</div>
          <div className="text-xs text-outline font-code mt-0.5">Gateway → Service → Core → DB</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <span className="text-outline text-xs uppercase font-label-caps font-semibold">
            Active Components
          </span>
          <div className="text-2xl font-bold font-code text-secondary mt-1">{nodes.length} units</div>
          <div className="text-xs text-outline font-code mt-0.5">{links.length} structural edges</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <span className="text-outline text-xs uppercase font-label-caps font-semibold">
            Circular Leak Cycles
          </span>
          <div className="text-2xl font-bold font-code text-amber-400 mt-1">1 cycle</div>
          <div className="text-xs text-amber-400 font-code mt-0.5">tokens.py ↔ session.py</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <span className="text-outline text-xs uppercase font-label-caps font-semibold">
            Instability Average
          </span>
          <div className="text-2xl font-bold font-code text-primary-container mt-1">0.48</div>
          <div className="text-xs text-outline font-code mt-0.5">Balanced package coupling</div>
        </div>
      </div>

      {/* Interactive Topology Graph */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[20px]">
              hub
            </span>
            Interactive Structural Graph
          </h2>
          <span className="text-xs font-code text-outline">
            Drag nodes to rearrange, scroll to zoom, click node to view coupling
          </span>
        </div>

        <InteractiveGraph
          nodes={nodes}
          links={links}
          height={560}
          onNodeSelect={setSelectedNode}
          selectedNodeId={selectedNode?.id}
        />
      </div>

      {/* Architectural Layer Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md pt-2">
        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs uppercase font-label-caps text-secondary">
              1. Edge &amp; API Gateway
            </span>
            <span className="w-2 h-2 rounded-full bg-secondary" />
          </div>
          <p className="text-xs text-outline">
            HTTP routes, CORS filters, request serializers, and rate-limiters.
          </p>
          <div className="font-code text-xs text-on-surface">api_gw (FastAPI Routers)</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs uppercase font-label-caps text-error">
              2. Domain Services
            </span>
            <span className="w-2 h-2 rounded-full bg-error" />
          </div>
          <p className="text-xs text-outline">
            Core business logic, auth token verification, and billing transactions.
          </p>
          <div className="font-code text-xs text-on-surface">auth_svc, user_svc, billing_svc</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs uppercase font-label-caps text-primary-container">
              3. Core Infrastructure
            </span>
            <span className="w-2 h-2 rounded-full bg-primary-container" />
          </div>
          <p className="text-xs text-outline">
            Token state machine, cryptography utilities, and session managers.
          </p>
          <div className="font-code text-xs text-on-surface">token_mgr, crypto_util</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs uppercase font-label-caps text-outline">
              4. Persistence &amp; Storage
            </span>
            <span className="w-2 h-2 rounded-full bg-outline" />
          </div>
          <p className="text-xs text-outline">
            Relational databases, Redis cache, and external webhook integrations.
          </p>
          <div className="font-code text-xs text-on-surface">postgres_db, redis_store</div>
        </div>
      </div>
    </div>
  );
};
