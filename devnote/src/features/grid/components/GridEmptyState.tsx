interface GridEmptyStateProps {
  title?: string;
  description?: string;
}

export function GridEmptyState({
  title = 'No rows available',
  description = 'Data will appear here when records are loaded.',
}: GridEmptyStateProps) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-[22px] border border-dashed border-line bg-[#fcfcfe] px-6 py-10 text-center">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="mt-2 max-w-md text-sm text-muted">{description}</p>
    </div>
  );
}
