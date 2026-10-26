import React from 'react';
import type { LabTest, PlanItem } from '../types/plan';

export interface PlanItemCardProps {
  item: PlanItem;
  testMap: Map<string, LabTest>;
}

export const PlanItemCard: React.FC<PlanItemCardProps> = ({ item, testMap }) => {
  const isPackage = item.type === 'package';

  return (
    <div className={`plan-item-card ${isPackage ? 'is-package' : 'is-test'}`}>
      <div className="item-header">
        <div className="item-title-group">
          <span className={`item-type-tag ${isPackage ? 'tag-package' : 'tag-test'}`}>
            {isPackage ? 'Bundle Package' : 'Individual Test'}
          </span>
          <h4 className="item-name">{item.name}</h4>
        </div>
        <div className="item-price">฿{item.price.toLocaleString()}</div>
      </div>

      <div className="item-covers-section">
        <span className="covers-label">Covers selected tests:</span>
        <div className="covers-tags">
          {item.covers.map((testId) => {
            const test = testMap.get(testId);
            return (
              <span key={testId} className="covered-tag">
                <span className="tag-code">{test?.code || testId}</span>
                <span className="tag-name">{test?.name || testId}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
