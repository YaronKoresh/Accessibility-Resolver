import { AR_CONFIG } from "../config";
import {
  convertToAccessibilityIssues,
  getWCAG22Summary,
  runWCAG22Checks,
  type WCAG22CheckResult,
} from "../rules/wcag22";
import type { AccessibilityIssue, IssueSeverity, WCAGLevel } from "../utils";

import {
  type ARIAValidationReport,
  validateARIAReferences,
} from "./aria-validator";
import { type ShadowDOMTraversalResult, traverseShadowDOM } from "./shadow-dom";

export interface ScannerOptions {
  includeShadowDOM?: boolean;

  autoFix?: boolean;

  logResults?: boolean;

  maxShadowDepth?: number;

  mutationDebounceMs?: number;
}

export interface ScanReport {
  issues: AccessibilityIssue[];

  totalIssues: number;

  autoFixedCount: number;

  unresolvedCount: number;

  bySeverity: Record<IssueSeverity, AccessibilityIssue[]>;

  byLevel: Record<WCAGLevel, AccessibilityIssue[]>;

  shadowDOMInfo?: ShadowDOMTraversalResult;

  ariaValidation?: ARIAValidationReport;

  wcag22Results?: WCAG22CheckResult[];

  duration: number;

  timestamp: number;
}

const defaultOptions: Required<ScannerOptions> = {
  includeShadowDOM: true,
  autoFix: true,
  logResults: true,
  maxShadowDepth: 10,
  mutationDebounceMs: AR_CONFIG.MUTATION_OBSERVER_DEBOUNCE_MILLISECONDS,
};

let issuesLog: AccessibilityIssue[] = [];
let autoFixedCount: number = 0;
let mutationDebounceTimeout: ReturnType<typeof setTimeout> | null = null;

export const logIssue = (
  severity: IssueSeverity,
  message: string,
  element?: Element | null,
  recommendation?: string,
  wcagPrinciple?: string,
  wcagGuideline?: string,
  isAutofixed: boolean = false,
  wcagLevel: WCAGLevel = "A",
): AccessibilityIssue => {
  const issue: AccessibilityIssue = {
    severity,
    message,
    element,
    recommendation,
    wcagPrinciple,
    wcagGuideline,
    wcagLevel,
    isAutofixed,
    timestamp: Date.now(),
  };

  issuesLog.push(issue);

  if (isAutofixed) {
    autoFixedCount++;
  }

  return issue;
};

export const setAttributeAndLog = (
  element: Element,
  attr: string,
  value: string,
  severity: IssueSeverity,
  message: string,
  recommendation: string,
  wcagPrinciple: string,
  wcagGuideline: string,
  wcagLevel: WCAGLevel = "A",
): number => {
  try {
    element.setAttribute(attr, value);
    logIssue(
      severity,
      message,
      element,
      recommendation,
      wcagPrinciple,
      wcagGuideline,
      true,
      wcagLevel,
    );
    return 1;
  } catch (e) {
    console.error("setAttribute Error:", element, attr, e);
    return 0;
  }
};

export const applyStylesAndLog = (
  element: Element,
  styles: Record<string, string>,
  severity: IssueSeverity,
  message: string,
  recommendation: string,
  wcagPrinciple: string,
  wcagGuideline: string,
  wcagLevel: WCAGLevel = "A",
): number => {
  try {
    const htmlElement: HTMLElement = element as HTMLElement;
    for (const prop in styles) {
      htmlElement.style.setProperty(prop, styles[prop]);
    }
    logIssue(
      severity,
      message,
      element,
      recommendation,
      wcagPrinciple,
      wcagGuideline,
      true,
      wcagLevel,
    );
    return 1;
  } catch (e) {
    console.error("applyStyles Error:", element, styles, e);
    return 0;
  }
};

export const clearIssues = (): void => {
  issuesLog = [];
  autoFixedCount = 0;
};

export const getIssues = (): AccessibilityIssue[] => {
  return [...issuesLog];
};

export class AccessibilityScanner {
  private options: Required<ScannerOptions>;
  private mutationObserver: MutationObserver | null = null;

