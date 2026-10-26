import React from 'react';
import type { LabTest, PlanResponseDto } from '../types/plan';
import { PlanItemCard } from './PlanItemCard';

export interface PlanSummaryProps {
  plan: PlanResponseDto;
  testMap: Map<string, LabTest>;
}

export const PlanSummary: React.FC<PlanSummaryProps> = ({ plan, testMap }) => {
  const hasSavings = plan.savings !== null && plan.savings > 0;
  const hasBonusTests = plan.extraTests.length > 0;

  return (
    <div className="plan-summary-container">
      <div className="summary-card-header">
        <div className="plan-badge-row">
          <span className="best-plan-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Cheapest Plan Recommended
          </span>
          <span className="items-count-summary">
            {plan.items.length} {plan.items.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        <h3 className="plan-heading">Your Customized Plan Breakdown</h3>
      </div>

      {/* Bonus tests included in chosen packages */}
      {hasBonusTests && (
        <div className="bonus-tests-banner" role="note">
          <div className="bonus-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v20M2 12h20" />
            </svg>
            Bonus Tests
          </div>
          <div className="bonus-text">
            <strong>Also included:</strong>{' '}
            {plan.extraTests
              .map((id) => {
                const test = testMap.get(id);
                return test ? `${test.name} (${test.code})` : id;
              })
              .join(', ')}
          </div>
        </div>
      )}

      {/* List of packages & tests */}
      <div className="plan-items-list">
        {plan.items.map((item) => (
          <PlanItemCard key={item.id} item={item} testMap={testMap} />
        ))}
      </div>

      {/* Price Breakdown Footer */}
      <div className="price-breakdown-card">
        <div className="price-rows">
          {plan.individualTotal !== null && (
            <div className="price-row individual-row">
              <span className="label">Regular Individual Total:</span>
              <span className="value strikethrough">฿{plan.individualTotal.toLocaleString()}</span>
            </div>
          )}

          {/* Rule: Don't show savings when they are zero or unknown (null) */}
          {hasSavings && (
            <div className="price-row savings-row">
              <span className="label">Package Bundle Savings:</span>
              <span className="value savings-amount">
                -฿{plan.savings!.toLocaleString()}
              </span>
            </div>
          )}

          <div className="price-row total-row">
            <div className="total-label-group">
              <span className="total-label">Total Amount:</span>
              <span className="currency-note">Prices in Thai Baht (THB)</span>
            </div>
            <div className="total-amount">
              ฿{plan.total.toLocaleString()}
            </div>
          </div>
        </div>

        {hasSavings && (
          <div className="savings-callout">
            🎉 You save <strong>฿{plan.savings!.toLocaleString()}</strong> by booking with this optimized bundle!
          </div>
        )}
      </div>
    </div>
  );
};
