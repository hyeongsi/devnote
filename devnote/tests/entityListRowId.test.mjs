import assert from 'node:assert/strict';

import { createEntityListRowId } from '../src/features/list/utils/entityListUtils.ts';

const cryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');

try {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: {},
  });

  const firstId = createEntityListRowId();
  const secondId = createEntityListRowId();

  assert.match(firstId, /^entity-row-[a-z0-9-]+$/);
  assert.notEqual(firstId, secondId);
} finally {
  if (cryptoDescriptor) {
    Object.defineProperty(globalThis, 'crypto', cryptoDescriptor);
  } else {
    delete globalThis.crypto;
  }
}
