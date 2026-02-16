export interface ShadowDOMTraversalOptions {
  maxDepth?: number;

  openOnly?: boolean;

  selector?: string;

  callback?: (
    element: Element,
    shadowRoot: ShadowRoot | null,
    depth: number,
  ) => void;
}

export interface ShadowDOMTraversalResult {
  elements: Element[];

  shadowContextMap: Map<Element, ShadowRoot | null>;

  shadowRootsCount: number;

  maxDepthReached: number;
}

export const getShadowRoot = (element: Element): ShadowRoot | null => {
  try {
    return element.shadowRoot;
  } catch {
    return null;
  }
};

export const hasOpenShadowRoot = (element: Element): boolean => {
  return getShadowRoot(element) !== null;
};

export const traverseShadowDOM = (
  root: Element | Document = document,
  options: ShadowDOMTraversalOptions = {},
): ShadowDOMTraversalResult => {
  const { maxDepth = 10, selector, callback } = options;

  const result: ShadowDOMTraversalResult = {
    elements: [],
    shadowContextMap: new Map(),
    shadowRootsCount: 0,
    maxDepthReached: 0,
  };

  const traverse = (
    node: Element | Document | ShadowRoot,
    shadowRoot: ShadowRoot | null,
    depth: number,
  ): void => {
    if (depth > maxDepth) return;

    result.maxDepthReached = Math.max(result.maxDepthReached, depth);

    const elements: Array<Element> = selector
      ? Array.from(node.querySelectorAll(selector))
      : Array.from(node.querySelectorAll("*"));

    for (const element of elements) {
      result.elements.push(element);
      result.shadowContextMap.set(element, shadowRoot);

      if (callback) {
        callback(element, shadowRoot, depth);
      }

      const nestedShadowRoot: ShadowRoot = getShadowRoot(element);
      if (nestedShadowRoot) {
        result.shadowRootsCount++;
        traverse(nestedShadowRoot, nestedShadowRoot, depth + 1);
      }
    }
  };

  const rootElement: Element =
    root instanceof Document ? root.documentElement : root;

  if (rootElement instanceof Element) {
    const rootShadow: ShadowRoot = getShadowRoot(rootElement);
    if (rootShadow) {
      result.shadowRootsCount++;
      traverse(rootShadow, rootShadow, 1);
    }
  }

  traverse(root, null, 0);

  return result;
};

export const querySelectorAllWithShadow = (
  selector: string,
  root: Element | Document = document,
): Element[] => {
  const result: ShadowDOMTraversalResult = traverseShadowDOM(root, {
    selector,
  });
  return result.elements;
};

export const getInteractiveElementsWithShadow = (
  root: Element | Document = document,
): Element[] => {
  const interactiveSelector =
    'button, a[href], input:not([type="hidden"]), select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="option"], [role="menuitem"], [role="tab"], [role="treeitem"], [role="slider"], [role="spinbutton"], [role="switch"], [tabindex]:not([tabindex="-1"])' as const;

  return querySelectorAllWithShadow(interactiveSelector, root);
};

export const getHeadingElementsWithShadow = (
  root: Element | Document = document,
): Element[] => {
  return querySelectorAllWithShadow("h1, h2, h3, h4, h5, h6", root);
};

export const getFormElementsWithShadow = (
  root: Element | Document = document,
): Element[] => {
  return querySelectorAllWithShadow(
    'input:not([type="hidden"]), select, textarea',
    root,
  );
};

export const getImageElementsWithShadow = (
  root: Element | Document = document,
): Element[] => {
  return querySelectorAllWithShadow('img, svg, [role="img"]', root);
};

export const getLandmarkElementsWithShadow = (
  root: Element | Document = document,
): Element[] => {
  const landmarkSelector =
    'main, header, footer, nav, aside, [role="main"], [role="banner"], [role="contentinfo"], [role="navigation"], [role="complementary"], [role="region"], [role="search"]' as const;
  return querySelectorAllWithShadow(landmarkSelector, root);
};

export const findShadowContext = (
  element: Element,
  traversalResult: ShadowDOMTraversalResult,
): ShadowRoot | null => {
  return traversalResult.shadowContextMap.get(element) ?? null;
};

export const isInShadowDOM = (element: Element): boolean => {
  let node: Node | null = element;
  while (node) {
    if (node instanceof ShadowRoot) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
};

export const getShadowHost = (element: Element): Element | null => {
  let node: Node | null = element;
  while (node) {
    if (node instanceof ShadowRoot) {
      return node.host;
    }
    node = node.parentNode;
  }
  return null;
};

export const getRootNode = (element: Element): Document | ShadowRoot => {
  return element.getRootNode() as Document | ShadowRoot;
};
