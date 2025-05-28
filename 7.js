// File 7: ar_check_modules_part2.js

// Part of AR_CheckModules: Second half of check functions
(function(AR_CheckModulesProto) {

	AR_CheckModulesProto.checkHoverFocusContent = function () {
		ar_logSection('Content on Hover/Focus (ARIA Attributes)');
		document.querySelectorAll('button, a[href], [role="button"], [role="link"], [role="menuitem"]').forEach(el => {
			try {
				if (ar_isVisuallyHidden(el)) return;
				const hasPopup = el.hasAttribute('aria-haspopup');
				const isExpanded = el.getAttribute('aria-expanded');
				const controlsId = el.getAttribute('aria-controls');
				if (hasPopup) {
					const popupValue = el.getAttribute('aria-haspopup').toLowerCase();
					const validPopupValues = ['menu', 'listbox', 'tree', 'grid', 'dialog', 'true', 'false'];
					if (!validPopupValues.includes(popupValue)) {
						ar_setAttributeAndLog(el, 'aria-haspopup', 'true', 'Moderate', `Invalid aria-haspopup. Auto-set "true".`, 'Use valid values.', 'Operable', '4.1.2', 'A');
					}
				}
				if (controlsId) {
					const controlledElement = document.getElementById(controlsId);
					if (controlledElement) {
						const isControlledElementVisible = !ar_isVisuallyHidden(controlledElement);
						if (isExpanded === null) {
							ar_setAttributeAndLog(el, 'aria-expanded', String(isControlledElementVisible), 'Minor', `aria-controls w/o aria-expanded. Auto-fixed.`, 'Add & update aria-expanded.', 'Operable', '4.1.2', 'A');
						} else if ((isExpanded === 'true' && !isControlledElementVisible) || (isExpanded === 'false' && isControlledElementVisible)) {
							ar_setAttributeAndLog(el, 'aria-expanded', String(isControlledElementVisible), 'Minor', `aria-expanded mismatch. Auto-corrected.`, 'Ensure aria-expanded reflects state.', 'Operable', '4.1.2', 'A');
						}
					} else if (isExpanded !== null) {
						ar_logAccessibilityIssue('Moderate', `aria-controls to non-existent ID "${controlsId}".`, el, 'Ensure valid ID.', 'Robust', '4.1.2', false, 'A');
					}
				} else if (isExpanded !== null) {
					ar_logAccessibilityIssue('Minor', `aria-expanded w/o aria-controls.`, el, 'Add aria-controls if content controlled.', 'Operable', '4.1.2', false, 'A');
				}
			} catch (e) { console.error('Error: HoverFocusContent Check:', e, el); }
		});
		console.log('\n💡 Manual Verification for WCAG 1.4.13 (Content on Hover/Focus) is CRUCIAL: Check for Dismissible, Hoverable, Persistent properties of popups.');
		console.groupEnd();
	};

	AR_CheckModulesProto.checkAutoFormSubmission = function () {
		ar_logSection('Automatic Form Submission');
		document.querySelectorAll('form, input:not([type="hidden"]), select, textarea').forEach(el => {
			try {
				if (ar_isVisuallyHidden(el)) return;
				['onfocus', 'onchange'].forEach(attrName => {
					const attrValue = el.getAttribute(attrName);
					if (attrValue && attrValue.toLowerCase().includes('submit()')) {
						ar_removeAttributeAndLog(el, attrName, 'Minor', `${el.tagName} with ${attrName} auto-submits. Auto-removed.`, 'Use explicit submit.', 'Operable', '3.2.2', 'A');
					}
				});
			} catch (e) { console.error('Error: AutoFormSubmission Check:', e, el); }
		});
		console.groupEnd();
	};

	AR_CheckModulesProto.checkDuplicateIds = function (globalState) {
		ar_logSection('Duplicate IDs');
		document.querySelectorAll('[id]').forEach(el => {
			try {
				const id = el.id;
				if (!id || id.trim() === '') return;
				if (globalState.seenIds.has(id)) {
					const originalElement = globalState.seenIds.get(id);
					const newId = ar_generateUniqueElementId(`dup-${id}-`);
					ar_setAttributeAndLog(el, 'id', newId, 'Critical', `Duplicate ID "#${id}". Auto-fixed to "#${newId}".`, `Original element:`, 'Robust', '4.1.1', 'A');
                    console.warn('    Original element with conflicting ID:', originalElement);
				} else {
					globalState.seenIds.set(id, el);
				}
			} catch (e) { console.error('Error: DuplicateIds Check:', e, el); }
		});
		console.groupEnd();
	};

	AR_CheckModulesProto.checkAccessibleNames = function () {
		ar_logSection('Accessible Names for Interactive Elements');
		document.querySelectorAll(`${AR_SELECTOR_STRINGS.INTERACTIVE_ELEMENTS}, [role="img"]`).forEach(el => {
			try {
				if (ar_isVisuallyHidden(el) || ar_hasAccessibleNameForElement(el)) return;
				const generatedName = this._generateAccessibleNameCandidate(el);
				if (generatedName) {
					ar_setAttributeAndLog(el, 'aria-label', generatedName, 'Moderate', `Lacked accessible name. Auto-fixed with aria-label: "${generatedName}".`, '**Manual review required.**', 'Perceivable', '2.4.4 / 4.1.2', 'A');
				} else {
                     ar_logAccessibilityIssue('Critical', `Lacked accessible name. Could not auto-generate.`, el, 'Provide text, title, aria-label, or <label>.', 'Perceivable', '2.4.4 / 4.1.2', false, 'A');
                }
			} catch (e) { console.error('Error: AccessibleNames Check:', e, el); }
		});
		console.groupEnd();
	};

	AR_CheckModulesProto._generateAccessibleNameCandidate = function (el) {
		let label = '';
		const tagName = el.tagName.toLowerCase();
		const type = (el.type || '').toLowerCase();
		if (el.placeholder && el.placeholder.trim()) label = el.placeholder.trim();
		else if (el.title && el.title.trim()) label = el.title.trim();
		if (tagName === 'input' && ['button', 'submit', 'reset'].includes(type) && el.value && el.value.trim()) {
			label = el.value.trim();
		} else if (tagName === 'input' && type === 'image' && el.src) {
			const filename = el.src.split('/').pop().split('.')[0].replace(AR_CONFIG.FILENAME_CLEANUP_REGEX, ' ');
			label = (filename.length > 3 && filename.length < 30) ? `Submit ${filename}` : 'Submit query';
            ar_setAttributeAndLog(el, 'alt', label, 'Moderate', `Input type="image" missing alt. Auto-set.`, '**Manual review.**', 'Perceivable', '1.1.1', 'A');
            return null;
		} else if (tagName === 'img' || el.getAttribute('role') === 'img') {
			label = this._generateAltTextAttempt(el) || 'Image (description needed)';
		} else if (tagName === 'a') {
			const textContent = (el.textContent || '').trim();
			label = (textContent.length > 2 && textContent.length < 50) ? `Link: ${textContent}` : 'Link - Description Needed';
		} else if (tagName === 'button') {
			const textContent = (el.textContent || '').trim();
			if (textContent.length > 2 && textContent.length < 50) {
				label = textContent;
			} else {
				let iconLabel = '';
				for (const prefix of AR_CONFIG.COMMON_ICON_CLASS_PREFIXES) {
					for (const cssClass of Array.from(el.classList)) {
						if (cssClass.startsWith(prefix)) {
							const potentialLabel = cssClass.substring(prefix.length).replace(AR_CONFIG.FILENAME_CLEANUP_REGEX, ' ').trim();
							if (potentialLabel.length > 2) {
								iconLabel = `${potentialLabel.charAt(0).toUpperCase() + potentialLabel.slice(1)} button`;
								break;
							}
						}
					}
					if (iconLabel) break;
				}
				label = iconLabel || 'Button - Action Needed';
			}
		}
		if (!label || label.startsWith('Unnamed')) label = `${el.getAttribute('role') || tagName} - Description Needed`;
		if (label.length > AR_CONFIG.MAX_CHAR_LENGTH_FOR_AUTOGENERATED_ARIA_LABEL) {
			label = label.substring(0, AR_CONFIG.MAX_CHAR_LENGTH_FOR_AUTOGENERATED_ARIA_LABEL - 3) + '...';
		}
		return label;
	};

	AR_CheckModulesProto.checkLangAttribute = function () {
		ar_logSection('Language Attribute (HTML)');
		const htmlEl = document.documentElement;
		if (!htmlEl.lang || !htmlEl.lang.trim()) {
			ar_setAttributeAndLog(htmlEl, 'lang', 'en', 'Critical', '<html> missing lang. Auto-set to "en".', '**Manual review required.** Verify "en" is correct.', 'Understandable', '3.1.1 Language of Page', 'A');
		}
		console.groupEnd();
	};

	AR_CheckModulesProto.checkTabindexUsage = function () {
		ar_logSection('Tabindex Usage');
		document.querySelectorAll('[tabindex]').forEach(el => {
			try {
				const tabindexValue = parseInt(el.getAttribute('tabindex'), 10);
				if (tabindexValue > 0) {
					ar_setAttributeAndLog(el, 'tabindex', '0', 'Moderate', `Positive tabindex="${tabindexValue}". Auto-fixed to "0".`, 'Avoid positive tabindex.', 'Operable', '2.4.3', 'A');
				}
                const role = el.getAttribute('role');
                const isNativeInteractive = el.matches(AR_SELECTOR_STRINGS.NATIVE_INTERACTIVE_TAGS);
                const commonInteractiveRoles = ['button', 'link', 'menuitem', 'tab', 'checkbox', 'radio', 'option', 'switch', 'slider', 'treeitem'];
                if (role && commonInteractiveRoles.includes(role) && !isNativeInteractive && tabindexValue < 0) {
                     ar_setAttributeAndLog(el, 'tabindex', '0', 'Minor', `Custom control [role="${role}"] not focusable. Auto-added tabindex="0".`, 'Ensure custom controls focusable.', 'Operable', '2.1.1', 'A');
                }
                if (role && commonInteractiveRoles.includes(role) && tabindexValue === -1 && !el.disabled && el.getAttribute('aria-disabled') !== 'true') {
                    ar_setAttributeAndLog(el, 'tabindex', '0', 'Minor', `Active custom control [role="${role}"] tabindex="-1". Auto-set to "0".`, 'Ensure active controls in tab order.', 'Operable', '2.1.1', 'A');
                }
			} catch (e) { console.error('Error: TabindexUsage Check:', e, el); }
		});
		console.groupEnd();
	};

	AR_CheckModulesProto.checkAriaMisuse = function () {
		ar_logSection('ARIA Misuse');
		this._checkAriaHiddenOnFocusable();
		this._checkRedundantAriaRoles();
		this._checkInvalidAriaRelationshipIDs();
		console.groupEnd();
	};

	AR_CheckModulesProto._checkAriaHiddenOnFocusable = function () {
		document.querySelectorAll('[aria-hidden="true"]').forEach(el => {
			try {
				const isElementFocusable = el.tabIndex >= 0 || el.matches(AR_SELECTOR_STRINGS.INTERACTIVE_ELEMENTS);
				const hasFocusableDescendant = el.querySelector(AR_SELECTOR_STRINGS.INTERACTIVE_ELEMENTS.split(',').map(s => `${s.trim()}:not([tabindex="-1"])`).join(',')) !== null;
				if (isElementFocusable || hasFocusableDescendant) {
					ar_removeAttributeAndLog(el, 'aria-hidden', 'Critical', '`aria-hidden="true"` on focusable. Auto-removed.', 'Do not use on focusable.', 'Perceivable', '4.1.2 / 1.3.1', 'A');
				}
			} catch (e) { console.error('Error: AriaHiddenOnFocusable Check:', e, el); }
		});
	};

	AR_CheckModulesProto._checkRedundantAriaRoles = function () {
		document.querySelectorAll('[role]').forEach(el => {
			try {
				const role = el.getAttribute('role').toLowerCase();
				const tagName = el.tagName.toLowerCase();
                const type = (el.type || '').toLowerCase();
				const implicitRoles = {
					'button': 'button', 'a': 'link', 'input[type=button]': 'button', 'input[type=submit]': 'button', 'input[type=reset]': 'button',
                    'input[type=checkbox]': 'checkbox', 'input[type=radio]': 'radio', 'input[type=text]': 'textbox', 'input[type=search]': 'searchbox',
                    'select': 'listbox', 'textarea': 'textbox', 'img': 'img', 'h1': 'heading', 'h2': 'heading', 'h3': 'heading', 'h4': 'heading', 'h5': 'heading', 'h6': 'heading',
                    'ul': 'list', 'ol': 'list', 'li': 'listitem', 'nav': 'navigation', 'header': 'banner', 'footer': 'contentinfo', 'main': 'main', 'aside': 'complementary', 'form': 'form', 'section': 'region'
				};
                let nativeRole = implicitRoles[tagName];
                if (tagName === 'input' && type) nativeRole = implicitRoles[`input[type=${type}]`] || nativeRole;
                if (tagName === 'a' && !el.hasAttribute('href')) nativeRole = null;
                if (tagName === 'img' && (!el.hasAttribute('alt') || el.alt.trim() === '')) nativeRole = null;
                if (tagName === 'section' && !ar_hasAccessibleNameForElement(el)) nativeRole = null;
				if (nativeRole === role) {
                    if (tagName === 'img' && (role === 'presentation' || role === 'none')) return;
					ar_removeAttributeAndLog(el, 'role', 'Minor', `Redundant ARIA role="${role}" on <${tagName}>. Auto-removed.`, 'Native tag implies role.', 'Robust', '4.1.2', 'A');
				}
                if (role === 'text' && el.matches(AR_SELECTOR_STRINGS.INTERACTIVE_ELEMENTS)) {
                    ar_removeAttributeAndLog(el, 'role', 'Critical', 'Interactive element `role="text"`. Auto-removed.', 'Remove role="text".', 'Robust', '4.1.2', 'A');
                }
                if ((role === 'presentation' || role === 'none') && (el.tabIndex >= 0 || el.matches(AR_SELECTOR_STRINGS.NATIVE_INTERACTIVE_TAGS))) {
                    const parentRole = el.parentElement ? el.parentElement.getAttribute('role') : null;
                    if (!(role === 'presentation' && tagName === 'li' && (parentRole === 'tablist' || parentRole === 'listbox' || parentRole === 'menu'))) {
                        ar_removeAttributeAndLog(el, 'role', 'Moderate', `Focusable element role="${role}". Auto-removed.`, `Focusable elements should not have role="presentation" or "none".`, 'Robust', '4.1.2', 'A');
                    }
                }
			} catch (e) { console.error('Error: RedundantAriaRoles Check:', e, el); }
		});
	};

	AR_CheckModulesProto._checkInvalidAriaRelationshipIDs = function () {
		['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'aria-flowto'].forEach(attr => {
			document.querySelectorAll(`[${attr}]`).forEach(el => {
				try {
					const idRefs = el.getAttribute(attr).split(/\s+/).filter(id => id.trim() !== '');
					const validIdRefs = idRefs.filter(id => document.getElementById(id));
					if (validIdRefs.length !== idRefs.length) {
						if (validIdRefs.length > 0) {
							ar_setAttributeAndLog(el, attr, validIdRefs.join(' '), 'Minor', `${attr} has invalid ID(s). Auto-removed invalid.`, `Ensure ${attr} points to valid IDs.`, 'Robust', '4.1.2', 'A');
						} else {
							ar_removeAttributeAndLog(el, attr, 'Minor', `${attr} only invalid ID(s). Auto-removed attr.`, `Ensure ${attr} points to valid IDs.`, 'Robust', '4.1.2', 'A');
						}
					}
				} catch (e) { console.error(`Error: InvalidAriaRelationshipIDs Check for ${attr}:`, e, el); }
			});
		});
	};

	AR_CheckModulesProto.checkContrastRatioForAllElements = function (targetElement = null) {
		if (!targetElement) ar_logSection('Text Contrast Ratios');
		const elementsToCheck = targetElement ? [targetElement] : Array.from(document.querySelectorAll(AR_SELECTOR_STRINGS.TEXT_CONTAINER_ELEMENTS_AFFECTED_BY_MENU));
		elementsToCheck.forEach(el => {
			try {
				if (ar_isVisuallyHidden(el) || el.textContent.trim().length === 0 || el.offsetWidth === 0 || el.offsetHeight === 0 || el.closest(`#${AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID}`)) return;
				const style = window.getComputedStyle(el);
				const fgOriginalRgba = ar_parseCssColorString(style.color);
				if (fgOriginalRgba[3] === 0) return;
				const bgEffectiveRgba = ar_getEffectiveBackgroundColorOfElement(el);
				const fgPerceivedRgba = ar_blendColors(fgOriginalRgba, bgEffectiveRgba);
				const currentContrast = ar_getContrastRatioBetweenColors(fgPerceivedRgba, bgEffectiveRgba);
				const isLargeText = ar_isTextLargeForWCAG(el);
				const requiredContrast = isLargeText ? AR_CONFIG.CONTRAST_RATIO_AA_LARGE_TEXT : AR_CONFIG.CONTRAST_RATIO_AA_NORMAL_TEXT;
                const originalFgColorString = `rgba(${fgOriginalRgba.join(',')})`;
                const originalBgColorString = `rgb(${bgEffectiveRgba.slice(0,3).join(',')})`;
				if (currentContrast < requiredContrast) {
                    const initialFailureKey = `${el.id || el.dataset.arGeneratedId || ar_generateUniqueElementId('contrast-el-') }::CONTRAST_FAILURE_INITIAL::${originalFgColorString}-${originalBgColorString}`;
                    if (!ar_loggedIssuesTracker.has(initialFailureKey)) {
                        ar_logAccessibilityIssue('Critical', `Low contrast: ${currentContrast.toFixed(2)}:1 (Req: ${requiredContrast}:1).`, el, `Original: ${originalFgColorString} on ${originalBgColorString}. Attempting autofix.`, 'Perceivable', '1.4.3 Contrast (Minimum)', false, 'AA');
                    }
					const fixed = this._attemptContrastFix(el, fgOriginalRgba, bgEffectiveRgba, requiredContrast, originalFgColorString, originalBgColorString);
                    if (fixed.success) {
                        ar_logAccessibilityIssue('Info', `Low contrast auto-fixed. New text: ${fixed.newFgCss}, New BG: ${fixed.newBgCss || 'unchanged'}. New contrast: ${fixed.newContrast.toFixed(2)}:1. Strategy: ${fixed.strategy}.`, el, `Original: ${originalFgColorString}, ${originalBgColorString}.`, 'Perceivable', '1.4.3', true, 'AA');
                        ar_loggedIssuesTracker.add(initialFailureKey);
                    } else {
                        const failKey = `${initialFailureKey}::AUTOFIX_FAILED`;
                        if (!ar_loggedIssuesTracker.has(failKey)) {
                            ar_logAccessibilityIssue('Critical', `Low contrast ${currentContrast.toFixed(2)}:1. Autofix failed. Best: ${fixed.newContrast ? fixed.newContrast.toFixed(2)+':1' : 'N/A'}.`, el, `Original: ${originalFgColorString} on ${originalBgColorString}. Manually adjust.`, 'Perceivable', '1.4.3', false, 'AA');
                            ar_loggedIssuesTracker.add(failKey);
                        }
                    }
				}
			} catch (e) { console.error('Error: ContrastRatio Check:', e, el); }
		});
		if (!targetElement) console.groupEnd();
	};

    AR_CheckModulesProto._attemptContrastFix = function(el, fgRgba, bgRgba, requiredContrast, origFgCss, origBgCss) {
        let currentFgRgba = [...fgRgba], currentBgRgba = [...bgRgba];
        let newContrast = 0, newFgCss = '', newBgCss = null, strategy = '';
        if (currentFgRgba[3] < 1) {
            strategy = 'force_opaque_text'; currentFgRgba[3] = 1; newFgCss = `rgb(${currentFgRgba.slice(0,3).join(',')})`;
            el.style.setProperty('color', newFgCss, 'important');
            const reEvaluatedPerceivedFg = ar_blendColors(currentFgRgba, currentBgRgba);
            newContrast = ar_getContrastRatioBetweenColors(reEvaluatedPerceivedFg, currentBgRgba);
            if (newContrast >= requiredContrast) return { success: true, newFgCss, newBgCss, newContrast, strategy };
        }
        strategy = 'simple_bw_text';
        const isBgDark = ar_getLuminanceFromRgb(currentBgRgba) < 0.5;
        currentFgRgba = isBgDark ? [255, 255, 255, 1] : [0, 0, 0, 1];
        newFgCss = `rgb(${currentFgRgba.slice(0,3).join(',')})`;
        el.style.setProperty('color', newFgCss, 'important');
        newContrast = ar_getContrastRatioBetweenColors(currentFgRgba, currentBgRgba);
        if (newContrast >= requiredContrast) return { success: true, newFgCss, newBgCss, newContrast, strategy };
        strategy = 'iterative_text_hsl';
        let tempFgRgb = fgRgba.slice(0,3);
        for (let i = 0; i < AR_CONFIG.CONTRAST_ADJUSTMENT_STEPS; i++) {
            let [h, s, l] = ar_rgbToHsl(...tempFgRgb);
            l = isBgDark ? Math.min(1, l + AR_CONFIG.CONTRAST_ADJUSTMENT_AMOUNT * (i / (AR_CONFIG.CONTRAST_ADJUSTMENT_STEPS -1) + 0.1)) : Math.max(0, l - AR_CONFIG.CONTRAST_ADJUSTMENT_AMOUNT * (i / (AR_CONFIG.CONTRAST_ADJUSTMENT_STEPS -1) + 0.1));
            tempFgRgb = ar_hslToRgb(h, s, l); currentFgRgba = [...tempFgRgb, 1]; newFgCss = `rgb(${currentFgRgba.slice(0,3).join(',')})`;
            el.style.setProperty('color', newFgCss, 'important');
            newContrast = ar_getContrastRatioBetweenColors(currentFgRgba, currentBgRgba);
            if (newContrast >= requiredContrast) return { success: true, newFgCss, newBgCss, newContrast, strategy };
        }
        const nonBgChangeTags = ['BODY', 'MAIN', 'HEADER', 'FOOTER', 'NAV', 'ASIDE'];
        if (!nonBgChangeTags.includes(el.tagName.toUpperCase())) {
            strategy += '+iterative_bg_hsl'; let tempBgRgb = bgRgba.slice(0,3);
            const isOriginalTextDark = ar_getLuminanceFromRgb(fgRgba) < 0.5;
            for (let i = 0; i < AR_CONFIG.CONTRAST_ADJUSTMENT_STEPS; i++) {
                let [h, s, l] = ar_rgbToHsl(...tempBgRgb);
                const delta = AR_CONFIG.CONTRAST_ADJUSTMENT_AMOUNT * (i / (AR_CONFIG.CONTRAST_ADJUSTMENT_STEPS -1) + 0.1);
                if (delta > AR_CONFIG.AGGRESSIVE_CONTRAST_BG_ADJUST_MAX_DELTA) break;
                l = isOriginalTextDark ? Math.min(1, l + delta) : Math.max(0, l - delta);
                tempBgRgb = ar_hslToRgb(h, s, l); currentBgRgba = [...tempBgRgb, 1]; newBgCss = `rgb(${currentBgRgba.slice(0,3).join(',')})`;
                el.style.setProperty('background-color', newBgCss, 'important');
                newContrast = ar_getContrastRatioBetweenColors(fgRgba, currentBgRgba);
                if (newContrast >= requiredContrast) {
                     el.style.setProperty('color', origFgCss, 'important');
                    return { success: true, newFgCss: origFgCss, newBgCss, newContrast, strategy };
                }
            }
        }
        el.style.setProperty('color', origFgCss);
        if (el.style.backgroundColor !== origBgCss && origBgCss) el.style.setProperty('background-color', origBgCss);
        else if (!origBgCss) el.style.removeProperty('background-color');
        return { success: false, newFgCss: origFgCss, newBgCss: origBgCss, newContrast, strategy: 'all_failed' };
    };

	AR_CheckModulesProto.checkFormFieldLabels = function () {
		ar_logSection('Form Field Labels');
		document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]), select, textarea').forEach(field => {
			try {
				if (ar_isVisuallyHidden(field) || ar_hasAccessibleNameForElement(field)) return;
				const fieldId = field.id || ar_generateUniqueElementId('field-');
				if (!field.id) field.id = fieldId;
				let labelText = (field.getAttribute('title') || '').trim() || (field.placeholder || '').trim();
				if ((field.type === 'radio' || field.type === 'checkbox') && field.nextSibling && field.nextSibling.nodeType === Node.TEXT_NODE && (field.nextSibling.textContent || '').trim().length > 0) {
					const textNode = field.nextSibling; const newLabel = document.createElement('label');
					newLabel.htmlFor = fieldId; newLabel.appendChild(document.createTextNode((textNode.textContent || '').trim()));
					textNode.parentNode.insertBefore(newLabel, textNode.nextSibling); textNode.parentNode.removeChild(textNode);
					ar_logAccessibilityIssue('Moderate', `Radio/checkbox missing label. Auto-wrapped adjacent text.`, field, '**Manual review required.**', 'Perceivable', '3.3.2 / 1.3.1', true, 'A');
					return;
				}
				if (labelText) {
					ar_setAttributeAndLog(field, 'aria-label', labelText, 'Moderate', `Field missing label. Auto-set aria-label from title/placeholder: "${labelText}".`, '**Manual review required.** Prefer visible <label>.', 'Perceivable', '3.3.2', 'A');
				} else {
					const newLabel = document.createElement('label'); newLabel.htmlFor = fieldId;
					newLabel.textContent = field.name ? `Label for ${field.name}` : `Label for field ${fieldId}`;
                    Object.assign(newLabel.style, { position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' });
					if (field.parentElement) {
						field.parentElement.insertBefore(newLabel, field);
						ar_logAccessibilityIssue('Critical', `Field missing label. Auto-added generic hidden <label>.`, field, '**Manual review required.**', 'Perceivable', '3.3.2', true, 'A');
					} else {
						ar_logAccessibilityIssue('Critical', `Field missing label. Could not auto-add <label>.`, field, 'Provide label.', 'Perceivable', '3.3.2', false, 'A');
					}
				}
			} catch (e) { console.error('Error: FormFieldLabels Check:', e, field); }
		});
		console.groupEnd();
	};

	AR_CheckModulesProto.checkFormValidationAria = function () {
		ar_logSection('Form Validation ARIA');
		document.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(el => {
			try {
				if (ar_isVisuallyHidden(el)) return;
				this._checkRequiredAria(el);
				this._checkInvalidAria(el);
			} catch (e) { console.error('Error: FormValidationAria Check:', e, el); }
		});
		console.groupEnd();
	};

	AR_CheckModulesProto._checkRequiredAria = function (el) {
		const previousSiblingText = (el.previousSibling && el.previousSibling.nodeType === Node.TEXT_NODE) ? el.previousSibling.textContent.trim() : '';
		const parentLabel = el.closest('label');
		const labelText = parentLabel ? (parentLabel.textContent || '').trim() : '';
        const nextSiblingText = (el.nextSibling && el.nextSibling.nodeType === Node.TEXT_NODE) ? el.nextSibling.textContent.trim() : '';
		if ((previousSiblingText.endsWith('*') || labelText.includes('*') || nextSiblingText.startsWith('*')) && !el.hasAttribute('required') && el.getAttribute('aria-required') !== 'true') {
			ar_setAttributeAndLog(el, 'required', '', 'Minor', 'Field visually marked required ("*") but missing `required`. Auto-added.', 'Ensure `required` and `aria-required="true"`.', 'Robust', '3.3.2 / 4.1.2', 'A');
		}
		if (el.hasAttribute('required') && el.getAttribute('aria-required') !== 'true') {
			ar_setAttributeAndLog(el, 'aria-required', 'true', 'Moderate', 'Required field missing aria-required="true". Auto-fixed.', 'Add aria-required="true".', 'Robust', '4.1.2', 'A');
		}
	};

	AR_CheckModulesProto._checkInvalidAria = function (el) {
		const ariaInvalid = el.getAttribute('aria-invalid');
		if (ariaInvalid && !['true', 'false'].includes(ariaInvalid.toLowerCase())) {
			ar_setAttributeAndLog(el, 'aria-invalid', 'false', 'Minor', 'aria-invalid invalid value. Auto-set to "false".', 'Use "true" or "false".', 'Robust', '4.1.2', 'A');
		}
		if (el.getAttribute('aria-invalid') === 'true' && !el.hasAttribute('aria-describedby')) {
			let errorMsgElement = null;
			const potentialErrorSibling = el.nextElementSibling;
			if (potentialErrorSibling && ((potentialErrorSibling.className || '').toLowerCase().includes('error') || (potentialErrorSibling.className || '').toLowerCase().includes('invalid') || potentialErrorSibling.getAttribute('role') === 'alert')) {
				errorMsgElement = potentialErrorSibling;
                if (!errorMsgElement.id) errorMsgElement.id = ar_generateUniqueElementId('error-msg-');
			} else {
				errorMsgElement = document.createElement('span'); errorMsgElement.id = ar_generateUniqueElementId('error-msg-');
				errorMsgElement.textContent = 'Invalid input.';
                Object.assign(errorMsgElement.style, { position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' });
				errorMsgElement.setAttribute('role', 'alert');
				el.parentNode.insertBefore(errorMsgElement, el.nextSibling);
			}
			if (errorMsgElement && errorMsgElement.id) {
				ar_setAttributeAndLog(el, 'aria-describedby', errorMsgElement.id, 'Minor', `Input aria-invalid="true" missing aria-describedby. Auto-linked/added error.`, 'Ensure invalid inputs described by error message via aria-describedby.', 'Understandable', '3.3.1', true, 'A');
			}
		}
	};

	AR_CheckModulesProto.checkLandmarkRoles = function (globalState) {
		ar_logSection('ARIA Landmark Roles / HTML5 Semantic Elements');
		this._identifyExistingLandmarks(globalState);
		this._ensureEssentialLandmarks(globalState);
		this._checkMultipleUniqueLandmarks(globalState);
		console.groupEnd();
	};

	AR_CheckModulesProto._identifyExistingLandmarks = function (globalState) {
		AR_SELECTOR_STRINGS.LANDMARK_ROLES_ARRAY.forEach(role => { globalState.detectedLandmarkRoleCounts[role] = 0; });
		AR_SELECTOR_STRINGS.LANDMARK_HTML_TAGS_ARRAY.forEach(tag => { globalState.detectedLandmarkRoleCounts[tag] = globalState.detectedLandmarkRoleCounts[tag] || 0; });
		document.querySelectorAll('*').forEach(el => {
			if (ar_isVisuallyHidden(el)) return;
			const role = el.getAttribute('role'); const tagName = el.tagName.toLowerCase();
			if (role && AR_SELECTOR_STRINGS.LANDMARK_ROLES_ARRAY.includes(role)) {
				globalState.detectedLandmarkRoleCounts[role]++;
			} else if (AR_SELECTOR_STRINGS.LANDMARK_HTML_TAGS_ARRAY.includes(tagName)) {
				const implicitRole = {'main': 'main', 'header': 'banner', 'footer': 'contentinfo', 'nav': 'navigation', 'aside': 'complementary', 'form': 'form', 'section': (el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')) ? 'region' : null }[tagName];
				if (implicitRole) globalState.detectedLandmarkRoleCounts[implicitRole]++;
			}
		});
	};

    AR_CheckModulesProto._ensureEssentialLandmark = function(globalState, landmarkName, config) {
        const { selector, htmlTag, role, placement, contentHeuristic } = config;
        const body = document.body;
        if (globalState.detectedLandmarkRoleCounts[landmarkName] === 0) {
            let candidateElement = document.querySelector(htmlTag) || document.querySelector(`[role="${role}"]`) || document.querySelector(selector);
            if (candidateElement) {
                if (candidateElement.tagName.toLowerCase() !== htmlTag && !candidateElement.getAttribute('role')) {
                    ar_setAttributeAndLog(candidateElement, 'role', role, 'Moderate', `Missing ${landmarkName}. Auto-added role to <${candidateElement.tagName.toLowerCase()}>.`, `Use <${htmlTag}> or role="${role}".`, 'Perceivable', '1.3.1', 'A');
                    globalState.detectedLandmarkRoleCounts[landmarkName]++;
                } else if (candidateElement.tagName.toLowerCase() === htmlTag && !candidateElement.getAttribute('role') && role !== htmlTag && landmarkName === role) {
                    ar_setAttributeAndLog(candidateElement, 'role', role, 'Info', `<${htmlTag}> candidate for ${landmarkName}. Auto-added role.`, `Consider explicit role.`, 'Perceivable', '1.3.1', 'A');
                    globalState.detectedLandmarkRoleCounts[landmarkName]++;
                } else if (!globalState.detectedLandmarkRoleCounts[landmarkName]) {
                     globalState.detectedLandmarkRoleCounts[landmarkName]++;
                }
            } else {
                const newLandmark = document.createElement(htmlTag);
                if (role !== htmlTag && role) newLandmark.setAttribute('role', role);
                let contentMoved = false;
                if (contentHeuristic) {
                    const bodyChildren = Array.from(body.children);
                    const headerEl = body.querySelector(AR_CheckModules._landmarkConfigs.banner.htmlTag + ', [role=banner]');
                    const navEl = body.querySelector(AR_CheckModules._landmarkConfigs.navigation.htmlTag + ', [role=navigation]');
                    const footerEl = body.querySelector(AR_CheckModules._landmarkConfigs.contentinfo.htmlTag + ', [role=contentinfo]');
                    const childrenToMove = contentHeuristic(bodyChildren, headerEl, navEl, footerEl);
                    if (childrenToMove.length > 0) {
                        childrenToMove.forEach(child => {
                            if (child.parentNode === body && child !== newLandmark && !['SCRIPT', 'STYLE', 'LINK', AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID, AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID].includes(child.tagName) && !child.closest(AR_CheckModules._landmarkConfigs.banner.htmlTag) && !child.closest(AR_CheckModules._landmarkConfigs.navigation.htmlTag) && !child.closest(AR_CheckModules._landmarkConfigs.contentinfo.htmlTag) && !(child.tagName.toLowerCase() === 'main' && landmarkName !== 'main')) {
                                newLandmark.appendChild(child); contentMoved = true;
                            }
                        });
                    }
                }
                if (placement === 'prepend' && body.firstChild) body.insertBefore(newLandmark, body.firstChild);
                else if (placement === 'append') body.appendChild(newLandmark);
                else if (placement === 'afterHeader') {
                    const headerRef = body.querySelector(AR_CheckModules._landmarkConfigs.banner.htmlTag + ', [role=banner]');
                    if (headerRef && headerRef.nextSibling) body.insertBefore(newLandmark, headerRef.nextSibling);
                    else if (body.firstChild) body.insertBefore(newLandmark, body.firstChild); else body.appendChild(newLandmark);
                } else if (placement === 'beforeFooter') {
                    const footerRef = body.querySelector(AR_CheckModules._landmarkConfigs.contentinfo.htmlTag + ', [role=contentinfo]');
                    if (footerRef) body.insertBefore(newLandmark, footerRef); else body.appendChild(newLandmark);
                } else body.appendChild(newLandmark);
                ar_logAccessibilityIssue('Moderate', `Missing "${landmarkName}". Aggressively Auto-created <${htmlTag}>${contentMoved ? ' and wrapped content.' : '.'}`, newLandmark, 'Verify structure. Significant DOM change.', 'Perceivable', '1.3.1', true, 'A');
                globalState.detectedLandmarkRoleCounts[landmarkName]++;
            }
        }
    };

    AR_CheckModulesProto._landmarkConfigs = {
        'banner': { selector: AR_SELECTOR_STRINGS.COMMON_HEADER_SELECTORS, htmlTag: 'header', role: 'banner', placement: 'prepend', contentHeuristic: (children) => children.slice(0, Math.min(children.length, 3)) },
        'navigation': { selector: AR_SELECTOR_STRINGS.COMMON_NAV_SELECTORS, htmlTag: 'nav', role: 'navigation', placement: 'afterHeader', contentHeuristic: (children) => { const navCand = children.find(c => c.tagName === 'UL' && c.querySelectorAll('li > a[href]').length > 2); return navCand ? [navCand] : []; }},
        'main': { selector: AR_SELECTOR_STRINGS.MAIN_CONTENT_TARGET_SELECTORS, htmlTag: 'main', role: 'main', placement: 'beforeFooter', contentHeuristic: (children, header, nav, footer) => {
            const mainContent = []; let inMain = false;
            for (const child of children) {
                if (child === header || child === nav || child.id === AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID || child.id === AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID || ['SCRIPT', 'STYLE', 'LINK'].includes(child.tagName)) { if (!inMain && child !== header && child !== nav) {} else continue; }
                if (child === footer) break; inMain = true; mainContent.push(child);
            }
            return mainContent.length > 0 ? mainContent : children.filter(c => c !== header && c !== nav && c !== footer && !['SCRIPT', 'STYLE'].includes(c.tagName) && c.id !== AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID && c.id !== AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID).slice(0, Math.max(1, children.length - (header?1:0) - (nav?1:0) - (footer?1:0) - 2));
        }},
        'contentinfo': { selector: AR_SELECTOR_STRINGS.COMMON_FOOTER_SELECTORS, htmlTag: 'footer', role: 'contentinfo', placement: 'append', contentHeuristic: (children) => children.length > 1 ? children.slice(Math.max(0, children.length - 2)) : children }
    };

	AR_CheckModulesProto._ensureEssentialLandmarks = function (globalState) {
        for (const landmarkName in this._landmarkConfigs) {
            this._ensureEssentialLandmark(globalState, landmarkName, this._landmarkConfigs[landmarkName]);
        }
	};

	AR_CheckModulesProto._checkMultipleUniqueLandmarks = function (globalState) {
		['main', 'banner', 'contentinfo'].forEach(roleName => {
			if (globalState.detectedLandmarkRoleCounts[roleName] > 1) {
				const elements = document.querySelectorAll(`${this._landmarkConfigs[roleName].htmlTag}, [role="${roleName}"]`);
				ar_logAccessibilityIssue('Minor', `Multiple "${roleName}" landmarks (${globalState.detectedLandmarkRoleCounts[roleName]}).`, elements.length > 0 ? elements[0] : document.body, `Usually one "${roleName}" per page.`, 'Perceivable', '1.3.1 / 2.4.1', false, 'A');
			}
		});
	};

	AR_CheckModulesProto.checkFocusIndicators = function () {
		ar_logSection('Focus Indicators');
		let styleTag = document.getElementById('ar-focus-style');
		if (!styleTag) {
			styleTag = document.createElement('style'); styleTag.id = 'ar-focus-style';
			styleTag.textContent = `${AR_SELECTOR_STRINGS.INTERACTIVE_ELEMENTS.split(',').map(s => `${s.trim()}:focus-visible`).join(',\n')} { outline: 3px solid #0056b3 !important; outline-offset: 2px !important; box-shadow: 0 0 0 3px rgba(112, 161, 255, 0.5) !important; }`;
			document.head.appendChild(styleTag);
			ar_logAccessibilityIssue('Info', 'Injected global CSS for :focus-visible.', styleTag, 'Review custom focus styles.', 'Operable', '2.4.7 / 2.4.11', true, 'AA');
		}
		document.querySelectorAll(AR_SELECTOR_STRINGS.INTERACTIVE_ELEMENTS).forEach(el => {
			try {
				if (ar_isVisuallyHidden(el)) return;
				const computedStyle = window.getComputedStyle(el);
				const defaultOutlineNone = computedStyle.outlineStyle === 'none' || parseFloat(computedStyle.outlineWidth) === 0;
                const defaultBoxShadowNone = computedStyle.boxShadow === 'none' || computedStyle.boxShadow === '';
				if (defaultOutlineNone && defaultBoxShadowNone) {
                    if (el.style.outline === 'none !important' || (el.style.outlineStyle === 'none' && el.style.getPropertyPriority('outline-style') === 'important')) {
                         ar_logAccessibilityIssue('Moderate', 'Element has `outline: none !important;`.', el, 'Avoid `!important` to remove outlines.', 'Operable', '2.4.7', false, 'AA');
                    } else if (defaultOutlineNone) {
                         ar_logAccessibilityIssue('Minor', 'Element has `outline: none`. Ensure :focus-visible provides indicator.', el, 'Verify visible focus indicator.', 'Operable', '2.4.7', false, 'AA');
                    }
				}
			} catch (e) { console.error('Error: FocusIndicators Check:', e, el); }
		});
		console.log('\n💡 Manual Verification for Focus Indicators is CRUCIAL.');
		console.groupEnd();
	};

	AR_CheckModulesProto.checkSkipLinks = function (globalState) {
		ar_logSection('Skip Link');
		const existingSkipLink = document.querySelector('a[href^="#"]:first-child, a.skip-link:first-child, [data-skip-link="true"]:first-child');
		if (!existingSkipLink || ar_isVisuallyHidden(existingSkipLink)) {
			const newSkipLink = this._createSkipLinkElement();
			let mainContentTarget = this._findMainContentTarget();
			if (mainContentTarget) {
				if (!mainContentTarget.id) mainContentTarget.id = ar_generateUniqueElementId('main-content-target-');
				if (mainContentTarget.getAttribute('tabindex') === null && !mainContentTarget.matches(AR_SELECTOR_STRINGS.NATIVE_INTERACTIVE_TAGS) && mainContentTarget.getAttribute('role') !== 'region' && mainContentTarget.tagName !== 'MAIN') {
					ar_setAttributeAndLog(mainContentTarget, 'tabindex', '-1', 'Info', 'Main content target for skip link made focusable.', 'Ensure main content area focusable for skip links.', 'Operable', '2.4.1', true, 'A');
				}
				newSkipLink.href = `#${mainContentTarget.id}`; document.body.prepend(newSkipLink);
				ar_logAccessibilityIssue('Moderate', 'No visible "skip to main" link. Auto-injected.', newSkipLink, 'Ensure skip link is first, targets main, visible on focus.', 'Operable', '2.4.1', true, 'A');
			} else {
				ar_logAccessibilityIssue('Moderate', 'No "skip to main" link, no clear main target.', document.body, 'Implement skip link.', 'Operable', '2.4.1', false, 'A');
			}
		}
		console.groupEnd();
	};

	AR_CheckModulesProto._createSkipLinkElement = function () {
		const skipLink = document.createElement('a'); skipLink.textContent = 'Skip to main content';
		Object.assign(skipLink.style, { position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden', zIndex: '-999', padding: '0.5em 1em', backgroundColor: '#f0f0f0', color: '#333', textDecoration: 'none', borderRadius: '3px', border: '1px solid #ccc', transition: 'left 0s 0.3s, top 0s 0.3s' });
		skipLink.onfocus = function () { Object.assign(this.style, { left: '10px', top: '10px', width: 'auto', height: 'auto', zIndex: '2147483647', boxShadow: '0 0 10px rgba(0,0,0,0.5)', transitionDelay: '0s' }); };
		skipLink.onblur = function () { Object.assign(this.style, { left: '-9999px', top: 'auto', width: '1px', height: '1px', zIndex: '-999', boxShadow: 'none', transitionDelay: '0s 0.3s' }); };
		return skipLink;
	};

	AR_CheckModulesProto._findMainContentTarget = function () {
		let target = document.querySelector(AR_SELECTOR_STRINGS.MAIN_CONTENT_TARGET_SELECTORS) || document.querySelector('article') || document.querySelector('section[aria-label], section[aria-labelledby]') || document.body.children[Math.min(1, document.body.children.length -1)];
        while(target && (target.matches('script, style, link') || target.id === AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID || target.id === AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID || target.classList.contains('skip-link'))) {
            target = target.nextElementSibling;
        }
		return target;
	};

	AR_CheckModulesProto.checkDocumentGlobals = function () {
		ar_logSection('Global Document Setup');
		const head = document.head; const body = document.body;
		this._checkDocumentTitle(head, body);
		this._checkViewportMeta(head);
		this._checkMetaRefresh(head);
		if (!head.querySelector('#ar-focus-style')) AR_CheckModules.checkFocusIndicators();
		console.groupEnd();
	};

	AR_CheckModulesProto._checkDocumentTitle = function (head, body) {
		const titleElement = head.querySelector('title');
		if (!titleElement || !(titleElement.textContent || '').trim()) {
			const h1 = body.querySelector('h1');
			const h1Text = (h1 && h1.textContent) ? h1.textContent.trim().substring(0, 60) : '';
			let newTitleText = (h1Text || 'Untitled Page') + (h1Text ? '' : ' - AutoTitle');
			let newTitleEl = titleElement || document.createElement('title');
			ar_setAttributeAndLog(newTitleEl, 'textContent', newTitleText, 'Critical', `Doc title missing/empty. Auto-generated: "${newTitleText}".`, '**Manual review required.** Provide descriptive title.', 'Operable', '2.4.2 Page Titled', 'A');
			if (!titleElement) head.appendChild(newTitleEl);
		}
	};

	AR_CheckModulesProto._checkViewportMeta = function (head) {
		let viewportMeta = head.querySelector('meta[name="viewport"]');
		const currentContent = viewportMeta ? viewportMeta.content : '';
        let newContent = currentContent; let issueFound = false;
		if (!viewportMeta || !currentContent) {
            newContent = 'width=device-width, initial-scale=1.0, user-scalable=yes'; issueFound = true;
            if (!viewportMeta) { viewportMeta = document.createElement('meta'); viewportMeta.name = 'viewport'; head.appendChild(viewportMeta); }
            ar_setAttributeAndLog(viewportMeta, 'content', newContent, 'Critical', 'Viewport missing/empty. Auto-added responsive viewport.', 'Ensure proper viewport.', 'Perceivable', '1.4.10 / 1.4.4', 'AA'); return;
        }
        if (!currentContent.includes('width=device-width')) { newContent = `width=device-width,${newContent.length > 0 ? ',' : ''}${newContent}`; issueFound = true; }
        if (!/initial-scale\s*=\s*1(\.0*)?/.test(currentContent)) { newContent = `${newContent}${newContent.length > 0 ? ',' : ''}initial-scale=1.0`; issueFound = true; }
        if (currentContent.includes('user-scalable=no')) { newContent = newContent.replace(/user-scalable=no[,]?/g, ''); issueFound = true; }
        if (/maximum-scale\s*=\s*1(\.0*)?/.test(currentContent)) { newContent = newContent.replace(/maximum-scale\s*=\s*1(\.0*)?[,]?/g, ''); issueFound = true; }
        if (!newContent.includes('user-scalable=yes') && !newContent.includes('user-scalable=no')) { newContent = `${newContent}${newContent.length > 0 ? ',' : ''}user-scalable=yes`; }
        newContent = newContent.replace(/,{2,}/g, ',').replace(/,\s*$/, '').trim();
		if (issueFound && newContent !== currentContent) {
			ar_setAttributeAndLog(viewportMeta, 'content', newContent, 'Moderate', `Viewport improper. Auto-corrected to "${newContent}".`, 'Avoid user-scalable=no or maximum-scale=1.0.', 'Perceivable', '1.4.4 / 1.4.10', 'AA');
		}
	};

	AR_CheckModulesProto._checkMetaRefresh = function (head) {
		const metaRefresh = head.querySelector('meta[http-equiv="refresh"]');
		if (metaRefresh) {
			ar_logAccessibilityIssue('Critical', 'Meta refresh tag found.', metaRefresh, 'Avoid meta refresh. Use server-side redirects or JS with user controls.', 'Operable', '2.2.1 / 2.2.4', false, 'A');
		}
	};

})(AR_CheckModules);
