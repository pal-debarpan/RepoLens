import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { blastRadiusService } from '../services/api';
import { BlastRadiusTarget, GraphNode, GraphLink } from '../types';
import { InteractiveGraph } from '../components/graph/InteractiveGraph';
import { ScoreGauge } from '../components/common/ScoreGauge';

export const BlastRadiusPage: React.FC = () => {
  const { activeRepo } = useApp();
  const navigate = useNavigate();

  const [targets, setTargets] = useState<BlastRadiusTarget[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('target-auth');
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<string | null>(null);
  const [simulationActive, setSimulationActive] = useState(false);

  useEffect(() => {
    blastRadiusService.getTargets(activeRepo?.id).then((list) => {
      setTargets(list);
    });
  }, [activeRepo]);

  const currentTarget = targets.find((t) => t.id === selectedTargetId) || targets[0];

  // Dynamically generate blast ripple graph nodes & links for the selected target
  const blastNodes: GraphNode[] = [
    {
      id: 'target_node',
      label: currentTarget?.symbol || 'validate_token',
      subLabel: currentTarget?.filePath || 'services/auth_service.py',
      category: 'changed',
      risk: 'critical',
      x: 350,
      y: 120,
      metrics: { afferentCoupling: 5, efferentCoupling: 3, instability: 0.38, loc: 412 },
    },
    {
      id: 'dep_middleware',
      label: 'jwt_auth.py',
      subLabel: 'middleware/jwt_auth.py',
      category: 'impacted',
      risk: 'critical',
      x: 180,
      y: 260,
      metrics: { afferentCoupling: 4, efferentCoupling: 2, instability: 0.33 },
    },
    {
      id: 'dep_user_route',
      label: 'User Router',
      subLabel: 'api/v1/routers/user.py',
      category: 'impacted',
      risk: 'high',
      x: 350,
      y: 280,
      metrics: { afferentCoupling: 2, efferentCoupling: 3, instability: 0.6 },
    },
    {
      id: 'dep_billing_route',
      label: 'Billing Checkout',
      subLabel: 'api/v1/routers/billing.py',
      category: 'impacted',
      risk: 'high',
      x: 520,
      y: 260,
      metrics: { afferentCoupling: 3, efferentCoupling: 4, instability: 0.57 },
    },
    {
      id: 'dep_session',
      label: 'Session Storage',
      subLabel: 'core/session.py',
      category: 'service',
      risk: 'medium',
      x: 180,
      y: 420,
      metrics: { afferentCoupling: 3, efferentCoupling: 1, instability: 0.25 },
    },
    {
      id: 'test_auth',
      label: 'test_auth_service.py',
      subLabel: 'tests/unit',
      category: 'test',
      risk: 'low',
      x: 350,
      y: 440,
      metrics: { afferentCoupling: 0, efferentCoupling: 1, instability: 1.0 },
    },
    {
      id: 'test_e2e',
      label: 'test_api_gateway.py',
      subLabel: 'tests/e2e',
      category: 'test',
      risk: 'low',
      x: 520,
      y: 420,
      metrics: { afferentCoupling: 0, efferentCoupling: 2, instability: 1.0 },
    },
  ];

  const blastLinks: GraphLink[] = [
    { source: 'target_node', target: 'dep_middleware', type: 'calls', isCritical: true },
    { source: 'target_node', target: 'dep_user_route', type: 'imports', isCritical: true },
    { source: 'target_node', target: 'dep_billing_route', type: 'calls', isCritical: true },
    { source: 'dep_middleware', target: 'dep_session', type: 'mutates' },
    { source: 'test_auth', target: 'target_node', type: 'tests', isCritical: true },
    { source: 'test_e2e', target: 'dep_user_route', type: 'tests' },
    { source: 'test_e2e', target: 'dep_billing_route', type: 'tests', isCritical: true },
  ];

  const handleRunSimulation = () => {
    setSimulationActive(true);
    setTimeout(() => {
      setSimulationActive(false);
    }, 1500);
  };

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
            <span>View Affected Tests ({currentTarget?.affectedTestsCount || 7})</span>
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
              <option key={t.id} value={t.id}>
                {t.filePath} :: {t.symbol} ({t.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-space-md">
        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high flex items-center gap-space-md">
          <ScoreGauge score={currentTarget?.riskScore || 84} size="md" />
          <div className="flex flex-col">
            <span className="text-outline text-[11px] uppercase font-label-caps font-semibold">
              Impact Score
            </span>
            <span className="text-sm font-bold font-code text-error">High Severity</span>
          </div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <span className="text-outline text-[11px] uppercase font-label-caps font-semibold">
            Direct Dependents
          </span>
          <div className="text-2xl font-bold font-code text-on-surface mt-1">
            {currentTarget?.directDependentsCount || 5} modules
          </div>
          <span className="text-[11px] text-primary-container font-code">1st degree AST links</span>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <span className="text-outline text-[11px] uppercase font-label-caps font-semibold">
            Indirect Downstream
          </span>
          <div className="text-2xl font-bold font-code text-secondary mt-1">
            {currentTarget?.indirectDependentsCount || 14} modules
          </div>
          <span className="text-[11px] text-outline font-code">Transitive call tree</span>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <span className="text-outline text-[11px] uppercase font-label-caps font-semibold">
            Affected Endpoints
          </span>
          <div className="text-2xl font-bold font-code text-amber-400 mt-1">
            {currentTarget?.affectedEndpointsCount || 4} routes
          </div>
          <span className="text-[11px] text-amber-400 font-code">External blast edge</span>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high col-span-2 lg:col-span-1">
          <span className="text-outline text-[11px] uppercase font-label-caps font-semibold">
            Confidence
          </span>
          <div className="text-2xl font-bold font-code text-primary-container mt-1">
            {currentTarget?.confidence || 96}%
          </div>
          <span className="text-[11px] text-outline font-code">Static AST verified</span>
        </div>
      </div>

      {/* Ripple Propagation Chain */}
      <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high space-y-2 shadow-sm">
        <span className="text-outline text-xs uppercase font-label-caps font-semibold">
          Ripple Propagation Chain:
        </span>
        <div className="flex items-center gap-2 overflow-x-auto py-1 font-code text-xs">
          {currentTarget?.ripplePath.map((node, i) => (
            <React.Fragment key={i}>
              <span
                className={`px-2.5 py-1 rounded whitespace-nowrap ${
                  i === 0
                    ? 'bg-error-container/40 text-error font-bold border border-error/30'
                    : i === currentTarget.ripplePath.length - 1
                    ? 'bg-primary-container/20 text-primary-container font-semibold'
                    : 'bg-surface-container text-on-surface'
                }`}
              >
                {node}
              </span>
              {i < currentTarget.ripplePath.length - 1 && (
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
              Affected API Endpoints ({currentTarget?.affectedEndpoints.length})
            </h3>
            <span className="text-[10px] font-code px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold uppercase">
              Consumer Impact
            </span>
          </div>

          <div className="space-y-2 font-code text-xs">
            {currentTarget?.affectedEndpoints.map((ep, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-surface-container border border-surface-container-highest flex items-center justify-between"
              >
                <span className="font-semibold text-on-surface">{ep}</span>
                <span className="text-error font-bold text-[11px]">High Blast</span>
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
              Required Regression Tests ({currentTarget?.affectedTests.length})
            </h3>
            <span className="text-[10px] font-code px-1.5 py-0.5 rounded bg-primary-container/20 text-primary-container font-bold uppercase">
              Test Selection
            </span>
          </div>

          <div className="space-y-2 font-code text-xs">
            {currentTarget?.affectedTests.map((test, i) => (
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
