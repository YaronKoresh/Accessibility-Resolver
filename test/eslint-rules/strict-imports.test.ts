import { createRequire } from "node:module";

import { RuleTester } from "eslint";
import { describe, test } from "vitest";

const require = createRequire(import.meta.url);
const rule = require("../../tools/eslint-local-rules/rules/strict-imports.cjs");

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

const wideImport = [
  "import {",
  "  getContrastRatioBetweenColors,",
  "  getEffectiveBackgroundColorOfElement,",
  "  parseCssColorString,",
  '} from "../utils";',
].join("\n");

describe("strict-imports rule", () => {
  test("wraps named imports that would exceed 80 columns", () => {
    ruleTester.run("strict-imports", rule, {
      valid: [{ code: wideImport }],
      invalid: [
        {
          code: 'import { parseCssColorString, getEffectiveBackgroundColorOfElement, getContrastRatioBetweenColors } from "../utils";',
          output: wideImport,
          errors: [{ message: /Imports must be strictly sorted/ }],
        },
      ],
    });
  });

  test("keeps short named imports on one line", () => {
    ruleTester.run("strict-imports", rule, {
      valid: [{ code: 'import { a, b } from "../utils";' }],
      invalid: [],
    });
  });

  test("keeps imports of many short names on one line like prettier", () => {
    ruleTester.run("strict-imports", rule, {
      valid: [
        {
          code: 'import { afterAll, beforeAll, describe, expect, it } from "vitest";',
        },
        {
          code: 'import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";',
        },
      ],
      invalid: [
        {
          code: 'import {\n  afterAll,\n  beforeAll,\n  describe,\n  expect,\n  it,\n} from "vitest";',
          output:
            'import { afterAll, beforeAll, describe, expect, it } from "vitest";',
          errors: [{ message: /Imports must be strictly sorted/ }],
        },
      ],
    });
  });
});
