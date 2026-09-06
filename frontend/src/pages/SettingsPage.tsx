import React from 'react';
import { useApp } from '../context';

export const SettingsPage: React.FC = () => {
  const {
    theme,
    setTheme,
    diffGlowEnabled,
    setDiffGlowEnabled,
    activeRepo,
  } = useApp();

  return (
    <div className="space-y-space-xl max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-space-xs">
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
            Application Settings
          </h1>
          <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-surface-container text-primary-container font-mono">
            SYS CONFIG
          </span>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Interface styling engines, topological graph heuristics, AST cache parameters, and external credentials.
        </p>
      </div>

      {/* Section 1: Theme & Appearance (Reference 11 exact match) */}
      <section className="bg-surface-container-low rounded-xl p-space-lg border border-surface-container-high shadow-sm space-y-space-lg">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary-container text-[20px]">
                palette
              </span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                Theme &amp; Appearance
              </h2>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
              Select interface rendering engine. Themes strictly configure syntax highlighting contrast and chromatic accenting.
            </p>
          </div>
          <span className="font-label-caps text-label-caps px-space-xs py-space-2xs rounded bg-surface-container text-primary-container uppercase font-semibold">
            Surface UI
          </span>
        </div>

        {/* Theme Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
          {/* DARK MODE */}
          <div
            onClick={() => setTheme('dark')}
            className={`relative group cursor-pointer rounded-lg p-space-md shadow-md transition-all flex flex-col justify-between h-56 border ${
              theme === 'dark'
                ? 'bg-surface-container border-primary-container ring-1 ring-primary-container'
                : 'bg-surface-container-lowest border-surface-container-highest hover:bg-surface-container'
            }`}
          >
            <div className="space-y-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="w-3 h-3 rounded-full bg-primary-container" />
                  <span className="font-headline-sm text-body-sm font-semibold text-on-surface">
                    Dark Mode
                  </span>
                </div>
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    theme === 'dark' ? 'text-primary-container' : 'text-outline opacity-30'
                  }`}
                >
                  {theme === 'dark' ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </div>
              <div className="font-code-sm text-code-sm text-primary-container font-semibold">
                Graphite &amp; Lime Spark
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Graphite base (#23262F), surface containers (#1A1C21), and surgical Lime Spark (#B6FF2E) technical accents.
              </p>
            </div>

            <div className="p-space-xs rounded bg-surface-container-lowest flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#111318]" />
                <span className="w-2.5 h-2.5 rounded-sm bg-[#23262F]" />
                <span className="w-2.5 h-2.5 rounded-sm bg-[#B6FF2E]" />
              </div>
              <span className="font-label-caps text-label-caps text-primary-container font-semibold">
                ACTIVE DEFAULT
              </span>
            </div>
          </div>

          {/* LIGHT MODE */}
          <div
            onClick={() => setTheme('light')}
            className={`relative group cursor-pointer rounded-lg p-space-md shadow-sm transition-all flex flex-col justify-between h-56 border ${
              theme === 'light'
                ? 'bg-surface-container border-primary-container ring-1 ring-primary-container'
                : 'bg-surface-container-lowest border-surface-container-highest hover:bg-surface-container'
            }`}
          >
            <div className="space-y-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="w-3 h-3 rounded-full bg-[#064E3B]" />
                  <span className="font-headline-sm text-body-sm font-semibold text-on-surface">
                    Light Mode
                  </span>
                </div>
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    theme === 'light' ? 'text-primary-container' : 'text-outline opacity-30'
                  }`}
                >
                  {theme === 'light' ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </div>
              <div className="font-code-sm text-code-sm text-[#064E3B] font-semibold">
                Champagne &amp; Emerald
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Champagne paper base (#F8E7C9), calibrated warm cream surfaces, and dense Emerald Ink (#064E3B) tokens.
              </p>
            </div>

            <div className="p-space-xs rounded bg-surface-container-lowest flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#F8E7C9]" />
                <span className="w-2.5 h-2.5 rounded-sm bg-[#E8D7B9]" />
                <span className="w-2.5 h-2.5 rounded-sm bg-[#064E3B]" />
              </div>
              <span className="font-label-caps text-label-caps text-on-surface-variant font-medium">
                LIGHT CONSOLE
              </span>
            </div>
          </div>

          {/* SYSTEM MODE */}
          <div
            onClick={() => setTheme('system')}
            className={`relative group cursor-pointer rounded-lg p-space-md shadow-sm transition-all flex flex-col justify-between h-56 border ${
              theme === 'system'
                ? 'bg-surface-container border-primary-container ring-1 ring-primary-container'
                : 'bg-surface-container-lowest border-surface-container-highest hover:bg-surface-container'
            }`}
          >
            <div className="space-y-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="w-3 h-3 rounded-full bg-secondary" />
                  <span className="font-headline-sm text-body-sm font-semibold text-on-surface">
                    Sync System
                  </span>
                </div>
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    theme === 'system' ? 'text-primary-container' : 'text-outline opacity-30'
                  }`}
                >
                  {theme === 'system' ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </div>
              <div className="font-code-sm text-code-sm text-secondary font-semibold">
                OS Dynamic Dispatch
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Matches host window query (`prefers-color-scheme`). Dynamically reloads tree styles and monospaced shaders.
              </p>
            </div>

            <div className="p-space-xs rounded bg-surface-container-lowest flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-surface-container-high" />
                <span className="w-2.5 h-2.5 rounded-sm bg-secondary" />
              </div>
              <span className="font-label-caps text-label-caps text-on-surface-variant font-medium">
                AUTO SYNC
              </span>
            </div>
          </div>
        </div>

        {/* High Voltage Diff Glow Switch (Ref 11 lines 153-160) */}
        <div className="flex items-center justify-between p-space-md rounded-lg bg-surface-container border border-surface-container-high">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
              contrast
            </span>
            <div>
              <div className="font-headline-sm text-body-sm font-medium text-on-surface">
                High-Voltage Diff Glow
              </div>
              <div className="font-body-sm text-body-sm text-on-surface-variant">
                Render directional photon bloom behind critical blast-radius markers and security vectors.
              </div>
            </div>
          </div>
          <button
            onClick={() => setDiffGlowEnabled(!diffGlowEnabled)}
            className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${
              diffGlowEnabled ? 'bg-primary-container' : 'bg-surface-container-highest'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full transition-transform ${
                diffGlowEnabled
                  ? 'translate-x-6 bg-on-primary-container'
                  : 'translate-x-0 bg-outline'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Section 2: Graph Engine Parameters */}
      <section className="bg-surface-container-low rounded-xl p-space-lg border border-surface-container-high shadow-sm space-y-space-md">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-primary-container text-[20px]">
            account_tree
          </span>
          <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
            Topological Graph Engine
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md text-body-sm">
          <div className="p-space-md rounded-lg bg-surface-container space-y-2">
            <div className="font-medium text-on-surface">Max Ripple Hop Traversal</div>
            <p className="text-xs text-outline">
              Limits recursive breadth-first search across downstream AST symbols.
            </p>
            <div className="flex items-center gap-4 pt-1">
              <input type="range" min="1" max="6" defaultValue="4" className="flex-1 accent-primary-container" />
              <span className="font-code text-xs font-bold text-primary-container">4 hops</span>
            </div>
          </div>

          <div className="p-space-md rounded-lg bg-surface-container space-y-2">
            <div className="font-medium text-on-surface">Cycle Detection Sensitivity</div>
            <p className="text-xs text-outline">
              Tarjan SCC algorithm depth threshold for circular imports.
            </p>
            <div className="flex items-center gap-4 pt-1">
              <input type="range" min="10" max="100" defaultValue="50" className="flex-1 accent-secondary" />
              <span className="font-code text-xs font-bold text-secondary">Strict L3</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Danger Zone */}
      <section className="bg-surface-container-low rounded-xl p-space-lg border border-error/30 shadow-sm space-y-space-md">
        <div className="flex items-center gap-space-xs text-error">
          <span className="material-symbols-outlined text-[20px]">warning</span>
          <h2 className="font-headline-md text-headline-md font-semibold">Danger Zone</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md p-space-md rounded-lg bg-surface-container border border-surface-container-high">
          <div>
            <div className="font-medium text-body-sm text-on-surface">
              Flush AST Cache for {activeRepo?.name}
            </div>
            <div className="text-xs text-outline mt-0.5">
              Force an end-to-end clean recompilation of the AST semantic graph and token database.
            </div>
          </div>
          <button
            onClick={() => alert('AST Cache purged successfully.')}
            className="px-space-md py-space-xs rounded-lg bg-error-container/30 hover:bg-error-container text-error text-xs font-code font-bold uppercase transition-colors self-start sm:self-auto"
          >
            Flush Cache
          </button>
        </div>
      </section>
    </div>
  );
};
