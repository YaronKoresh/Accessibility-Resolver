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

import { autoFixFocusAppearance } from "../src/rules/wcag22";

beforeAll((): void => {
  const dom: JSDOM = new JSDOM(
    "<!doctype html><html><head></head><body></body></html>",
  );
  vi.stubGlobal("window", dom.window);
  vi.stubGlobal("document", dom.window.document);
  vi.stubGlobal("ShadowRoot", dom.window.ShadowRoot);
});

afterAll((): void => {
  vi.unstubAllGlobals();
});

beforeEach((): void => {
  document.head.innerHTML = "";
  document.body.innerHTML = "<div id='host'></div><button id='main'>m</button>";
});

const buildShadowButton = (): { root: ShadowRoot; button: HTMLElement } => {
  const root: ShadowRoot = document
    .getElementById("host")!
    .attachShadow({ mode: "open" });
  root.innerHTML = "<button id='inner'>s</button>";
  return { root, button: root.getElementById("inner")! };
};

describe("autoFixFocusAppearance and shadow roots", (): void => {
  it("adds the focus style inside the shadow root of the element", (): void => {
    const { root, button } = buildShadowButton();
    expect(autoFixFocusAppearance(button)).toBe(true);
    expect(button.getAttribute("data-ar-focus-fix")).toBe("true");
    expect(root.querySelectorAll("style#ar-focus-appearance-fix")).toHaveLength(
      1,
    );
  });

  it("does not add a second style to the same shadow root", (): void => {
    const { root, button } = buildShadowButton();
    const other: HTMLElement = document.createElement("button");
    root.appendChild(other);
    autoFixFocusAppearance(button);
    autoFixFocusAppearance(other);
    expect(root.querySelectorAll("style#ar-focus-appearance-fix")).toHaveLength(
      1,
    );
  });

  it("does not touch the main document for an element inside a shadow root", (): void => {
    const { button } = buildShadowButton();
    autoFixFocusAppearance(button);
    expect(document.getElementById("ar-focus-appearance-fix")).toBeNull();
  });

  it("still adds the style to the main document for a normal element", (): void => {
    autoFixFocusAppearance(document.getElementById("main")!);
    expect(document.querySelectorAll("#ar-focus-appearance-fix")).toHaveLength(
      1,
    );
  });
});
