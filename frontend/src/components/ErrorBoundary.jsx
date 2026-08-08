import React from 'react';

/**
 * React Error Boundary component mapping unhandled client-side runtime errors to recovery UI.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled client runtime error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-wrapper">
          <h2 className="error-boundary-title">Something went wrong</h2>
          <p className="error-boundary-message">
            An unexpected error occurred in the user interface rendering stack. Please try reloading the application.
          </p>
          <button onClick={this.handleReload} className="error-boundary-reload-btn">
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
