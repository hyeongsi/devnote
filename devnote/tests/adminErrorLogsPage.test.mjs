import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
const sidebarSource = await readFile(new URL('../src/features/admin/AdminSidebar.tsx', import.meta.url), 'utf8');
const pageSource = await readFile(new URL('../src/pages/admin/AdminErrorLogsPage.tsx', import.meta.url), 'utf8');

assert.match(appSource, /AdminErrorLogsPage/);
assert.match(appSource, /path="error-logs"/);
assert.match(sidebarSource, /\/admin\/error-logs/);
assert.match(sidebarSource, /TriangleAlert|Bug|CircleAlert/);
assert.match(pageSource, /getErrorLogs/);
assert.match(pageSource, /getErrorLogDetail/);
assert.match(pageSource, /stackTrace/);
assert.match(pageSource, /에러 로그/);
assert.match(pageSource, /상세 내역/);
