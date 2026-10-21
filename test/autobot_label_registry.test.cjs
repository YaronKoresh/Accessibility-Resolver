const assert = require("node:assert/strict");
const { test } = require("./javascript_test_harness.cjs");
const { AutobotLabelRegistry } = require("../.github/scripts/autobot/labels/registry.cjs");

test("label name normalization builds the alias table once instead of on every call", () => {
  AutobotLabelRegistry.normalizeLabelName("bug");
  const originalFromEntries = Object.fromEntries;
  let fromEntriesCalls = 0;
  Object.fromEntries = function countedFromEntries(...args) {
    fromEntriesCalls += 1;
    return originalFromEntries.apply(this, args);
  };
  try {
    for (let index = 0; index < 50; index += 1) {
      AutobotLabelRegistry.normalizeLabelName("Bug");
    }
  } finally {
    Object.fromEntries = originalFromEntries;
  }
  assert.equal(fromEntriesCalls, 0);
});

test("label name normalization keeps resolving spelling variants and unknown labels", () => {
  const definitions = Object.keys(AutobotLabelRegistry.LABEL_DEFINITIONS);
  const hyphenated = definitions.find((label) => label.includes("-"));
  assert.ok(hyphenated);
  assert.equal(AutobotLabelRegistry.normalizeLabelName(hyphenated.replace(/-/g, " ")), hyphenated);
  assert.equal(AutobotLabelRegistry.normalizeLabelName(hyphenated.replace(/-/g, "_").toUpperCase()), hyphenated);
  assert.equal(AutobotLabelRegistry.normalizeLabelName("  Bug  "), "bug");
  assert.equal(AutobotLabelRegistry.normalizeLabelName("not-a-known-label"), "not-a-known-label");
  assert.equal(AutobotLabelRegistry.normalizeLabelName(null), "");
});
