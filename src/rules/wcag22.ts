import { AR_CONFIG } from "../config";
import { querySelectorAllWithShadow } from "../core/shadow-dom";
import {
  type AccessibilityIssue,
  getContrastRatioBetweenColors,
  getEffectiveBackgroundColorOfElement,
  parseCssColorString,
} from "../utils";

export interface TargetSizeMeasurements {
  width: number;
  height: number;
  minRequired: number;
  area: number;
  isCircular: boolean;
  spacing?: number;
}

export interface FocusAppearanceMeasurements {
  outlineWidth: number;
  outlineOffset: number;
  contrastRatio: number;
  focusIndicatorArea: number;
  perimeter: number;
  meetsMinArea: boolean;
  meetsContrast: boolean;
}

export interface WCAG22CheckResult {
  passed: boolean;

  element: Element;

  criterion: string;

  wcagGuideline: string;

  wcagLevel: "AA" | "AAA";

  message: string;

  recommendation?: string;

  measurements?: TargetSizeMeasurements | FocusAppearanceMeasurements;

  isAutofixed?: boolean;
}

export interface TargetSizeCheckResult extends Omit<
  WCAG22CheckResult,
  "measurements"
> {
  measurements?: TargetSizeMeasurements;
}

export interface FocusAppearanceCheckResult extends Omit<
  WCAG22CheckResult,
  "measurements"
> {
  measurements?: FocusAppearanceMeasurements;
}

export const checkTargetSize = (element: Element): TargetSizeCheckResult => {
  const minSize = AR_CONFIG.WCAG_22_MIN_TARGET_SIZE_PX;
  const rect: DOMRect = element.getBoundingClientRect();
  const computedStyle: CSSStyleDeclaration = window.getComputedStyle(element);

  const width: number = rect.width;
  const height: number = rect.height;
  const area: number = width * height;

  const borderRadius: string = computedStyle.borderRadius;
  const isCircular: boolean =
    borderRadius === "50%" ||
    parseFloat(borderRadius) >= Math.min(width, height) / 2;

  const meetsWidth: boolean = width >= minSize;
  const meetsHeight: boolean = height >= minSize;
  const passesSize: boolean = meetsWidth && meetsHeight;

  let hasAdequateSpacing: boolean = false;
  if (!passesSize) {
    const spacing: number = calculateTargetSpacing(element);
    const widthWithSpacing: number = width + spacing * 2;
    const heightWithSpacing: number = height + spacing * 2;
    hasAdequateSpacing =
      widthWithSpacing >= minSize && heightWithSpacing >= minSize;
  }

  const isInline: boolean = isInlineTarget(element);

  const passed: boolean = passesSize || hasAdequateSpacing || isInline;

  return {
    passed,
    element,
    criterion: "Target Size (Minimum)",
    wcagGuideline: "2.5.8",
    wcagLevel: "AA",
    message: passed
      ? `Target size meets WCAG 2.2 requirements (${width.toFixed(1)}x${height.toFixed(1)}px)`
      : `Target size (${width.toFixed(1)}x${height.toFixed(1)}px) is smaller than the required ${minSize}x${minSize}px`,
    recommendation: passed
      ? undefined
      : `Increase the target size to at least ${minSize}x${minSize} CSS pixels, or ensure adequate spacing around the target.`,
    measurements: {
      width,
      height,
      minRequired: minSize,
      area,
      isCircular,
      spacing: calculateTargetSpacing(element),
    },
  };
};

const calculateTargetSpacing = (element: Element): number => {
  const rect: DOMRect = element.getBoundingClientRect();
  let minSpacing: number = Infinity;

  const parent: HTMLElement = element.parentElement;
  if (!parent) return 0;

  const siblings: NodeListOf<Element> = parent.querySelectorAll(
    'button, a[href], input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])',
  );

  for (const sibling of siblings) {
    if (sibling === element) continue;

    const siblingRect: DOMRect = sibling.getBoundingClientRect();

    const horizontalGap: number = Math.max(
      siblingRect.left - rect.right,
      rect.left - siblingRect.right,
    );
    const verticalGap: number = Math.max(
      siblingRect.top - rect.bottom,
      rect.top - siblingRect.bottom,
    );

    if (horizontalGap > 0) minSpacing = Math.min(minSpacing, horizontalGap);
    if (verticalGap > 0) minSpacing = Math.min(minSpacing, verticalGap);
  }

  return minSpacing === Infinity ? 0 : minSpacing;
};

