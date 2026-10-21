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

beforeEach((): void => {
  document.body.innerHTML = "<p>text</p>";
});

afterEach((): void => {
  document.body.innerHTML = "";
});

const waitFor = (ms: number): Promise<void> =>
  new Promise((resolve: () => void): void => {
    setTimeout(resolve, ms);
  });

describe("scanner mutation observer", (): void => {
  it("does not rescan after the observer is disconnected", async (): Promise<void> => {
    const scanner: AccessibilityScanner = new AccessibilityScanner({
      autoFix: false,
      logResults: false,
      mutationDebounceMs: 30,
    });
    const reports: ScanReport[] = [];
    vi.spyOn(console, "warn").mockImplementation((): void => {
      void 0;
    });
    scanner.setupMutationObserver((report: ScanReport): void => {
      reports.push(report);
    });
    document.body.appendChild(document.createElement("div"));
    await waitFor(5);
    scanner.disconnectMutationObserver();
    await waitFor(120);
    expect(reports.length).toBe(0);
  });

  it("keeps the debounce timers of two scanners apart", async (): Promise<void> => {
    const first: AccessibilityScanner = new AccessibilityScanner({
      autoFix: false,
      logResults: false,
      mutationDebounceMs: 30,
    });
    const second: AccessibilityScanner = new AccessibilityScanner({
      autoFix: false,
      logResults: false,
      mutationDebounceMs: 30,
    });
    const firstReports: ScanReport[] = [];
    const secondReports: ScanReport[] = [];
    vi.spyOn(console, "warn").mockImplementation((): void => {
      void 0;
    });
    first.setupMutationObserver((report: ScanReport): void => {
      firstReports.push(report);
    });
    second.setupMutationObserver((report: ScanReport): void => {
      secondReports.push(report);
    });
    document.body.appendChild(document.createElement("div"));
    await waitFor(150);
    first.disconnectMutationObserver();
    second.disconnectMutationObserver();
    expect(firstReports.length).toBe(1);
    expect(secondReports.length).toBe(1);
  });

  it("still rescans once after a change when connected", async (): Promise<void> => {
    const scanner: AccessibilityScanner = new AccessibilityScanner({
      autoFix: false,
      logResults: false,
      mutationDebounceMs: 20,
    });
    const reports: ScanReport[] = [];
    vi.spyOn(console, "warn").mockImplementation((): void => {
      void 0;
    });
    scanner.setupMutationObserver((report: ScanReport): void => {
      reports.push(report);
    });
    document.body.appendChild(document.createElement("div"));
    document.body.appendChild(document.createElement("div"));
    await waitFor(120);
    scanner.disconnectMutationObserver();
    expect(reports.length).toBe(1);
  });
});
