import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-logo" aria-hidden="true">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v20M2 12h20" />
          </svg>
        </div>
        <div className="brand-text">
          <span className="brand-badge">MedEx Healthcare</span>
          <h1>Lab Test Bundle Finder</h1>
        </div>
      </div>
      <p className="header-subtitle">
        Select the tests prescribed by your doctor. We automatically calculate the cheapest
        combination of health packages and individual tests to maximize your savings.
      </p>
    </header>
  );
};