const isInlineTarget = (element: Element): boolean => {
  const style: CSSStyleDeclaration = window.getComputedStyle(element);
  const display: string = style.display;

  if (display === "inline" || display === "inline-block") {
    const parent: HTMLElement = element.parentElement;
    if (parent) {
      const textContent: string = parent.textContent || "";
      const elementText: string = element.textContent || "";
      const surroundingText: string = textContent
        .replace(elementText, "")
        .trim();

      return surroundingText.length > 20;
    }
  }

  return false;
};

export const checkFocusAppearance = (
  element: Element,
): FocusAppearanceCheckResult => {
  const computedStyle: CSSStyleDeclaration = window.getComputedStyle(element);
  const rect: DOMRect = element.getBoundingClientRect();

  const outlineWidth: number = parseFloat(computedStyle.outlineWidth) || 0;
  const outlineOffset: number = parseFloat(computedStyle.outlineOffset) || 0;
  const outlineStyle: string = computedStyle.outlineStyle;
  const outlineColor: string = computedStyle.outlineColor;

  const perimeter: number = 2 * (rect.width + rect.height);
  const minThickness = AR_CONFIG.WCAG_22_FOCUS_INDICATOR_MIN_THICKNESS_PX;
  const minArea: number = perimeter * minThickness;

  const focusIndicatorArea: number =
    outlineWidth > 0 ? perimeter * outlineWidth : 0;

  let contrastRatio: number = 0;
  if (outlineColor && outlineColor !== "transparent") {
    const outlineRgba = parseCssColorString(outlineColor);
    const bgColor = getEffectiveBackgroundColorOfElement(element);
    contrastRatio = getContrastRatioBetweenColors(outlineRgba, bgColor);
  }

  const boxShadow: string = computedStyle.boxShadow;
  const hasBoxShadowIndicator: boolean = Boolean(
    boxShadow && boxShadow !== "none",
  );

  const meetsMinArea: boolean =
    focusIndicatorArea >= minArea ||
    outlineWidth >= minThickness ||
    hasBoxShadowIndicator;

  const meetsContrast: boolean =
    contrastRatio >= AR_CONFIG.WCAG_22_FOCUS_INDICATOR_MIN_CONTRAST;

  const hasFocusIndicator: boolean =
    (outlineStyle !== "none" && outlineWidth > 0) || hasBoxShadowIndicator;

  const passed: boolean = hasFocusIndicator && meetsMinArea && meetsContrast;

  return {
    passed,
    element,
    criterion: "Focus Appearance",
    wcagGuideline: "2.4.11",
    wcagLevel: "AA",
    message: passed
      ? "Focus indicator meets WCAG 2.2 requirements"
      : hasFocusIndicator
        ? `Focus indicator may not meet WCAG 2.2 requirements (contrast: ${contrastRatio.toFixed(2)}:1, outline: ${outlineWidth}px)`
        : "No visible focus indicator detected",
    recommendation: passed
      ? undefined
      : !hasFocusIndicator
        ? "Add a visible focus indicator using outline or box-shadow. The indicator should be at least 2px thick with 3:1 contrast."
        : !meetsContrast
          ? `Increase focus indicator contrast to at least 3:1 (current: ${contrastRatio.toFixed(2)}:1)`
          : "Increase focus indicator thickness to at least 2 CSS pixels.",
    measurements: {
      outlineWidth,
      outlineOffset,
      contrastRatio,
      focusIndicatorArea,
      perimeter,
      meetsMinArea,
      meetsContrast,
    },
  };
};

