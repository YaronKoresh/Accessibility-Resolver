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
});

afterAll((): void => {
  vi.unstubAllGlobals();
});

beforeEach((): void => {
  document.body.innerHTML =
    "<div><button id='t'>a</button><button id='n'>b</button><button id='f'>c</button></div>";
});

const place = (
  id: string,
  left: number,
  top: number,
  width: number,
  height: number,
): void => {
  const el: HTMLElement = document.getElementById(id)!;
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

describe("checkTargetSize spacing", (): void => {
  it("fails a small target that touches a neighbour even when another is far", (): void => {
    place("t", 0, 0, 10, 10);
    place("n", 10, 0, 10, 10);
    place("f", 200, 0, 10, 10);
    const result = checkTargetSize(document.getElementById("t")!);
    expect(result.passed).toBe(false);
    expect(result.measurements?.spacing).toBe(0);
  });

  it("fails a small target that overlaps a neighbour", (): void => {
    place("t", 0, 0, 10, 10);
    place("n", 5, 5, 10, 10);
    place("f", 200, 0, 10, 10);
    const result = checkTargetSize(document.getElementById("t")!);
    expect(result.passed).toBe(false);
    expect(result.measurements?.spacing).toBe(0);
  });

  it("passes a small target whose nearest neighbours are far enough", (): void => {
    place("t", 0, 0, 10, 10);
    place("n", 100, 0, 10, 10);
    place("f", 200, 0, 10, 10);
    const result = checkTargetSize(document.getElementById("t")!);
    expect(result.passed).toBe(true);
    expect(result.measurements?.spacing).toBe(90);
  });

  it("measures a diagonal neighbour by its real distance", (): void => {
    place("t", 0, 0, 10, 10);
    place("n", 13, 14, 10, 10);
    place("f", 400, 400, 10, 10);
    const result = checkTargetSize(document.getElementById("t")!);
    expect(result.measurements?.spacing).toBe(5);
  });
});

describe("checkTargetSize neighbours outside the parent", (): void => {
  it("passes a small target that has no neighbours at all", (): void => {
    document.body.innerHTML = "<div><button id='t'>a</button></div>";
    place("t", 0, 0, 10, 10);
    const result = checkTargetSize(document.getElementById("t")!);
    expect(result.passed).toBe(true);
    expect(result.measurements?.spacing).toBeGreaterThanOrEqual(24);
  });

  it("measures a neighbour that lives in another parent", (): void => {
    document.body.innerHTML =
      "<div><button id='t'>a</button></div><div><button id='n'>b</button></div>";
    place("t", 0, 0, 10, 10);
    place("n", 18, 0, 10, 10);
    const result = checkTargetSize(document.getElementById("t")!);
    expect(result.measurements?.spacing).toBe(8);
    expect(result.passed).toBe(true);
  });

  it("fails a small target touching a neighbour in another parent", (): void => {
    document.body.innerHTML =
      "<div><button id='t'>a</button></div><div><button id='n'>b</button></div>";
    place("t", 0, 0, 10, 10);
    place("n", 10, 0, 10, 10);
    const result = checkTargetSize(document.getElementById("t")!);
    expect(result.passed).toBe(false);
    expect(result.measurements?.spacing).toBe(0);
  });
});
