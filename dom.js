function ar_hasAriaLabel(el) {
	return el.getAttribute('aria-label') && el.getAttribute('aria-label').trim()
}
function ar_hasAriaLabelledby(el) {
	const labelledbyAttr = el.getAttribute('aria-labelledby');
	if (!labelledbyAttr)
		return false;
	return labelledbyAttr.split(/\s+/).some(id => {
		const lblEl = document.getElementById(id);
		return lblEl && (lblEl.textContent || '').trim()
	})
}
function ar_hasTextOrValue(el) {
	return (el.textContent || '').trim() || (el.value || '').trim()
}
function ar_hasImageWithAltInAnchor(el) {
	const img = el.querySelector('img[alt]');
	return img && (img.alt || '').trim()
}
function ar_hasImageAlt(el) {
	return (el.alt || '').trim()
}
function ar_hasFigcaption(el) {
	const figcaption = el.querySelector('figcaption');
	return figcaption && (figcaption.textContent || '').trim()
}
function ar_hasExplicitLabel(el) {
	if (!el.id)
		return false;
	const labels = document.querySelectorAll(`label[for="${ el.id }"]`);
	return Array.from(labels).some(lbl => (lbl.textContent || '').trim() || lbl.querySelector('img[alt]'))
}
function ar_hasParentLabel(el) {
	const parentLbl = el.closest('label');
	return parentLbl && (parentLbl.textContent || '').trim() && (!parentLbl.htmlFor || parentLbl.htmlFor === el.id)
}
function ar_hasTitleAttr(el) {
	return !!(el.getAttribute('title') && el.getAttribute('title').trim())
}
function ar_hasAccessibleNameForElement(element) {
	if (!element)
		return false;
	if (ar_hasAriaLabel(element) || ar_hasAriaLabelledby(element))
		return true;
	const tagName = element.tagName.toUpperCase();
	if ((tagName === 'BUTTON' || tagName === 'INPUT' && [
			'submit',
			'reset',
			'button'
		].includes(element.type)) && ar_hasTextOrValue(element))
		return true;
	if (tagName === 'A' && (ar_hasTextOrValue(element) || ar_hasImageWithAltInAnchor(element)))
		return true;
	if (tagName === 'IMG' && ar_hasImageAlt(element))
		return true;
	if (tagName === 'INPUT' && element.type === 'image' && ar_hasImageAlt(element))
		return true;
	if (tagName === 'FIGURE' && ar_hasFigcaption(element))
		return true;
	if ([
			'INPUT',
			'SELECT',
			'TEXTAREA'
		].includes(tagName) && (ar_hasExplicitLabel(element) || ar_hasParentLabel(element)))
		return true;
	return ar_hasTitleAttr(element)
}
function ar_setAttributeAndLog(el, attr, val, sev, msg, rec, princ, guide, level = 'A') {
	try {
		if (attr === 'textContent')
			el.textContent = val;
		else
			el.setAttribute(attr, val);
		ar_logAccessibilityIssue(sev, msg, el, rec, princ, guide, true, level);
		return 1
	} catch (e) {
		console.error(`setAttribute Error: ${ attr }=${ val } on`, el, e);
		return 0
	}
}
function ar_removeAttributeAndLog(el, attr, sev, msg, rec, princ, guide, level = 'A') {
	try {
		el.removeAttribute(attr);
		ar_logAccessibilityIssue(sev, msg, el, rec, princ, guide, true, level);
		return 1
	} catch (e) {
		console.error(`removeAttribute Error: ${ attr } on`, el, e);
		return 0
	}
}
function ar_applyStylesAndLog(el, styles, sev, msg, rec, princ, guide, level = 'A') {
	try {
		for (const prop in styles) {
			el.style.setProperty(prop, styles[prop], 'important')
		}
		ar_logAccessibilityIssue(sev, msg, el, rec, princ, guide, true, level);
		return 1
	} catch (e) {
		console.error('applyStyles Error:', el, styles, e);
		return 0
	}
}
function ar_storeOriginalInlineStyle(element, cssProperty) {
	if (!ar_originalElementStylesMap.has(element)) {
		ar_originalElementStylesMap.set(element, {})
	}
	const elementOriginalStyles = ar_originalElementStylesMap.get(element);
	if (elementOriginalStyles[cssProperty] === undefined) {
		elementOriginalStyles[cssProperty] = element.style.getPropertyValue(cssProperty)
	}
}
function ar_restoreOriginalInlineStyle(element, cssProperty) {
	if (ar_originalElementStylesMap.has(element)) {
		const elementOriginalStyles = ar_originalElementStylesMap.get(element);
		if (elementOriginalStyles[cssProperty] !== undefined) {
			element.style.setProperty(cssProperty, elementOriginalStyles[cssProperty])
		} else {
			element.style.removeProperty(cssProperty)
		}
	}
}
function ar_getElementsForMenuTextStyleAdjustments() {
	return Array.from(document.querySelectorAll(AR_SELECTOR_STRINGS.TEXT_CONTAINER_ELEMENTS_AFFECTED_BY_MENU))
}