export const autoFixTargetSize = (element: Element): boolean => {
  const checkResult: TargetSizeCheckResult = checkTargetSize(element);

  if (checkResult.passed) return false;

  const htmlElement: HTMLElement = element as HTMLElement;
  const minSize = AR_CONFIG.WCAG_22_MIN_TARGET_SIZE_PX;
  const measurements: TargetSizeMeasurements = checkResult.measurements;

  if (!measurements) return false;

  try {
    if (measurements.width < minSize) {
      htmlElement.style.minWidth = `${minSize}px`;
    }
    if (measurements.height < minSize) {
      htmlElement.style.minHeight = `${minSize}px`;
    }
    return true;
  } catch {
    return false;
  }
};

export const autoFixFocusAppearance = (element: Element): boolean => {
  const htmlElement: HTMLElement = element as HTMLElement;

  try {
    htmlElement.setAttribute("data-ar-focus-fix", "true");

    if (!document.getElementById("ar-focus-appearance-fix")) {
      const style: HTMLStyleElement = document.createElement("style");
      style.id = "ar-focus-appearance-fix";
      style.textContent = `
        [data-ar-focus-fix]:focus-visible {
          outline: 3px solid #0056b3 !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 4px rgba(0, 86, 179, 0.25) !important;
        }
      `;
      document.head.appendChild(style);
    }

    return true;
  } catch {
    return false;
  }
};

export const runWCAG22Checks = (
  root: Element | Document = document,
  includeShadowDOM: boolean = true,
): WCAG22CheckResult[] => {
  const results: WCAG22CheckResult[] = [];

  const interactiveSelector =
    'button, a[href], input:not([type="hidden"]), select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [tabindex]:not([tabindex="-1"])' as const;

  const elements: Array<Element> = includeShadowDOM
    ? querySelectorAllWithShadow(interactiveSelector, root)
    : Array.from(
        (root instanceof Document ? root : root).querySelectorAll(
          interactiveSelector,
        ),
      );

  for (const element of elements) {
    const style: CSSStyleDeclaration = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") {
      continue;
    }

    results.push(checkTargetSize(element));

    results.push(checkFocusAppearance(element));
  }

  return results;
};

export const getWCAG22Summary = (
  results: WCAG22CheckResult[],
): {
  total: number;
  passed: number;
  failed: number;
  targetSizeIssues: number;
  focusAppearanceIssues: number;
} => {
  const targetSizeResults: Array<WCAG22CheckResult> = results.filter(
    (r: WCAG22CheckResult): boolean => r.wcagGuideline === "2.5.8",
  );
  const focusAppearanceResults: Array<WCAG22CheckResult> = results.filter(
    (r: WCAG22CheckResult): boolean => r.wcagGuideline === "2.4.11",
  );

  return {
    total: results.length,
    passed: results.filter((r: WCAG22CheckResult): boolean => r.passed).length,
    failed: results.filter((r: WCAG22CheckResult): boolean => !r.passed).length,
    targetSizeIssues: targetSizeResults.filter(
      (r: WCAG22CheckResult): boolean => !r.passed,
    ).length,
    focusAppearanceIssues: focusAppearanceResults.filter(
      (r: WCAG22CheckResult): boolean => !r.passed,
    ).length,
  };
};

export const convertToAccessibilityIssues = (
  results: WCAG22CheckResult[],
): AccessibilityIssue[] => {
  return results
    .filter((result: WCAG22CheckResult): boolean => !result.passed)
    .map(
      (
        result: WCAG22CheckResult,
      ): {
        severity: "Moderate";
        message: string;
        element: Element;
        recommendation: string;
        wcagPrinciple: string;
        wcagGuideline: string;
        wcagLevel: "AA" | "AAA";
        isAutofixed: boolean;
        timestamp: number;
      } => ({
        severity: "Moderate" as const,
        message: result.message,
        element: result.element,
        recommendation: result.recommendation,
        wcagPrinciple: result.wcagGuideline.startsWith("2.4")
          ? "Operable"
          : "Operable",
        wcagGuideline: result.wcagGuideline,
        wcagLevel: result.wcagLevel,
        isAutofixed: result.isAutofixed || false,
        timestamp: Date.now(),
      }),
    );
};
