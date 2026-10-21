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
  querySelectorAllWithShadow,
  traverseShadowDOM,
} from "../src/core/shadow-dom";

beforeAll((): void => {
  const dom: JSDOM = new JSDOM("<!doctype html><html><body></body></html>");
  vi.stubGlobal("window", dom.window);
  vi.stubGlobal("document", dom.window.document);
  vi.stubGlobal("Document", dom.window.Document);
  vi.stubGlobal("Element", dom.window.Element);
  vi.stubGlobal("ShadowRoot", dom.window.ShadowRoot);
});

afterAll((): void => {
  vi.unstubAllGlobals();
});

beforeEach((): void => {
  document.body.innerHTML =
    "<my-widget id='host'></my-widget><button id='outer'>o</button>";
});

const attach = (hostId: string, html: string): ShadowRoot => {
  const shadow: ShadowRoot = document
    .getElementById(hostId)!
    .attachShadow({ mode: "open" });
  shadow.innerHTML = html;
  return shadow;
};

describe("selector search through shadow roots", (): void => {
  it("finds a match inside a shadow root whose host does not match", (): void => {
    attach("host", "<button id='inner'>i</button>");
    const ids: string[] = querySelectorAllWithShadow("button", document).map(
      (e: Element): string => e.id,
    );
    expect(ids.sort()).toEqual(["inner", "outer"]);
  });

  it("counts the shadow root of a host that does not match", (): void => {
    attach("host", "<button id='inner'>i</button>");
    const result = traverseShadowDOM(document, { selector: "button" });
    expect(result.shadowRootsCount).toBe(1);
    expect(result.shadowContextMap.get(document.getElementById("outer")!)).toBe(
      null,
    );
  });

  it("reaches a match inside nested shadow roots of non matching hosts", (): void => {
    const first: ShadowRoot = attach("host", "<div id='mid'></div>");
    const nested: ShadowRoot = first
      .getElementById("mid")!
      .attachShadow({ mode: "open" });
    nested.innerHTML = "<a id='deep' href='#'>x</a>";
    const found: Element[] = querySelectorAllWithShadow("a[href]", document);
    expect(found.map((e: Element): string => e.id)).toEqual(["deep"]);
  });

  it("does not report elements that do not match the selector", (): void => {
    attach("host", "<span id='inner'>i</span>");
    const found: Element[] = querySelectorAllWithShadow("button", document);
    expect(found.map((e: Element): string => e.id)).toEqual(["outer"]);
  });

  it("calls the callback only for matching elements", (): void => {
    attach("host", "<span id='inner'>i</span><button id='b2'>b</button>");
    const seen: string[] = [];
    traverseShadowDOM(document, {
      selector: "button",
      callback: (el: Element): void => {
        seen.push(el.id);
      },
    });
    expect(seen.sort()).toEqual(["b2", "outer"]);
  });
});
