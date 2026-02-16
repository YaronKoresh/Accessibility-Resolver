import type { ScannerOptions, ScanReport } from "./core/scanner";
import type { AccessibilityIssue, IssueSeverity, WCAGLevel } from "./utils";

export { AR_CONFIG, AR_SELECTOR_STRINGS } from "./config";
export type { ARConfig, ARSelectorStrings } from "./config";

export {
  blendColors,
  escapeHtml,
  generateUniqueElementId,
  getContrastRatioBetweenColors,
  getDeviceOrientation,
  getDeviceType,
  getEffectiveBackgroundColorOfElement,
  getLuminanceFromRgb,
  hasAccessibleNameForElement,
  hasAriaLabel,
  hasAriaLabelledby,
  hasExplicitLabel,
  hasFigcaption,
  hasImageAlt,
  hasImageWithAltInAnchor,
  hasParentLabel,
  hasTextOrValue,
  hasTitleAttr,
  hslToRgb,
  isTextLargeForWCAG,
  isVisuallyHidden,
  originalElementStylesMap,
  parseCssColorString,
  restoreOriginalInlineStyle,
  rgbToHsl,
  storeOriginalInlineStyle,
} from "./utils";

export type {
  AccessibilityIssue,
  HSLColor,
  IssueSeverity,
  RGBAColor,
  WCAGLevel,
} from "./utils";

export {
  findShadowContext,
  getFormElementsWithShadow,
  getHeadingElementsWithShadow,
  getImageElementsWithShadow,
  getInteractiveElementsWithShadow,
  getLandmarkElementsWithShadow,
  getRootNode,
  getShadowHost,
  getShadowRoot,
  hasOpenShadowRoot,
  isInShadowDOM,
  querySelectorAllWithShadow,
  traverseShadowDOM,
} from "./core/shadow-dom";

export type {
  ShadowDOMTraversalOptions,
  ShadowDOMTraversalResult,
} from "./core/shadow-dom";

export {
  ARIA_ID_REFERENCE_ATTRIBUTES,
  ARIA_MULTI_ID_REFERENCE_ATTRIBUTES,
  repairARIAReference,
  repairElementARIAReferences,
  validateARIAReference,
  validateARIAReferences,
  validateAriaDescribedby,
  validateAriaLabelledby,
  validateElementARIAReferences,
} from "./core/aria-validator";

export type {
  ARIAValidationReport,
  ARIAValidationResult,
} from "./core/aria-validator";

export {
  autoFixFocusAppearance,
  autoFixTargetSize,
  checkFocusAppearance,
  checkTargetSize,
  convertToAccessibilityIssues,
  getWCAG22Summary,
  runWCAG22Checks,
} from "./rules/wcag22";

export type {
  FocusAppearanceCheckResult,
  TargetSizeCheckResult,
  WCAG22CheckResult,
} from "./rules/wcag22";

import {
  AccessibilityScanner,
  applyStylesAndLog as _applyStylesAndLog,
  clearIssues as _clearIssues,
  exportIssues as _exportIssues,
  getIssues as _getIssues,
  logIssue as _logIssue,
  quickScan as _quickScan,
  setAttributeAndLog as _setAttributeAndLog,
} from "./core/scanner";

export { AccessibilityScanner };
export const logIssue: (
  severity: IssueSeverity,
  message: string,
  element?: Element | null,
  recommendation?: string,
  wcagPrinciple?: string,
  wcagGuideline?: string,
  isAutofixed?: boolean,
  wcagLevel?: WCAGLevel,
) => AccessibilityIssue = _logIssue;
export const setAttributeAndLog: (
  element: Element,
  attr: string,
  value: string,
  severity: IssueSeverity,
  message: string,
  recommendation: string,
  wcagPrinciple: string,
  wcagGuideline: string,
  wcagLevel?: WCAGLevel,
) => number = _setAttributeAndLog;
export const applyStylesAndLog: (
  element: Element,
  styles: Record<string, string>,
  severity: IssueSeverity,
  message: string,
  recommendation: string,
  wcagPrinciple: string,
  wcagGuideline: string,
  wcagLevel?: WCAGLevel,
) => number = _applyStylesAndLog;
export const clearIssues: () => void = _clearIssues;
export const getIssues: () => AccessibilityIssue[] = _getIssues;
export const quickScan: (options?: ScannerOptions) => Promise<ScanReport> =
  _quickScan;
export const exportIssues: () => AccessibilityIssue[] = _exportIssues;

export type { ScanReport, ScannerOptions } from "./core/scanner";

export const VERSION = "2.0.0" as const;

export const init = (): void => {
  console.log(
    "%c Made by Yaron Koresh ",
    "background:#4CAF50;color:white;font-size:1em;font-weight:bold;padding:5px 10px;border-radius:3px;",
  );
  console.log(
    `%c Accessibility Resolver v${VERSION} - ESM Edition `,
    "background:#1976d2;color:white;font-size:0.9em;padding:3px 8px;border-radius:3px;",
  );

  const scanner: AccessibilityScanner = new AccessibilityScanner({
    includeShadowDOM: true,
    autoFix: true,
    logResults: true,
  });

  scanner
    .scan()
    .then((report: ScanReport): void => {
      (
        window as unknown as { accessibilityScanGlobalResults: typeof report }
      ).accessibilityScanGlobalResults = report;

      scanner.setupMutationObserver();
      return void 0;
    })
    .catch((error: unknown): void => {
      console.error("Accessibility Resolver failed to initialize:", error);
    });
};

if (typeof document !== "undefined") {
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    setTimeout(init, 0);
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
}
