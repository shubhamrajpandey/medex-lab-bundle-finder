import React, { useCallback, useState } from 'react';
import { Header } from './components/Header';
import { TestSelector } from './components/TestSelector';
import { SelectedChips } from './components/SelectedChips';
import { PlanSummary } from './components/PlanSummary';
import { StatusAlert } from './components/StatusAlert';
import { useCatalog } from './hooks/useCatalog';
import { usePlanCalculator } from './hooks/usePlanCalculator';
import './App.css';

export const App: React.FC = () => {
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);

  // Load available lab tests
  const {
    tests,
    testMap,
    testNameMap,
    isLoading: isLoadingCatalog,
    error: catalogError,
    refetch: refetchCatalog,
  } = useCatalog();

  // Dynamic live plan calculation with race-condition protection
  const {
    plan,
    isLoading: isCalculatingPlan,
    error: planError,
  } = usePlanCalculator(selectedTestIds, testNameMap);

  // Toggle test selection while preserving selection order
  const handleToggleTest = useCallback((id: string) => {
    setSelectedTestIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id]; // Appends in selection order
    });
  }, []);

  // Remove a single test chip
  const handleRemoveTest = useCallback((id: string) => {
    setSelectedTestIds((prev) => prev.filter((item) => item !== id));
  }, []);

  // Clear all selections
  const handleClearAll = useCallback(() => {
    setSelectedTestIds([]);
  }, []);

  return (
    <div className="app-container">
      <Header />

      {catalogError ? (
        <div className="catalog-error-container">
          <StatusAlert
            type="error"
            message={catalogError}
            onRetry={refetchCatalog}
          />
        </div>
      ) : (
        <main className="main-layout">
          {/* Left Column: Test Selection */}
          <section className="selection-column">
            <SelectedChips
              selectedIds={selectedTestIds}
              testMap={testMap}
              onRemove={handleRemoveTest}
              onClearAll={handleClearAll}
            />

            <TestSelector
              tests={tests}
              selectedIds={selectedTestIds}
              onToggleTest={handleToggleTest}
              isLoadingCatalog={isLoadingCatalog}
            />
          </section>

          {/* Right Column: Dynamic Plan & Savings Breakdown */}
          <aside className="plan-column" aria-label="Bundle recommendations">
            <div className="plan-sticky-wrapper">
              <div className="plan-column-header">
                <h2>Optimal Plan Recommendation</h2>
                <p>Real-time calculation based on your selected tests</p>
              </div>

              {/* State handling: Empty Selection */}
              {selectedTestIds.length === 0 && (
                <StatusAlert
                  type="empty"
                  message="Choose one or more lab tests to see which health package or test combination gives you the lowest price."
                />
              )}

              {/* State handling: Loading */}
              {selectedTestIds.length > 0 && isCalculatingPlan && (
                <StatusAlert
                  type="loading"
                  message="Calculating optimal bundle..."
                />
              )}

              {/* State handling: Error in Plain Language */}
              {selectedTestIds.length > 0 && !isCalculatingPlan && planError && (
                <StatusAlert type="error" message={planError} />
              )}

              {/* State handling: Success Result */}
              {selectedTestIds.length > 0 && !isCalculatingPlan && !planError && plan && (
                <PlanSummary plan={plan} testMap={testMap} />
              )}

              <div className="guarantee-card">
                <div className="guarantee-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="guarantee-text">
                  <strong>MedEx Best-Price Guarantee</strong>
                  <span>We evaluate all valid packages and individual tests to guarantee you never overpay.</span>
                </div>
              </div>
            </div>
          </aside>
        </main>
      )}
    </div>
  );
};

export default App;
