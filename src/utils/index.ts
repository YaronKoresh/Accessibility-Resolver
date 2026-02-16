export type RGBAColor = [number, number, number, number];

export type HSLColor = [number, number, number];

export type IssueSeverity = "Critical" | "Moderate" | "Minor" | "Info";

export type WCAGLevel = "A" | "AA" | "AAA" | "User";

export interface AccessibilityIssue {
  severity: IssueSeverity;
  message: string;
  element?: Element | null;
  recommendation?: string;
  wcagPrinciple?: string;
  wcagGuideline?: string;
  wcagLevel?: WCAGLevel;
  isAutofixed: boolean;
  timestamp: number;
}

const generatedUniqueElementIds: Set<string> = new Set<string>();

export const generateUniqueElementId = (prefix: string = "ar-uid"): string => {
  let newId: string;
  let attempts: number = 0;
  do {
    newId = `${prefix}-${Math.random().toString(36).substring(2, 9)}${attempts > 0 ? "-" + attempts : ""}`;
    attempts++;
  } while (
    document.getElementById(newId) ||
    generatedUniqueElementIds.has(newId)
  );
  generatedUniqueElementIds.add(newId);
  return newId;
};

export const isVisuallyHidden = (element: Element | null): boolean => {
  if (!element) return true;
  const style: CSSStyleDeclaration = window.getComputedStyle(element);
  return (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0" ||
    (element as HTMLElement).offsetWidth === 0 ||
    (element as HTMLElement).offsetHeight === 0
  );
};

export const parseCssColorString = (colorString: string): RGBAColor => {
  if (!colorString || typeof colorString !== "string") {
    return [0, 0, 0, 0];
  }
  const div: HTMLDivElement = document.createElement("div");
  Object.assign(div.style, {
    color: "transparent",
    backgroundColor: "transparent",
    display: "none",
  });
  if (!document.body) {
    return [0, 0, 0, 0];
  }
  document.body.appendChild(div);
  try {
    div.style.color = colorString;
    const compColor: string = window.getComputedStyle(div).color;
    const match: RegExpMatchArray = compColor.match(
      /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/,
    );
    if (match) {
      return [
        +match[1],
        +match[2],
        +match[3],
        match[4] !== undefined ? parseFloat(match[4]) : 1,
      ];
    }
  } catch (err) {
    console.error(err);
  } finally {
    div.remove();
  }
  return [0, 0, 0, 0];
};

