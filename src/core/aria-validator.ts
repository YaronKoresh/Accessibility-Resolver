import {
  getRootNode,
  isInShadowDOM,
  querySelectorAllWithShadow,
} from "./shadow-dom";

export const ARIA_ID_REFERENCE_ATTRIBUTES = [
  "aria-activedescendant",
  "aria-controls",
  "aria-describedby",
  "aria-details",
  "aria-errormessage",
  "aria-flowto",
  "aria-labelledby",
  "aria-owns",
] as const;

export const ARIA_MULTI_ID_REFERENCE_ATTRIBUTES = [
  "aria-controls",
  "aria-describedby",
  "aria-flowto",
  "aria-labelledby",
  "aria-owns",
] as const;

export interface ARIAValidationResult {
  isValid: boolean;

  attribute: string;

  element: Element;

  referencedIds: string[];

  missingIds: string[];

  foundIds: string[];

  crossesShadowBoundary: boolean;

  errorMessage?: string;
}

export interface ARIAValidationReport {
  results: ARIAValidationResult[];

  elementsChecked: number;

  validCount: number;

  invalidCount: number;

  missingTargets: ARIAValidationResult[];

  shadowBoundaryCrossings: ARIAValidationResult[];
}

const findElementById = (
  id: string,
  contextElement: Element,
): Element | null => {
  const root: Document | ShadowRoot = getRootNode(contextElement);

  const element: HTMLElement =
    root.getElementById?.(id) ||
    (root as Document | ShadowRoot).querySelector?.(`#${CSS.escape(id)}`);

  if (element) {
    return element;
  }

  if (isInShadowDOM(contextElement)) {
    return document.getElementById(id);
  }

  return null;
};

export const validateARIAReference = (
  element: Element,
  attribute: (typeof ARIA_ID_REFERENCE_ATTRIBUTES)[number],
): ARIAValidationResult => {
  const value: string = element.getAttribute(attribute);

  const result: ARIAValidationResult = {
    isValid: true,
    attribute,
    element,
    referencedIds: [],
    missingIds: [],
    foundIds: [],
    crossesShadowBoundary: false,
  };

  if (!value || value.trim() === "") {
    return result;
  }

  const isMultiRef: boolean = (
    ARIA_MULTI_ID_REFERENCE_ATTRIBUTES as readonly string[]
  ).includes(attribute);
  const ids: Array<string> = isMultiRef
    ? value
        .trim()
        .split(/\s+/)
        .filter((id: string): boolean => id.length > 0)
    : [value.trim()];

  result.referencedIds = ids;

  for (const id of ids) {
    const referencedElement: Element = findElementById(id, element);

    if (referencedElement) {
      result.foundIds.push(id);

      const elementRoot: Document | ShadowRoot = getRootNode(element);
      const referencedRoot: Document | ShadowRoot =
        getRootNode(referencedElement);

      if (elementRoot !== referencedRoot) {
        result.crossesShadowBoundary = true;
      }
    } else {
      result.missingIds.push(id);
      result.isValid = false;
    }
  }

  if (result.missingIds.length > 0) {
    result.errorMessage = `ARIA reference "${attribute}" points to non-existent ID(s): ${result.missingIds.join(", ")}`;
  }

  return result;
};

export const validateElementARIAReferences = (
  element: Element,
): ARIAValidationResult[] => {
  const results: ARIAValidationResult[] = [];

  for (const attr of ARIA_ID_REFERENCE_ATTRIBUTES) {
    if (element.hasAttribute(attr)) {
      results.push(validateARIAReference(element, attr));
    }
  }

  return results;
};

