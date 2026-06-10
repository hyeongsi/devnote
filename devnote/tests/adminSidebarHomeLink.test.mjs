import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sidebarSource = await readFile(
  new URL('../src/features/admin/AdminSidebar.tsx', import.meta.url),
  'utf8',
);

assert.match(sidebarSource, /import \{ Link, NavLink \} from 'react-router-dom';/);
assert.match(
  sidebarSource,
  /<Link[\s\S]*?to="\/"[\s\S]*?aria-label="DevNote 메인으로 이동"[\s\S]*?DevNote[\s\S]*?Admin[\s\S]*?<\/Link>/,
);
