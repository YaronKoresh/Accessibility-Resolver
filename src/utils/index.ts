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

const MODERN_COLOR_PATTERN: RegExp =
  /^(color|lab|lch|oklab|oklch)\(\s*([^)]*?)\s*\)$/i;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const encodeSrgbChannel = (linear: number): number => {
  const value: number = clamp01(linear);
  const encoded: number =
    value <= 0.0031308
      ? 12.92 * value
      : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  return Math.round(clamp01(encoded) * 255);
};

const decodeSrgbChannel = (encoded: number): number => {
  const sign: number = encoded < 0 ? -1 : 1;
  const value: number = Math.abs(encoded);
  return (
    sign *
    (value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4))
  );
};

const multiplyMatrix = (
  matrix: readonly number[],
  [x, y, z]: readonly [number, number, number],
): [number, number, number] => [
  matrix[0] * x + matrix[1] * y + matrix[2] * z,
  matrix[3] * x + matrix[4] * y + matrix[5] * z,
  matrix[6] * x + matrix[7] * y + matrix[8] * z,
];

const XYZ_D65_TO_LINEAR_SRGB: readonly number[] = [
  3.2409699419, -1.5373831776, -0.4986107603, -0.9692436363, 1.8759675015,
  0.0415550574, 0.0556300797, -0.2039769589, 1.0569715142,
];

const XYZ_D50_TO_LINEAR_SRGB: readonly number[] = [
  3.1338561, -1.6168667, -0.4906146, -0.9787684, 1.9161415, 0.033454, 0.0719453,
  -0.2289914, 1.4052427,
];

const LINEAR_P3_TO_XYZ_D65: readonly number[] = [
  0.4865709486, 0.2656676932, 0.1982172852, 0.2289745641, 0.6917385218,
  0.0792869141, 0, 0.0451133819, 1.0439443689,
];

const parseColorComponent = (
  token: string,
  percentScale: number,
): number | null => {
  if (token === "none") return 0;
  const match: RegExpMatchArray | null = token.match(
    /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(%|deg)?$/i,
  );
  if (!match) return null;
  const value: number = parseFloat(match[1]);
  return match[2] === "%" ? (value / 100) * percentScale : value;
};

type LinearRgb = [number, number, number];

const parseComponents = (
  tokens: string[],
  scales: [number, number, number],
): LinearRgb | null => {
  const parts: Array<number | null> = tokens.map(
    (t: string, i: number): number | null => parseColorComponent(t, scales[i]),
  );
  return parts.some((v: number | null): boolean => v === null)
    ? null
    : (parts as LinearRgb);
};

const polarToRectangular = (
  space: string,
  [light, second, third]: LinearRgb,
): LinearRgb => {
  if (space === "lab" || space === "oklab") return [light, second, third];
  const radians: number = (third * Math.PI) / 180;
  return [light, second * Math.cos(radians), second * Math.sin(radians)];
};

const linearFromRgbSpace = (
  space: string,
  tokens: string[],
): LinearRgb | null => {
  const parts: LinearRgb | null = parseComponents(tokens, [1, 1, 1]);
  if (!parts) return null;
  if (space === "srgb-linear") return parts;
  const linear: LinearRgb = [
    decodeSrgbChannel(parts[0]),
    decodeSrgbChannel(parts[1]),
    decodeSrgbChannel(parts[2]),
  ];
  if (space === "srgb") return linear;
  return multiplyMatrix(
    XYZ_D65_TO_LINEAR_SRGB,
    multiplyMatrix(LINEAR_P3_TO_XYZ_D65, linear),
  );
};

const linearFromLab = (space: string, tokens: string[]): LinearRgb | null => {
  const parts: LinearRgb | null = parseComponents(
    tokens,
    space === "lab" ? [100, 125, 125] : [100, 150, 360],
  );
  if (!parts) return null;
  const [light, a, b] = polarToRectangular(space, parts);
  const fy: number = (light + 16) / 116;
  const fx: number = fy + a / 500;
  const fz: number = fy - b / 200;
  const inverse = (t: number): number =>
    t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27);
  const y: number = light > 8 ? fy ** 3 : light / (24389 / 27);
  return multiplyMatrix(XYZ_D50_TO_LINEAR_SRGB, [
    inverse(fx) * 0.96422,
    y,
    inverse(fz) * 0.82521,
  ]);
};

