'use client';

/**
 * Error Boundary Component
 *
 * Catches React errors and displays user-friendly fallback UI.
 * Per constitution: Error messages must be actionable with recovery options.
 */

import React, { Component, ReactNode } from 'react';
import {
  getUserFriendlyError,
  getRecoveryAction,
  logError,
  UserFriendlyError,
} from '@/lib/utils/error-handling';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: UserFriendlyError, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error
    logError(error, {
      componentStack: errorInfo.componentStack,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  override render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const userFriendlyError = getUserFriendlyError(this.state.error);

      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(userFriendlyError, this.resetError);
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback
          error={userFriendlyError}
          onReset={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default error fallback component
 */
function DefaultErrorFallback({
  error,
  onReset,
}: {
  error: UserFriendlyError;
  onReset: () => void;
}): JSX.Element {
  const recovery = getRecoveryAction(error.category);

  return (
    <div className="min-h-screen bg-[#0d3333] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="rounded-xl bg-dark-teal-gradient border border-red-500/30 p-6 space-y-6">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-900/30 border border-red-500/30">
              <svg
                className="w-8 h-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          {/* Error Title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">{error.title}</h2>
            <p className="text-teal-200">{error.message}</p>
          </div>

          {/* Suggestions */}
          {error.suggestions.length > 0 && (
            <div className="bg-teal-900/20 rounded-lg p-4 border border-teal-700/30">
              <h3 className="text-sm font-semibold text-teal-300 mb-2">
                What you can do:
              </h3>
              <ul className="space-y-1">
                {error.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-teal-100 flex items-start">
                    <span className="text-teal-400 mr-2">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technical Details (collapsible) */}
          {error.technicalDetails && process.env.NODE_ENV === 'development' && (
            <details className="bg-teal-900/10 rounded-lg p-4 border border-teal-700/20">
              <summary className="text-sm font-semibold text-teal-300 cursor-pointer">
                Technical Details
              </summary>
              <pre className="mt-2 text-xs text-teal-200 whitespace-pre-wrap break-words">
                {error.technicalDetails}
              </pre>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onReset}
              className="flex-1 px-4 py-3 rounded-lg bg-teal-500 text-white hover:bg-teal-600 font-semibold text-sm transition-all duration-200 shadow-lg shadow-teal-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d3333]"
            >
              {recovery.buttonText}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-3 rounded-lg bg-teal-700/50 text-teal-100 hover:bg-teal-600 hover:text-white font-semibold text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d3333]"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook-based error boundary wrapper
 * (For use in functional components)
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: (error: UserFriendlyError, reset: () => void) => ReactNode
): React.ComponentType<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
