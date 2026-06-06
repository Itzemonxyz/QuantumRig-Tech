import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl mx-auto my-8 max-w-2xl">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Oops, something went wrong</h2>
          <p className="text-slate-500 mb-6">The framework encountered an unexpected error. Please refresh the page to try again.</p>
          <div className="bg-white p-4 rounded-lg border border-rose-200 text-left w-full overflow-auto max-h-[200px] mb-6 shadow-inner">
            <code className="text-xs text-rose-600 font-mono">
              {this.state.error && this.state.error.toString()}
            </code>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
