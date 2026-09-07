import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import * as analysisService from '../services/analysisService';
import { GraphNode, GraphLink, GraphResponse, UmlResponse } from '../types';
import { InteractiveGraph } from '../components/graph/InteractiveGraph';

export const ArchitecturePage: React.FC = () => {
  const { activeRepo, currentAnalysisId } = useApp();
  const navigate = useNavigate();

  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [graphData, setGraphData] = useState<GraphResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [uml, setUml] = useState<UmlResponse | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'empty' | 'error'>('empty');

  useEffect(() => {
    if (currentAnalysisId) {
      setLoadState('loading');
      analysisService.getGraph(currentAnalysisId).then((graph) => {
        setGraphData(graph);
        const apiNodes = graph.nodes ?? [];
        setNodes(apiNodes.map((node, index) => {
          const path = node.path || node.id;
          const lower = path.toLowerCase();
          const category: GraphNode['category'] = lower.includes('test') ? 'test' : lower.includes('api') || lower.includes('route') || lower.includes('controller') ? 'api' : lower.includes('db') || lower.includes('model') || lower.includes('store') ? 'storage' : 'core';
          const columns = Math.max(1, Math.ceil(Math.sqrt(apiNodes.length)));
          return { id: node.id, label: node.label || path.split('/').pop() || node.id, subLabel: path, category,
            risk: (node.blast_radius_score ?? 0) >= 76 ? 'critical' : (node.blast_radius_score ?? 0) >= 51 ? 'high' : (node.blast_radius_score ?? 0) >= 26 ? 'medium' : 'low',
            x: 110 + (index % columns) * 180, y: 100 + Math.floor(index / columns) * 115,
            metrics: { loc: node.lines_of_code, afferentCoupling: node.in_degree, efferentCoupling: node.out_degree } };
        }));
        setLinks(
          (graph.edges ?? []).map((e) => ({
            source: e.source,
            target: e.target,
            type: (e.edge_type as GraphLink['type']) || 'calls',
            isCritical: e.weight > 5,
          }))
        );
        setLoadState(apiNodes.length ? 'ready' : 'empty');
      }).catch((err) => {
        console.warn('Graph fetch failed:', err);
        setNodes([]);
        setLinks([]);
        setGraphData(null);
        setLoadState('error');
      });
      analysisService.getUml(currentAnalysisId).then(setUml).catch(() => setUml(null));
    } else {
      setNodes([]);
      setLinks([]);
      setGraphData(null);
      setUml(null);
      setLoadState('empty');
    }
  }, [currentAnalysisId]);

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
          <div className="text-2xl font-bold font-code text-amber-400 mt-1">{graphData?.has_cycles ? graphData.cycles.length : 0} cycle(s)</div>
          <div className="text-xs text-amber-400 font-code mt-0.5">{graphData?.has_cycles ? "Cyclic dependencies detected" : "No cycles"}</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <span className="text-outline text-xs uppercase font-label-caps font-semibold">
            Network Density
          </span>
          <div className="text-2xl font-bold font-code text-primary-container mt-1">{graphData?.density ? graphData.density.toFixed(2) : '0.00'}</div>
          <div className="text-xs text-outline font-code mt-0.5">Edge to node ratio</div>
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
        {loadState === 'loading' && <p className="text-xs font-code text-outline">Loading architecture analysis…</p>}
        {loadState === 'error' && <p className="text-xs font-code text-error">Architecture data could not be loaded for this analysis.</p>}
      </div>

      {uml && (
        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high space-y-2">
          <div className="text-xs uppercase font-label-caps text-outline">Generated UML ({uml.total_nodes} nodes, {uml.total_edges} relationships)</div>
          <pre className="max-h-64 overflow-auto rounded-lg bg-surface-container-lowest p-3 text-xs font-code text-on-surface">{uml.plantuml_source}</pre>
        </div>
      )}

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
