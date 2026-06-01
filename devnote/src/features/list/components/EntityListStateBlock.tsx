interface EntityListStateBlockProps {
  tone: 'loading' | 'error';
  children: string;
}

const toneClassName: Record<EntityListStateBlockProps['tone'], string> = {
  loading: 'border-line bg-white text-muted',
  error: 'border-red-200 bg-red-50 text-red-600',
};

export function EntityListStateBlock({ tone, children }: EntityListStateBlockProps) {
  return (
    <section
      className={`rounded-[24px] border px-6 py-12 text-center text-sm font-medium shadow-[0_18px_50px_rgba(17,24,39,0.045)] ${toneClassName[tone]}`}
    >
      {children}
    </section>
  );
}
