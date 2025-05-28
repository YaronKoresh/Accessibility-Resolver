function ar_generateUniqueElementId(prefix = 'ar-uid') {
	let newId;
	let attempts = 0;
	do {
		newId = `${ prefix }-${ Math.random().toString(36).substring(2, 9) }${ attempts > 0 ? '-' + attempts : '' }`;
		attempts++
	} while (document.getElementById(newId) || ar_generatedUniqueElementIds.has(newId));
	ar_generatedUniqueElementIds.add(newId);
	return newId
}
function ar_isVisuallyHidden(element) {
	if (!element)
		return true;
	const style = window.getComputedStyle(element);
	return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0' || element.offsetWidth === 0 || element.offsetHeight === 0
}
function ar_parseCssColorString(colorString) {
	if (!colorString || typeof colorString !== 'string')
		return [
			0,
			0,
			0,
			0
		];
	const div = document.createElement('div');
	Object.assign(div.style, {
		color: 'transparent',
		backgroundColor: 'transparent',
		display: 'none'
	});
	if (!document.body)
		return [
			0,
			0,
			0,
			0
		];
	document.body.appendChild(div);
	try {
		div.style.color = colorString;
		const compColor = window.getComputedStyle(div).color;
		const match = compColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
		if (match) {
			return [
				+match[1],
				+match[2],
				+match[3],
				match[4] !== undefined ? parseFloat(match[4]) : 1
			]
		}
	} catch (e) {
	} finally {
		div.remove()
	}
	return [
		0,
		0,
		0,
		0
	]
}
function ar_getLuminanceFromRgb(rgbArray) {
	const a = rgbArray.slice(0, 3).map(v => {
		v /= 255;
		return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
	});
	return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
}
function ar_getContrastRatioBetweenColors(rgba1, rgba2) {
	const lum1 = ar_getLuminanceFromRgb(rgba1);
	const lum2 = ar_getLuminanceFromRgb(rgba2);
	return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05)
}
function ar_blendColors(fgRgba, bgRgba) {
	const alpha = fgRgba[3];
	if (alpha === 1)
		return fgRgba;
	const r = Math.round((1 - alpha) * bgRgba[0] + alpha * fgRgba[0]);
	const g = Math.round((1 - alpha) * bgRgba[1] + alpha * fgRgba[1]);
	const b = Math.round((1 - alpha) * bgRgba[2] + alpha * fgRgba[2]);
	return [
		r,
		g,
		b,
		1
	]
}
function ar_getEffectiveBackgroundColorOfElement(element) {
	let currentEl = element;
	while (currentEl && currentEl !== document.documentElement) {
		const style = window.getComputedStyle(currentEl);
		const bgColor = style.backgroundColor;
		if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
			const rgba = ar_parseCssColorString(bgColor);
			if (rgba[3] === 1)
				return rgba
		}
		if (currentEl === document.body || !currentEl.parentElement)
			break;
		currentEl = currentEl.parentElement
	}
	const bodyBg = ar_parseCssColorString(window.getComputedStyle(document.body).backgroundColor);
	return bodyBg[3] === 1 ? bodyBg : [
		255,
		255,
		255,
		1
	]
}
function ar_isTextLargeForWCAG(element) {
	const style = window.getComputedStyle(element);
	const fontSize = parseFloat(style.fontSize);
	const fontWeight = style.fontWeight;
	return fontSize >= AR_CONFIG.LARGE_TEXT_FONT_SIZE_PX || fontSize >= AR_CONFIG.LARGE_TEXT_FONT_SIZE_BOLD_PX && (parseInt(fontWeight) >= 700 || fontWeight === 'bold' || fontWeight === 'bolder')
}
function ar_rgbToHsl(r, g, b) {
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b), min = Math.min(r, g, b);
	let h, s, l = (max + min) / 2;
	if (max === min) {
		h = s = 0
	} else {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
		case r:
			h = (g - b) / d + (g < b ? 6 : 0);
			break;
		case g:
			h = (b - r) / d + 2;
			break;
		case b:
			h = (r - g) / d + 4;
			break
		}
		h /= 6
	}
	return [
		h,
		s,
		l
	]
}
function ar_hslToRgb(h, s, l) {
	let r, g, b;
	if (s === 0) {
		r = g = b = l
	} else {
		const hue2rgb = (p, q, t) => {
			if (t < 0)
				t += 1;
			if (t > 1)
				t -= 1;
			if (t < 1 / 6)
				return p + (q - p) * 6 * t;
			if (t < 1 / 2)
				return q;
			if (t < 2 / 3)
				return p + (q - p) * (2 / 3 - t) * 6;
			return p
		};
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3)
	}
	return [
		Math.round(r * 255),
		Math.round(g * 255),
		Math.round(b * 255)
	]
}
function ar_getLogMeta(severity, isAutofixed) {
	const styles = {
		'Critical': {
			p: '\u274C Critical:',
			s: 'color:white;background:#d32f2f;border-left:4px solid #b71c1c;'
		},
		'Moderate': {
			p: '\u26A0️ Moderate:',
			s: 'color:black;background:#ffb300;border-left:4px solid #e65100;'
		},
		'Minor': {
			p: '\uD83D\uDCA1 Minor:',
			s: 'color:black;background:#64b5f6;border-left:4px solid #1976d2;'
		},
		'Info': {
			p: 'ℹ️ Info:',
			s: 'color:#37474f;background:#eceff1;border-left:4px solid #90a4ae;'
		}
	};
	const fixStyle = {
		p: '\u2705 Auto-Fixed:',
		s: 'color:darkgreen;background:#c8e6c9;border-left:4px solid #388e3c;'
	};
	return isAutofixed ? fixStyle : styles[severity] || styles.Info
}
function ar_logIssueDetails(element, recommendation, wcagPrinciple, wcagGuideline, wcagLevel, isAutofixed, severity) {
	if (element instanceof HTMLElement) {
		console.log('%cElement:', 'font-weight:bold;color:#424242;margin-left:15px;', element)
	} else if (typeof element === 'string') {
		console.log(`%cContext: %c${ element }`, 'font-weight:bold;color:#424242;margin-left:15px;', 'color:#424242;')
	}
	if (recommendation && (!isAutofixed || severity === 'Critical' || severity === 'Moderate')) {
		console.log(`%cRecommendation: %c${ recommendation }`, 'font-weight:bold;color:#0d47a1;margin-left:15px;padding-left:8px;border-left:3px solid #bbdefb;', 'color:#1565c0;')
	}
	if (wcagGuideline) {
		console.log(`%cWCAG: %c${ wcagGuideline } (${ wcagLevel }) - ${ wcagPrinciple }`, 'font-weight:bold;color:#4a148c;margin-left:15px;padding-left:8px;border-left:3px solid #e1bee7;', 'color:#6a1b9a;')
	}
}
function ar_logAccessibilityIssue(severity, message, element = null, recommendation = '', wcagPrinciple = '', wcagGuideline = '', isAutofixed = false, wcagLevel = 'A') {
	let elId = 'global', elSig = '';
	if (element instanceof HTMLElement) {
		elId = element.id || element.dataset.arGeneratedId || (element.dataset.arGeneratedId = ar_generateUniqueElementId('el-tracked-'));
		if (wcagGuideline === '1.4.3 Contrast (Minimum)') {
			const style = window.getComputedStyle(element);
			const fg = style.color;
			const bg = ar_getEffectiveBackgroundColorOfElement(element).join(',');
			elSig = `::${ fg }-${ bg }`
		}
	}
	const baseMsgKey = message.substring(0, 40).replace(/\s+/g, '_').replace(/[^\w-]/g, '');
	let issueKey = `${ elId }::${ wcagGuideline || baseMsgKey }${ elSig }::${ severity }`;
	if (message.toLowerCase().includes('autofix attempt failed') && wcagGuideline === '1.4.3 Contrast (Minimum)') {
		const origKey = `${ elId }::${ wcagGuideline }${ elSig }::Critical`;
		if (ar_loggedIssuesTracker.has(origKey))
			return;
		issueKey = origKey
	}
	if (ar_loggedIssuesTracker.has(issueKey) && !isAutofixed)
		return;
	ar_loggedIssuesTracker.add(issueKey);
	ar_totalScannedIssuesCounter++;
	ar_accessibilityIssuesLog.push({
		id: `ar-issue-${ ar_totalScannedIssuesCounter }`,
		severity,
		message,
		element,
		recommendation,
		wcagPrinciple,
		wcagGuideline,
		isAutofixed,
		wcagLevel
	});
	const logMeta = ar_getLogMeta(severity, isAutofixed);
	console.groupCollapsed(`%c${ logMeta.p } %c${ message }`, `${ logMeta.s }font-weight:bold;padding:4px 8px;border-radius:4px 0 0 4px;`, 'font-weight:normal;padding:4px 8px;');
	ar_logIssueDetails(element, recommendation, wcagPrinciple, wcagGuideline, wcagLevel, isAutofixed, severity);
	console.groupEnd();
	if (isAutofixed)
		ar_totalAutoFixedIssuesCounter++
}
function ar_logSection(title) {
	console.groupCollapsed(`%c🔎 ${ title } %c`, 'background-color:#e8f0fe;color:#174ea6;font-weight:bold;padding:6px 12px;border-radius:5px;border:1px solid #d0d8e0;margin-bottom:5px;display:inline-block;', '')
}
