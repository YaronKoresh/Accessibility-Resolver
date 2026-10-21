import { JSDOM } from "jsdom";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { AccessibilityScanner, type ScanReport } from "../src/core/scanner";
import { autoFixWCAG22Results, runWCAG22Checks } from "../src/rules/wcag22";

beforeAll((): void => {
  const dom: JSDOM = new JSDOM(
    "<!doctype html><html><head></head><body></body></html>",
  );
  vi.stubGlobal("window", dom.window);
  vi.stubGlobal("document", dom.window.document);
  vi.stubGlobal("MutationObserver", dom.window.MutationObserver);
  vi.stubGlobal("CSS", { escape: (value: string): string => value });
  vi.stubGlobal("Document", dom.window.Document);
  vi.stubGlobal("ShadowRoot", dom.window.ShadowRoot);
  vi.stubGlobal("HTMLElement", dom.window.HTMLElement);
  vi.stubGlobal("Element", dom.window.Element);
  vi.stubGlobal("Node", dom.window.Node);
});

afterAll((): void => {
  vi.unstubAllGlobals();
});

const buildPage = (): HTMLButtonElement => {
  document.head.innerHTML = "";
  document.body.innerHTML = '<button id="small-button">Go</button>';
  return document.getElementById("small-button") as HTMLButtonElement;
};

describe("AccessibilityScanner autoFix option", () => {
  let button: HTMLButtonElement;

  beforeEach((): void => {
    button = buildPage();
  });

  afterEach((): void => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  });

  it("fixes failing target size and focus checks when autoFix is true", async (): Promise<void> => {
    const scanner: AccessibilityScanner = new AccessibilityScanner({
      autoFix: true,
      logResults: false,
    });
    const report: ScanReport = await scanner.scan();

    expect(report.totalIssues).toBe(2);
    expect(report.autoFixedCount).toBe(2);
    expect(report.unresolvedCount).toBe(0);
    expect(button.style.minWidth).toBe("24px");
    expect(button.style.minHeight).toBe("24px");
    expect(button.getAttribute("data-ar-focus-fix")).toBe("true");
    expect(document.getElementById("ar-focus-appearance-fix")).not.toBeNull();
  });

  it("only reports and changes nothing when autoFix is false", async (): Promise<void> => {
    const scanner: AccessibilityScanner = new AccessibilityScanner({
      autoFix: false,
      logResults: false,
    });
    const report: ScanReport = await scanner.scan();

    expect(report.totalIssues).toBe(2);
    expect(report.autoFixedCount).toBe(0);
    expect(report.unresolvedCount).toBe(2);
    expect(button.getAttribute("style")).toBeNull();
    expect(button.hasAttribute("data-ar-focus-fix")).toBe(false);
    expect(document.getElementById("ar-focus-appearance-fix")).toBeNull();
  });

  it("autoFixWCAG22Results marks only the fixed results", (): void => {
    const results = runWCAG22Checks(document, false);
    const failedBefore: number = results.filter(
      (r): boolean => !r.passed,
    ).length;

    autoFixWCAG22Results(results);

    expect(failedBefore).toBe(2);
    expect(results.filter((r): boolean => r.isAutofixed === true)).toHaveLength(
      2,
    );
  });
});
