import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
const requireAdminSource = await readFile(
  new URL('../src/components/auth/RequireAdmin.tsx', import.meta.url),
  'utf8',
);

assert.match(
  appSource,
  /<Route path="\/admin" element={<RequireAdmin \/>}>[\s\S]*?<Route element={<AdminShell \/>}>/,
);
assert.match(appSource, /<Route path="ai-posting" element={<AdminAiPostingPage \/>} \/>/);
assert.match(appSource, /<Route path="error-logs" element={<AdminErrorLogsPage \/>} \/>/);
assert.match(appSource, /<Route path="error-logs\/:id" element={<AdminErrorLogDetailPage \/>} \/>/);
assert.match(appSource, /<Route path="menus" element={<AdminMenusPage \/>} \/>/);
assert.match(appSource, /<Route path="categories" element={<AdminCategoriesPage \/>} \/>/);

assert.match(requireAdminSource, /buildLoginRedirectPath\(location\.pathname, location\.search, location\.hash\)/);
assert.match(requireAdminSource, /window\.addEventListener\(AUTH_REQUIRED_EVENT, handleAuthRequired\)/);
