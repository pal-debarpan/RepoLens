import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RepoLens ErrorBoundary] Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0D0F0D] flex items-center justify-center p-8">
          <div className="max-w-xl w-full space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-error/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-error text-[22px]">error</span>
              </div>
              <div>
                <h1 className="text-on-surface font-semibold text-lg">Something went wrong</h1>
                <p className="text-outline text-sm">A rendering error occurred in the application.</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface-container border border-surface-container-high text-sm font-code text-error overflow-auto max-h-48">
              {this.state.error?.message ?? 'Unknown error'}
            </div>
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container text-sm font-semibold hover:bg-primary-fixed-dim transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => { this.handleReset(); window.location.href = '/overview'; }}
                className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-sm font-semibold hover:bg-surface-container-highest transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
            {this.state.errorInfo && (
              <details className="text-xs font-code text-outline">
                <summary className="cursor-pointer hover:text-on-surface">Stack Trace</summary>
                <pre className="mt-2 overflow-auto max-h-40 text-[10px]">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