export const validateARIAReferences = (
  root: Element | Document = document,
  includeShadowDOM: boolean = true,
): ARIAValidationReport => {
  const report: ARIAValidationReport = {
    results: [],
    elementsChecked: 0,
    validCount: 0,
    invalidCount: 0,
    missingTargets: [],
    shadowBoundaryCrossings: [],
  };

  const selector: string = ARIA_ID_REFERENCE_ATTRIBUTES.map(
    (
      attr:
        | "aria-activedescendant"
        | "aria-controls"
        | "aria-describedby"
        | "aria-details"
        | "aria-errormessage"
        | "aria-flowto"
        | "aria-labelledby"
        | "aria-owns",
    ): string => `[${attr}]`,
  ).join(", ");

  const elements: Array<Element> = includeShadowDOM
    ? querySelectorAllWithShadow(selector, root)
    : Array.from(
        (root instanceof Document ? root : root).querySelectorAll(selector),
      );

  for (const element of elements) {
    report.elementsChecked++;
    const elementResults: Array<ARIAValidationResult> =
      validateElementARIAReferences(element);

    for (const result of elementResults) {
      report.results.push(result);

      if (result.isValid) {
        report.validCount++;
      } else {
        report.invalidCount++;
        report.missingTargets.push(result);
      }

      if (result.crossesShadowBoundary) {
        report.shadowBoundaryCrossings.push(result);
      }
    }
  }

  return report;
};

export const validateAriaLabelledby = (
  element: Element,
): {
  isValid: boolean;
  text: string;
  missingIds: string[];
} => {
  const labelledby: string = element.getAttribute("aria-labelledby");

  if (!labelledby) {
    return { isValid: false, text: "", missingIds: [] };
  }

  const ids: Array<string> = labelledby
    .trim()
    .split(/\s+/)
    .filter((id: string): boolean => id.length > 0);
  const textParts: string[] = [];
  const missingIds: string[] = [];

  for (const id of ids) {
    const referencedElement: Element = findElementById(id, element);
    if (referencedElement) {
      const text: string = referencedElement.textContent?.trim() || "";
      if (text) {
        textParts.push(text);
      }
    } else {
      missingIds.push(id);
    }
  }

  return {
    isValid: missingIds.length === 0 && textParts.length > 0,
    text: textParts.join(" "),
    missingIds,
  };
};

export const validateAriaDescribedby = (
  element: Element,
): {
  isValid: boolean;
  text: string;
  missingIds: string[];
} => {
  const describedby: string = element.getAttribute("aria-describedby");

  if (!describedby) {
    return { isValid: false, text: "", missingIds: [] };
  }

  const ids: Array<string> = describedby
    .trim()
    .split(/\s+/)
    .filter((id: string): boolean => id.length > 0);
  const textParts: string[] = [];
  const missingIds: string[] = [];

  for (const id of ids) {
    const referencedElement: Element = findElementById(id, element);
    if (referencedElement) {
      const text: string = referencedElement.textContent?.trim() || "";
      if (text) {
        textParts.push(text);
      }
    } else {
      missingIds.push(id);
    }
  }

  return {
    isValid: missingIds.length === 0,
    text: textParts.join(" "),
    missingIds,
  };
};

export const repairARIAReference = (
  element: Element,
  attribute: (typeof ARIA_ID_REFERENCE_ATTRIBUTES)[number],
): string | null => {
  const validation: ARIAValidationResult = validateARIAReference(
    element,
    attribute,
  );

  if (validation.isValid) {
    return element.getAttribute(attribute);
  }

  if (validation.foundIds.length === 0) {
    element.removeAttribute(attribute);
    return null;
  }

  const repairedValue: string = validation.foundIds.join(" ");
  element.setAttribute(attribute, repairedValue);
  return repairedValue;
};

export const repairElementARIAReferences = (element: Element): string[] => {
  const repairedAttributes: string[] = [];

  for (const attr of ARIA_ID_REFERENCE_ATTRIBUTES) {
    if (element.hasAttribute(attr)) {
      const originalValue: string = element.getAttribute(attr);
      const repairedValue: string = repairARIAReference(element, attr);

      if (repairedValue !== originalValue) {
        repairedAttributes.push(attr);
      }
    }
  }

  return repairedAttributes;
};
