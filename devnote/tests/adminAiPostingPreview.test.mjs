import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sourcePath = new URL('../src/pages/admin/AdminAiPostingPage.tsx', import.meta.url);
const source = await readFile(sourcePath, 'utf8');

assert.match(source, /PostMarkdownRenderer/);
assert.match(source, /isPreviewMode/);
assert.match(source, /미리보기|Preview/);
