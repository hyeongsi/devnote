import assert from 'node:assert/strict';
import { normalizeCodeFenceLanguage, normalizePostMarkdown } from '../src/features/post/postMarkdown.ts';

const malformedList =
  '* **蹂댁븞 臾몄젣**: 誘쇨컧???뺣낫媛 ?몄텧?⑸땲?? * **?좎뿰??遺議?*: ?섍꼍蹂??ㅼ젙??諛붽씀湲??대졄?듬땲?? * **諛고룷???대젮?**: ?ㅼ떆 鍮뚮뱶?댁빞 ?⑸땲??';

assert.equal(
  normalizePostMarkdown(malformedList),
  [
    '* **蹂댁븞 臾몄젣**: 誘쇨컧???뺣낫媛 ?몄텧?⑸땲??',
    '* **?좎뿰??遺議?*: ?섍꼍蹂??ㅼ젙??諛붽씀湲??대졄?듬땲??',
    '* **諛고룷???대젮?**: ?ㅼ떆 鍮뚮뱶?댁빞 ?⑸땲??',
  ].join('\n'),
);

assert.equal(
  normalizePostMarkdown('蹂몃Ц?낅땲?? ### 3.1. ?섍꼍蹂?섎?? ?ㅼ쓬 ?ㅻ챸?낅땲??'),
  ['蹂몃Ц?낅땲??', '', '### 3.1. ?섍꼍蹂?섎??', '?ㅼ쓬 ?ㅻ챸?낅땲??'].join('\n'),
);

assert.equal(
  normalizePostMarkdown('```java\nString value = "* **洹몃?濡?*";\n```'),
  '```java\nString value = "* **洹몃?濡?*";\n```',
);

assert.equal(normalizeCodeFenceLanguage('NGINX'), 'nginx');
assert.equal(normalizeCodeFenceLanguage('nginx conf'), 'nginx');
assert.equal(normalizeCodeFenceLanguage('your-app.conf'), 'nginx');
assert.equal(normalizeCodeFenceLanguage('shell'), 'bash');
assert.equal(normalizeCodeFenceLanguage('terminal'), 'bash');
assert.equal(normalizeCodeFenceLanguage('yml'), 'yaml');
assert.equal(normalizeCodeFenceLanguage('typescript jsx'), 'tsx');
assert.equal(normalizeCodeFenceLanguage('unknown-language'), 'plaintext');

assert.equal(
  normalizePostMarkdown('```NGINX\nserver { listen 80; }\n```'),
  '```nginx\nserver { listen 80; }\n```',
);

assert.equal(
  normalizePostMarkdown('```terminal\nsudo systemctl status nginx\n```'),
  '```bash\nsudo systemctl status nginx\n```',
);