const linearFromOklab = (space: string, tokens: string[]): LinearRgb | null => {
  const parts: LinearRgb | null = parseComponents(
    tokens,
    space === "oklab" ? [1, 0.4, 0.4] : [1, 0.4, 360],
  );
  if (!parts) return null;
  const [light, a, b] = polarToRectangular(space, parts);
  const l: number = (light + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m: number = (light - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s: number = (light - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
};

const parseModernCssColor = (colorString: string): RGBAColor | null => {
  const match: RegExpMatchArray | null = colorString
    .trim()
    .match(MODERN_COLOR_PATTERN);
  if (!match) return null;

  const fn: string = match[1].toLowerCase();
  const [body, alphaToken] = match[2]
    .split("/")
    .map((p: string): string => p.trim());
  const tokens: string[] = body.toLowerCase().split(/\s+/).filter(Boolean);

  const space: string = fn === "color" ? (tokens.shift() ?? "") : fn;
  if (tokens.length !== 3) return null;

  let alpha: number = 1;
  if (alphaToken !== undefined) {
    const parsedAlpha: number | null = parseColorComponent(
      alphaToken.toLowerCase(),
      1,
    );
    if (parsedAlpha === null) return null;
    alpha = clamp01(parsedAlpha);
  }

  let linear: LinearRgb | null = null;
  if (space === "srgb" || space === "srgb-linear" || space === "display-p3") {
    linear = linearFromRgbSpace(space, tokens);
  } else if (space === "lab" || space === "lch") {
    linear = linearFromLab(space, tokens);
  } else if (space === "oklab" || space === "oklch") {
    linear = linearFromOklab(space, tokens);
  }
  if (!linear) return null;

  return [
    encodeSrgbChannel(linear[0]),
    encodeSrgbChannel(linear[1]),
    encodeSrgbChannel(linear[2]),
    alpha,
  ];
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
    const modern: RGBAColor | null = parseModernCssColor(compColor);
    if (modern) return modern;
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
  const layers: RGBAColor[] = [];

  while (currentElement) {
    const style: CSSStyleDeclaration = window.getComputedStyle(currentElement);
    const bg: RGBAColor = parseCssColorString(style.backgroundColor);

    if (bg[3] > 0) {
      layers.push(bg);
      if (bg[3] >= 1) break;
    }

    if (currentElement.parentElement) {
      currentElement = currentElement.parentElement;
    } else {
      const rootNode: Node = currentElement.getRootNode();
      currentElement =
        typeof ShadowRoot !== "undefined" && rootNode instanceof ShadowRoot
          ? rootNode.host
          : null;
    }
  }

  let resultBg: RGBAColor = [255, 255, 255, 1];
  for (let i: number = layers.length - 1; i >= 0; i--) {
    resultBg = blendColors(layers[i], resultBg);
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

  const root: Node = el.getRootNode?.() ?? document;
  const findById = (id: string): HTMLElement | null => {
    const scoped: Element | null =
      typeof (root as Document | ShadowRoot).getElementById === "function"
        ? (root as Document | ShadowRoot).getElementById(id)
        : null;
    return (scoped ?? document.getElementById(id)) as HTMLElement | null;
  };

  return labelledby.split(/\s+/).some((id: string): boolean => {
    if (!id) return false;
    const labelEl: HTMLElement | null = findById(id);
    return !!labelEl && !!labelEl.textContent?.trim();
  });
};

const BUTTON_LIKE_INPUT_TYPES: ReadonlySet<string> = new Set<string>([
  "button",
  "submit",
  "reset",
]);

export const hasTextOrValue = (el: Element): boolean => {
  const tag: string = el.tagName.toLowerCase();

  if (tag === "input") {
    const type: string = (el.getAttribute("type") ?? "text").toLowerCase();
    if (!BUTTON_LIKE_INPUT_TYPES.has(type)) return false;
    return ((el as HTMLInputElement).value?.trim() || "").length > 0;
  }

  if (tag === "select" || tag === "textarea") return false;

  return (el.textContent?.trim() || "").length > 0;
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
  const root: Node = el.getRootNode?.() ?? document;
  const scope: ParentNode =
    typeof (root as ParentNode).querySelectorAll === "function"
      ? (root as ParentNode)
      : document;
  return Array.from(scope.querySelectorAll("label[for]")).some(
    (label: Element): boolean => label.getAttribute("for") === id,
  );
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
  const type: string | undefined = screen?.orientation?.type;
  if (typeof type === "string") {
    return type.includes("portrait") ? "portrait" : "landscape";
  }
  const width: number = screen?.width ?? 0;
  const height: number = screen?.height ?? 0;
  return height > width ? "portrait" : "landscape";
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
