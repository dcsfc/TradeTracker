import { Component } from 'react';

/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI
 * Critical for production to prevent entire app crashes
 */
class ErrorBoundary extends Component {
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
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Dashboard Error Boundary Caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 p-6 flex items-center justify-center">
          <div className="max-w-2xl w-full p-8 bg-rose-500/10 border-2 border-rose-500/30 rounded-xl">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-3xl font-bold text-rose-400 mb-4">
                Something went wrong
              </h2>
              <p className="text-slate-300 mb-6 text-lg">
                The dashboard encountered an unexpected error. Please try reloading the page.
              </p>
              {this.state.error && (
                <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <p className="text-sm text-slate-400 font-mono text-left">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}
              <button
                onClick={this.handleReload}
                className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg"
              >
                Reload Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

