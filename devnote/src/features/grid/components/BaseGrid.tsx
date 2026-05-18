import type { ReactNode } from 'react';

import type { GridColumn } from '../types/gridTypes';
import { GridEmptyState } from './GridEmptyState';

interface BaseGridProps<TRow> {
  columns: GridColumn<TRow>[];
  rowData: TRow[];
  emptyState?: ReactNode;
  className?: string;
}

export function BaseGrid<TRow>({
  columns,
  rowData,
  emptyState,
  className,
}: BaseGridProps<TRow>) {
  if (rowData.length === 0) {
    return <>{emptyState ?? <GridEmptyState />}</>;
  }

  return (
    <div className={className}>
      <div className="overflow-x-auto rounded-[22px] border border-line">
        <table className="min-w-full border-separate border-spacing-0 text-left">
          <thead className="bg-[#fbfbff] text-sm font-bold text-gray-500">
            <tr>
              {columns.map((column) => (
                <th key={column.id} className="border-b border-line px-4 py-3">
                  {column.headerName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white text-sm text-gray-700">
            {rowData.map((row, rowIndex) => (
              <tr key={rowIndex} className="even:bg-[#fdfdff]">
                {columns.map((column) => {
                  if (column.kind === 'action') {
                    return (
                      <td key={column.id} className="border-b border-line px-4 py-4 align-middle">
                        {column.render({
                          row,
                          value: undefined,
                        })}
                      </td>
                    );
                  }

                  const value = row[column.field];
                  const rendered = column.render?.({
                    row,
                    value,
                  });

                  return (
                    <td key={column.id} className="border-b border-line px-4 py-4 align-middle">
                      {rendered ?? column.formatter?.(value, row) ?? String(value ?? '')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
