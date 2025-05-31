function ar_setupMutationObserverForContrast() {
	const observer = new MutationObserver(mutationsList => {
		for (const mutation of mutationsList) {
			if (mutation.type === 'attributes' && (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
				if (mutation.target.nodeType === Node.ELEMENT_NODE) {
					AR_CheckModules.checkContrastRatioForAllElements(mutation.target)
				}
			} else if (mutation.type === 'childList') {
				mutation.addedNodes.forEach(node => {
					if (node.nodeType === Node.ELEMENT_NODE) {
						AR_CheckModules.checkContrastRatioForAllElements(node);
						node.querySelectorAll('*').forEach(descendant => AR_CheckModules.checkContrastRatioForAllElements(descendant))
					}
				})
			}
		}
	});
	observer.observe(document.body, {
		attributes: true,
		childList: true,
		subtree: true,
		attributeFilter: [
			'style',
			'class'
		]
	});
	console.log('\uD83D\uDCA1 MutationObserver for live contrast changes is active.')
}
async function ar_runAccessibilityScan() {
	ar_loggedIssuesTracker.clear();
	ar_accessibilityIssuesLog.length = 0;
	ar_totalScannedIssuesCounter = 0;
	ar_totalAutoFixedIssuesCounter = 0;
	console.log('%c Accessibility Resolver ', 'background:#0056b3;color:white;font-size:1.5em;font-weight:bold;padding:10px 20px;border-radius:5px;');
	console.log('Scanning for accessibility issues and applying auto-fixes...');
	console.time('AccessibilityScanDuration');
	const docElement = document.documentElement;
	const globalState = {
		lastHeadingLevel: 0,
		seenIds: new Map(),
		detectedLandmarkRoleCounts: {}
	};
	AR_SELECTOR_STRINGS.LANDMARK_ROLES_ARRAY.forEach(role => {
		globalState.detectedLandmarkRoleCounts[role] = 0
	});
	AR_SELECTOR_STRINGS.LANDMARK_HTML_TAGS_ARRAY.forEach(tag => {
		globalState.detectedLandmarkRoleCounts[tag] = globalState.detectedLandmarkRoleCounts[tag] || 0
	});
	AR_CheckModules.checkDocumentGlobals();
	AR_CheckModules.checkLangAttribute();
	AR_CheckModules.checkSkipLinks(globalState);
	AR_CheckModules.checkContentStructure(globalState);
	AR_CheckModules.checkMediaIntegrity();
	AR_CheckModules.checkImageAltText();
	AR_CheckModules.checkIframeTitles();
	AR_CheckModules.checkTableAccessibility();
	AR_CheckModules.checkOverlayFocusBlocking();
	AR_CheckModules.checkInteractiveElementSize();
	AR_CheckModules.checkHoverFocusContent();
	AR_CheckModules.checkAutoFormSubmission();
	AR_CheckModules.checkDuplicateIds(globalState);
	AR_CheckModules.checkAccessibleNames();
	AR_CheckModules.checkTabindexUsage();
	AR_CheckModules.checkAriaMisuse();
	AR_CheckModules.checkContrastRatioForAllElements();
	AR_CheckModules.checkFormFieldLabels();
	AR_CheckModules.checkFormValidationAria();
	AR_CheckModules.checkLandmarkRoles(globalState);
	AR_CheckModules.checkFocusIndicators();
	ar_setupMutationObserverForContrast();
	console.log('\n%c Accessibility Check and Auto-Fix Summary ', 'font-size:1.3em;font-weight:bold;color:#003973;padding:5px;background:#e3f2fd;border-bottom:2px solid #003973;display:block;text-align:center;');
	const unresolvedIssues = ar_accessibilityIssuesLog.filter(r => !r.isAutofixed);
	console.log(`%cTotal Issues Identified: %c${ ar_accessibilityIssuesLog.length }`, 'font-weight:bold;', 'font-weight:normal;');
	console.log(`%cAuto-Fixed: %c${ ar_totalAutoFixedIssuesCounter }`, 'font-weight:bold;color:green;', `font-weight:normal;color:${ ar_totalAutoFixedIssuesCounter > 0 ? 'green' : 'grey' };`);
	console.log(`%cUnresolved: %c${ unresolvedIssues.length }`, 'font-weight:bold;color:red;', `font-weight:normal;color:${ unresolvedIssues.length > 0 ? 'red' : 'green' };`);
	[
		'Critical',
		'Moderate',
		'Minor',
		'Info'
	].forEach(severity => {
		const issues = unresolvedIssues.filter(r => r.severity === severity && r.wcagLevel !== 'User');
		if (issues.length > 0) {
			const colorMap = {
				'Critical': '#c62828',
				'Moderate': '#ef6c00',
				'Minor': '#0277bd',
				'Info': '#546e7a'
			};
			console.groupCollapsed(`%c ${ severity } Unresolved: ${ issues.length } `, `color:white;background-color:${ colorMap[severity] };padding:3px 7px;border-radius:3px;font-weight:bold;`);
			issues.forEach(issue => {
				console.log(`%cMessage: %c${ issue.message }`, 'font-weight:bold;', '');
				if (issue.element instanceof HTMLElement)
					console.log('%cElement:', 'font-style:italic;', issue.element);
				if (issue.recommendation)
					console.log(`%cRecommendation: %c${ issue.recommendation }`, 'font-style:italic;color:#01579b;', '');
				if (issue.wcagGuideline)
					console.log(`%cWCAG: %c${ issue.wcagGuideline } (${ issue.wcagLevel })`, 'font-style:italic;color:#311b92;', '');
				console.log('---')
			});
			console.groupEnd()
		}
	});
	if (unresolvedIssues.filter(r => r.wcagLevel !== 'User').length > 0) {
		console.log("\n%cReview unresolved issues by expanding the groups above. The 'accessibilityScanGlobalResults' object in the console contains all findings.", 'color:#01579b;');
		window.accessibilityScanGlobalResults = ar_accessibilityIssuesLog
	} else if (ar_accessibilityIssuesLog.filter(r => r.wcagLevel !== 'User' && !r.isAutofixed).length === 0) {
		console.log('%c\uD83C\uDF89 All identified automated accessibility issues were either fixed or not detected in this scan!', 'color:green;font-weight:bold;font-size:1.1em;')
	}
	console.timeEnd('AccessibilityScanDuration');
	const generalObserver = new MutationObserver(() => {
		clearTimeout(ar_mainMutationObserverDebounceTimeout);
		ar_mainMutationObserverDebounceTimeout = setTimeout(() => {
			generalObserver.disconnect();
			console.warn('%cDOM has changed significantly. Re-run Accessibility Resolver for an accurate report.', 'color:orange;font-weight:bold;background:lightyellow;padding:5px;')
		}, AR_CONFIG.MUTATION_OBSERVER_DEBOUNCE_MILLISECONDS)
	});
	generalObserver.observe(docElement, {
		attributes: true,
		childList: true,
		subtree: true,
		characterData: true,
		attributeFilter: [
			'style',
			'class',
			'alt',
			'href',
			'role',
			'tabindex',
			'aria-hidden',
			'aria-label',
			'id',
			'for',
			'value',
			'src',
			'lang',
			'title'
		]
	})
}

function ar_initializeAndRunMerged() {
	console.log('%c Made by Yaron Koresh ', 'background:#4CAF50;color:white;font-size:1em;font-weight:bold;padding:5px 10px;border-radius:3px;');
	if (typeof AR_AccessibilityMenu.init !== 'function') {
		console.error('AR_AccessibilityMenu.init is not defined. Check script loading order for ar_menu_ui.js and ar_menu_actions.js.');
		return
	}
	if (typeof AR_CheckModules.checkDocumentGlobals !== 'function') {
		console.error('AR_CheckModules methods are not defined. Check script loading order for ar_check_modules_part1/2.js.');
		return
	}
	AR_AccessibilityMenu.init();
	ar_runAccessibilityScan();
}

if (document.readyState === 'complete') {
	ar_initializeAndRunMerged();
} else {
	document.addEventListener('load', () => {
		ar_initializeAndRunMerged()
	});
}
