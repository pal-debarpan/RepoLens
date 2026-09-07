import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { testingService } from '../services/api';
import { TestingRecommendation } from '../types';

export const TestingPage: React.FC = () => {
  const { activeRepo } = useApp();
  const navigate = useNavigate();

  const [tests, setTests] = useState<TestingRecommendation[]>([]);
  const [runningAll, setRunningAll] = useState(false);
  const [executedCount, setExecutedCount] = useState(0);

  useEffect(() => {
    testingService.getRecommendations(activeRepo?.id).then(setTests);
  }, [activeRepo]);

  const handleRunAll = () => {
    setRunningAll(true);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setExecutedCount(count);
      if (count >= tests.length) {
        clearInterval(interval);
        setRunningAll(false);
        setTests((prev) =>
          prev.map((t) => ({ ...t, status: 'passed', lastRun: 'Just now (Passed)' }))
        );
      }
    }, 600);
  };

  return (
    <div className="space-y-space-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
              Testing Recommendations
            </h1>
            <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-surface-container text-primary-container">
              TEST IMPACT ANALYSIS (TIA)
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Selective regression targeting based on AST dependency ripple for{' '}
            <span className="font-code text-on-surface font-semibold">{activeRepo?.name}</span>.
          </p>
        </div>

        <button
          onClick={handleRunAll}
          disabled={runningAll}
          className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container font-headline-sm text-body-sm font-semibold transition-all shadow-glow-lime disabled:opacity-50 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">
            {runningAll ? 'sync' : 'play_arrow'}
          </span>
          <span>
            {runningAll
              ? `Executing (${executedCount}/${tests.length})...`
              : 'Run Recommended Tests'}
          </span>
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <div className="text-outline text-xs uppercase font-label-caps font-semibold">Recommended Subset</div>
          <div className="text-2xl font-bold font-code text-on-surface mt-1">{tests.length} suites</div>
          <div className="text-xs text-primary-container font-code mt-0.5">Topologically targeted</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <div className="text-outline text-xs uppercase font-label-caps font-semibold">Execution Time Savings</div>
          <div className="text-2xl font-bold font-code text-primary-container mt-1">8.2s</div>
          <div className="text-xs text-outline font-code mt-0.5">vs 4m 12s full test runner</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <div className="text-outline text-xs uppercase font-label-caps font-semibold">Coverage Confidence</div>
          <div className="text-2xl font-bold font-code text-secondary mt-1">84.5%</div>
          <div className="text-xs text-outline font-code mt-0.5">0 uncovered blast vectors</div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high">
          <div className="text-outline text-xs uppercase font-label-caps font-semibold">Stale Test Cases</div>
          <div className="text-2xl font-bold font-code text-amber-400 mt-1">1 stale</div>
          <div className="text-xs text-amber-400 font-code mt-0.5">Vulnerability sink test</div>
        </div>
      </div>

      {/* Targeted Recommendations List */}
      <div className="space-y-space-sm">
        {tests.map((test) => (
          <div
            key={test.id}
            className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high hover:border-surface-container-highest transition-all flex flex-col md:flex-row md:items-center justify-between gap-space-md"
          >
            <div className="flex items-start gap-space-md min-w-0">
              <span
                className={`px-2 py-1 rounded text-xs font-code font-bold uppercase flex-shrink-0 ${
                  test.priority === 'High'
                    ? 'bg-error-container/30 text-error'
                    : test.priority === 'Medium'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-surface-container text-outline'
                }`}
              >
                {test.priority}
              </span>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-code font-semibold text-body-sm text-on-surface truncate">
                    {test.testFile}
                  </span>
                  <span className="font-code text-xs text-primary-container">
                    ::{test.testCase}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1 text-xs text-outline font-code">
                  <span className="material-symbols-outlined text-[14px]">radar</span>
                  <span>Target: {test.targetComponent}</span>
                </div>

                <p className="text-xs text-on-surface-variant mt-1">
                  {test.reason}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-space-md flex-shrink-0">
              <div className="flex flex-col text-right font-code text-xs">
                <span className="text-on-surface font-semibold">{test.executionTimeSec}s</span>
                <span className="text-outline text-[11px]">{test.lastRun}</span>
              </div>

              <button
                onClick={() => navigate('/blast-radius')}
                className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors"
                title="View in Blast Radius Graph"
              >
                <span className="material-symbols-outlined text-[18px]">account_tree</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
