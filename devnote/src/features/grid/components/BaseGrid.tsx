import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type GetRowIdParams,
  type GridReadyEvent,
  type RowClassParams,
  type RowClassRules,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import '../grid.css';

ModuleRegistry.registerModules([AllCommunityModule]);

interface BaseGridProps<TRow> {
  columnDefs: ColDef<TRow>[];
  rowData: TRow[];
  className?: string;
  gridHeight?: number;
  loading?: boolean;
  defaultColDef?: ColDef<TRow>;
  rowClassRules?: RowClassRules<TRow>;
  getRowClass?: (params: RowClassParams<TRow>) => string | string[] | undefined;
  getRowId?: (params: GetRowIdParams<TRow>) => string;
  onGridReady?: (event: GridReadyEvent<TRow>) => void;
}

export function BaseGrid<TRow>({
  columnDefs,
  rowData,
  className,
  gridHeight = 460,
  loading = false,
  defaultColDef,
  rowClassRules,
  getRowClass,
  getRowId,
  onGridReady,
}: BaseGridProps<TRow>) {
  return (
    <div className={className}>
      <div className="ag-theme-quartz grid-platform-theme overflow-hidden rounded-2xl border border-line bg-white shadow-[0_10px_30px_rgba(17,24,39,0.04)]">
        <div style={{ height: gridHeight }}>
          <AgGridReact<TRow>
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={{
              resizable: true,
              sortable: true,
              flex: 1,
              minWidth: 120,
              suppressMovable: true,
              ...defaultColDef,
            }}
            loading={loading}
            rowClassRules={rowClassRules}
            getRowClass={getRowClass}
            getRowId={getRowId}
            onGridReady={onGridReady}
            animateRows
            stopEditingWhenCellsLoseFocus
            singleClickEdit
            suppressRowClickSelection
            overlayNoRowsTemplate='<span class="grid-platform-empty">No rows available.</span>'
          />
        </div>
      </div>
    </div>
  );
}
