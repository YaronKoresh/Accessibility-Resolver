import { afterEach, describe, expect, it, vi } from "vitest";

import { getDeviceOrientation } from "../src/utils";

afterEach((): void => {
  vi.unstubAllGlobals();
});

describe("getDeviceOrientation", (): void => {
  it("uses screen.orientation.type when it exists", (): void => {
    vi.stubGlobal("screen", {
      orientation: { type: "portrait-primary" },
      width: 800,
      height: 600,
    });
    expect(getDeviceOrientation()).toBe("portrait");
  });

  it("reports landscape for a landscape type", (): void => {
    vi.stubGlobal("screen", { orientation: { type: "landscape-secondary" } });
    expect(getDeviceOrientation()).toBe("landscape");
  });

  it("falls back to the screen size when orientation is missing", (): void => {
    vi.stubGlobal("screen", { width: 800, height: 600 });
    expect(getDeviceOrientation()).toBe("landscape");
    vi.stubGlobal("screen", { width: 600, height: 800 });
    expect(getDeviceOrientation()).toBe("portrait");
  });

  it("does not throw when screen has no data", (): void => {
    vi.stubGlobal("screen", {});
    expect(getDeviceOrientation()).toBe("landscape");
  });
});
