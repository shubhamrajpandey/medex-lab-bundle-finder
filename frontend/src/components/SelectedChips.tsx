import React from 'react';
import type { LabTest } from '../types/plan';

export interface SelectedChipsProps {
  selectedIds: string[];
  testMap: Map<string, LabTest>;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

export const SelectedChips: React.FC<SelectedChipsProps> = ({
  selectedIds,
  testMap,
  onRemove,
  onClearAll,
}) => {
  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <div className="selected-chips-container" aria-label="Selected tests">
      <div className="selected-chips-header">
        <span className="selected-count">
          Selected Tests <strong>({selectedIds.length})</strong>
        </span>
        <button
          type="button"
          className="clear-all-btn"
          onClick={onClearAll}
          aria-label="Clear all selected tests"
        >
          Clear all
        </button>
      </div>

      <div className="chips-list">
        {selectedIds.map((id) => {
          const test = testMap.get(id);
          const label = test ? `${test.code} – ${test.name}` : id;

          return (
            <span key={id} className="test-chip">
              <span className="chip-code">{test?.code || id}</span>
              <span className="chip-name">{test?.name || id}</span>
              <button
                type="button"
                className="chip-remove-btn"
                onClick={() => onRemove(id)}
                aria-label={`Remove ${label}`}
                title={`Remove ${label}`}
              >
                &times;
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
};
