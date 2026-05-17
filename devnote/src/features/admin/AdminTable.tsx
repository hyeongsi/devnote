import { Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface AdminTableColumn<T> {
  key: string;
  title: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface AdminTableProps<T> {
  title: string;
  description: string;
  actionLabel: string;
  rows: T[];
  columns: AdminTableColumn<T>[];
  getRowKey: (row: T) => number | string;
}

export function AdminTable<T>({
  title,
  description,
  actionLabel,
  rows,
  columns,
  getRowKey,
}: AdminTableProps<T>) {
  return (
    <section className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_rgba(17,24,39,0.05)] md:p-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gray-950">{title}</h2>
          <p className="mt-2 text-sm text-muted">{description}</p>
        </div>
        <button type="button" className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(109,93,252,0.26)]">
          + {actionLabel}
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-[22px] border border-line">
        <table className="min-w-full border-separate border-spacing-0 text-left">
          <thead className="bg-[#fbfbff] text-sm font-bold text-gray-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`border-b border-line px-4 py-3 ${column.className ?? ''}`}>
                  {column.title}
                </th>
              ))}
              <th className="border-b border-line px-4 py-3">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white text-sm text-gray-700">
            {rows.map((row) => (
              <tr key={getRowKey(row)} className="even:bg-[#fdfdff]">
                {columns.map((column) => (
                  <td key={column.key} className="border-b border-line px-4 py-4 align-middle">
                    {column.render(row)}
                  </td>
                ))}
                <td className="border-b border-line px-4 py-4">
                  <div className="flex items-center gap-3 text-gray-400">
                    <button type="button" aria-label="수정" className="transition hover:text-primary">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" aria-label="삭제" className="transition hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 rounded-2xl bg-primary-soft px-4 py-3 text-sm font-medium text-muted">
        드래그하여 항목 순서를 변경할 수 있습니다.
      </div>
    </section>
  );
}
