import type { PaginationItem } from '../../hooks/usePagination';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  items: PaginationItem[];
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  items,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-3 pt-3 text-sm font-bold">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-2 text-gray-600 transition hover:text-primary disabled:cursor-not-allowed disabled:text-gray-300"
      >
        &lt;
      </button>
      {items.map((item, index) =>
        item === '...' ? (
          <span key={`ellipsis-${index}`} className="px-1 text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            className={`grid h-9 w-9 place-items-center rounded-xl transition ${
              item === currentPage
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-primary-soft hover:text-primary'
            }`}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-2 text-gray-600 transition hover:text-primary disabled:cursor-not-allowed disabled:text-gray-300"
      >
        &gt;
      </button>
    </div>
  );
}
