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

import { checkTargetSize } from "../src/rules/wcag22";

beforeAll((): void => {
  const dom: JSDOM = new JSDOM("<!doctype html><html><body></body></html>");
  vi.stubGlobal("window", dom.window);
  vi.stubGlobal("document", dom.window.document);
  vi.stubGlobal("ShadowRoot", dom.window.ShadowRoot);
});

afterAll((): void => {
  vi.unstubAllGlobals();
});

beforeEach((): void => {
  document.body.innerHTML = "";
});

const place = (
  el: HTMLElement,
  left: number,
  top: number,
  width: number,
  height: number,
): void => {
  el.getBoundingClientRect = (): DOMRect =>
    ({
      left,
      top,
      right: left + width,
      bottom: top + height,
      width,
      height,
      x: left,
      y: top,
    }) as DOMRect;
};

describe("checkTargetSize ignores neighbours that are not rendered", (): void => {
  it("passes a small target near the origin when the only neighbour is display none", (): void => {
    document.body.innerHTML =
      "<button id='t'>a</button><button id='h' style='display:none'>b</button>";
    place(document.getElementById("t")!, 3, 3, 10, 10);
    const result = checkTargetSize(document.getElementById("t")!);
    expect(result.measurements?.spacing).toBe(24);
    expect(result.passed).toBe(true);
  });

  it("ignores a neighbour inside a display none container", (): void => {
    document.body.innerHTML =
      "<button id='t'>a</button><div style='display:none'><button id='h'>b</button></div>";
    place(document.getElementById("t")!, 3, 3, 10, 10);
    const result = checkTargetSize(document.getElementById("t")!);
    expect(result.passed).toBe(true);
  });

  it("ignores a neighbour with visibility hidden", (): void => {
    document.body.innerHTML =
      "<button id='t'>a</button><button id='h' style='visibility:hidden'>b</button>";
    place(document.getElementById("t")!, 0, 0, 10, 10);
    place(document.getElementById("h")!, 10, 0, 10, 10);
    const result = checkTargetSize(document.getElementById("t")!);
    expect(result.passed).toBe(true);
  });

  it("still counts a rendered touching neighbour", (): void => {
    document.body.innerHTML =
      "<button id='t'>a</button><button id='n'>b</button>";
    place(document.getElementById("t")!, 0, 0, 10, 10);
    place(document.getElementById("n")!, 10, 0, 10, 10);
    const result = checkTargetSize(document.getElementById("t")!);
    expect(result.passed).toBe(false);
    expect(result.measurements?.spacing).toBe(0);
  });
});
