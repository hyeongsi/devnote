export interface MarkdownHeading {
  id: string;
  level: 2;
  text: string;
}

export type MarkdownBlock =
  | { type: 'heading'; id: string; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'blockquote'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'code'; language: string | null; code: string };

export function parsePostMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim() || null;
      index += 1;
      const codeLines: string[] = [];

      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push({ type: 'code', language, code: codeLines.join('\n') });
      continue;
    }

    if (trimmed.startsWith('## ')) {
      const text = trimmed.slice(3).trim();
      blocks.push({ type: 'heading', id: toAnchorId(text), text });
      index += 1;
      continue;
    }

    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = [];

      while (index < lines.length && lines[index].trim().startsWith('> ')) {
        quoteLines.push(lines[index].trim().slice(2).trim());
        index += 1;
      }

      blocks.push({ type: 'blockquote', text: quoteLines.join(' ') });
      continue;
    }

    if (trimmed.startsWith('- ')) {
      const items: string[] = [];

      while (index < lines.length && lines[index].trim().startsWith('- ')) {
        items.push(lines[index].trim().slice(2).trim());
        index += 1;
      }

      blocks.push({ type: 'list', items });
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length) {
      const nextLine = lines[index].trimEnd();
      const nextTrimmed = nextLine.trim();

      if (
        !nextTrimmed ||
        nextTrimmed.startsWith('## ') ||
        nextTrimmed.startsWith('> ') ||
        nextTrimmed.startsWith('- ') ||
        nextTrimmed.startsWith('```')
      ) {
        break;
      }

      paragraphLines.push(nextTrimmed);
      index += 1;
    }

    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') });
  }

  return blocks;
}

export function extractMarkdownHeadings(markdown: string): MarkdownHeading[] {
  return parsePostMarkdown(markdown)
    .filter((block): block is Extract<MarkdownBlock, { type: 'heading' }> => block.type === 'heading')
    .map((block) => ({
      id: block.id,
      level: 2,
      text: block.text,
    }));
}

function toAnchorId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}