  constructor(options: ScannerOptions = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  async scan(root: Element | Document = document): Promise<ScanReport> {
    const startTime: number = performance.now();
    clearIssues();

    const report: ScanReport = {
      issues: [],
      totalIssues: 0,
      autoFixedCount: 0,
      unresolvedCount: 0,
      bySeverity: {
        Critical: [],
        Moderate: [],
        Minor: [],
        Info: [],
      },
      byLevel: {
        A: [],
        AA: [],
        AAA: [],
        User: [],
      },
      duration: 0,
      timestamp: Date.now(),
    };

    if (this.options.includeShadowDOM) {
      report.shadowDOMInfo = traverseShadowDOM(root, {
        maxDepth: this.options.maxShadowDepth,
      });

      if (
        report.shadowDOMInfo.shadowRootsCount > 0 &&
        this.options.logResults
      ) {
        console.log(
          `%c[Shadow DOM] Found ${report.shadowDOMInfo.shadowRootsCount} shadow root(s), max depth: ${report.shadowDOMInfo.maxDepthReached}`,
          "color: #6a1b9a",
        );
      }
    }

    report.ariaValidation = validateARIAReferences(
      root,
      this.options.includeShadowDOM,
    );

    for (const result of report.ariaValidation.missingTargets) {
      logIssue(
        "Moderate",
        result.errorMessage || `Invalid ARIA reference: ${result.attribute}`,
        result.element,
        `Ensure the element with id="${result.missingIds.join(", ")}" exists in the DOM.`,
        "Robust",
        "4.1.2",
        false,
        "A",
      );
    }

    report.wcag22Results = runWCAG22Checks(root, this.options.includeShadowDOM);
    const wcag22Issues: Array<AccessibilityIssue> =
      convertToAccessibilityIssues(report.wcag22Results);

    for (const issue of wcag22Issues) {
      logIssue(
        issue.severity,
        issue.message,
        issue.element,
        issue.recommendation,
        issue.wcagPrinciple,
        issue.wcagGuideline,
        issue.isAutofixed,
        issue.wcagLevel,
      );
    }

    if (this.options.logResults) {
      const summary: {
        total: number;
        passed: number;
        failed: number;
        targetSizeIssues: number;
        focusAppearanceIssues: number;
      } = getWCAG22Summary(report.wcag22Results);
      console.log(
        `%c[WCAG 2.2] Checked ${summary.total} criteria: ${summary.passed} passed, ${summary.failed} failed`,
        summary.failed > 0 ? "color: #c62828" : "color: #2e7d32",
      );

      if (summary.targetSizeIssues > 0) {
        console.log(
          `  - Target Size (2.5.8) issues: ${summary.targetSizeIssues}`,
        );
      }
      if (summary.focusAppearanceIssues > 0) {
        console.log(
          `  - Focus Appearance (2.4.11) issues: ${summary.focusAppearanceIssues}`,
        );
      }
    }

    report.issues = getIssues();
    report.totalIssues = report.issues.length;
    report.autoFixedCount = autoFixedCount;
    report.unresolvedCount = report.issues.filter(
      (i: AccessibilityIssue): boolean => !i.isAutofixed,
    ).length;

    for (const issue of report.issues) {
      report.bySeverity[issue.severity].push(issue);
      if (issue.wcagLevel) {
        report.byLevel[issue.wcagLevel].push(issue);
      }
    }

    report.duration = performance.now() - startTime;

    if (this.options.logResults) {
      this.logReport(report);
    }

    return report;
  }

  private logReport(report: ScanReport): void {
    console.log(
      "\n%c Accessibility Scan Report ",
      "font-size:1.3em;font-weight:bold;color:#003973;padding:5px;background:#e3f2fd;border-bottom:2px solid #003973;",
    );
    console.log(
      `%cTotal Issues: %c${report.totalIssues}`,
      "font-weight:bold;",
      "font-weight:normal;",
    );
    console.log(
      `%cAuto-Fixed: %c${report.autoFixedCount}`,
      "font-weight:bold;color:green;",
      `font-weight:normal;color:${report.autoFixedCount > 0 ? "green" : "grey"};`,
    );
    console.log(
      `%cUnresolved: %c${report.unresolvedCount}`,
      "font-weight:bold;color:red;",
      `font-weight:normal;color:${report.unresolvedCount > 0 ? "red" : "green"};`,
    );
    console.log(
      `%cScan Duration: %c${report.duration.toFixed(2)}ms`,
      "font-weight:bold;",
      "font-weight:normal;",
    );

    const severities: IssueSeverity[] = [
      "Critical",
      "Moderate",
      "Minor",
      "Info",
    ];
    const colorMap: Record<IssueSeverity, string> = {
      Critical: "#c62828",
      Moderate: "#ef6c00",
      Minor: "#0277bd",
      Info: "#546e7a",
    };

    for (const severity of severities) {
      const issues: Array<AccessibilityIssue> = report.bySeverity[
        severity
      ].filter((i: AccessibilityIssue): boolean => !i.isAutofixed);
      if (issues.length > 0) {
        console.groupCollapsed(
          `%c ${severity}: ${issues.length} `,
          `color:white;background-color:${colorMap[severity]};padding:3px 7px;border-radius:3px;font-weight:bold;`,
        );

        for (const issue of issues) {
          console.log(`%cMessage: %c${issue.message}`, "font-weight:bold;", "");
          if (issue.element)
            console.log("%cElement:", "font-style:italic;", issue.element);
          if (issue.recommendation)
            console.log(
              `%cRecommendation: %c${issue.recommendation}`,
              "font-style:italic;color:#01579b;",
              "",
            );
          if (issue.wcagGuideline)
            console.log(
              `%cWCAG: %c${issue.wcagGuideline} (${issue.wcagLevel})`,
              "font-style:italic;color:#311b92;",
              "",
            );
          console.log("---");
        }

        console.groupEnd();
      }
    }

    if (report.unresolvedCount === 0) {
      console.log(
        "%c🎉 No unresolved accessibility issues found!",
        "color:green;font-weight:bold;font-size:1.1em;",
      );
    }
  }

  setupMutationObserver(callback?: (report: ScanReport) => void): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }

    this.mutationObserver = new MutationObserver((): void => {
      if (mutationDebounceTimeout) {
        clearTimeout(mutationDebounceTimeout);
      }

      mutationDebounceTimeout = setTimeout(async (): Promise<void> => {
        console.warn(
          "%cDOM has changed. Re-running accessibility scan...",
          "color:orange;font-weight:bold;",
        );
        const report: ScanReport = await this.scan();
        if (callback) {
          callback(report);
        }
      }, this.options.mutationDebounceMs);
    });

    this.mutationObserver.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
      attributeFilter: [
        "style",
        "class",
        "alt",
        "href",
        "role",
        "tabindex",
        "aria-hidden",
        "aria-label",
        "id",
        "for",
        "value",
        "src",
        "lang",
        "title",
      ],
    });
  }

  disconnectMutationObserver(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }
}

export const quickScan = async (
  options: ScannerOptions = {},
): Promise<ScanReport> => {
  const scanner: AccessibilityScanner = new AccessibilityScanner(options);
  return scanner.scan();
};

export const exportIssues = (): AccessibilityIssue[] => {
  return getIssues();
};

export type { AccessibilityIssue, IssueSeverity, WCAGLevel };
