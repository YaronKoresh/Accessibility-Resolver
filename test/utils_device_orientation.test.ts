import { describe, expect, it, vi } from "vitest";

import { getDeviceOrientation } from "../src/utils";

const withScreen = (value: object, run: () => void): void => {
  vi.stubGlobal("screen", value);
  try {
    run();
  } finally {
    vi.unstubAllGlobals();
  }
};

describe("getDeviceOrientation", (): void => {
  it("uses screen.orientation.type when it exists", (): void => {
    withScreen(
      { orientation: { type: "portrait-primary" }, width: 800, height: 600 },
      (): void => {
        expect(getDeviceOrientation()).toBe("portrait");
      },
    );
  });

  it("reports landscape for a landscape type", (): void => {
    withScreen({ orientation: { type: "landscape-secondary" } }, (): void => {
      expect(getDeviceOrientation()).toBe("landscape");
    });
  });

  it("falls back to the screen size when orientation is missing", (): void => {
    withScreen({ width: 800, height: 600 }, (): void => {
      expect(getDeviceOrientation()).toBe("landscape");
    });
    withScreen({ width: 600, height: 800 }, (): void => {
      expect(getDeviceOrientation()).toBe("portrait");
    });
  });

  it("does not throw when screen has no data", (): void => {
    withScreen({}, (): void => {
      expect(getDeviceOrientation()).toBe("landscape");
    });
  });
});
