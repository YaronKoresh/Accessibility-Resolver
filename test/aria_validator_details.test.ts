import { JSDOM } from "jsdom";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  type ARIAValidationResult,
  repairARIAReference,
  validateARIAReference,
} from "../src/core/aria-validator";

beforeAll((): void => {
  const dom: JSDOM = new JSDOM("<!doctype html><html><body></body></html>");
  vi.stubGlobal("window", dom.window);
  vi.stubGlobal("document", dom.window.document);
  vi.stubGlobal("CSS", { escape: (value: string): string => value });
  vi.stubGlobal("ShadowRoot", dom.window.ShadowRoot);
});

afterAll((): void => {
  vi.unstubAllGlobals();
});

beforeEach((): void => {
  document.body.innerHTML =
    "<p id='a'>A</p><p id='b'>B</p><div id='d' aria-details='a b'></div>";
});

describe("aria-details holds a list of ids", (): void => {
  it("accepts two existing ids", (): void => {
    const d: Element = document.getElementById("d")!;
    const result: ARIAValidationResult = validateARIAReference(
      d,
      "aria-details",
    );
    expect(result.isValid).toBe(true);
    expect(result.foundIds).toEqual(["a", "b"]);
    expect(result.missingIds).toEqual([]);
  });

  it("keeps a valid list when repairing", (): void => {
    const d: Element = document.getElementById("d")!;
    expect(repairARIAReference(d, "aria-details")).toBe("a b");
    expect(d.getAttribute("aria-details")).toBe("a b");
  });

  it("drops only the missing id when repairing", (): void => {
    const d: Element = document.getElementById("d")!;
    d.setAttribute("aria-details", "a gone b");
    expect(repairARIAReference(d, "aria-details")).toBe("a b");
    expect(d.getAttribute("aria-details")).toBe("a b");
  });

  it("still treats aria-activedescendant as one id", (): void => {
    const d: Element = document.getElementById("d")!;
    d.setAttribute("aria-activedescendant", "a b");
    const result: ARIAValidationResult = validateARIAReference(
      d,
      "aria-activedescendant",
    );
    expect(result.isValid).toBe(false);
    expect(result.missingIds).toEqual(["a b"]);
  });
});
