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

import { autoFixTargetSize } from "../src/rules/wcag22";

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
  document.body.innerHTML = "";
});

describe("autoFixTargetSize and the display of the target", (): void => {
  it("makes an inline link inline-block so the minimum size applies", (): void => {
    document.body.innerHTML = '<a id="l" href="#">x</a><button>y</button>';
    const link: HTMLElement = document.getElementById("l")!;

    expect(autoFixTargetSize(link)).toBe(true);

    expect(window.getComputedStyle(link).display).toBe("inline-block");
    expect(link.style.minWidth).toBe("24px");
    expect(link.style.minHeight).toBe("24px");
  });

  it("keeps the display of a block level target", (): void => {
    document.body.innerHTML =
      '<button id="b" style="display:block">x</button><button>y</button>';
    const button: HTMLElement = document.getElementById("b")!;

    expect(autoFixTargetSize(button)).toBe(true);

    expect(window.getComputedStyle(button).display).toBe("block");
    expect(button.style.minWidth).toBe("24px");
  });

  it("keeps an inline-flex target as it is", (): void => {
    document.body.innerHTML =
      '<span id="s" role="button" tabindex="0" style="display:inline-flex">x</span><button>y</button>';
    const target: HTMLElement = document.getElementById("s")!;

    expect(autoFixTargetSize(target)).toBe(true);

    expect(window.getComputedStyle(target).display).toBe("inline-flex");
  });
});
