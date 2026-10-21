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

import { autoFixWCAG22Results, runWCAG22Checks } from "../src/rules/wcag22";

beforeAll((): void => {
  const dom: JSDOM = new JSDOM(
    "<!doctype html><html><head></head><body></body></html>",
  );
  vi.stubGlobal("window", dom.window);
  vi.stubGlobal("document", dom.window.document);
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
  document.head.innerHTML = "";
  document.body.innerHTML = "";
});

describe("runWCAG22Checks and hidden elements", (): void => {
  it("skips a button inside a display none container", (): void => {
    document.body.innerHTML =
      '<div style="display:none"><button id="b">Go</button></div>';
    expect(runWCAG22Checks(document, false)).toHaveLength(0);
  });

  it("skips a button several levels below a display none ancestor", (): void => {
    document.body.innerHTML =
      '<section hidden><div><p><button id="b">Go</button></p></div></section>';
    expect(runWCAG22Checks(document, false)).toHaveLength(0);
  });

  it("skips a button whose own visibility is hidden", (): void => {
    document.body.innerHTML = '<button style="visibility:hidden">Go</button>';
    expect(runWCAG22Checks(document, false)).toHaveLength(0);
  });

  it("still checks a visible button", (): void => {
    document.body.innerHTML = "<div><button>Go</button></div>";
    expect(runWCAG22Checks(document, false)).toHaveLength(2);
  });

  it("skips a button inside a shadow root whose host is display none", (): void => {
    document.body.innerHTML = '<div id="host" style="display:none"></div>';
    const host: HTMLElement = document.getElementById("host")!;
    const shadow: ShadowRoot = host.attachShadow({ mode: "open" });
    shadow.innerHTML = "<button>Go</button>";
    expect(runWCAG22Checks(document, true)).toHaveLength(0);
  });

  it("does not write a size style to a hidden button when fixing", (): void => {
    document.body.innerHTML =
      '<div style="display:none"><button id="b">Go</button></div>';
    autoFixWCAG22Results(runWCAG22Checks(document, false));
    const button: HTMLElement = document.getElementById("b")!;
    expect(button.getAttribute("style")).toBeNull();
    expect(button.hasAttribute("data-ar-focus-fix")).toBe(false);
  });
});
