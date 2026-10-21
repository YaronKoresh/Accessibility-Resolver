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

import { hasAccessibleNameForElement, hasAriaLabelledby } from "../src/utils";

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

const makeShadow = (html: string): ShadowRoot => {
  const host: HTMLElement = document.createElement("div");
  document.body.appendChild(host);
  const shadow: ShadowRoot = host.attachShadow({ mode: "open" });
  shadow.innerHTML = html;
  return shadow;
};

describe("hasAriaLabelledby with shadow roots", (): void => {
  it("finds a label inside the same shadow root", (): void => {
    const shadow: ShadowRoot = makeShadow(
      "<span id='l'>Name</span><button aria-labelledby='l'></button>",
    );
    const button: Element = shadow.querySelector("button")!;
    expect(hasAriaLabelledby(button)).toBe(true);
    expect(hasAccessibleNameForElement(button)).toBe(true);
  });

  it("returns false for a blank label inside the shadow root", (): void => {
    const shadow: ShadowRoot = makeShadow(
      "<span id='l'>   </span><button aria-labelledby='l'></button>",
    );
    expect(hasAriaLabelledby(shadow.querySelector("button")!)).toBe(false);
  });

  it("finds a label in the main document from inside a shadow root", (): void => {
    document.body.insertAdjacentHTML("beforeend", "<span id='m'>Main</span>");
    const shadow: ShadowRoot = makeShadow(
      "<button aria-labelledby='m'></button>",
    );
    expect(hasAriaLabelledby(shadow.querySelector("button")!)).toBe(true);
  });

  it("uses any of several ids", (): void => {
    const shadow: ShadowRoot = makeShadow(
      "<span id='b'>Second</span><button aria-labelledby='a b'></button>",
    );
    expect(hasAriaLabelledby(shadow.querySelector("button")!)).toBe(true);
  });
});

describe("hasAriaLabelledby in the main document", (): void => {
  it("still finds labels and still rejects missing or blank ones", (): void => {
    document.body.innerHTML =
      "<span id='l'>Name</span><span id='e'> </span><i id='ok' aria-labelledby='l'></i><i id='blank' aria-labelledby='e'></i><i id='none' aria-labelledby='zz'></i><i id='empty' aria-labelledby='   '></i>";
    expect(hasAriaLabelledby(document.getElementById("ok")!)).toBe(true);
    expect(hasAriaLabelledby(document.getElementById("blank")!)).toBe(false);
    expect(hasAriaLabelledby(document.getElementById("none")!)).toBe(false);
    expect(hasAriaLabelledby(document.getElementById("empty")!)).toBe(false);
  });

  it("works for a detached element", (): void => {
    document.body.innerHTML = "<span id='l'>Name</span>";
    const detached: HTMLElement = document.createElement("button");
    detached.setAttribute("aria-labelledby", "l");
    expect(hasAriaLabelledby(detached)).toBe(true);
  });
});
