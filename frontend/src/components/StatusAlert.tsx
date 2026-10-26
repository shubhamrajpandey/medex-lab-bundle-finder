import React from 'react';

export interface StatusAlertProps {
  type: 'empty' | 'loading' | 'error';
  message: string;
  onRetry?: () => void;
}

export const StatusAlert: React.FC<StatusAlertProps> = ({ type, message, onRetry }) => {
  if (type === 'loading') {
    return (
      <div className="status-alert alert-loading" role="status" aria-live="polite">
        <div className="spinner-small" aria-hidden="true" />
        <span>Calculating cheapest bundle plan...</span>
      </div>
    );
  }

  if (type === 'empty') {
    return (
      <div className="status-alert alert-empty">
        <div className="alert-icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div className="alert-content">
          <h4>No tests selected</h4>
          <p>{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="status-alert alert-error" role="alert">
      <div className="alert-icon error-icon" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className="alert-content">
        <h4>Notice</h4>
        <p>{message}</p>
        {onRetry && (
          <button type="button" className="retry-btn" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
};
