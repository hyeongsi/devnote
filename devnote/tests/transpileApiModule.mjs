import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

const compilerOptions = {
  module: ts.ModuleKind.ES2022,
  target: ts.ScriptTarget.ES2022,
  verbatimModuleSyntax: true,
};

export async function transpileApiModule(sourceUrl, outputPrefix) {
  const outputDir = join(tmpdir(), `devnote-${outputPrefix}-tests-${Date.now()}`);
  const outputPath = join(outputDir, `${outputPrefix}.mjs`);

  await mkdir(outputDir, { recursive: true });
  await Promise.all([
    writeTranspiledModule(sourceUrl, outputPath),
    writeApiDependency('../src/api/http.ts', join(outputDir, 'http')),
    writeApiDependency('../src/api/menuMapping.ts', join(outputDir, 'menuMapping')),
  ]);

  return outputPath;
}

async function writeApiDependency(relativePath, outputPath) {
  await writeTranspiledModule(new URL(relativePath, import.meta.url), outputPath);
}

async function writeTranspiledModule(sourceUrl, outputPath) {
  const source = await readFile(sourceUrl, 'utf8');
  const transpiled = ts.transpileModule(source, { compilerOptions });
  await writeFile(outputPath, transpiled.outputText, 'utf8');
}
