(function() {
    console.log(
        "%c Author: Yaron Koresh ",
        "background: #4CAF50; color: white; font-size: 1.5em; font-weight: bold; padding: 10px 20px; border-radius: 5px;"
    );

    const MIN_INTERACTIVE_SIZE = 24;
    const WCAG_CONTRAST_AA_NORMAL = 4.5;
    const WCAG_CONTRAST_AA_LARGE = 3.0;
    const LARGE_TEXT_MIN_PX = 24;
    const LARGE_TEXT_MIN_BOLD_PX = 18.66;

    const results = [];
    const issueSeverities = {
        'Critical': '❌ Critical:',
        'Moderate': '⚠️ Moderate:',
        'Minor': '💡 Minor:',
        'Info': 'ℹ️ Info:'
    };

    function logSection(title) {
        console.groupCollapsed(`%c--- ${title} ---`, 'font-weight: bold; color: #0056b3;');
    }

    let issueCounter = 0;
    function generateIssueId() {
        return `issue-${++issueCounter}`;
    }

    function logIssue(severity, message, element = null, recommendation = '', wcagPrinciple = '', wcagGuideline = '', isAutofixed = false) {
        const issueId = generateIssueId();
        const issue = { issueId, severity, message, element, recommendation, wcagPrinciple, wcagGuideline, isAutofixed };
        results.push(issue);
        const prefix = isAutofixed ? '✅ Auto-Fixed: ' : issueSeverities[severity] || '';
        console.warn(`${prefix} ${message}`);
        if (element instanceof HTMLElement) {
            console.warn(`    Identified element:`, element);
        } else if (typeof element === 'string') {
            console.warn(`    Context: ${element}`);
        }
        if (recommendation) {
            console.warn(`    Recommendation: ${recommendation}`);
        }
        if (wcagGuideline) {
            console.warn(`    WCAG Guideline: ${wcagGuideline}`);
        }
    }

    function hasAccessibleName(el) {
        if (el.hasAttribute('aria-label') && el.getAttribute('aria-label').trim().length > 0) return true;
        if (el.hasAttribute('aria-labelledby')) {
            const labelledByIds = el.getAttribute('aria-labelledby').split(/\s+/);
            for (const id of labelledByIds) {
                const labelledByEl = document.getElementById(id);
                if (labelledByEl && labelledByEl.textContent.trim().length > 0) return true;
            }
        }

        const tagName = el.tagName;

        if (tagName === 'BUTTON' || (tagName === 'INPUT' && (el.type === 'submit' || el.type === 'reset'))) {
            if (el.textContent.trim().length > 0 || (el.value && el.value.trim().length > 0)) return true;
        }
        if (tagName === 'A') {
            if (el.textContent.trim().length > 0) return true;
            const imgChild = el.querySelector('img');
            if (imgChild && imgChild.alt && imgChild.alt.trim().length > 0) return true;
        }
        if (tagName === 'IMG' && el.alt && el.alt.trim().length > 0) return true;
        if (tagName === 'INPUT' && el.type === 'image' && el.alt && el.alt.trim().length > 0) return true;
        if (tagName === 'FIGURE' && el.querySelector('figcaption') && el.querySelector('figcaption').textContent.trim().length > 0) return true;
        if ((tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA') && el.id) {
            const labels = document.querySelectorAll(`label[for="${el.id}"]`);
            if (labels.length > 0 && Array.from(labels).some(label => label.textContent.trim().length > 0)) return true;
        }

        if (el.hasAttribute('title') && el.getAttribute('title').trim().length > 0) return true;

        return false;
    }

    function parseRgb(rgbString) {
        const match = rgbString.match(/\d+/g);
        return match ? match.map(Number) : [0, 0, 0];
    }

    function parseColorToRgba(colorString) {
        const div = document.createElement('div');
        div.style.color = 'rgb(0,0,0)';
        div.style.backgroundColor = 'rgb(0,0,0)';
        div.style.display = 'none';
        document.body.appendChild(div);

        try {
            div.style.color = colorString;
            const computedColor = window.getComputedStyle(div).color;
            const rgbaMatch = computedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/);
            if (rgbaMatch) {
                return [
                    parseInt(rgbaMatch[1]),
                    parseInt(rgbaMatch[2]),
                    parseInt(rgbaMatch[3]),
                    rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1
                ];
            }
        } catch (e) {
        } finally {
            document.body.removeChild(div);
        }
        return [0, 0, 0, 1];
    }


    function getLuminance(rgb) {
        const [r, g, b] = rgb.map(val => {
            val /= 255;
            return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    function getContrastRatio(rgb1, rgb2) {
        const lum1 = getLuminance(rgb1);
        const lum2 = getLuminance(rgb2);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
    }

    function getEffectiveBackgroundColor(el) {
        let currentEl = el;
        while (currentEl && currentEl !== document.documentElement) {
            const style = window.getComputedStyle(currentEl);
            const bgColor = style.backgroundColor;

            if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                const rgba = parseColorToRgba(bgColor);
                if (rgba[3] === 1) {
                    return rgba.slice(0, 3);
                }
            }
            currentEl = currentEl.parentElement;
        }

        const bodyStyle = window.getComputedStyle(document.body);
        const bodyBgColor = bodyStyle.backgroundColor;
        if (bodyBgColor && bodyBgColor !== 'rgba(0, 0, 0, 0)' && bodyBgColor !== 'transparent') {
            const rgba = parseColorToRgba(bodyBgColor);
            if (rgba[3] === 1) {
                return rgba.slice(0, 3);
            }
        }

        return [255, 255, 255];
    }

    function isLargeText(el) {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        const fontWeight = parseInt(style.fontWeight);

        return (fontSize >= LARGE_TEXT_MIN_PX) ||
               (fontSize >= LARGE_TEXT_MIN_BOLD_PX && (fontWeight >= 600 || style.fontWeight === 'bold'));
    }

    function checkContentStructure() {
        logSection("1. Structure and Relationships (Visual vs. Coded Structure)");
        let issuesFound = 0;
        let fixedCount = 0;

        document.querySelectorAll('div, span, p').forEach(el => {
            try {
                const style = window.getComputedStyle(el);
                const fontSize = parseFloat(style.fontSize);
                const fontWeight = parseInt(style.fontWeight);
                const isHeadingTag = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(el.tagName);
                const hasHeadingRole = el.hasAttribute('role') && el.getAttribute('role') === 'heading';

                if (fontSize >= 20 && (fontWeight >= 600 || style.fontWeight === 'bold') && !isHeadingTag && el.textContent.trim().length > 0) {
                    if (!hasHeadingRole) {
                        el.setAttribute('role', 'heading');
                        el.setAttribute('aria-level', '2');
                        logIssue('Moderate', 'Element appears as a heading (font size/weight) but is not a semantic heading tag. Auto-fixed by adding `role="heading"` and `aria-level="2"`.', el, 'Use appropriate H1-H6 tags hierarchically to define document structure, ensuring they reflect the visual hierarchy. If using ARIA, ensure `aria-level` is semantically correct.', 'Operable', '2.4.6 Headings and Labels', true);
                        fixedCount++;
                    } else {
                        logIssue('Moderate', 'Element appears as a heading (font size/weight) but is not a semantic heading tag (Hx).', el, 'Use appropriate H1-H6 tags hierarchically to define document structure, ensuring they reflect the visual hierarchy.', 'Operable', '2.4.6 Headings and Labels');
                        issuesFound++;
                    }
                }
            } catch (e) {
                console.error("Error checking heading structure:", e, el);
            }
        });
        document.querySelectorAll('div, p').forEach(el => {
            try {
                const textContent = el.textContent.trim();
                const parentTag = el.parentElement ? el.parentElement.tagName : '';
                const isListItemText = textContent.startsWith('•') || textContent.startsWith('- ') || /^\d+\.\s/.test(textContent);
                const isSemanticListParent = ['UL', 'OL', 'LI', 'DL'].includes(parentTag);

                if (isListItemText && !isSemanticListParent && textContent.length > 5) {
                    logIssue('Moderate', 'Appears as a list item (bullets/numbers) but is not within a semantic list tag (UL/OL/LI).', el, 'Use `<ul>`, `<ol>`, and `<li>` tags for lists to convey semantic meaning to assistive technologies.', 'Perceivable', '1.3.1 Info and Relationships');
                    issuesFound++;
                }
            } catch (e) {
                console.error("Error checking list structure:", e, el);
            }
        });
        if (issuesFound === 0 && fixedCount === 0) {
            console.log("✅ No visual structure issues without semantic coding found (heuristic check only).");
        } else if (issuesFound > 0) {
            logIssue('Critical', `Found ${issuesFound} potential cases of visual structure without semantic coding.`, null, 'Manually review the page structure and ensure all visual relationships are semantically coded using appropriate HTML5 and ARIA roles. Consider using a tool like the W3C Nu Html Checker for validation.', 'Perceivable', '1.3.1 Info and Relationships');
        }
        console.groupEnd();
    }

    function checkMediaIntegrity() {
        logSection("2. Missing/Broken Elements Check");
        let issuesFound = 0;
        let fixedCount = 0;

        const brokenImages = Array.from(document.querySelectorAll('img')).filter(img => {
            try {
                return !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0;
            } catch (e) {
                console.error("Error checking image:", e, img);
                return false;
            }
        });
        if (brokenImages.length > 0) {
            logIssue('Critical', `Found ${brokenImages.length} broken or improperly loaded images.`, brokenImages[0], 'Verify image source paths are correct. For meaningful images, provide concise and descriptive `alt` text. For decorative images, use `alt=""` or CSS background-image.', 'Perceivable', '1.1.1 Non-text Content');
            issuesFound += brokenImages.length;
        } else {
            console.log("✅ All images loaded correctly.");
        }

        document.querySelectorAll('a[href]').forEach(a => {
            try {
                const href = a.getAttribute('href');
                const textContent = a.textContent.trim();
                const hasImgChild = a.querySelector('img') !== null;
                const hasAriaLabel = a.hasAttribute('aria-label') && a.getAttribute('aria-label').trim().length > 0;

                const isEffectivelyEmpty = (href === null || href.trim() === '' || href.trim() === '#') &&
                                           textContent.length === 0 &&
                                           !hasImgChild &&
                                           !hasAriaLabel;

                if (isEffectivelyEmpty) {
                    const rect = a.getBoundingClientRect();
                    const isSmall = rect.width > 0 && rect.height > 0 && (rect.width < 10 || rect.height < 10);

                    if (isSmall) {
                        a.setAttribute('aria-hidden', 'true');
                        logIssue('Minor', `Empty or hash link appears decorative. Auto-fixed by adding \`aria-hidden="true"\`.`, a, 'For purely decorative links, `aria-hidden="true"` can hide them from screen readers. For functional links, ensure they have a clear accessible name.', 'Perceivable', '2.4.4 Link Purpose (In Context)', true);
                        fixedCount++;
                    } else {
                        logIssue('Critical', `Empty or hash link without accessible name.`, a, 'Ensure all links have a clear, accessible name. This can be text content, an `<img>` with `alt` text, `aria-label`, or `aria-labelledby`.', 'Perceivable', '2.4.4 Link Purpose (In Context)');
                        issuesFound++;
                    }
                }
            } catch (e) {
                console.error("Error checking link:", e, a);
            }
        });
        if (issuesFound === 0 && fixedCount === 0) {
            console.log("✅ No empty links found.");
        } else if (issuesFound > 0) {
            logIssue('Critical', `Found ${issuesFound} empty links without accessible names.`, null, 'Ensure all links have a clear, accessible name.', 'Perceivable', '2.4.4 Link Purpose (In Context)');
        }
        console.groupEnd();
    }

    function checkOverlayFocusBlocking() {
        logSection("3. Overlapping Elements (Modals/Popups) Check");
        let issuesFound = 0;

        document.querySelectorAll('body > div, body > section, body > aside, [role="dialog"], [role="alertdialog"]').forEach(el => {
            try {
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();

                const isOverlayCandidate = (style.position === 'fixed' || style.position === 'absolute') &&
                                           (rect.width >= window.innerWidth * 0.8 || rect.height >= window.innerHeight * 0.8) &&
                                           parseFloat(style.zIndex) > 0 &&
                                           style.display !== 'none' &&
                                           style.visibility !== 'hidden';

                const hasAriaModal = el.getAttribute('aria-modal') === 'true';
                const hasRoleDialogOrAlertDialog = el.getAttribute('role') === 'dialog' || el.getAttribute('role') === 'alertdialog';
                if (isOverlayCandidate && (!hasAriaModal || !hasRoleDialogOrAlertDialog)) {
                    logIssue('Critical', 'Found a fixed/absolute positioned element that covers most of the screen. It might be a modal that blocks focus and does not have aria-modal="true" or role="dialog/alertdialog".', el, 'Implement `aria-modal=\'true\'` and `role=\'dialog\'` or `role=\'alertdialog\'` on modal elements. Crucially, ensure focus is trapped within the modal when open and restored to the trigger element when closed. Allow dismissal via the ESC key.', 'Operable', '2.4.3 Focus Order, 2.4.7 Focus Visible');
                    issuesFound++;
                } else if (isOverlayCandidate && hasAriaModal && hasRoleDialogOrAlertDialog) {
                    console.log(`💡 Appears to be a valid modal with aria-modal="true" and role. Manual focus management check is required (Focus Trap, Esc key).`, el);
                }
            } catch (e) {
                console.error("Error checking modals:", e, el);
            }
        });

        if (issuesFound === 0) {
            console.log("✅ No prominent overlapping elements that might block focus found (heuristic check only).");
        } else {
            logIssue('Critical', `Found ${issuesFound} potential overlapping elements without appropriate accessibility settings.`, null, 'Manual focus management check is required for modals/popups.', 'Operable', '2.4.3 Focus Order, 2.4.7 Focus Visible');
        }
        console.groupEnd();
    }

    function checkInteractiveElementSize() {
        logSection("4. Interactive Element Size Check");
        let issuesFound = 0;
        let fixedCount = 0;
        const interactiveSelectors = 'button, a[href], input:not([type="hidden"]), select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="option"], [tabindex]:not([tabindex="-1"])';
        document.querySelectorAll(interactiveSelectors).forEach(el => {
            try {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0 && (rect.width < MIN_INTERACTIVE_SIZE || rect.height < MIN_INTERACTIVE_SIZE)) {
                    el.style.setProperty('min-width', `${MIN_INTERACTIVE_SIZE}px`, 'important');
                    el.style.setProperty('min-height', `${MIN_INTERACTIVE_SIZE}px`, 'important');
                    logIssue('Moderate', `Interactive element is smaller than ${MIN_INTERACTIVE_SIZE}x${MIN_INTERACTIVE_SIZE} pixels. Auto-fixed by setting \`min-width\` and \`min-height\` to ${MIN_INTERACTIVE_SIZE}px.`, el, 'Increase the clickable/tappable area to at least 24x24 pixels using CSS properties like `padding`, `min-width`, or `min-height` to improve usability for all users, especially on touch devices.', 'Operable', '2.5.5 Target Size', true);
                    fixedCount++;
                }
            } catch (e) {
                console.error("Error checking element size:", e, el);
            }
        });
        if (issuesFound === 0 && fixedCount === 0) {
            console.log(`✅ All interactive elements meet the minimum size of ${MIN_INTERACTIVE_SIZE}x${MIN_INTERACTIVE_SIZE} pixels.`);
        } else if (issuesFound > 0) {
            logIssue('Moderate', `Found ${issuesFound} interactive elements smaller than ${MIN_INTERACTIVE_SIZE}x${MIN_INTERACTIVE_SIZE} pixels.`, null, 'Ensure every interactive element has sufficient touch/click area.', 'Operable', '2.5.5 Target Size');
        }
        console.groupEnd();
    }

    function checkHoverFocusContent() {
        logSection("5. Content on Hover/Focus Check");
        let issuesFoundAutomated = 0;
        let fixedCount = 0;

        const triggerSelectors = 'button, a[href], [role="button"], [role="link"], [role="menuitem"], [role="option"], [role="tab"]';
        document.querySelectorAll(triggerSelectors).forEach(el => {
            try {
                const hasPopup = el.hasAttribute('aria-haspopup');
                const isExpanded = el.hasAttribute('aria-expanded');
                const controlsElement = el.hasAttribute('aria-controls');

                if (hasPopup) {
                    const popupValue = el.getAttribute('aria-haspopup');
                    const validPopupValues = ['menu', 'listbox', 'tree', 'grid', 'dialog'];
                    if (!validPopupValues.includes(popupValue)) {
                        el.setAttribute('aria-haspopup', 'menu');
                        logIssue('Moderate', `Element with invalid \`aria-haspopup\` value: "${popupValue}". Auto-fixed by setting to "menu".`, el, 'Ensure `aria-haspopup` uses a valid value like `menu`, `listbox`, `tree`, `grid`, or `dialog`.', 'Operable', '4.1.2 Name, Role, Value', true);
                        fixedCount++;
                    }
                }

                if (controlsElement && !isExpanded) {
                    el.setAttribute('aria-expanded', 'false');
                    logIssue('Minor', `Element with \`aria-controls\` but missing \`aria-expanded\`. Auto-fixed by adding \`aria-expanded="false"\`.`, el, 'If this element controls expandable content, add `aria-expanded="false"` (or `true` if expanded by default) and update it dynamically with JavaScript.', 'Operable', '4.1.2 Name, Role, Value', true);
                    fixedCount++;
                }

                if (isExpanded && !controlsElement) {
                    logIssue('Minor', `Element with \`aria-expanded\` but missing \`aria-controls\`.`, el, 'If this element expands/collapses content, consider adding `aria-controls` to point to the ID of the controlled element.', 'Operable', '4.1.2 Name, Role, Value');
                    issuesFoundAutomated++;
                }

            } catch (e) {
                console.error("Error checking ARIA attributes for hover/focus content:", e, el);
            }
        });

        if (issuesFoundAutomated === 0 && fixedCount === 0) {
            console.log("✅ Automated check for ARIA attributes on hover/focus triggers found no immediate issues.");
        } else if (issuesFoundAutomated > 0) {
            logIssue('Moderate', `Found ${issuesFoundAutomated} potential ARIA attribute issues on elements that might trigger hover/focus content.`, null, 'Review these elements to ensure proper ARIA usage for content that appears on hover or focus.', 'Operable', '4.1.2 Name, Role, Value');
        }


        console.log("\n💡 **Manual Verification for Content on Hover/Focus is CRUCIAL:**");
        console.log("    This automated check is limited. The most reliable way to ensure accessible content on hover/focus is through thorough manual testing.");
        console.log("    **Perform the following manual steps for ALL content that appears on hover or focus (e.g., tooltips, dropdowns, sub-menus, pop-ups):");
        console.log("    - **Dismissible (WCAG 1.4.13):");
        console.log("        * Can you easily dismiss the content without moving pointer hover or keyboard focus, e.g., by pressing the ESC key?");
        console.log("        * Does it automatically dismiss when the content is no longer needed (e.g., when the user moves focus away from the trigger and the content)?");
        console.log("    - **Hoverable (WCAG 1.4.13):");
        console.log("        * If the content is triggered by mouse hover, can you move your mouse pointer from the trigger element to the newly revealed content without the content disappearing?");
        console.log("        * Can you then interact with the content (e.g., click links, fill fields) within the revealed area?");
        console.log("    - **Persistent (WCAG 1.4.13):");
        console.log("        * Does the content remain visible until the user dismisses it, or until its function is no longer relevant (e.g., when focus shifts away from both the trigger and the content)?");
        console.log("        * Does it disappear too quickly if the user moves focus or pointer slightly?");
        console.log("    - **Overall Experience:");
        console.log("        * Does the content appear clearly and is its text readable (consider using the contrast checker for its text content)?");
        console.log("        * If the revealed content contains interactive elements, can you navigate to them and interact with them using only the keyboard?");
        console.groupEnd();
    }

    function checkAutoFormSubmission() {
        logSection("6. Automatic Form Submission Check");
        let fixedCount = 0;
        document.querySelectorAll('form').forEach(form => {
            try {
                const onFocusAttr = form.getAttribute('onfocus');
                if (onFocusAttr && onFocusAttr.includes('submit()')) {
                    form.removeAttribute('onfocus');
                    logIssue('Minor', 'Form configured with onfocus that can lead to automatic submission. Auto-fixed by removing `onfocus` attribute.', form, 'Forms should only submit via an explicit user action, typically a dedicated submit button, to prevent unexpected data loss or navigation.', 'Operable', '3.2.2 On Input', true);
                    fixedCount++;
                }
                const onChangeAttr = form.getAttribute('onchange');
                if (onChangeAttr && onChangeAttr.includes('submit()')) {
                    form.removeAttribute('onchange');
                    logIssue('Minor', 'Form configured with onchange that can lead to automatic submission. Auto-fixed by removing `onchange` attribute.', form, 'Forms should only submit via an explicit user action, typically a dedicated submit button, to prevent unexpected data loss or navigation.', 'Operable', '3.2.2 On Input', true);
                    fixedCount++;
                }

                form.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(input => {
                    const inputOnFocusAttr = input.getAttribute('onfocus');
                    if (inputOnFocusAttr && inputOnFocusAttr.includes('submit()')) {
                        input.removeAttribute('onfocus');
                        logIssue('Minor', 'Input field configured with onfocus that can lead to automatic submission. Auto-fixed by removing `onfocus` attribute.', input, 'Forms should only submit via an explicit user action, typically a dedicated submit button, to prevent unexpected data loss or navigation.', 'Operable', '3.2.2 On Input', true);
                        fixedCount++;
                    }
                    const inputOnChangeAttr = input.getAttribute('onchange');
                    if (inputOnChangeAttr && inputOnChangeAttr.includes('submit()')) {
                        input.removeAttribute('onchange');
                        logIssue('Minor', 'Input field (or select) configured with onchange that can lead to automatic submission. Auto-fixed by removing `onchange` attribute.', input, 'Forms should only submit via an explicit user action, typically a dedicated submit button, to prevent unexpected data loss or navigation.', 'Operable', '3.2.2 On Input', true);
                        fixedCount++;
                    }
                });

                if (fixedCount === 0) {
                    console.log("✅ No forms/elements with automatic submission on focus/change found (heuristic check only).");
                }
            } catch (e) {
                console.error("Error checking automatic form submission:", e, form);
            }
        });
        console.groupEnd();
    }

    function checkDuplicateIds() {
        logSection("7. Duplicate ID Check");
        const seenIds = new Map();
        let fixedCount = 0;

        document.querySelectorAll('[id]').forEach(el => {
            try {
                const id = el.id;
                if (id) {
                    if (seenIds.has(id)) {
                        let newId = id;
                        let suffix = 1;
                        while (document.getElementById(newId) !== null) {
                            newId = `${id}_autofix_${suffix++}`;
                        }
                        el.id = newId;
                        logIssue('Moderate', `Duplicate ID found: "${id}". Auto-fixed by changing to "${newId}".`, el, 'Ensure all `id` attributes are unique across the entire document. Duplicate IDs can cause unpredictable behavior for JavaScript, CSS, and assistive technologies. Rename or generate unique IDs.', 'Robust', '4.1.1 Parsing', true);
                        fixedCount++;
                    } else {
                        seenIds.set(id, el);
                    }
                }
            } catch (e) {
                console.error("Error checking duplicate ID:", e, el);
            }
        });

        if (fixedCount === 0) {
            console.log("✅ No duplicate IDs found on the page.");
        }
        console.groupEnd();
    }

    function checkAccessibleNames() {
        logSection("8. Accessible Names for Interactive Elements Check");
        let issuesFound = 0;
        let fixedCount = 0;
        const interactiveElementsSelectors = 'button, a[href], input:not([type="hidden"]), select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="textbox"], [role="combobox"], [role="slider"], [role="img"]';

        document.querySelectorAll(interactiveElementsSelectors).forEach(el => {
            try {
                if (!hasAccessibleName(el)) {
                    const tagName = el.tagName.toLowerCase();
                    let genericLabel = `Unnamed ${tagName}`;
                    if (el.type) {
                        genericLabel = `Unnamed ${el.type} ${tagName}`;
                    }
                    if (el.placeholder && el.placeholder.trim().length > 0) {
                        genericLabel = el.placeholder.trim();
                    } else if (el.alt && el.alt.trim().length > 0) {
                        genericLabel = el.alt.trim();
                    }

                    el.setAttribute('aria-label', genericLabel);
                    logIssue('Minor', `Interactive element lacked an accessible name. Auto-fixed by adding \`aria-label="${genericLabel}"\`.`, el, 'Provide a clear accessible name for all interactive elements. This autofix provides a generic label; **manual review is highly recommended** to ensure semantic accuracy.', 'Perceivable', '2.4.4 Link Purpose (In Context), 4.1.2 Name, Role, Value', true);
                    fixedCount++;
                }
            } catch (e) {
                console.error("Error checking accessible name:", e, el);
            }
        });
        if (issuesFound === 0 && fixedCount === 0) {
            console.log("✅ All interactive elements have an accessible name.");
        } else if (issuesFound > 0) {
            logIssue('Critical', `Found ${issuesFound} interactive elements without an accessible name.`, null, 'This is a critical issue for screen reader users. It must be fixed.', 'Perceivable', '2.4.4 Link Purpose (In Context), 4.1.2 Name, Role, Value');
        }
        console.groupEnd();
    }

    function checkGeneralHealth() {
        logSection("9. Additional General Checks");
        console.log("💡 Check the console window (F12) for additional red errors or yellow warnings that may have occurred before or during script execution.");
        if (typeof jQuery !== 'undefined') {
            console.log(`✅ jQuery is available and loaded. Version: ${jQuery.fn.jquery}`);
        } else {
            console.log("💡 jQuery not found. If the site uses jQuery, this could be a loading issue.");
        }

        const metaViewport = document.querySelector('meta[name="viewport"]');
        if (!metaViewport || (!metaViewport.content.includes('width=device-width') || !metaViewport.content.includes('initial-scale='))) {
            if (!metaViewport) {
                const newMeta = document.createElement('meta');
                newMeta.name = 'viewport';
                newMeta.content = 'width=device-width, initial-scale=1.0';
                document.head.appendChild(newMeta);
                logIssue('Critical', "Meta viewport tag was missing. Auto-fixed by adding `width=device-width, initial-scale=1.0`.", document.head, 'Add `<meta name=\'viewport\' content=\'width=device-width, initial-scale=1.0\'>` to the `<head>` section of your HTML to ensure proper responsive behavior across various devices.', 'Robust', '3.1.2 Language of Parts', true);
            } else if (!metaViewport.content.includes('width=device-width') || !metaViewport.content.includes('initial-scale=')) {
                metaViewport.content = 'width=device-width, initial-scale=1.0';
                logIssue('Critical', "Meta viewport tag was improperly configured. Auto-fixed by setting `width=device-width, initial-scale=1.0`.", metaViewport, 'Add `<meta name=\'viewport\' content=\'width=device-width, initial-scale=1.0\'>` to the `<head>` section of your HTML to ensure proper responsive behavior across various devices.', 'Robust', '3.1.2 Language of Parts', true);
            }
        } else {
            console.log("✅ Valid meta viewport tag found, supports responsiveness.");
        }
        console.groupEnd();
    }

    function checkLangAttribute() {
        logSection("10. Language Attribute (lang) Check");
        const htmlElement = document.documentElement;
        if (!htmlElement.hasAttribute('lang') || htmlElement.getAttribute('lang').trim().length === 0) {
            htmlElement.setAttribute('lang', 'en');
            logIssue('Critical', '<html> tag was missing a lang attribute or it was empty. Auto-fixed by setting `lang="en"`.', htmlElement, 'Add a `lang` attribute to the `<html>` tag specifying the main content language of the page (e.g., `<html lang="en">`). This is essential for screen readers and search engines.', 'Robust', '3.1.1 Language of Page', true);
        } else {
            console.log(`✅ <html> tag contains a lang attribute: "${htmlElement.getAttribute('lang')}".`);
        }
        console.groupEnd();
    }

    function checkTabindexUsage() {
        logSection("11. Tabindex Usage Check");
        let fixedCount = 0;
        document.querySelectorAll('[tabindex]').forEach(el => {
            try {
                const tabindex = parseInt(el.getAttribute('tabindex'), 10);
                if (tabindex > 0) {
                    el.setAttribute('tabindex', '0');
                    logIssue('Moderate', `Element with tabindex="${tabindex}" (positive value). Auto-fixed by changing to "0".`, el, 'Avoid using `tabindex` with positive values (>0) as it disrupts the natural tab order. For elements that need to be focusable but are not natively interactive, use `tabindex=\'0\'`. For elements that should only be programmatically focusable, use `tabindex=\'-1\'`.', 'Operable', '2.4.3 Focus Order', true);
                    fixedCount++;
                }
            } catch (e) {
                console.error("Error checking tabindex:", e, el);
            }
        });
        if (fixedCount === 0) {
            console.log("✅ No elements with positive tabindex found.");
        }
        console.groupEnd();
    }

    function checkAriaMisuse() {
        logSection("12. ARIA Misuse Check");
        let fixedCount = 0;

        document.querySelectorAll('[aria-hidden="true"]').forEach(el => {
            try {
                const isFocusable = el.tabIndex >= 0 || el.matches('a[href], button, input, select, textarea, [tabindex]');
                const hasFocusableDescendant = el.querySelector('a[href], button, input, select, textarea, [tabindex]') !== null;

                if (isFocusable || hasFocusableDescendant) {
                    el.removeAttribute('aria-hidden');
                    logIssue('Critical', 'Element with `aria-hidden="true"` contained focusable elements. Auto-fixed by removing `aria-hidden` attribute.', el, 'Do not apply `aria-hidden=\'true\'` to elements that contain focusable descendants or are themselves focusable. If an element needs to be visually hidden, ensure it is also hidden from assistive technologies (e.g., using `display: none;` or `visibility: hidden;`).', 'Perceivable', '4.1.2 Name, Role, Value', true);
                    fixedCount++;
                }
            } catch (e) {
                console.error("Error checking ARIA misuse:", e, el);
            }
        });

        document.querySelectorAll('[role="text"]').forEach(el => {
            try {
                const interactiveSelectors = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
                if (el.matches(interactiveSelectors)) {
                    el.removeAttribute('role');
                    logIssue('Critical', 'Interactive element used `role="text"`. Auto-fixed by removing `role` attribute.', el, 'Remove `role=\'text\'` from interactive elements. This role overrides the element\'s native semantics, making it inaccessible. Use appropriate semantic HTML elements or ARIA roles that convey interactivity.', 'Robust', '4.1.2 Name, Role, Value', true);
                    fixedCount++;
                }
            } catch (e) {
                console.error("Error checking ARIA misuse (role=text):", e, el);
            }
        });

        if (fixedCount === 0) {
            console.log("✅ No common ARIA misuse issues found.");
        }
        console.groupEnd();
    }

    function checkContrastRatio(targetElement = null) {
        const elementsToCheck = targetElement ? [targetElement] : document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, li, label, input, textarea, select');

        if (!targetElement) {
            logSection("13. Contrast Ratio Check");
        }

        let currentScanIssuesFound = 0;
        let currentScanFixedCount = 0;

        elementsToCheck.forEach(el => {
            try {
                if (el.textContent.trim().length === 0 || el.offsetWidth === 0 || el.offsetHeight === 0) {
                    return;
                }

                let currentStyle = window.getComputedStyle(el);
                let originalTextColor = parseRgb(currentStyle.color);
                let backgroundColor = getEffectiveBackgroundColor(el);

                let currentContrast = getContrastRatio(originalTextColor, backgroundColor);
                const requiredContrast = isLargeText(el) ? WCAG_CONTRAST_AA_LARGE : WCAG_CONTRAST_AA_NORMAL;

                if (el.tagName === 'A') {
                    const idOrClass = el.id ? `id="${el.id}"` : (el.className ? `class="${el.className}"` : '');
                    console.log(`DEBUG: A tag (${el.textContent.trim().substring(0, 30)}... ${idOrClass}):`);
                    console.log(`  Computed Text Color: ${currentStyle.color}`);
                    console.log(`  Effective Background Color: rgb(${backgroundColor.join(',')})`);
                    console.log(`  Current Contrast: ${currentContrast.toFixed(2)}`);
                    console.log(`  Required Contrast: ${requiredContrast.toFixed(2)}`);
                }

                if (currentContrast < requiredContrast) {
                    let newColorRgb;
                    const backgroundLuminance = getLuminance(backgroundColor);

                    const isOriginalTextVeryLight = originalTextColor[0] > 230 && originalTextColor[1] > 230 && originalTextColor[2] > 230;
                    const isEffectiveBackgroundVeryLight = backgroundColor[0] > 230 && backgroundColor[1] > 230 && backgroundColor[2] > 230;

                    if (isOriginalTextVeryLight && isEffectiveBackgroundVeryLight && currentContrast < 2.0) {
                        newColorRgb = 'rgb(0, 0, 0)';
                        console.log(`DEBUG: Forcing text to black due to very light text on very light background detection (current contrast: ${currentContrast.toFixed(2)}).`);
                    } else if (backgroundLuminance < 0.5) {
                        newColorRgb = 'rgb(255, 255, 255)';
                    } else {
                        newColorRgb = 'rgb(0, 0, 0)';
                    }

                    el.style.setProperty('color', newColorRgb, 'important');

                    const finalContrast = getContrastRatio(parseRgb(newColorRgb), backgroundColor);

                    if (finalContrast >= requiredContrast) {
                        logIssue(
                            'Critical',
                            `Low contrast ratio: ${currentContrast.toFixed(2)}:1 (required ${requiredContrast}:1). Auto-fixed by directly setting inline \`color: ${newColorRgb} !important;\`.`,
                            el,
                            `Original color was ${currentStyle.color}. Text color forcefully changed to ${newColorRgb}. New contrast: ${finalContrast.toFixed(2)}:1.`,
                            'Perceivable',
                            '1.4.3 Contrast (Minimum)',
                            true
                        );
                        currentScanFixedCount++;
                    } else {
                        issuesFound++;
                        logIssue(
                            'Critical',
                            `Low contrast ratio: ${currentContrast.toFixed(2)}:1 (required ${requiredContrast}:1).`,
                            el,
                            `Adjust the foreground (text) or background color to achieve a contrast ratio of at least ${requiredContrast}:1. Automated inline fix attempt failed.`,
                            'Perceivable',
                            '1.4.3 Contrast (Minimum)'
                        );
                    }
                }
            } catch (e) {
                console.error("Error checking contrast ratio:", e, el);
            }
        });

        if (!targetElement) {
            if (currentScanIssuesFound === 0 && currentScanFixedCount === 0) {
                console.log(`✅ All texts meet minimum contrast ratios (WCAG AA).`);
            } else if (currentScanIssuesFound > 0) {
                logIssue('Critical', `Found ${currentScanIssuesFound} unresolved contrast ratio issues.`, null, 'Fix contrast ratios to ensure better readability, especially for users with visual impairments.', 'Perceivable', '1.4.3 Contrast (Minimum)');
            }
            console.groupEnd();
        }
    }

    function checkFormValidationAria() {
        logSection("14. ARIA Attributes for Form Validation Check");
        let fixedCount = 0;

        document.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(el => {
            try {
                if (el.hasAttribute('required') && el.getAttribute('aria-required') !== 'true') {
                    el.setAttribute('aria-required', 'true');
                    logIssue('Moderate', 'Required field was missing `aria-required="true"`. Auto-fixed by setting attribute.', el, 'For required form fields, add `aria-required=\'true\'` to explicitly inform assistive technologies about their mandatory status. Also, ensure `aria-invalid` is used correctly (`true`/`false`) to indicate validation state.', 'Robust', '4.1.2 Name, Role, Value', true);
                    fixedCount++;
                }
                const ariaInvalid = el.getAttribute('aria-invalid');
                if (ariaInvalid && ariaInvalid !== 'true' && ariaInvalid !== 'false') {
                     el.setAttribute('aria-invalid', 'false');
                     logIssue('Minor', '`aria-invalid` attribute had an invalid value. Auto-fixed by setting to `false`.', el, 'The `aria-invalid` attribute must have a value of `true` or `false`. Correct the value to accurately reflect the validation state of the form field.', 'Robust', '4.1.2 Name, Role, Value', true);
                     fixedCount++;
                }
            } catch (e) {
                console.error("Error checking ARIA form validation:", e, el);
            }
        });

        if (fixedCount === 0) {
            console.log("✅ Basic ARIA attributes for form validation are correct.");
        }
        console.groupEnd();
    }

    function checkSkipLinks() {
        logSection("15. Skip Link Check");
        let issuesFound = 0;
        const skipLink = document.querySelector('a[href="#main"], a.skip-link, a[href^="#"][tabindex="0"]');

        if (!skipLink) {
            const newSkipLink = document.createElement('a');
            newSkipLink.href = '#main';
            newSkipLink.textContent = 'Skip to main content';
            newSkipLink.style.cssText = 'position: absolute; left: -9999px; top: auto; width: 1px; height: 1px; overflow: hidden; z-index: -999;';
            newSkipLink.onfocus = function() {
                this.style.cssText = 'position: static; width: auto; height: auto; z-index: 999;';
            };
            newSkipLink.onblur = function() {
                this.style.cssText = 'position: absolute; left: -9999px; top: auto; width: 1px; height: 1px; overflow: hidden; z-index: -999;';
            };
            document.body.prepend(newSkipLink);

            if (!document.getElementById('main')) {
                const mainElement = document.querySelector('main') || document.body.children[0];
                if (mainElement) {
                    mainElement.id = 'main';
                }
            }

            logIssue('Moderate', 'No "skip to main content" link found. Auto-fixed by injecting a basic skip link.', null, 'Implement a \'skip to main content\' link (or similar) as the first focusable element on the page. This link should be visually hidden until focused and, when activated, move focus to the main content area, allowing keyboard users to bypass repetitive navigation.', 'Operable', '2.4.1 Bypass Blocks', true);
        } else {
            console.log("✅ Skip link found. Manual verification needed to ensure it works correctly and targets the main content.");
        }
        console.groupEnd();
    }

    function checkLandmarkRoles() {
        logSection("16. ARIA Landmark Roles Check");
        let issuesFound = 0;
        const requiredLandmarks = ['main', 'navigation', 'banner', 'contentinfo'];
        let fixedCount = 0;

        requiredLandmarks.forEach(role => {
            const elements = document.querySelectorAll(`[role="${role}"], ${role}`);
            if (elements.length === 0) {
                let autofixedElement = null;
                if (role === 'main') {
                    const candidate = document.querySelector('body > article, body > section');
                    if (candidate) {
                        candidate.setAttribute('role', 'main');
                        autofixedElement = candidate;
                    } else {
                        const newElement = document.createElement('main');
                        newElement.setAttribute('role', 'main');
                        newElement.textContent = 'Main Content Area (Auto-added)';
                        document.body.appendChild(newElement);
                        autofixedElement = newElement;
                    }
                } else if (role === 'banner') {
                    const candidate = document.querySelector('header, div[id*="header"], div[class*="header"], div[id*="banner"], div[class*="banner"]');
                    if (candidate) {
                        candidate.setAttribute('role', 'banner');
                        autofixedElement = candidate;
                    } else {
                        const newElement = document.createElement('header');
                        newElement.setAttribute('role', 'banner');
                        newElement.textContent = 'Site Header (Auto-added)';
                        document.body.prepend(newElement);
                        autofixedElement = newElement;
                    }
                } else if (role === 'contentinfo') {
                    const candidate = document.querySelector('footer, div[id*="footer"], div[class*="footer"], div[id*="contentinfo"], div[class*="contentinfo"]');
                    if (candidate) {
                        candidate.setAttribute('role', 'contentinfo');
                        autofixedElement = candidate;
                    } else {
                        const newElement = document.createElement('footer');
                        newElement.setAttribute('role', 'contentinfo');
                        newElement.textContent = 'Site Footer (Auto-added)';
                        document.body.appendChild(newElement);
                        autofixedElement = newElement;
                    }
                } else if (role === 'navigation') {
                    const potentialNav = document.querySelector('ul:has(a), div:has(a):has(a)');
                    if (potentialNav) {
                        if (potentialNav.tagName === 'UL') {
                            const navElement = document.createElement('nav');
                            potentialNav.parentNode.insertBefore(navElement, potentialNav);
                            navElement.appendChild(potentialNav);
                            autofixedElement = navElement;
                        } else {
                            potentialNav.setAttribute('role', 'navigation');
                            autofixedElement = potentialNav;
                        }
                    } else {
                        const newNav = document.createElement('nav');
                        const ul = document.createElement('ul');
                        const li = document.createElement('li');
                        const a = document.createElement('a');
                        a.href = '#';
                        a.textContent = 'Navigation Link (Auto-added)';
                        li.appendChild(a);
                        ul.appendChild(li);
                        newNav.appendChild(ul);
                        document.body.prepend(newNav);
                        autofixedElement = newNav;
                    }
                }

                if (autofixedElement) {
                    logIssue('Moderate', `Missing recommended ARIA landmark role or HTML5 semantic element: "${role}". Auto-fixed by adding role to a likely candidate or injecting a new element.`, autofixedElement, `Employ appropriate HTML5 semantic elements (e.g., <main>, <nav>, <header>, <footer>, <aside>, <article>, <section>) or ARIA landmark roles (e.g., role='main', role='navigation', role='banner', role='contentinfo', role='complementary', role='article', role='region') to structure the page meaningfully for assistive technologies. Ensure each major section has a unique, descriptive label if using ARIA roles.`, 'Perceivable', '1.3.1 Info and Relationships', true);
                    fixedCount++;
                } else {
                    logIssue('Moderate', `Missing recommended ARIA landmark role or HTML5 semantic element: "${role}". No suitable element found for autofix.`, document.body, `Manually add the semantic HTML5 element or ARIA landmark role for "${role}".`, 'Perceivable', '1.3.1 Info and Relationships');
                    issuesFound++;
                }
            } else if (elements.length > 1 && (role === 'main' || role === 'banner' || role === 'contentinfo')) {
                 logIssue('Minor', `Multiple instances of ARIA landmark role or HTML5 semantic element: "${role}".`, elements[0], `Roles like 'main', 'banner', and 'contentinfo' should typically appear only once per page. Review your document structure to ensure these roles are used uniquely where appropriate.`, 'Perceivable', '1.3.1 Info and Relationships');
                 issuesFound++;
            }
        });

        if (issuesFound === 0 && fixedCount === 0) {
            console.log("✅ Basic ARIA landmark roles and HTML5 semantic elements appear to be used appropriately.");
        } else if (issuesFound > 0) {
            logIssue('Moderate', `Found ${issuesFound} potential issues with ARIA landmark roles or HTML5 semantic elements.`, null, 'Review the use of landmark roles to ensure clear page structure for assistive technologies.', 'Perceivable', '1.3.1 Info and Relationships');
        }
        console.groupEnd();
    }

    function checkImageAltText() {
        logSection("17. Image Alternative Text Check");
        let issuesFound = 0;
        let fixedCount = 0;

        document.querySelectorAll('img:not([alt])').forEach(img => {
            const isSmall = img.naturalWidth < 20 && img.naturalHeight < 20;
            const parentInteractive = img.closest('a, button, [role="button"], [role="link"]');
            const parentHasText = parentInteractive && parentInteractive.textContent.trim().length > 0;

            if (isSmall || parentHasText) {
                img.setAttribute('alt', '');
                logIssue('Minor', 'Image was missing `alt` attribute and appears decorative. Auto-fixed by setting `alt=""`.', img, 'For purely decorative images, use `alt=""` (empty string) to hide them from screen readers. For meaningful images, provide concise, descriptive `alt` text.', 'Perceivable', '1.1.1 Non-text Content', true);
                fixedCount++;
            } else {
                img.setAttribute('alt', 'Image description needed');
                logIssue('Critical', 'Image was missing `alt` attribute. Auto-fixed by adding generic `alt="Image description needed"`.', img, 'Add concise, descriptive `alt` text for images that convey information. **Manual review is highly recommended** to replace the generic `alt` text with accurate content.', 'Perceivable', '1.1.1 Non-text Content', true);
                fixedCount++;
            }
        });

        document.querySelectorAll('img[alt=""]').forEach(img => {
            const computedStyle = window.getComputedStyle(img);
            if (img.offsetWidth > 0 || img.offsetHeight > 0 || computedStyle.display !== 'none' || computedStyle.visibility !== 'hidden') {
                img.setAttribute('alt', 'Image description needed');
                logIssue('Minor', 'Image had an empty `alt` attribute but appears to be non-decorative. Auto-fixed by adding generic `alt="Image description needed"`.', img, 'If an image with `alt=\'\'` is conveying information, provide meaningful `alt` text. **Manual review is highly recommended** to replace the generic `alt` text with accurate content. If it is truly decorative, consider using `aria-hidden=\'true\'` or implementing it as a CSS background image.', 'Perceivable', '1.1.1 Non-text Content', true);
                fixedCount++;
            }
        });

        document.querySelectorAll('img[alt]').forEach(img => {
            const altText = img.alt.trim().toLowerCase();
            const commonKeywords = ['image', 'picture', 'graphic', 'logo', 'icon'];
            if (commonKeywords.some(keyword => altText.includes(keyword)) && altText.length > 0 && altText.length < 10) {
                logIssue('Minor', `Image alt text "${img.alt}" might be redundant or insufficient.`, img, 'Refine `alt` text to be concise and avoid redundant phrases like \'image of\', \'picture of\', or \'graphic of\'. Focus on describing the content or function of the image.', 'Perceivable', '1.1.1 Non-text Content');
                issuesFound++;
            }
        });

        if (issuesFound === 0 && fixedCount === 0) {
            console.log("✅ All images appear to have appropriate alternative text.");
        } else if (issuesFound > 0) {
            logIssue('Critical', `Found ${issuesFound} potential issues with image alternative text.`, null, 'Review all image alt texts to ensure they are accurate and helpful for screen reader users.', 'Perceivable', '1.1.1 Non-text Content');
        }
        console.groupEnd();
    }

    function checkFormFieldLabels() {
        logSection("18. Form Field Labels Check");
        let issuesFound = 0;
        let fixedCount = 0;
        const formFields = document.querySelectorAll('input:not([type="hidden"]), select, textarea');

        formFields.forEach(field => {
            try {
                const id = field.id || `autofix_id_${Math.random().toString(36).substring(2, 9)}`;
                if (!field.id) field.id = id;

                const hasAriaLabel = field.hasAttribute('aria-label') && field.getAttribute('aria-label').trim().length > 0;
                const hasAriaLabelledby = field.hasAttribute('aria-labelledby') && document.getElementById(field.getAttribute('aria-labelledby')) && document.getElementById(field.getAttribute('aria-labelledby')).textContent.trim().length > 0;
                let hasAssociatedLabel = false;

                const labels = document.querySelectorAll(`label[for="${id}"]`);
                if (labels.length > 0 && Array.from(labels).some(label => label.textContent.trim().length > 0)) {
                    hasAssociatedLabel = true;
                } else {
                    const parentLabel = field.closest('label');
                    if (parentLabel && parentLabel.textContent.trim().length > 0) {
                        hasAssociatedLabel = true;
                    }
                }

                if (!hasAssociatedLabel && !hasAriaLabel && !hasAriaLabelledby) {
                    const newLabel = document.createElement('label');
                    newLabel.htmlFor = id;
                    newLabel.textContent = field.placeholder || `Field for ${id}`;
                    field.parentNode.insertBefore(newLabel, field);
                    logIssue('Critical', `Form field was missing an associated label or accessible name. Auto-fixed by adding a <label> tag.`, field, 'Ensure all form input fields (`<input>`, `<select>`, `<textarea>`) have an associated accessible label. This can be done by using a `<label>` element with a `for` attribute pointing to the input\'s `id`, or by using `aria-label` or `aria-labelledby` attributes directly on the input.', 'Perceivable', '3.3.2 Labels or Instructions, 4.1.2 Name, Role, Value', true);
                    fixedCount++;
                }
            } catch (e) {
                console.error("Error checking form field label:", e, field);
            }
        });

        if (issuesFound === 0 && fixedCount === 0) {
            console.log("✅ All form fields appear to have associated labels or accessible names.");
        } else if (issuesFound > 0) {
            logIssue('Critical', `Found ${issuesFound} form fields missing accessible labels.`, null, 'This is a critical issue for screen reader users. All form fields must have an accessible label.', 'Perceivable', '3.3.2 Labels or Instructions, 4.1.2 Name, Role, Value');
        }
        console.groupEnd();
    }

    function checkFocusIndicators() {
        logSection("19. Focus Indicator Check");
        let issuesFound = 0;
        let fixedCount = 0;
        const interactiveSelectors = 'button, a[href], input:not([type="hidden"]), select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="option"], [tabindex]:not([tabindex="-1"])';

        let styleTag = document.getElementById('autofix-focus-style');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'autofix-focus-style';
            styleTag.textContent = `
                ${interactiveSelectors}:focus-visible {
                    outline: 2px solid Highlight !important;
                    outline: 2px solid -webkit-focus-ring-color !important;
                    outline-offset: 2px !important;
                }
                ${interactiveSelectors}:focus:not(:focus-visible) {
                    outline: none !important;
                }
            `;
            document.head.appendChild(styleTag);
            logIssue('Info', 'Injected global CSS to ensure visible focus indicators using `:focus-visible`.', styleTag, 'This autofix applies a default focus outline for keyboard navigation. Manual review is still needed to ensure custom focus styles are sufficient and consistent.', 'Operable', '2.4.7 Focus Visible', true);
            fixedCount++;
        }

        document.querySelectorAll(interactiveSelectors).forEach(el => {
            try {
                const computedStyle = window.getComputedStyle(el);
                if (computedStyle.outlineStyle === 'none' && computedStyle.boxShadow === 'none') {
                    logIssue(
                        'Minor',
                        'Interactive element had `outline: none` and no `box-shadow` on its default state. Auto-fixed by global style injection.',
                        el,
                        'The script has injected a global CSS rule to ensure a visible focus outline. Verify this is sufficient and consider implementing custom, WCAG-compliant focus styles.',
                        'Operable',
                        '2.4.7 Focus Visible',
                        true
                    );
                    fixedCount++;
                }
            } catch (e) {
                console.error("Error checking focus indicator:", e, el);
            }
        });

        if (issuesFound === 0 && fixedCount === 0) {
            console.log("✅ No immediate issues with `outline: none` found on interactive elements.");
        } else if (issuesFound > 0) {
            logIssue('Critical', `Found ${issuesFound} potential issues where focus indicators might be missing or hidden.`, null, 'Review these elements manually to ensure keyboard focus is always clearly visible. Implement custom focus styles if default outlines are removed.', 'Operable', '2.4.7 Focus Visible');
        }

        console.log("\n💡 **Manual Verification for Focus Indicators is CRUCIAL:**");
        console.log("    Even with automated fixes, the most reliable way to ensure accessible focus indicators is through manual testing.");
        console.log("    **Perform the following manual steps for ALL interactive elements:**");
        console.log("    - **Keyboard Navigation:** Use the `Tab` key (and `Shift+Tab`) to navigate through all links, buttons, form fields, and other interactive components on the page.");
        console.log("    - **Visible Outline:** For every interactive element, confirm that there is a clear, visible focus indicator (e.g., a distinct border, outline, or background change) that highlights the currently focused element. Ensure it is not too subtle or easily missed.");
        console.log("    - **Custom Styles:** If default browser outlines are removed (e.g., `outline: none`), verify that a custom focus style is implemented that is at least as visible and has sufficient contrast.");
        console.log("    - **Consistency:** Check if the focus indicator is consistent and easily noticeable across the entire website.");
        console.log("    - **Contrast:** Ensure the focus indicator has sufficient contrast against the background to be easily seen by users with low vision.");
        console.groupEnd();
    }

    function setupMutationObserver() {
        const observer = new MutationObserver(mutationsList => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                    checkContrastRatio(mutation.target);
                } else if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            checkContrastRatio(node);
                            node.querySelectorAll('*').forEach(descendant => checkContrastRatio(descendant));
                        }
                    });
                }
            }
        });

        observer.observe(document.body, { attributes: true, childList: true, subtree: true, attributeFilter: ['style', 'class'] });
        console.log("💡 MutationObserver set up to monitor for dynamic style changes on elements for contrast issues.");
    }


    console.clear();
    console.log(
        "%c Author: Yaron Koresh ",
        "background: #4CAF50; color: white; font-size: 1.5em; font-weight: bold; padding: 10px 20px; border-radius: 5px;"
    );
    console.log("%c--- Website Accessibility Check and Auto-Fix ---", 'font-size: 1.5em; font-weight: bold; color: #333;');
    console.log("This script will check for common accessibility issues and display them in the console. Manual review is also required.");

    checkContentStructure();
    checkMediaIntegrity();
    checkOverlayFocusBlocking();
    checkInteractiveElementSize();
    checkHoverFocusContent();
    checkAutoFormSubmission();
    checkDuplicateIds();
    checkAccessibleNames();
    checkGeneralHealth();
    checkLangAttribute();
    checkTabindexUsage();
    checkAriaMisuse();
    checkContrastRatio();
    checkFormValidationAria();
    checkSkipLinks();
    checkLandmarkRoles();
    checkImageAltText();
    checkFormFieldLabels();
    checkFocusIndicators();

    setupMutationObserver();


    console.log("\n%c--- Accessibility Check and Auto-Fix Summary ---", 'font-size: 1.2em; font-weight: bold; color: #0056b3;');
    const autoFixedIssues = results.filter(r => r.isAutofixed);
    const unresolvedIssues = results.filter(r => !r.isAutofixed);
    const criticalUnresolved = unresolvedIssues.filter(r => r.severity === 'Critical');
    const moderateUnresolved = unresolvedIssues.filter(r => r.severity === 'Moderate');
    const minorUnresolved = unresolvedIssues.filter(r => r.severity === 'Minor');
    const infoMessages = unresolvedIssues.filter(r => r.severity === 'Info');


    console.log(`%cTotal issues identified: ${results.length}`, 'font-weight: bold;');
    console.log(`%cIssues auto-fixed: ${autoFixedIssues.length}`, autoFixedIssues.length > 0 ? 'color: green; font-weight: bold;' : 'color: gray;');
    console.log(`%cUnresolved issues: ${unresolvedIssues.length}`, unresolvedIssues.length > 0 ? 'color: red; font-weight: bold;' : 'color: green;');

    if (criticalUnresolved.length > 0) {
        console.groupCollapsed(`%c  Critical Unresolved: ${criticalUnresolved.length}`, 'color: red; font-weight: bold;');
        criticalUnresolved.forEach(issue => {
            console.log(`    - ${issue.message}`);
            if (issue.recommendation) console.log(`      Recommendation: ${issue.recommendation}`);
            if (issue.wcagGuideline) console.log(`      WCAG: ${issue.wcagGuideline}`);
            if (issue.element instanceof HTMLElement) console.log(`      Element:`, issue.element);
            console.log('');
        });
        console.groupEnd();
    } else {
        console.log(`%c  Critical Unresolved: ${criticalUnresolved.length}`, 'color: gray;');
    }

    if (moderateUnresolved.length > 0) {
        console.groupCollapsed(`%c  Moderate Unresolved: ${moderateUnresolved.length}`, 'color: orange; font-weight: bold;');
        moderateUnresolved.forEach(issue => {
            console.log(`    - ${issue.message}`);
            if (issue.recommendation) console.log(`      Recommendation: ${issue.recommendation}`);
            if (issue.wcagGuideline) console.log(`      WCAG: ${issue.wcagGuideline}`);
            if (issue.element instanceof HTMLElement) console.log(`      Element:`, issue.element);
            console.log('');
        });
        console.groupEnd();
    } else {
        console.log(`%c  Moderate Unresolved: ${moderateUnresolved.length}`, 'color: gray;');
    }

    if (minorUnresolved.length > 0) {
        console.groupCollapsed(`%c  Minor Unresolved: ${minorUnresolved.length}`, 'color: gold; font-weight: bold;');
        minorUnresolved.forEach(issue => {
            console.log(`    - ${issue.message}`);
            if (issue.recommendation) console.log(`      Recommendation: ${issue.recommendation}`);
            if (issue.wcagGuideline) console.log(`      WCAG: ${issue.wcagGuideline}`);
            if (issue.element instanceof HTMLElement) console.log(`      Element:`, issue.element);
            console.log('');
        });
        console.groupEnd();
    } else {
        console.log(`%c  Minor Unresolved: ${minorUnresolved.length}`, 'color: gray;');
    }

    if (infoMessages.length > 0) {
        console.groupCollapsed(`%c  Info Messages: ${infoMessages.length}`, 'color: gray; font-weight: bold;');
        infoMessages.forEach(issue => {
            console.log(`    - ${issue.message}`);
            if (issue.recommendation) console.log(`      Recommendation: ${issue.recommendation}`);
            if (issue.wcagGuideline) console.log(`      WCAG: ${issue.wcagGuideline}`);
            if (issue.element instanceof HTMLElement) console.log(`      Element:`, issue.element);
            console.log('');
        });
        console.groupEnd();
    } else {
        console.log(`%c  Info Messages: ${infoMessages.length}`, 'color: gray;');
    }


    if (unresolvedIssues.length > 0) {
        console.log("\nTo view details of unresolved issues, expand the message groups in the console.");
        console.log("The 'accessibilityScanResults' object (containing all issues) is available in the console for programmatic viewing:");
        window.accessibilityScanResults = results;
    } else {
        console.log("🎉 All automated accessibility issues were either fixed or not detected in this check. Great job!");
        console.log("*** Important: This is only an initial check. Full accessibility requires a more thorough manual review. ***");
    }

    console.groupEnd();
})();