export const getLuminanceFromRgb = (
  rgbArray: [number, number, number] | RGBAColor,
): number => {
  const [r, g, b] = rgbArray.map((v: number): number => {
    const normalized: number = v / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const getContrastRatioBetweenColors = (
  rgba1: RGBAColor,
  rgba2: RGBAColor,
): number => {
  const lum1: number = getLuminanceFromRgb(rgba1);
  const lum2: number = getLuminanceFromRgb(rgba2);
  const lighter: number = Math.max(lum1, lum2);
  const darker: number = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
};

export const blendColors = (
  fgRgba: RGBAColor,
  bgRgba: RGBAColor,
): RGBAColor => {
  const alpha: number = fgRgba[3];
  if (alpha >= 1) return fgRgba;

  return [
    Math.round(fgRgba[0] * alpha + bgRgba[0] * (1 - alpha)),
    Math.round(fgRgba[1] * alpha + bgRgba[1] * (1 - alpha)),
    Math.round(fgRgba[2] * alpha + bgRgba[2] * (1 - alpha)),
    1,
  ];
};

export const getEffectiveBackgroundColorOfElement = (
  element: Element,
): RGBAColor => {
  let currentElement: Element | null = element;
  let resultBg: RGBAColor = [255, 255, 255, 1];

  while (currentElement && currentElement !== document.documentElement) {
    const style: CSSStyleDeclaration = window.getComputedStyle(currentElement);
    const bg: RGBAColor = parseCssColorString(style.backgroundColor);

    if (bg[3] > 0) {
      resultBg = blendColors(bg, resultBg);
      if (bg[3] >= 1) break;
    }
    currentElement = currentElement.parentElement;
  }

  return resultBg;
};

export const isTextLargeForWCAG = (element: Element): boolean => {
  const style: CSSStyleDeclaration = window.getComputedStyle(element);
  const fontSize: number = parseFloat(style.fontSize);
  const fontWeight: number =
    parseInt(style.fontWeight, 10) || (style.fontWeight === "bold" ? 700 : 400);

  return fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
};

export const rgbToHsl = (r: number, g: number, b: number): HSLColor => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max: number = Math.max(r, g, b);
  const min: number = Math.min(r, g, b);
  const l: number = (max + min) / 2;

  let h: number = 0;
  let s: number = 0;

  if (max !== min) {
    const d: number = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h, s, l];
};

export const hslToRgb = (
  h: number,
  s: number,
  l: number,
): [number, number, number] => {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q: number = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p: number = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

export const escapeHtml = (str: string): string => {
  const escapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return str.replace(/[&<>"']/g, (char: string): string => escapeMap[char]);
};

export const hasAriaLabel = (el: Element): boolean => {
  const label: string = el.getAttribute("aria-label");
  return !!label && label.trim().length > 0;
};

export const hasAriaLabelledby = (el: Element): boolean => {
  const labelledby: string = el.getAttribute("aria-labelledby");
  if (!labelledby) return false;

  return labelledby.split(/\s+/).some((id: string): string => {
    const labelEl: HTMLElement = document.getElementById(id);
    return labelEl && labelEl.textContent?.trim();
  });
};

export const hasTextOrValue = (el: Element): boolean => {
  const text: string = el.textContent?.trim() || "";
  const value: string = (el as HTMLInputElement).value?.trim() || "";
  return text.length > 0 || value.length > 0;
};

export const hasImageWithAltInAnchor = (el: Element): boolean => {
  const img: Element = el.querySelector("img[alt]");
  return !!img && (img.getAttribute("alt")?.trim().length ?? 0) > 0;
};

export const hasImageAlt = (el: Element): boolean => {
  const alt: string = el.getAttribute("alt");
  return alt !== null;
};

export const hasFigcaption = (el: Element): boolean => {
  const figure: HTMLElement = el.closest("figure");
  return !!figure && !!figure.querySelector("figcaption");
};

export const hasExplicitLabel = (el: Element): boolean => {
  const id: string = el.id;
  if (!id) return false;
  return !!document.querySelector(`label[for="${id}"]`);
};

export const hasParentLabel = (el: Element): boolean => {
  return !!el.closest("label");
};

export const hasTitleAttr = (el: Element): boolean => {
  const title: string = el.getAttribute("title");
  return !!title && title.trim().length > 0;
};

export const hasAccessibleNameForElement = (element: Element): boolean => {
  if (hasAriaLabel(element)) return true;

  if (hasAriaLabelledby(element)) return true;

  if (hasTextOrValue(element)) return true;

  if (hasImageWithAltInAnchor(element)) return true;

  if (hasExplicitLabel(element) || hasParentLabel(element)) return true;

  if (hasTitleAttr(element)) return true;

  return false;
};

export const getDeviceType = (): "tablet" | "mobile" | "desktop" => {
  const ua: string = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  } else if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua,
    )
  ) {
    return "mobile";
  }
  return "desktop";
};

export const getDeviceOrientation = (): "portrait" | "landscape" => {
  if (screen.orientation.type.includes("portrait")) {
    return "portrait";
  }
  return "landscape";
};

export const originalElementStylesMap: Map<
  Element,
  Record<string, string>
> = new Map<Element, Record<string, string>>();

export const storeOriginalInlineStyle = (
  element: Element,
  cssProperty: string,
): void => {
  if (!originalElementStylesMap.has(element)) {
    originalElementStylesMap.set(element, {});
  }
  const elementOriginalStyles: Record<string, string> =
    originalElementStylesMap.get(element)!;
  if (elementOriginalStyles[cssProperty] === undefined) {
    elementOriginalStyles[cssProperty] = (
      element as HTMLElement
    ).style.getPropertyValue(cssProperty);
  }
};

export const restoreOriginalInlineStyle = (
  element: Element,
  cssProperty: string,
): void => {
  if (originalElementStylesMap.has(element)) {
    const elementOriginalStyles: Record<string, string> =
      originalElementStylesMap.get(element)!;
    if (elementOriginalStyles[cssProperty] !== undefined) {
      (element as HTMLElement).style.setProperty(
        cssProperty,
        elementOriginalStyles[cssProperty],
      );
    } else {
      (element as HTMLElement).style.removeProperty(cssProperty);
    }
  }
};
