var AR_AccessibilityMenu = AR_AccessibilityMenu || {};
(function (Menu) {
	const MENU_BUTTON_ID = 'aaa-menu-button';
	const MENU_PANEL_ID = 'aaa-menu-panel';
	const PAGE_STRUCTURE_PANEL_ID = 'aaa-page-structure-panel';
	const READING_MASK_TOP_ID = 'aaa-reading-mask-top';
	const READING_MASK_BOTTOM_ID = 'aaa-reading-mask-bottom';
	const READING_LINE_ID = 'aaa-reading-line';
	const CLASS_TEMP_HIGHLIGHT = 'ar-aaa-temp-highlight';
	function isAccessibilityMenuElement(el) {
		return el.closest(`#${ MENU_BUTTON_ID }`) || el.closest(`#${ MENU_PANEL_ID }`) || el.closest(`#${ PAGE_STRUCTURE_PANEL_ID }`);
	}
	if (typeof Menu._getLocalizedString === 'undefined') {
		console.error('ARMenu: _getLocalizedString is not defined. Ensure action.js is loaded before panel.js.');
		Menu._getLocalizedString = key => key;
	}
	Menu.panel = Menu.panel || {};
	Menu.panel.createMenuPanel = function () {
		const panel = document.createElement('div');
		panel.id = MENU_PANEL_ID;
		panel.setAttribute('role', 'dialog');
		panel.setAttribute('aria-modal', 'true');
		panel.setAttribute('aria-labelledby', 'ar-aaa-menu-title');
		panel.style.display = 'none';
		panel.innerHTML = Menu.panel.getMenuPanelHTML();
		document.body.appendChild(panel);
	};
	Menu.panel.createReadingAidElements = function () {
		Menu.readingMaskTop = document.createElement('div');
		Menu.readingMaskTop.className = READING_MASK_TOP_ID;
		document.body.appendChild(Menu.readingMaskTop);
		Menu.readingMaskBottom = document.createElement('div');
		Menu.readingMaskBottom.className = READING_MASK_BOTTOM_ID;
		document.body.appendChild(Menu.readingMaskBottom);
		Menu.readingLine = document.createElement('div');
		Menu.readingLine.className = READING_LINE_ID;
		document.body.appendChild(Menu.readingLine);
	};
	Menu.panel.createPageStructurePanel = function () {
		Menu.pageStructurePanel = document.createElement('div');
		Menu.pageStructurePanel.id = PAGE_STRUCTURE_PANEL_ID;
		Menu.pageStructurePanel.setAttribute('role', 'dialog');
		Menu.pageStructurePanel.setAttribute('aria-modal', 'false');
		Menu.pageStructurePanel.setAttribute('aria-labelledby', 'ar-aaa-structure-title');
		Menu.pageStructurePanel.style.display = 'none';
		Menu.pageStructurePanel.classList.add('ar-aaa-page-structure-panel');
		let panelHTML = `<h3 id="ar-aaa-structure-title">${ Menu._getLocalizedString('pageStructureTitle') }</h3>`;
		panelHTML += `<div class="ar-structure-category" id="ar-aaa-structure-headings"><h4>${ Menu._getLocalizedString('headings') }</h4><ul></ul></div>`;
		panelHTML += `<div class="ar-structure-category" id="ar-aaa-structure-landmarks"><h4>${ Menu._getLocalizedString('landmarks') }</h4><ul></ul></div>`;
		panelHTML += `<div class="ar-structure-category" id="ar-aaa-structure-links"><h4>${ Menu._getLocalizedString('links') }</h4><ul></ul></div>`;
		panelHTML += `<button class="ar-aaa-structure-close-btn" data-action="close-structure-panel">${ Menu._getLocalizedString('closeStructurePanel') }</button>`;
		Menu.pageStructurePanel.innerHTML = panelHTML;
		document.body.appendChild(Menu.pageStructurePanel);
		Menu.pageStructurePanel.querySelector('.ar-aaa-structure-close-btn').addEventListener('click', () => {
			Menu._togglePageStructurePanel(false);
			if (Menu.isReadingModeActive) {
				document.body.classList.remove('ar-aaa-reading-mode');
				Menu.isReadingModeActive = false;
				const rmButton = document.querySelector(`#${ MENU_PANEL_ID } button[data-action="reading-mode"]`);
				if (rmButton)
					Menu._updateButtonActiveState(rmButton, false);
			}
		});
		Menu.pageStructurePanel.addEventListener('keydown', event => {
			if (event.key === 'Escape') {
				Menu._togglePageStructurePanel(false);
				if (Menu.isReadingModeActive) {
					document.body.classList.remove('ar-aaa-reading-mode');
					Menu.isReadingModeActive = false;
					const rmButton = document.querySelector(`#${ MENU_PANEL_ID } button[data-action="reading-mode"]`);
					if (rmButton)
						Menu._updateButtonActiveState(rmButton, false);
				}
			}
		});
	};
	Menu.panel._getIconSVG = function (pathData, label = '') {
		return `<span class="ar-aaa-menu-icon" role="img" aria-label="${ label }"><svg viewBox="0 0 24 24">${ pathData }</svg></span>`;
	};
	Menu.panel.getMenuPanelHTML = function () {
		const ICONS = {
			textSize: Menu.panel._getIconSVG('<path d="M2.5,4V7H7.5V19H10.5V7H15.5V4M10.5,10.5H13.5V13.5H10.5V10.5Z"/>', Menu._getLocalizedString('textSize')),
			contrast: Menu.panel._getIconSVG('<path d="M12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6V18M20,15L19.3,14C19.5,13.4 19.6,12.7 19.6,12C19.6,11.3 19.5,10.6 19.3,10L20,9L17.3,4L16.7,5C15.9,4.3 14.9,3.8 13.8,3.5L13.5,2H10.5L10.2,3.5C9.1,3.8 8.1,4.3 7.3,5L6.7,4L4,9L4.7,10C4.5,10.6 4.4,11.3 4.4,12C4.4,12.7 4.5,13.4 4.7,14L4,15L6.7,20L7.3,19C8.1,19.7 9.1,20.2 10.2,20.5L10.5,22H13.5L13.8,20.5C14.9,20.2 15.9,19.7 16.7,19L17.3,20L20,15Z"/>', Menu._getLocalizedString('contrast')),
			highlight: Menu.panel._getIconSVG('<path d="M16.2,12L12,16.2L7.8,12L12,7.8M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z"/>', Menu._getLocalizedString('highlight')),
			readAloud: Menu.panel._getIconSVG('<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>', Menu._getLocalizedString('readAloudIcon')),
			readingMode: Menu.panel._getIconSVG('<path d="M5 5v14h14V5H5zm8 12H7v-2h6v2zm4-4H7v-2h10v2zm0-4H7V7h10v2z"/>', Menu._getLocalizedString('readingModeIcon')),
			readingMask: Menu.panel._getIconSVG('<path d="M11.5,6C8.46,6 5.83,7.43 4.42,9.59L2.93,8.1L1.87,9.16L3.87,11.16C3.67,11.46 3.5,11.72 3.5,12C3.5,12.28 3.67,12.54 3.87,12.84L1.87,14.84L2.93,15.9L4.42,14.41C5.83,16.57 8.46,18 11.5,18C14.54,18 17.17,16.57 18.58,14.41L20.07,15.9L21.13,14.84L19.13,12.84C19.33,12.54 19.5,12.28 19.5,12C19.5,11.72 19.33,11.46 19.13,11.16L21.13,9.16L20.07,8.1L18.58,9.59C17.17,7.43 14.54,6 11.5,6M11.5,8A4.5,4.5 0 0,1 16,12.5A4.5,4.5 0 0,1 11.5,17A4.5,4.5 0 0,1 7,12.5A4.5,4.5 0 0,1 11.5,8M11.5,10A2.5,2.5 0 0,0 9,12.5A2.5,2.5 0 0,0 11.5,15A2.5,2.5 0 0,0 14,12.5A2.5,2.5 0 0,0 11.5,10Z"/>', Menu._getLocalizedString('readingMaskIcon')),
			readingLine: Menu.panel._getIconSVG('<path d="M19 13H5v-2h14v2z"/>', Menu._getLocalizedString('readingLineIcon')),
			pageStructure: Menu.panel._getIconSVG('<path d="M3,3H9V7H3V3M15,3H21V7H15V3M3,10H9V14H3V10M15,10H21V14H15V10M3,17H9V21H3V17M15,17H21V21H15V17Z"/>', Menu._getLocalizedString('pageStructureIcon')),
			animation: Menu.panel._getIconSVG('<path d="M8,5V19L19,12L8,5Z"/>', Menu._getLocalizedString('animation')),
			fontStyle: Menu.panel._getIconSVG('<path d="M9.25,4V5.5H6.75V4H5.25V5.5H2.75V4H1.25V14.5H2.75V16H5.25V14.5H7.75V16H10.25V14.5H11.75V4H9.25M17.75,4V14.5H19.25V16H21.75V14.5H24.25V4H21.75V5.5H19.25V4H17.75M10.25,7H7.75V13H10.25V7M16.25,7H13.75V13H16.25V7Z"/>', Menu._getLocalizedString('fontStyle')),
			reset: Menu.panel._getIconSVG('<path d="M12,5V1L7,6L12,11V7A6,6 0 0,1 18,13A6,6 0 0,1 12,19A6,6 0 0,1 6,13H4A8,8 0 0,0 12,21A8,8 0 0,0 20,13A8,8 0 0,0 12,5Z"/>', Menu._getLocalizedString('reset')),
			close: Menu.panel._getIconSVG('<path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>', Menu._getLocalizedString('closeMenu'))
		};
		let html = `<h3 id="ar-aaa-menu-title">${ Menu._getLocalizedString('menuTitle') }</h3>`;
		html += `<div class="ar-aaa-menu-group"><h4 class="ar-aaa-profile-title">${ Menu._getLocalizedString('profilesTitle') }</h4><div class="ar-aaa-button-row">`;
		for (const profileKey in Menu.profiles) {
			const profile = Menu.profiles[profileKey];
			html += `<button data-action="profile-${ profileKey }">${ Menu.panel._getIconSVG(profile.iconPath, Menu._getLocalizedString('profileIcon')) } ${ Menu._getLocalizedString(profile.labelKey) }</button>`;
		}
		html += `</div></div>`;
		html += `
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row"> <button data-action="increase-text">${ ICONS.textSize } ${ Menu._getLocalizedString('increaseText') }</button> <button data-action="decrease-text">${ ICONS.textSize } ${ Menu._getLocalizedString('decreaseText') }</button> </div></div>
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row"> <button data-action="contrast-high">${ ICONS.contrast } ${ Menu._getLocalizedString('highContrast') }</button> <button data-action="contrast-invert">${ ICONS.contrast } ${ Menu._getLocalizedString('invertColors') }</button> <button data-action="contrast-dark">${ ICONS.contrast } ${ Menu._getLocalizedString('darkContrast') }</button> </div></div>
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row"> <button data-action="highlight-links">${ ICONS.highlight } ${ Menu._getLocalizedString('highlightLinks') }</button> <button data-action="enhanced-focus">${ ICONS.highlight } ${ Menu._getLocalizedString('enhancedFocus') }</button> </div></div>
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row"> <button data-action="read-aloud" class="ar-aaa-fullwidth-btn">${ ICONS.readAloud } ${ Menu._getLocalizedString('readAloud') }</button> </div></div>
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row"> <button data-action="reading-mode" class="ar-aaa-fullwidth-btn">${ ICONS.readingMode } ${ Menu._getLocalizedString('readingMode') }</button> </div></div>
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row"> <button data-action="reading-mask">${ ICONS.readingMask } ${ Menu._getLocalizedString('readingMask') }</button> <button data-action="reading-line">${ ICONS.readingLine } ${ Menu._getLocalizedString('readingLine') }</button> </div></div>
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row"> <button data-action="stop-animations" class="ar-aaa-fullwidth-btn">${ ICONS.animation } ${ Menu._getLocalizedString('stopAnimations') }</button> </div></div>
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row"> <button data-action="toggle-dyslexia-font" class="ar-aaa-fullwidth-btn">${ ICONS.fontStyle } ${ Menu._getLocalizedString('dyslexiaFont') }</button> </div></div>
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row"> <button data-action="reset-all" class="ar-aaa-fullwidth-btn ar-aaa-reset-btn">${ ICONS.reset } ${ Menu._getLocalizedString('resetAll') }</button> <button data-action="close-menu" class="ar-aaa-fullwidth-btn">${ ICONS.close } ${ Menu._getLocalizedString('closeMenu') }</button> </div></div>`;
		return html;
	};
	Menu.panel.populatePageStructurePanel = function () {
		if (!Menu.pageStructurePanel)
			return;
		const listedElements = new Set();
		const isHiddenOrEmpty = el => {
			if (!el || el.nodeType !== Node.ELEMENT_NODE)
				return true;
			if (window.getComputedStyle(el).display === 'none' || window.getComputedStyle(el).visibility === 'hidden' || el.offsetWidth === 0 || el.offsetHeight === 0) {
				return true;
			}
			if (el.matches('h1,h2,h3,h4,h5,h6,a[href]')) {
				return !ar_hasAccessibleNameForElement(el);
			}
			return false;
		};
		const getAccessibleName = el => {
			if (!el)
				return '';
			if (el.hasAttribute('aria-label') && el.getAttribute('aria-label').trim()) {
				return el.getAttribute('aria-label').trim();
			}
			if (el.hasAttribute('aria-labelledby')) {
				const labelledbyIds = el.getAttribute('aria-labelledby').split(/\s+/);
				for (const id of labelledbyIds) {
					const lblEl = document.getElementById(id);
					if (lblEl && lblEl.textContent.trim()) {
						return lblEl.textContent.trim();
					}
				}
			}
			if (el.textContent && el.textContent.trim()) {
				let text = el.textContent.trim().replace(/\s+/g, ' ');
				const tempDiv = document.createElement('div');
				tempDiv.textContent = text;
				text = tempDiv.textContent.trim().replace(/\s+/g, ' ');
				if (text.length > 100) {
					text = text.substring(0, 97) + '...';
				}
				return text;
			}
			if (el.tagName === 'A') {
				const img = el.querySelector('img[alt]');
				if (img && img.alt.trim()) {
					return img.alt.trim();
				}
			}
			if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
				if (el.placeholder && el.placeholder.trim())
					return el.placeholder.trim();
				if (el.title && el.title.trim())
					return el.title.trim();
			}
			return '';
		};
		const isElementAlreadyListedOrCovered = el => {
			if (listedElements.has(el))
				return true;
			let current = el.parentElement;
			while (current) {
				if (listedElements.has(current)) {
					const currentRole = current.getAttribute('role') || current.tagName.toLowerCase();
					if ([
							'main',
							'navigation',
							'banner',
							'contentinfo',
							'complementary',
							'form',
							'region',
							'search'
						].includes(currentRole)) {
						if (getAccessibleName(current) && !el.matches('h1, h2, h3, h4, h5, h6, a[href], button, input, select, textarea, [role="button"], [role="link"]')) {
							return true;
						}
					}
				}
				current = current.parentElement;
			}
			return false;
		};
		const addToList = (el, text, type) => {
			if (isAccessibilityMenuElement(el)) {
				return null;
			}
			if (isHiddenOrEmpty(el)) {
				return null;
			}
			if (isElementAlreadyListedOrCovered(el)) {
				return null;
			}
			const li = document.createElement('li');
			const button = document.createElement('button');
			const display_text = text.substring(0, 70) + (text.length > 70 ? '...' : '');
			button.textContent = display_text;
			button.title = text;
			button.addEventListener('click', () => {
				el.scrollIntoView({
					behavior: 'smooth',
					block: 'center'
				});
				el.classList.add(CLASS_TEMP_HIGHLIGHT);
				setTimeout(() => {
					el.classList.remove(CLASS_TEMP_HIGHLIGHT);
				}, 2000);
				Menu._togglePageStructurePanel(false);
			});
			li.appendChild(button);
			listedElements.add(el);
			return li;
		};
		const createListSection = (selector, containerId, itemType) => {
			const container = Menu.pageStructurePanel.querySelector(`#${ containerId } ul`);
			if (!container)
				return;
			container.innerHTML = '';
			let elements = [];
			if (itemType === 'landmarks') {
				const landmarkSelectors = [
					'main',
					'[role="main"]',
					'nav',
					'[role="navigation"]',
					'header',
					'[role="banner"]',
					'footer',
					'[role="contentinfo"]',
					'aside',
					'[role="complementary"]',
					'form',
					'[role="form"]',
					'[role="search"]',
					'section[aria-label]',
					'section[aria-labelledby]',
					'[role="region"][aria-label]',
					'[role="region"][aria-labelledby]'
				].join(',');
				elements = Array.from(document.querySelectorAll(landmarkSelectors));
			} else if (itemType === 'links') {
				elements = Array.from(document.querySelectorAll('a[href]:not([href=""]):not([href="#"]):not([href^="javascript:"])'));
			} else {
				elements = Array.from(document.querySelectorAll(selector));
			}
			elements = elements.filter(el => !isAccessibilityMenuElement(el));
			const itemsToAdd = [];
			elements.forEach(el => {
				let text = getAccessibleName(el);
				let originalText = text;
				if (itemType === 'landmarks') {
					const role = el.getAttribute('role') || el.tagName.toLowerCase();
					const landmarkNameMap = {
						'main': Menu._getLocalizedString('mainContent'),
						'navigation': Menu._getLocalizedString('navigation'),
						'banner': Menu._getLocalizedString('header'),
						'contentinfo': Menu._getLocalizedString('footer'),
						'complementary': Menu._getLocalizedString('complementary'),
						'form': Menu._getLocalizedString('form'),
						'search': Menu._getLocalizedString('search'),
						'region': Menu._getLocalizedString('region'),
						'header': Menu._getLocalizedString('header'),
						'nav': Menu._getLocalizedString('navigation'),
						'aside': Menu._getLocalizedString('complementary'),
						'footer': Menu._getLocalizedString('footer'),
						'section': Menu._getLocalizedString('region')
					};
					const localizedName = landmarkNameMap[role];
					if (localizedName) {
						text = localizedName + (text ? `: ${ text }` : ` (${ Menu._getLocalizedString('unlabeled') })`);
					} else if (!text) {
						text = `${ role.charAt(0).toUpperCase() + role.slice(1) } (${ Menu._getLocalizedString('unlabeled') })`;
					}
				} else if (itemType === 'links') {
					if (!text || text.length < 2 || text.toLowerCase().includes('read more') || text.toLowerCase().includes('click here')) {
						const parentText = el.parentElement ? el.parentElement.textContent.trim().replace(/\s+/g, ' ') : '';
						if (parentText.length > 10 && parentText.length < 100) {
							text = `Link: ${ parentText.substring(0, Math.min(parentText.length, 50)) }...`;
						} else {
							text = `Link: ${ el.href || Menu._getLocalizedString('unlabeled') }`;
						}
					}
				} else if (itemType === 'Heading' && !text) {
					text = `${ el.tagName } (${ Menu._getLocalizedString('unlabeled') })`;
				}
				if (text && text.trim() !== '') {
					const listItem = addToList(el, originalText || text, itemType);
					if (listItem) {
						itemsToAdd.push(listItem);
					}
				}
			});
			if (itemsToAdd.length === 0) {
				container.innerHTML = `<li>${ Menu._getLocalizedString('noItemsFound') }</li>`;
			} else {
				itemsToAdd.forEach(li => container.appendChild(li));
			}
		};
		listedElements.clear();
		createListSection('h1, h2, h3, h4, h5, h6', 'ar-aaa-structure-headings', 'Heading');
		createListSection('', 'ar-aaa-structure-landmarks', 'landmarks');
		createListSection('a[href]', 'ar-aaa-structure-links', 'links');
	};
}(AR_AccessibilityMenu));
