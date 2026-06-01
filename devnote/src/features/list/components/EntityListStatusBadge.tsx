import type { EntityRowState } from '../types/entityListTypes';
import { entityListStatePresentation } from '../utils/entityListPresentation';

interface EntityListStatusBadgeProps {
  state: EntityRowState;
}

export function EntityListStatusBadge({ state }: EntityListStatusBadgeProps) {
  const presentation = entityListStatePresentation[state];

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ring-1 ${presentation.badgeClassName}`}
    >
      {presentation.label}
    </span>
  );
}
