import React from 'react';
import { FaExclamationTriangle, FaRefresh, FaHome } from 'react-icons/fa';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and state
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/home';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">
              <FaExclamationTriangle className="mx-auto h-12 w-12 text-red-500" />
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Oops! Something went wrong
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                We encountered an unexpected error. Please try refreshing the page.
              </p>
            </div>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="space-y-4">
                <button
                  onClick={this.handleReload}
                  className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FaRefresh />
                  Refresh Page
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FaHome />
                  Go to Home
                </button>
              </div>

              {/* Development Error Details */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="text-sm font-medium text-red-800 mb-2">
                    Error Details (Development Mode):
                  </h3>
                  <details className="text-xs text-red-700">
                    <summary className="cursor-pointer hover:text-red-900">
                      Click to view error details
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap break-words">
                      {this.state.error.toString()}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const withErrorBoundary = (Component, fallback) => {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

// Simple Error Display Component
export const ErrorDisplay = ({ 
  error, 
  onRetry, 
  onGoHome, 
  title = "Something went wrong",
  message = "We encountered an error. Please try again."
}) => {
  return (
    <div className="text-center py-12">
      <FaExclamationTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{message}</p>
      
      {error && process.env.NODE_ENV === 'development' && (
        <div className="text-left max-w-md mx-auto mb-6 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          <code>{error.toString()}</code>
        </div>
      )}
      
      <div className="flex justify-center gap-4">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FaRefresh />
            Try Again
          </button>
        )}
        {onGoHome && (
          <button
            onClick={onGoHome}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <FaHome />
            Go Home
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorBoundary;
