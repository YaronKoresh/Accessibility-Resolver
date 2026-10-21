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

import { hasAccessibleNameForElement, hasTextOrValue } from "../src/utils";

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

const named = (html: string): boolean => {
  document.body.innerHTML = html;
  return hasAccessibleNameForElement(document.body.firstElementChild!);
};

describe("accessible name of form controls", (): void => {
  it("does not take the typed value of a text input as its name", (): void => {
    expect(named("<input type='text' value='john'>")).toBe(false);
    expect(named("<input value='john'>")).toBe(false);
    expect(named("<input type='email' value='a@b.c'>")).toBe(false);
  });

  it("does not take the option texts of a select as its name", (): void => {
    expect(
      named("<select><option>One</option><option>Two</option></select>"),
    ).toBe(false);
  });

  it("does not take the content of a textarea as its name", (): void => {
    expect(named("<textarea>hello</textarea>")).toBe(false);
  });

  it("still uses the value of button like inputs", (): void => {
    expect(named("<input type='submit' value='Send'>")).toBe(true);
    expect(named("<input type='button' value='Go'>")).toBe(true);
    expect(named("<input type='reset' value='Clear'>")).toBe(true);
    expect(named("<input type='submit' value=' '>")).toBe(false);
  });

  it("still uses the text of buttons and links", (): void => {
    expect(named("<button>Go</button>")).toBe(true);
    expect(named("<a href='#'>Home</a>")).toBe(true);
    expect(named("<button> </button>")).toBe(false);
  });

  it("still accepts a text input with a label, aria-label or title", (): void => {
    expect(named("<input value='x' aria-label='Name'>")).toBe(true);
    expect(named("<input value='x' title='Name'>")).toBe(true);
    document.body.innerHTML = "<label>Name <input value='x'></label>";
    expect(hasAccessibleNameForElement(document.querySelector("input")!)).toBe(
      true,
    );
  });

  it("reports text or value by element kind", (): void => {
    document.body.innerHTML = "<input value='x'><p>text</p>";
    expect(hasTextOrValue(document.querySelector("input")!)).toBe(false);
    expect(hasTextOrValue(document.querySelector("p")!)).toBe(true);
  });
});
