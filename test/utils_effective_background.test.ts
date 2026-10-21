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
  getEffectiveBackgroundColorOfElement,
  type RGBAColor,
} from "../src/utils";

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
  document.documentElement.removeAttribute("style");
  document.body.innerHTML = "";
});

describe("getEffectiveBackgroundColorOfElement", (): void => {
  it("uses an opaque background set on the html element", (): void => {
    document.documentElement.style.backgroundColor = "rgb(0, 0, 0)";
    document.body.innerHTML = "<p id='p'>x</p>";
    const color: RGBAColor = getEffectiveBackgroundColorOfElement(
      document.getElementById("p")!,
    );
    expect(color).toEqual([0, 0, 0, 1]);
  });

  it("prefers the body background over the html background", (): void => {
    document.documentElement.style.backgroundColor = "rgb(0, 0, 0)";
    document.body.style.backgroundColor = "rgb(200, 100, 50)";
    document.body.innerHTML = "<p id='p'>x</p>";
    expect(
      getEffectiveBackgroundColorOfElement(document.getElementById("p")!),
    ).toEqual([200, 100, 50, 1]);
    document.body.removeAttribute("style");
  });

  it("falls back to white when nothing sets a background", (): void => {
    document.body.innerHTML = "<p id='p'>x</p>";
    expect(
      getEffectiveBackgroundColorOfElement(document.getElementById("p")!),
    ).toEqual([255, 255, 255, 1]);
  });

  it("continues from a shadow root to its host", (): void => {
    document.body.innerHTML =
      "<div id='h' style='background-color: rgb(10, 20, 30)'></div>";
    const shadow: ShadowRoot = document
      .getElementById("h")!
      .attachShadow({ mode: "open" });
    shadow.innerHTML = "<span id='s'>t</span>";
    expect(
      getEffectiveBackgroundColorOfElement(shadow.getElementById("s")!),
    ).toEqual([10, 20, 30, 1]);
  });

  it("stops at a detached element without a host", (): void => {
    const detached: HTMLElement = document.createElement("span");
    expect(getEffectiveBackgroundColorOfElement(detached)).toEqual([
      255, 255, 255, 1,
    ]);
  });

  it("blends a translucent layer over an opaque parent", (): void => {
    document.body.style.backgroundColor = "rgb(0, 0, 255)";
    document.body.innerHTML =
      "<div id='d' style='background-color: rgba(255, 0, 0, 0.5)'>x</div>";
    expect(
      getEffectiveBackgroundColorOfElement(document.getElementById("d")!),
    ).toEqual([128, 0, 128, 1]);
    document.body.removeAttribute("style");
  });

  it("blends two translucent layers over the white default", (): void => {
    document.body.innerHTML =
      "<div style='background-color: rgba(0, 0, 0, 0.5)'><p id='p' style='background-color: rgba(255, 0, 0, 0.5)'>x</p></div>";
    expect(
      getEffectiveBackgroundColorOfElement(document.getElementById("p")!),
    ).toEqual([192, 64, 64, 1]);
  });
});
