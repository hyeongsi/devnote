import type { EntityRowState } from '../types/entityListTypes';

interface EntityListStatePresentation {
  label: string;
  badgeClassName: string;
  rowClassName: string;
}

export const entityListStatePresentation: Record<EntityRowState, EntityListStatePresentation> = {
  clean: {
    label: '저장됨',
    badgeClassName: 'bg-gray-50 text-gray-500 ring-gray-100',
    rowClassName: 'bg-white',
  },
  added: {
    label: '추가됨',
    badgeClassName: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    rowClassName: 'bg-emerald-50/50',
  },
  modified: {
    label: '수정됨',
    badgeClassName: 'bg-amber-50 text-amber-700 ring-amber-100',
    rowClassName: 'bg-amber-50/50',
  },
  deleted: {
    label: '삭제 예정',
    badgeClassName: 'bg-red-50 text-red-700 ring-red-100',
    rowClassName: 'bg-red-50/60 text-gray-400',
  },
};
