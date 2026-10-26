import React, { useMemo, useState } from 'react';
import type { LabTest } from '../types/plan';

export interface TestSelectorProps {
  tests: LabTest[];
  selectedIds: string[];
  onToggleTest: (id: string) => void;
  isLoadingCatalog: boolean;
}

export const TestSelector: React.FC<TestSelectorProps> = ({
  tests,
  selectedIds,
  onToggleTest,
  isLoadingCatalog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filteredTests = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return tests;
    }
    return tests.filter(
      (t) =>
        t.code.toLowerCase().includes(query) ||
        t.name.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query),
    );
  }, [tests, searchTerm]);

  return (
    <section className="test-selector-section" aria-labelledby="selector-heading">
      <div className="selector-header">
        <h2 id="selector-heading" className="section-title">
          Available Lab Tests
        </h2>
        <span className="tests-count-badge">
          {filteredTests.length} {filteredTests.length === 1 ? 'test' : 'tests'}
        </span>
      </div>

      <div className="search-box-wrapper">
        <span className="search-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </span>
        <input
          id="test-search-input"
          type="search"
          className="search-input"
          placeholder="Search by test name or code (e.g. CBC, FBS, Lipid)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search lab tests"
        />
        {searchTerm && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => setSearchTerm('')}
            aria-label="Clear search"
          >
            &times;
          </button>
        )}
      </div>

      {isLoadingCatalog ? (
        <div className="loading-state-box">
          <div className="spinner" aria-hidden="true" />
          <p>Loading available laboratory tests...</p>
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="empty-search-box">
          <p>No tests found matching &ldquo;{searchTerm}&rdquo;</p>
          <button
            type="button"
            className="reset-search-btn"
            onClick={() => setSearchTerm('')}
          >
            Show all tests
          </button>
        </div>
      ) : (
        <div className="tests-grid" role="list">
          {filteredTests.map((test) => {
            const isSelected = selectedSet.has(test.id);

            return (
              <div
                key={test.id}
                role="listitem"
                className={`test-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleTest(test.id)}
              >
                <div className="card-top-row">
                  <span className="test-code-badge">{test.code}</span>
                  <div className="checkbox-indicator" aria-hidden="true">
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>

                <div className="test-card-body">
                  <h3 className="test-card-name">{test.name}</h3>
                  <div className="test-card-footer">
                    {test.price !== null ? (
                      <span className="test-price">฿{test.price.toLocaleString()}</span>
                    ) : (
                      <span className="package-only-badge" title="Can only be obtained through a package">
                        Package only
                      </span>
                    )}
                    <span className="toggle-label">
                      {isSelected ? 'Selected' : 'Add +'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
