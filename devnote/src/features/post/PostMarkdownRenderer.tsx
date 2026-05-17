import { parsePostMarkdown } from './postMarkdown';

export function PostMarkdownRenderer({ markdown }: { markdown: string }) {
  const blocks = parsePostMarkdown(markdown);

  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <section key={`${block.id}-${index}`} id={block.id} className="mt-10 scroll-mt-24">
              <h2 className="mb-4 text-2xl font-extrabold text-gray-950">{block.text}</h2>
            </section>
          );
        }

        if (block.type === 'paragraph') {
          return (
            <div key={`paragraph-${index}`} className="mt-4 text-[17px] leading-9 text-gray-600">
              <p>{renderInlineCode(block.text)}</p>
            </div>
          );
        }

        if (block.type === 'blockquote') {
          return (
            <div
              key={`quote-${index}`}
              className="mt-6 rounded-2xl border-l-4 border-primary bg-[#f8f7ff] p-6 text-[16px] leading-8 text-gray-600"
            >
              {renderInlineCode(block.text)}
            </div>
          );
        }

        if (block.type === 'list') {
          return (
            <div key={`list-${index}`} className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {block.items.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-line bg-white p-5 text-center font-bold text-gray-600"
                >
                  {renderInlineCode(item)}
                </div>
              ))}
            </div>
          );
        }

        return (
          <div key={`code-${index}`} className="mt-6 overflow-auto rounded-2xl bg-slate-950 p-6">
            {block.language ? (
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-blue-200/70">
                {block.language}
              </p>
            ) : null}
            <pre className="text-sm leading-7 text-blue-100">
              <code>{block.code}</code>
            </pre>
          </div>
        );
      })}
    </>
  );
}

function renderInlineCode(text: string) {
  const parts = text.split(/(`[^`]+`)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={`${part}-${index}`}
          className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.95em] text-slate-700"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}
