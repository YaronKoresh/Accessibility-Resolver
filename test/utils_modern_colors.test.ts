import { JSDOM } from "jsdom";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  getEffectiveBackgroundColorOfElement,
  parseCssColorString,
  type RGBAColor,
} from "../src/utils";

beforeAll((): void => {
  const dom: JSDOM = new JSDOM("<!doctype html><html><body></body></html>");
  vi.stubGlobal("window", dom.window);
  vi.stubGlobal("document", dom.window.document);
});

afterAll((): void => {
  vi.unstubAllGlobals();
});

const near = (actual: RGBAColor, expected: RGBAColor, delta = 2): void => {
  for (let i = 0; i < 3; i++) {
    expect(Math.abs(actual[i] - expected[i])).toBeLessThanOrEqual(delta);
  }
  expect(actual[3]).toBeCloseTo(expected[3], 2);
};

describe("parseCssColorString with modern color functions", (): void => {
  it("reads color(srgb ...)", (): void => {
    near(parseCssColorString("color(srgb 1 0 0)"), [255, 0, 0, 1]);
    near(parseCssColorString("color(srgb 0 0 1 / 0.5)"), [0, 0, 255, 0.5]);
    near(parseCssColorString("color(srgb 50% 50% 50%)"), [128, 128, 128, 1], 1);
  });

  it("reads color(srgb-linear ...) and color(display-p3 ...)", (): void => {
    near(
      parseCssColorString("color(srgb-linear 0.5 0.5 0.5)"),
      [188, 188, 188, 1],
    );
    near(parseCssColorString("color(display-p3 1 1 1)"), [255, 255, 255, 1]);
    near(parseCssColorString("color(display-p3 0 0 0)"), [0, 0, 0, 1]);
  });

  it("reads lab and lch", (): void => {
    near(parseCssColorString("lab(100 0 0)"), [255, 255, 255, 1]);
    near(parseCssColorString("lab(0 0 0)"), [0, 0, 0, 1]);
    near(parseCssColorString("lab(54.2905 80.8049 69.891)"), [255, 0, 0, 1], 3);
    near(
      parseCssColorString("lch(54.2905 106.839 40.8526)"),
      [255, 0, 0, 1],
      3,
    );
  });

  it("reads oklab and oklch", (): void => {
    near(parseCssColorString("oklab(1 0 0)"), [255, 255, 255, 1]);
    near(parseCssColorString("oklab(0 0 0)"), [0, 0, 0, 1]);
    near(parseCssColorString("oklch(0.6279 0.2577 29.23)"), [255, 0, 0, 1], 3);
    near(parseCssColorString("oklch(0.5 0 0 / 50%)"), [99, 99, 99, 0.5], 2);
  });

  it("keeps reading legacy colors and returns transparent for garbage", (): void => {
    near(parseCssColorString("rgb(10 20 30 / 50%)"), [10, 20, 30, 0.5]);
    near(parseCssColorString("red"), [255, 0, 0, 1]);
    near(parseCssColorString("not a color"), [0, 0, 0, 0]);
    near(parseCssColorString("color(srgb 1 0)"), [0, 0, 0, 0]);
  });

  it("uses a black color() background when computing the effective background", (): void => {
    document.body.innerHTML =
      "<div style='background-color: color(srgb 0 0 0)'><span id='s'>x</span></div>";
    const bg: RGBAColor = getEffectiveBackgroundColorOfElement(
      document.getElementById("s")!,
    );
    near(bg, [0, 0, 0, 1]);
  });
});
