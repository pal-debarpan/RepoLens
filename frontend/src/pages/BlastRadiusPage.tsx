import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import * as analysisService from '../services/analysisService';
import { BlastRadiusTarget, GraphNode, GraphLink, BlastRadiusResponse } from '../types';
import { InteractiveGraph } from '../components/graph/InteractiveGraph';
import { ScoreGauge } from '../components/common/ScoreGauge';

export const BlastRadiusPage: React.FC = () => {
  const { activeRepo, currentAnalysisId } = useApp();
  const navigate = useNavigate();

  const [targets, setTargets] = useState<string[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [currentTarget, setCurrentTarget] = useState<BlastRadiusResponse | null>(null);
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<string | null>(null);
  const [simulationActive, setSimulationActive] = useState(false);

  useEffect(() => {
    if (currentAnalysisId) {
      analysisService.getGraph(currentAnalysisId).then((graph) => {
        const fileNodes = graph.nodes.map(n => n.id).filter(id => id.includes('.'));
        if (fileNodes.length > 0) {
          setTargets(fileNodes);
          setSelectedTargetId(fileNodes[0]);
        }
      }).catch(console.error);
    } else {
        setTargets([]);
        setSelectedTargetId('');
        setCurrentTarget(null);
    }
  }, [currentAnalysisId]);

  useEffect(() => {
    if (currentAnalysisId && selectedTargetId) {
      handleRunSimulation();
    }
  }, [currentAnalysisId, selectedTargetId]);

  const handleRunSimulation = () => {
    if (!currentAnalysisId || !selectedTargetId) return;
    setSimulationActive(true);
    analysisService.getBlastRadius(currentAnalysisId, selectedTargetId).then((res) => {
      setCurrentTarget(res);
      setSimulationActive(false);
    }).catch(err => {
      console.error(err);
      setSimulationActive(false);
    });
  };

  // Dynamically generate blast ripple graph nodes & links for the selected target
  const blastNodes: GraphNode[] = [];
  const blastLinks: GraphLink[] = [];

  if (currentTarget) {
    const nodeIds = new Set<string>();
    
    nodeIds.add(currentTarget.target_file);
    blastNodes.push({
      id: currentTarget.target_file,
      label: currentTarget.target_file.split('/').pop() || currentTarget.target_file,
      category: 'changed',
      risk: 'critical'
    });

    currentTarget.affected_files?.forEach((af) => {
        if (!nodeIds.has(af.file_path)) {
            nodeIds.add(af.file_path);
            blastNodes.push({
                id: af.file_path,
                label: af.file_path.split('/').pop() || af.file_path,
                category: 'impacted',
                risk: af.impact_level === 'High' ? 'high' : af.impact_level === 'Critical' ? 'critical' : 'medium',
            });
        }
    });

    currentTarget.evidence_chains?.forEach((chain) => {
        for(let i=0; i<chain.length-1; i++) {
            blastLinks.push({
                source: chain[i],
                target: chain[i+1],
                type: 'imports',
                isCritical: true
            });
        }
    });
  }

  return (
    <div className="space-y-space-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
              Blast Radius Analyzer
            </h1>
            <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-primary-container text-on-primary-container font-mono font-bold shadow-glow-lime">
              CORE INTELLIGENCE
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            "If I change this code, what else is affected?" Topological downstream ripple simulation.
          </p>
        </div>

        <div className="flex items-center gap-space-sm self-start sm:self-auto">
          <button
            onClick={() => navigate('/testing')}
            className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high border border-surface-container-highest text-on-surface text-body-sm font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">checklist</span>
            <span>View Affected Tests ({currentTarget?.test_targets?.length || 0})</span>
          </button>
          <button
            onClick={handleRunSimulation}
            disabled={simulationActive}
            className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container font-headline-sm text-body-sm font-semibold transition-all shadow-glow-lime disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {simulationActive ? 'sync' : 'radar'}
            </span>
            <span>{simulationActive ? 'Simulating Ripple...' : 'Simulate Change'}</span>
          </button>
        </div>
      </div>

      {/* Target Selector Bar */}
      <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-between gap-space-md shadow-sm">
        {/* Target Component Dropdown */}
        <div className="flex items-center gap-space-sm flex-1">
          <span className="text-outline text-xs font-label-caps uppercase font-semibold">
            Changed Target:
          </span>
          <select
            value={selectedTargetId}
            onChange={(e) => setSelectedTargetId(e.target.value)}
            className="flex-1 max-w-md bg-surface-container border border-surface-container-highest text-on-surface rounded-lg px-3 py-1.5 text-xs font-code focus:outline-none focus:border-primary-container font-semibold"
          >
            {targets.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-space-md">
        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high flex items-center gap-space-md">
          <ScoreGauge score={currentTarget?.score ?? null} size="md" />
          <div className="flex flex-col">
            <span className="text-outline text-[11px] uppercase font-label-caps font-semibold">
              Impact Score
            </span>
            <span className="text-sm font-bold font-code text-error">{currentTarget?.impact_level || 'Low'} Severity</span>
          </div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <span className="text-outline text-[11px] uppercase font-label-caps font-semibold">
            Direct Dependents
          </span>
          <div className="text-2xl font-bold font-code text-on-surface mt-1">
            {currentTarget?.direct_dependents_count || 0} modules
          </div>
          <span className="text-[11px] text-primary-container font-code">1st degree AST links</span>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <span className="text-outline text-[11px] uppercase font-label-caps font-semibold">
            Indirect Downstream
          </span>
          <div className="text-2xl font-bold font-code text-secondary mt-1">
            {currentTarget?.total_affected_count || 0} modules
          </div>
          <span className="text-[11px] text-outline font-code">Transitive call tree</span>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <span className="text-outline text-[11px] uppercase font-label-caps font-semibold">
            Affected Endpoints
          </span>
          <div className="text-2xl font-bold font-code text-amber-400 mt-1">
            {currentTarget?.affected_files?.filter(f => f.file_path.includes('router') || f.file_path.includes('api')).length || 0} routes
          </div>
          <span className="text-[11px] text-amber-400 font-code">External blast edge</span>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high col-span-2 lg:col-span-1">
          <span className="text-outline text-[11px] uppercase font-label-caps font-semibold">
            Confidence
          </span>
          <div className="text-2xl font-bold font-code text-primary-container mt-1">—</div>
          <span className="text-[11px] text-outline font-code">Evidence chains shown below</span>
        </div>
      </div>

      {/* Ripple Propagation Chain */}
      <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high space-y-2 shadow-sm">
        <span className="text-outline text-xs uppercase font-label-caps font-semibold">
          Ripple Propagation Chain:
        </span>
        <div className="flex items-center gap-2 overflow-x-auto py-1 font-code text-xs">
          {(currentTarget?.evidence_chains?.[0] || []).map((node, i, arr) => (
            <React.Fragment key={i}>
              <span
                className={`px-2.5 py-1 rounded whitespace-nowrap ${
                  i === 0
                    ? 'bg-error-container/40 text-error font-bold border border-error/30'
                    : i === arr.length - 1
                    ? 'bg-primary-container/20 text-primary-container font-semibold'
                    : 'bg-surface-container text-on-surface'
                }`}
              >
                {node.split('/').pop() || node}
              </span>
              {i < arr.length - 1 && (
                <span className="material-symbols-outlined text-outline text-[14px]">
                  arrow_forward
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Interactive Ripple Graph Canvas */}
      <div className="space-y-space-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[20px]">
              radar
            </span>
            Topological Ripple Visualization
          </h2>
          <span className="text-xs font-code text-outline">
            Drag nodes, scroll to zoom, click node to inspect coupling
          </span>
        </div>

        <InteractiveGraph
          nodes={blastNodes}
          links={blastLinks}
          height={500}
          selectedNodeId={selectedGraphNodeId}
          onNodeSelect={(node) => setSelectedGraphNodeId(node?.id ?? null)}
        />
      </div>

      {/* Impact Details Grid: Affected Endpoints & Affected Tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
        {/* Affected Endpoints Box */}
        <div className="p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high space-y-space-md shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-body-sm font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400 text-[18px]">
                api
              </span>
              Affected Files ({currentTarget?.affected_files?.length || 0})
            </h3>
            <span className="text-[10px] font-code px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold uppercase">
              Consumer Impact
            </span>
          </div>

          <div className="space-y-2 font-code text-xs">
            {currentTarget?.affected_files?.map((ep, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-surface-container border border-surface-container-highest flex items-center justify-between"
              >
                <span className="font-semibold text-on-surface truncate">{ep.file_path}</span>
                <span className="text-error font-bold text-[11px] ml-2 flex-shrink-0">{ep.impact_level} Blast</span>
              </div>
            ))}
          </div>
        </div>

        {/* Affected Test Suites Box */}
        <div className="p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high space-y-space-md shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-body-sm font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-[18px]">
                checklist
              </span>
              Required Regression Tests ({currentTarget?.test_targets?.length || 0})
            </h3>
            <span className="text-[10px] font-code px-1.5 py-0.5 rounded bg-primary-container/20 text-primary-container font-bold uppercase">
              Test Selection
            </span>
          </div>

          <div className="space-y-2 font-code text-xs">
            {currentTarget?.test_targets?.map((test, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-surface-container border border-surface-container-highest flex items-center justify-between"
              >
                <span className="text-on-surface truncate">{test}</span>
                <span className="text-primary-container font-semibold text-[11px] flex-shrink-0 ml-2">
                  Targeted
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
