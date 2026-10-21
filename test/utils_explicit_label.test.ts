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

import { hasAccessibleNameForElement, hasExplicitLabel } from "../src/utils";

beforeAll((): void => {
  const dom: JSDOM = new JSDOM("<!doctype html><html><body></body></html>");
  vi.stubGlobal("window", dom.window);
  vi.stubGlobal("document", dom.window.document);
});

afterAll((): void => {
  vi.unstubAllGlobals();
});

beforeEach((): void => {
  document.body.innerHTML = "";
});

describe("hasExplicitLabel with special characters in the id", (): void => {
  it("finds the label of an input whose id contains a double quote", (): void => {
    document.body.innerHTML = "<input id='a\"b'><label for='a\"b'>Name</label>";
    const input: Element = document.querySelector("input")!;
    expect(hasExplicitLabel(input)).toBe(true);
  });

  it("finds the label of an input whose id contains a closing bracket", (): void => {
    document.body.innerHTML = '<input id="a]b"><label for="a]b">Name</label>';
    const input: Element = document.querySelector("input")!;
    expect(hasExplicitLabel(input)).toBe(true);
  });

  it("finds the label of an input whose id contains a backslash", (): void => {
    document.body.innerHTML = '<input id="a\\b"><label for="a\\b">Name</label>';
    const input: Element = document.querySelector("input")!;
    expect(hasExplicitLabel(input)).toBe(true);
  });

  it("returns false when no label points at the id", (): void => {
    document.body.innerHTML =
      "<input id='a\"b'><label for='other'>Name</label>";
    const input: Element = document.querySelector("input")!;
    expect(hasExplicitLabel(input)).toBe(false);
  });

  it("does not throw from hasAccessibleNameForElement for such an id", (): void => {
    document.body.innerHTML = "<input id='a\"b'><label for='a\"b'>Name</label>";
    const input: Element = document.querySelector("input")!;
    expect(hasAccessibleNameForElement(input)).toBe(true);
  });

  it("finds a label inside the same shadow root", (): void => {
    document.body.innerHTML = "<div id='host'></div>";
    const host: Element = document.getElementById("host")!;
    const shadow: ShadowRoot = host.attachShadow({ mode: "open" });
    shadow.innerHTML = "<input id='f'><label for='f'>Name</label>";
    const input: Element = shadow.querySelector("input")!;
    expect(hasExplicitLabel(input)).toBe(true);
  });
});
