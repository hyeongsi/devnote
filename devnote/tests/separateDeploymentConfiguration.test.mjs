import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const apiDirectory = new URL('../src/api/', import.meta.url);
const apiFiles = (await readdir(apiDirectory)).filter((name) => name.endsWith('.ts'));
const apiSources = await Promise.all(
  apiFiles.map((name) => readFile(new URL(name, apiDirectory), 'utf8')),
);

for (const source of apiSources) {
  assert.doesNotMatch(source, /https?:\/\/(localhost|127\.0\.0\.1):8080/);
}

const viteConfig = await readFile(new URL('../vite.config.ts', import.meta.url), 'utf8');
assert.match(viteConfig, /['"]\/api['"]\s*:\s*\{/);
assert.match(viteConfig, /target:\s*['"]http:\/\/localhost:8080['"]/);

const productionProperties = await readFile(
  new URL('../../devnote-webapp/src/main/resources/application-prod.properties', import.meta.url),
  'utf8',
);
assert.match(productionProperties, /server\.forward-headers-strategy=framework/);
assert.match(productionProperties, /server\.address=\$\{SERVER_ADDRESS:127\.0\.0\.1\}/);
assert.match(productionProperties, /server\.servlet\.session\.cookie\.secure=true/);

const nginxConfig = await readFile(
  new URL('../../deploy/nginx/devnote.conf.example', import.meta.url),
  'utf8',
);
assert.match(nginxConfig, /try_files \$uri \$uri\/ \/index\.html;/);
assert.match(nginxConfig, /location \/api\/ \{/);
assert.match(nginxConfig, /proxy_pass http:\/\/127\.0\.0\.1:8080;/);
