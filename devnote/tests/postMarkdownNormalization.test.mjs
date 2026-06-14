import assert from 'node:assert/strict';
import { normalizePostMarkdown } from '../src/features/post/postMarkdown.ts';

const malformedList =
  '* **보안 문제**: 민감한 정보가 노출됩니다. * **유연성 부족**: 환경별 설정을 바꾸기 어렵습니다. * **배포의 어려움**: 다시 빌드해야 합니다.';

assert.equal(
  normalizePostMarkdown(malformedList),
  [
    '* **보안 문제**: 민감한 정보가 노출됩니다.',
    '* **유연성 부족**: 환경별 설정을 바꾸기 어렵습니다.',
    '* **배포의 어려움**: 다시 빌드해야 합니다.',
  ].join('\n'),
);

assert.equal(
  normalizePostMarkdown('본문입니다. ### 3.1. 환경변수란? 다음 설명입니다.'),
  ['본문입니다.', '', '### 3.1. 환경변수란?', '다음 설명입니다.'].join('\n'),
);

assert.equal(
  normalizePostMarkdown('```java\nString value = \"* **그대로**\";\n```'),
  '```java\nString value = \"* **그대로**\";\n```',
);
