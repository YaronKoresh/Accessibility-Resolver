import crypto from "node:crypto";

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
  test,
} from "vitest";

const testGlobals = globalThis as typeof globalThis & {
  __vitestCjsBridge__?: {
    afterAll: typeof afterAll;
    afterEach: typeof afterEach;
    beforeAll: typeof beforeAll;
    beforeEach: typeof beforeEach;
    describe: typeof describe;
    it: typeof it;
    test: typeof test;
  };
  crypto?: typeof crypto;
};

if (!globalThis.crypto) {
  (globalThis as any).crypto = crypto;
}

testGlobals.__vitestCjsBridge__ = {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
  test,
};
