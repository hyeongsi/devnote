export interface MarkdownHeading {
  id: string;
  level: number;
  text: string;
}

export type MarkdownBlock =
  | { type: 'heading'; id: string; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'blockquote'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'code'; language: string | null; code: string };

const CODE_LANGUAGE_ALIASES: Array<[RegExp, string]> = [
  [/\b(nginx)\b|\.conf$|\bconf(?:ig)?\b/, 'nginx'],
  [/\b(bash|shell|sh|zsh|terminal|console|powershell|ps1)\b/, 'bash'],
  [/\b(yaml|yml)\b/, 'yaml'],
  [/\b(json|jsonc)\b/, 'json'],
  [/\b(env|dotenv)\b|\.env$/, 'properties'],
  [/\b(properties|props)\b|\.properties$/, 'properties'],
  [/\b(xml|html|css|sql|java|kotlin|dockerfile)\b/, '$&'],
  [/\b(tsx|typescript-jsx|typescript jsx)\b/, 'tsx'],
  [/\b(javascript|js|jsx)\b/, 'javascript'],
  [/\b(typescript|ts)\b/, 'typescript'],
];

const KNOWN_CODE_LANGUAGES = new Set([
  'bash',
  'css',
  'dockerfile',
  'html',
  'java',
  'javascript',
  'json',
  'kotlin',
  'nginx',
  'plaintext',
  'properties',
  'sql',
  'tsx',
  'typescript',
  'xml',
  'yaml',
]);

export function normalizeCodeFenceLanguage(language: string | null | undefined): string {
  const normalized = (language ?? '')
    .trim()
    .toLowerCase()
    .replace(/^language-/, '')
    .replace(/[{}()[\],]/g, ' ')
    .replace(/\s+/g, ' ');

  if (!normalized) {
    return 'plaintext';
  }

  for (const [pattern, replacement] of CODE_LANGUAGE_ALIASES) {
    if (pattern.test(normalized)) {
      if (replacement === '$&') {
        const match = normalized.match(pattern)?.[1] ?? normalized.match(pattern)?.[0];
        return match ?? 'plaintext';
      }
      return replacement;
    }
  }

  return KNOWN_CODE_LANGUAGES.has(normalized) ? normalized : 'plaintext';
}

export function normalizePostMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const normalized: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      if (!inCodeBlock) {
        const indent = line.match(/^\s*/)?.[0] ?? '';
        const fence = line.trimStart();
        const language = fence.slice(3).trim();
        normalized.push(`${indent}\`\`\`${normalizeCodeFenceLanguage(language)}`);
        inCodeBlock = true;
        continue;
      }

      inCodeBlock = !inCodeBlock;
      normalized.push(line);
      continue;
    }

    if (inCodeBlock) {
      normalized.push(line);
      continue;
    }

    const withListBreaks = line.replace(
      /(\S[.!?。]|[가-힣A-Za-z0-9)])\s+(?=[*-]\s+\*\*)/g,
      '$1\n',
    );
    const withHeadingBreaks = withListBreaks.replace(
      /(\S)\s+(?=#{2,6}\s+\S)/g,
      '$1\n\n',
    ).replace(
      /(#{2,6}\s+.+?[?!。])\s+(?=\S)/g,
      '$1\n',
    );

    normalized.push(...withHeadingBreaks.split('\n'));
  }

  return normalized.join('\n');
}

export function parsePostMarkdown(markdown: string): MarkdownBlock[] {
  const lines = normalizePostMarkdown(markdown).split('\n');
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

    const headingMatch = /^(#{2,6})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      const text = headingMatch[2].trim();
      blocks.push({ type: 'heading', id: toAnchorId(text), level: headingMatch[1].length, text });
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

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];

      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, '').trim());
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
        /^#{2,6}\s+/.test(nextTrimmed) ||
        nextTrimmed.startsWith('> ') ||
        /^[-*]\s+/.test(nextTrimmed) ||
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
      level: block.level,
      text: block.text,
    }));
}

export function toAnchorId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}
