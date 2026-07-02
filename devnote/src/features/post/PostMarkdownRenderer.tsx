import { Check, Copy } from 'lucide-react';
import { isValidElement, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github-dark.css';
import { normalizeCodeFenceLanguage, normalizePostMarkdown, toAnchorId } from './postMarkdown';

export function PostMarkdownRenderer({ markdown }: { markdown: string }) {
  return (
    <div className="post-markdown min-w-0 max-w-full overflow-hidden text-gray-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, [rehypeHighlight, { detect: true }]]}
        components={{
          h2: ({ children }) => (
            <h2
              id={toAnchorId(toPlainText(children))}
              className="mt-16 scroll-mt-24 border-t border-line pt-10 text-[26px] font-extrabold leading-[1.35] text-gray-950"
            >
              <span className="mb-4 block h-1 w-9 rounded-full bg-primary" />
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              id={toAnchorId(toPlainText(children))}
              className="mt-12 scroll-mt-24 text-[21px] font-extrabold leading-[1.45] text-gray-950"
            >
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4
              id={toAnchorId(toPlainText(children))}
              className="mt-10 scroll-mt-24 text-lg font-extrabold leading-[1.5] text-gray-900"
            >
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mt-5 text-[17px] leading-[1.9] text-gray-700">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-extrabold text-gray-950">{children}</strong>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className="font-semibold text-primary underline decoration-primary/30 underline-offset-4 transition hover:decoration-primary"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="mt-6 grid gap-3.5 pl-6 text-[17px] leading-[1.8] text-gray-700 marker:text-primary [&>li]:list-disc [&>li]:pl-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mt-6 grid list-decimal gap-3.5 pl-7 text-[17px] leading-[1.8] text-gray-700 marker:font-bold marker:text-primary">
              {children}
            </ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="mt-8 border-l-[3px] border-primary bg-[#f8f7ff] px-6 py-4 text-[16px] leading-8 text-gray-700 [&>p]:mt-0">
              {children}
            </blockquote>
          ),
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
          code: ({ className, children, ...props }) => {
            const isBlock = className?.includes('language-') || String(children).includes('\n');

            if (isBlock) {
              const language = normalizeCodeFenceLanguage(className?.match(/language-([^\s]+)/)?.[1]);
              return (
                <code
                  className={mergeClassNames(
                    'block min-w-0 max-w-full whitespace-pre-wrap break-words',
                    `language-${language}`,
                    className,
                  )}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <code
                className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.92em] font-semibold text-slate-700"
                {...props}
              >
                {children}
              </code>
            );
          },
          hr: () => <hr className="my-12 border-line" />,
          table: ({ children }) => (
            <div className="mt-8 overflow-x-auto border-y border-line">
              <table className="w-full border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-line bg-gray-50 px-4 py-3 font-extrabold text-gray-950">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-line px-4 py-3.5 leading-6 text-gray-700">{children}</td>
          ),
        }}
      >
        {normalizePostMarkdown(markdown)}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const code = toPlainText(children).replace(/\n$/, '');
  const language = getCodeLanguage(children);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-8 max-w-full min-w-0 overflow-hidden rounded-lg border border-slate-700 bg-[#0d1117] shadow-[0_16px_36px_rgba(15,23,42,0.16)]">
      <div className="flex h-11 items-center justify-between border-b border-white/10 bg-[#161b22] px-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
          </div>
          <span className="font-mono text-[11px] font-bold uppercase text-slate-400">
            {language}
          </span>
        </div>
        <button
          type="button"
          title="코드 복사"
          aria-label="코드 복사"
          className="grid h-8 w-8 place-items-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white"
          onClick={() => void handleCopy()}
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <pre className="max-w-full overflow-x-hidden whitespace-pre-wrap break-words p-5 font-mono text-[14px] leading-7 md:p-6">
        {children}
      </pre>
    </div>
  );
}

function getCodeLanguage(children: ReactNode): string {
  if (Array.isArray(children)) {
    return children.map(getCodeLanguage).find((language) => language !== 'code') ?? 'code';
  }
  if (isValidElement<{ className?: string }>(children)) {
    return children.props.className?.match(/language-([\w-]+)/)?.[1] ?? 'code';
  }
  return 'code';
}

function toPlainText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(toPlainText).join('');
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return toPlainText(node.props.children);
  }
  return '';
}

function mergeClassNames(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(' ');
}
