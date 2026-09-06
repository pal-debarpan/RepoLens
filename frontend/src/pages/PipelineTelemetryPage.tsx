import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { pipelineService } from '../services/api';
import { PipelineStage, PipelineLog } from '../types';

export const PipelineTelemetryPage: React.FC = () => {
  const { activeRepo } = useApp();
  const navigate = useNavigate();

  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [logs, setLogs] = useState<PipelineLog[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [logSearch, setLogSearch] = useState<string>('');

  useEffect(() => {
    pipelineService.getStages().then(setStages);
    pipelineService.getLogs().then(setLogs);
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch =
      log.message.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.stage.toLowerCase().includes(logSearch.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="space-y-space-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs">
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
              Pipeline Telemetry
            </h1>
            <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-surface-container text-primary-container font-mono">
              LIVE AST INGESTION
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Live streaming AST graph compilation, semantic tokenization, and dependency propagation for{' '}
            <span className="font-code text-on-surface font-semibold">{activeRepo?.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-space-xs self-start sm:self-auto">
          <button
            onClick={() => navigate('/architecture')}
            className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container font-headline-sm text-body-sm font-semibold transition-all shadow-glow-lime"
          >
            <span>View Architecture</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Top 3 Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-outline font-label-caps text-label-caps uppercase">
              Tokenizer Throughput
            </span>
            <span className="material-symbols-outlined text-primary-container text-[18px]">
              speed
            </span>
          </div>
          <div className="mt-2">
            <div className="text-headline-md font-bold text-on-surface font-code">
              2,840 <span className="text-xs font-normal text-outline">tokens/sec</span>
            </div>
            <div className="text-xs text-primary-container font-code mt-0.5">
              ▲ 14% vs baseline AST cache
            </div>
          </div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-outline font-label-caps text-label-caps uppercase">
              Graph Entities Resolved
            </span>
            <span className="material-symbols-outlined text-secondary text-[18px]">
              hub
            </span>
          </div>
          <div className="mt-2">
            <div className="text-headline-md font-bold text-on-surface font-code">
              4,210 <span className="text-xs font-normal text-outline">nodes (18,920 edges)</span>
            </div>
            <div className="text-xs text-secondary font-code mt-0.5">
              Topological cycle resolution: 99.8%
            </div>
          </div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-outline font-label-caps text-label-caps uppercase">
              AST Buffer Memory (RSS)
            </span>
            <span className="material-symbols-outlined text-outline text-[18px]">
              memory
            </span>
          </div>
          <div className="mt-2">
            <div className="text-headline-md font-bold text-on-surface font-code">
              412 <span className="text-xs font-normal text-outline">MB allocated</span>
            </div>
            <div className="text-xs text-outline font-code mt-0.5">
              Zero memory leak detected in v4.9
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Stage Progression Timeline */}
      <div className="p-space-lg rounded-xl bg-surface-container-low border border-surface-container-high space-y-space-md shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[20px]">
              checklist
            </span>
            Pipeline Stages
          </h2>
          <span className="font-code text-xs text-primary-container">
            Stage 4 of 5 Running
          </span>
        </div>

        <div className="space-y-space-sm">
          {stages.map((stage) => {
            const isCompleted = stage.status === 'completed';
            const isRunning = stage.status === 'running';

            return (
              <div
                key={stage.id}
                className="p-space-md rounded-lg bg-surface-container border border-surface-container-highest flex flex-col md:flex-row md:items-center justify-between gap-space-sm"
              >
                <div className="flex items-center gap-space-sm min-w-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCompleted
                        ? 'bg-primary-container/20 text-primary-container'
                        : isRunning
                        ? 'bg-secondary/20 text-secondary animate-pulse'
                        : 'bg-surface-container-highest text-outline'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isCompleted ? 'check' : isRunning ? 'sync' : 'hourglass_empty'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-body-sm text-on-surface truncate">
                      {stage.name}
                    </span>
                    <span className="text-xs text-outline font-code truncate">
                      {stage.detail}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-space-md w-full md:w-64">
                  <div className="flex-1 bg-surface-container-lowest h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-primary-container'
                          : isRunning
                          ? 'bg-secondary'
                          : 'bg-transparent'
                      }`}
                      style={{ width: `${stage.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-code text-outline w-12 text-right">
                    {stage.duration || `${stage.progress}%`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Terminal Log Streamer */}
      <div className="rounded-xl bg-surface-container-lowest border border-surface-container-high overflow-hidden shadow-xl">
        {/* Terminal Header */}
        <div className="px-space-md py-space-sm bg-surface-container-low border-b border-surface-container-high flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[18px]">
              terminal
            </span>
            <span className="font-code text-xs font-semibold text-on-surface">
              daemon.stdout // repolens-ast-worker
            </span>
          </div>

          <div className="flex items-center gap-space-sm">
            <div className="relative">
              <input
                type="text"
                placeholder="Filter terminal output..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="px-2.5 py-1 rounded bg-surface-container border border-surface-container-highest text-xs font-code text-on-surface focus:outline-none focus:border-primary-container"
              />
            </div>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-2 py-1 rounded bg-surface-container border border-surface-container-highest text-xs font-code text-on-surface focus:outline-none"
            >
              <option value="all">All Levels</option>
              <option value="info">INFO</option>
              <option value="warn">WARN</option>
              <option value="error">ERROR</option>
              <option value="success">SUCCESS</option>
            </select>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-space-md font-code text-xs space-y-1.5 max-h-80 overflow-y-auto bg-black/40">
          {filteredLogs.map((l) => {
            const levelColors = {
              info: 'text-secondary',
              warn: 'text-amber-400',
              error: 'text-error font-bold',
              success: 'text-primary-container font-semibold',
              debug: 'text-outline',
            };

            return (
              <div key={l.id} className="flex items-start gap-3 hover:bg-white/5 py-0.5 px-1 rounded">
                <span className="text-outline text-[11px] select-none">{l.timestamp}</span>
                <span className={`text-[11px] uppercase font-bold w-16 ${levelColors[l.level]}`}>
                  [{l.level}]
                </span>
                <span className="text-outline text-[11px] w-20">[{l.stage}]</span>
                <span className="text-on-surface flex-1">{l.message}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
