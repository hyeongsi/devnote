import { useMemo, useState } from 'react';

import type { GridManagedRow } from '../types/gridTypes';
import { createManagedGridRow } from '../utils/rowState';

export function useGridState<TRow>(items: TRow[]) {
  const [rows, setRows] = useState<GridManagedRow<TRow>[]>(() =>
    items.map((item) => createManagedGridRow(item)),
  );

  const hasChanges = useMemo(
    () => rows.some((row) => row.state !== 'clean'),
    [rows],
  );

  function reset(nextItems: TRow[]) {
    setRows(nextItems.map((item) => createManagedGridRow(item)));
  }

  return {
    rows,
    setRows,
    hasChanges,
    reset,
  };
}
