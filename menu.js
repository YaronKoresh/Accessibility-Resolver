var AR_AccessibilityMenu = AR_AccessibilityMenu || {};
(function (Menu) {
	const MENU_BUTTON_ID = 'aaa-menu-button';
	const MENU_PANEL_ID = 'aaa-menu-panel';
	const FILTER_OVERLAY_ID = 'aaa-filter-overlay';
	const FONT_SIZE_MULTIPLIER = 1.1;
	const CLASS_HIGH_CONTRAST = 'ar-aaa-high-contrast';
	const CLASS_INVERT_COLORS = 'ar-aaa-invert-colors';
	const CLASS_HIGHLIGHT_LINKS = 'ar-aaa-highlight-links';
	const CLASS_ENHANCED_FOCUS = 'ar-aaa-enhanced-focus';
	const CLASS_ANIMATIONS_STOPPED = 'ar-aaa-animations-stopped';
	const CLASS_DYSLEXIA_FONT = 'ar-aaa-dyslexia-font';
	Menu.isOpen = false;
	Menu.isDyslexiaFontActive = false;
	Menu.activeContrastMode = 'default';
	Menu.areLinksHighlighted = false;
	Menu.isFocusEnhanced = false;
	Menu.areAnimationsStopped = false;
	Menu.isPanelDragging = false;
	Menu.isButtonDragging = false;
	Menu.buttonDragOccurred = false;
	Menu._originalFontSizes = new Map();
	Menu._initialButtonX = 0;
	Menu._initialButtonY = 0;
	Menu._initialPanelX = 0;
	Menu._initialPanelY = 0;
	Menu._initialMouseX = 0;
	Menu._initialMouseY = 0;
	Menu._panelRelativeOffsetX = 0;
	Menu._panelRelativeOffsetY = 0;
	Menu.translations = {
		'he': {
			menuTitle: 'כלי נגישות',
			increaseText: 'הגדל טקסט',
			decreaseText: 'הקטן טקסט',
			highContrast: 'ניגודיות גבוהה',
			invertColors: 'היפוך צבעים',
			highlightLinks: 'הדגש קישורים',
			enhancedFocus: 'מיקוד משופר',
			stopAnimations: 'עצור אנימציות',
			dyslexiaFont: 'גופן דיסלקטי',
			resetAll: 'איפוס הכל',
			closeMenu: 'סגור תפריט',
			accessibilityIcon: 'אייקון נגישות',
			textSize: 'גודל טקסט',
			contrast: 'ניגודיות',
			highlight: 'הדגשה',
			animation: 'אנימציה',
			fontStyle: 'סגנון גופן',
			reset: 'איפוס'
		},
		'en': {
			menuTitle: 'Accessibility Tools',
			increaseText: 'Increase Text',
			decreaseText: 'Decrease Text',
			highContrast: 'High Contrast',
			invertColors: 'Invert Colors',
			highlightLinks: 'Highlight Links',
			enhancedFocus: 'Enhanced Focus',
			stopAnimations: 'Stop Animations',
			dyslexiaFont: 'Dyslexia Font',
			resetAll: 'Reset All',
			closeMenu: 'Close Menu',
			accessibilityIcon: 'Accessibility Icon',
			textSize: 'Text Size',
			contrast: 'Contrast',
			highlight: 'Highlight',
			animation: 'Animation',
			fontStyle: 'Font Style',
			reset: 'Reset'
		}
	};
	Menu._getLocalizedString = function (key) {
		let lang = document.documentElement.lang || navigator.language || 'en';
		lang = lang.split('-')[0];
		if (Menu.translations[lang] && Menu.translations[lang][key]) {
			return Menu.translations[lang][key]
		}
		return Menu.translations['en'][key] || key
	};
	function getClientCoords(event) {
		if (event.touches && event.touches.length > 0) {
			return {
				clientX: event.touches[0].clientX,
				clientY: event.touches[0].clientY
			}
		}
		return {
			clientX: event.clientX,
			clientY: event.clientY
		}
	}
	function logAction(message, isUserAction = false) {
		console.log(`[ARMenu] ${ message } ${ isUserAction ? '(User Action)' : '' }`)
	}
	Menu.init = function () {
		if (document.getElementById(MENU_BUTTON_ID)) {
			logAction('Already initialized.');
			return
		}
		this._injectStyles();
		this._createMenuButton();
		this._createMenuPanel();
		this._attachEventListeners();
		logAction('Initialized successfully.')
	};
	Menu._injectStyles = function () {
		const styleId = 'aaa-menu-styles';
		if (document.getElementById(styleId))
			return;
		const css = `
            @font-face {
                font-family: 'OpenDyslexic'; font-style: normal; font-display: swap; font-weight: 400;
                src: url(https://cdn.jsdelivr.net/fontsource/fonts/opendyslexic@latest/latin-400-normal.woff2) format('woff2'),
                     url(https://cdn.jsdelivr.net/fontsource/fonts/opendyslexic@latest/latin-400-normal.woff) format('woff');
            }
            @font-face {
                font-family: 'OpenDyslexic'; font-style: normal; font-display: swap; font-weight: 700;
                src: url(https://cdn.jsdelivr.net/fontsource/fonts/opendyslexic@latest/latin-700-normal.woff2) format('woff2'),
                     url(https://cdn.jsdelivr.net/fontsource/fonts/opendyslexic@latest/latin-700-normal.woff) format('woff');
            }

            #${ MENU_BUTTON_ID } {
                position: fixed; z-index: 2147483647; background-color: #0056b3; color: white !important;
                border: none; border-radius: 50%; width: 70px; height: 70px; font-size: 36px;
                cursor: grab; box-shadow: 0 2px 10px rgba(0,0,0,0.2); display: flex;
                align-items: center; justify-content: center; transition: background-color 0.2s, box-shadow 0.2s; padding: 0;
            }
            #${ MENU_BUTTON_ID }:hover, #${ MENU_BUTTON_ID }:focus-visible {
                background-color: #003d82; outline: 2px solid #007bff; outline-offset: 2px;
            }
            #${ MENU_BUTTON_ID }.dragging { cursor: grabbing; }
            #${ MENU_BUTTON_ID } .ar-aaa-menu-icon {
                display: flex; align-items: center; justify-content: center;
                width: 60% !important; height: 60% !important;
            }
            #${ MENU_BUTTON_ID } .ar-aaa-menu-icon svg { width: 100% !important; height: 100% !important; fill: currentColor !important; }

            #${ MENU_PANEL_ID } {
                display: none; position: fixed; width: 320px; max-height: calc(100vh - 100px);
                overflow-y: auto; background-color: white; border: 1px solid #0056b3;
                border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); z-index: 2147483646;
                padding: 15px; font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #333; cursor: grab;
            }
            #${ MENU_PANEL_ID } h3 {
                margin-top: 0; margin-bottom: 15px; font-size: 1.2em; color: #0056b3; text-align: center; cursor: grab;
            }
            #${ MENU_PANEL_ID }.ar-aaa-menu-open { display: block; }
            #${ MENU_PANEL_ID } .ar-aaa-menu-group { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e9ecef; }
            #${ MENU_PANEL_ID } .ar-aaa-menu-group:last-of-type { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
            #${ MENU_PANEL_ID } .ar-aaa-button-row { display: flex; flex-wrap: wrap; gap: 8px; }
            #${ MENU_PANEL_ID } button {
                flex: 1 1 calc(50% - 4px); padding: 8px 10px; font-size: 0.95em; background-color: #f8f9fa;
                color: #0056b3 !important; border: 1px solid #0056b3; border-radius: 4px; cursor: pointer;
                transition: background-color 0.2s, border-color 0.2s, color 0.2s; display: flex;
                align-items: center; justify-content: center; gap: 6px; min-height: 38px;
            }
            #${ MENU_PANEL_ID } button:hover, #${ MENU_PANEL_ID } button:focus-visible {
                background-color: #e9ecef; border-color: #003d82; outline: 1px solid #0056b3;
            }
            #${ MENU_PANEL_ID } button.ar-aaa-menu-btn-active {
                background-color: #0056b3 !important; color: white !important; border-color: #003d82 !important;
            }
            #${ MENU_PANEL_ID } button.ar-aaa-fullwidth-btn { flex-basis: 100%; }
            #${ MENU_PANEL_ID } button.ar-aaa-reset-btn {
                background-color: #d1ecf1; border-color: #007bff; color: #004085 !important;
            }
            #${ MENU_PANEL_ID } button.ar-aaa-reset-btn:hover { background-color: #b8e0e8; }
            #${ MENU_PANEL_ID } .ar-aaa-menu-icon svg { width: 1em; height: 1em; fill: currentColor; }

            html.${ CLASS_INVERT_COLORS } {
                filter: invert(100%) hue-rotate(180deg) !important;
                background-color: #fff !important; 
            }
            html.${ CLASS_INVERT_COLORS } #${ MENU_BUTTON_ID },
            html.${ CLASS_INVERT_COLORS } #${ MENU_PANEL_ID } {
                filter: invert(100%) hue-rotate(180deg) !important; 
            }
            html.${ CLASS_INVERT_COLORS } img,
            html.${ CLASS_INVERT_COLORS } video,
            html.${ CLASS_INVERT_COLORS } svg,
            html.${ CLASS_INVERT_COLORS } [style*="background-image"] { 
                filter: invert(100%) hue-rotate(180deg) !important;
            }

            body.${ CLASS_HIGH_CONTRAST } { background-color: #000 !important; color: #fff !important; }
            body.${ CLASS_HIGH_CONTRAST } a { 
                color: #FFFF00 !important; /* Yellow link text */
                background-color: #000000 !important; /* Black background for link */
                text-decoration: underline !important; 
            }
            body.${ CLASS_HIGH_CONTRAST } button, body.${ CLASS_HIGH_CONTRAST } input,
            body.${ CLASS_HIGH_CONTRAST } select, body.${ CLASS_HIGH_CONTRAST } textarea {
                background-color: #333333 !important; color: #fff !important; border: 1px solid #FFFFFF !important;
            }
            body.${ CLASS_HIGH_CONTRAST } #${ MENU_PANEL_ID } {
                background-color: white !important; border-color: #0056b3 !important; color: #333 !important;
            }
            body.${ CLASS_HIGH_CONTRAST } #${ MENU_PANEL_ID } h3 { color: #0056b3 !important; }
            body.${ CLASS_HIGH_CONTRAST } #${ MENU_PANEL_ID } button {
                background-color: #f8f9fa !important; color: #0056b3 !important; border-color: #0056b3 !important;
            }
            body.${ CLASS_HIGH_CONTRAST } #${ MENU_PANEL_ID } button.ar-aaa-menu-btn-active {
                background-color: #0056b3 !important; color: white !important; border-color: #003d82 !important;
            }
            body.${ CLASS_HIGH_CONTRAST } #${ MENU_PANEL_ID } button.ar-aaa-reset-btn {
                 background-color: #d1ecf1 !important; border-color: #007bff !important; color: #004085 !important;
            }
            body.${ CLASS_HIGH_CONTRAST } #${ MENU_BUTTON_ID } { 
                background-color: #0056b3 !important; color: white !important;
            }

            body.${ CLASS_HIGHLIGHT_LINKS } a[href] {
                background-color: yellow !important; color: black !important;
                outline: 2px solid orange !important; border-radius: 2px;
            }

            body.${ CLASS_ENHANCED_FOCUS } *:focus-visible {
                outline: 3px solid #007bff !important;
                outline-offset: 2px !important;
                box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.5) !important;
            }

            body.${ CLASS_ANIMATIONS_STOPPED } *,
            body.${ CLASS_ANIMATIONS_STOPPED } *::before,
            body.${ CLASS_ANIMATIONS_STOPPED } *::after {
                animation-duration: 0.01ms !important; animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important; transition-delay: 0ms !important;
            }
            
            body.${ CLASS_DYSLEXIA_FONT } { font-family: 'OpenDyslexic', Arial, sans-serif !important; }
            body.${ CLASS_DYSLEXIA_FONT } *:not(script):not(style):not(link):not(code):not(pre):not(kbd):not(samp) {
                font-family: inherit !important;
            }
            #${ MENU_PANEL_ID }, #${ MENU_PANEL_ID } *,
            #${ MENU_BUTTON_ID }, #${ MENU_BUTTON_ID } * {
                font-family: 'Inter', Arial, sans-serif !important;
            }

            @media (max-width: 480px) {
                #${ MENU_PANEL_ID } {
                    width: calc(100% - 20px); left: 10px; right: 10px; bottom: 10px; top: auto;
                    max-height: calc(100vh - 80px);
                }
                #${ MENU_BUTTON_ID } { width: 50px; height: 50px; font-size: 24px; }
                #${ MENU_PANEL_ID } button { flex-basis: 100%; }
            }
        `;
		const styleEl = document.createElement('style');
		styleEl.id = styleId;
		styleEl.textContent = css;
		document.head.appendChild(styleEl)
	};
	Menu._createFilterOverlay = function () {
	};
	Menu._createMenuButton = function () {
		const btn = document.createElement('button');
		btn.id = MENU_BUTTON_ID;
		btn.setAttribute('aria-label', Menu._getLocalizedString('menuTitle'));
		btn.setAttribute('aria-expanded', 'false');
		btn.setAttribute('aria-controls', MENU_PANEL_ID);
		const accessibilityIconSVG = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/></svg>';
		btn.innerHTML = `<span class="ar-aaa-menu-icon" role="img" aria-label="${ Menu._getLocalizedString('accessibilityIcon') }">${ accessibilityIconSVG }</span>`;
		btn.style.right = '20px';
		btn.style.top = '50%';
		btn.style.transform = 'translateY(-50%)';
		btn.style.left = 'auto';
		btn.style.bottom = 'auto';
		document.body.appendChild(btn);
		btn.addEventListener('mousedown', this._handleButtonMouseDown.bind(this));
		btn.addEventListener('touchstart', this._handleButtonMouseDown.bind(this), { passive: false })
	};
	Menu._createMenuPanel = function () {
		const panel = document.createElement('div');
		panel.id = MENU_PANEL_ID;
		panel.setAttribute('role', 'dialog');
		panel.setAttribute('aria-modal', 'true');
		panel.setAttribute('aria-labelledby', 'ar-aaa-menu-title');
		panel.style.display = 'none';
		panel.innerHTML = this._getMenuPanelHTML();
		document.body.appendChild(panel);
		panel.addEventListener('mousedown', this._handlePanelMouseDown.bind(this));
		panel.addEventListener('touchstart', this._handlePanelMouseDown.bind(this), { passive: false })
	};
	Menu._getIconSVG = function (pathData, label = '') {
		return `<span class="ar-aaa-menu-icon" role="img" aria-label="${ label }"><svg viewBox="0 0 24 24">${ pathData }</svg></span>`
	};
	Menu._getMenuPanelHTML = function () {
		const ICONS = {
			textSize: this._getIconSVG('<path d="M2.5,4V7H7.5V19H10.5V7H15.5V4M10.5,10.5H13.5V13.5H10.5V10.5Z"/>', Menu._getLocalizedString('textSize')),
			contrast: this._getIconSVG('<path d="M12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6V18M20,15L19.3,14C19.5,13.4 19.6,12.7 19.6,12C19.6,11.3 19.5,10.6 19.3,10L20,9L17.3,4L16.7,5C15.9,4.3 14.9,3.8 13.8,3.5L13.5,2H10.5L10.2,3.5C9.1,3.8 8.1,4.3 7.3,5L6.7,4L4,9L4.7,10C4.5,10.6 4.4,11.3 4.4,12C4.4,12.7 4.5,13.4 4.7,14L4,15L6.7,20L7.3,19C8.1,19.7 9.1,20.2 10.2,20.5L10.5,22H13.5L13.8,20.5C14.9,20.2 15.9,19.7 16.7,19L17.3,20L20,15Z"/>', Menu._getLocalizedString('contrast')),
			highlight: this._getIconSVG('<path d="M16.2,12L12,16.2L7.8,12L12,7.8M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z"/>', Menu._getLocalizedString('highlight')),
			animation: this._getIconSVG('<path d="M8,5V19L19,12L8,5Z"/>', Menu._getLocalizedString('animation')),
			fontStyle: this._getIconSVG('<path d="M9.25,4V5.5H6.75V4H5.25V5.5H2.75V4H1.25V14.5H2.75V16H5.25V14.5H7.75V16H10.25V14.5H11.75V4H9.25M17.75,4V14.5H19.25V16H21.75V14.5H24.25V4H21.75V5.5H19.25V4H17.75M10.25,7H7.75V13H10.25V7M16.25,7H13.75V13H16.25V7Z"/>', Menu._getLocalizedString('fontStyle')),
			reset: this._getIconSVG('<path d="M12,5V1L7,6L12,11V7A6,6 0 0,1 18,13A6,6 0 0,1 12,19A6,6 0 0,1 6,13H4A8,8 0 0,0 12,21A8,8 0 0,0 20,13A8,8 0 0,0 12,5Z"/>', Menu._getLocalizedString('reset')),
			close: this._getIconSVG('<path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>', Menu._getLocalizedString('closeMenu'))
		};
		let html = `<h3 id="ar-aaa-menu-title">${ Menu._getLocalizedString('menuTitle') }</h3>`;
		html += `
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row">
                <button data-action="increase-text">${ ICONS.textSize } ${ Menu._getLocalizedString('increaseText') }</button>
                <button data-action="decrease-text">${ ICONS.textSize } ${ Menu._getLocalizedString('decreaseText') }</button>
            </div></div>
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row">
                <button data-action="contrast-high">${ ICONS.contrast } ${ Menu._getLocalizedString('highContrast') }</button>
                <button data-action="contrast-invert">${ ICONS.contrast } ${ Menu._getLocalizedString('invertColors') }</button>
            </div></div>
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row">
                <button data-action="highlight-links">${ ICONS.highlight } ${ Menu._getLocalizedString('highlightLinks') }</button>
                <button data-action="enhanced-focus">${ ICONS.highlight } ${ Menu._getLocalizedString('enhancedFocus') }</button>
            </div></div>
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row">
                <button data-action="stop-animations" class="ar-aaa-fullwidth-btn">${ ICONS.animation } ${ Menu._getLocalizedString('stopAnimations') }</button>
            </div></div>
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row">
                <button data-action="toggle-dyslexia-font" class="ar-aaa-fullwidth-btn">${ ICONS.fontStyle } ${ Menu._getLocalizedString('dyslexiaFont') }</button>
            </div></div>
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row">
                <button data-action="reset-all" class="ar-aaa-fullwidth-btn ar-aaa-reset-btn">${ ICONS.reset } ${ Menu._getLocalizedString('resetAll') }</button>
                <button data-action="close-menu" class="ar-aaa-fullwidth-btn">${ ICONS.close } ${ Menu._getLocalizedString('closeMenu') }</button>
            </div></div>`;
		return html
	};
	Menu._attachEventListeners = function () {
		const menuButton = document.getElementById(MENU_BUTTON_ID);
		const menuPanel = document.getElementById(MENU_PANEL_ID);
		if (menuButton) {
			menuButton.addEventListener('click', this._handleMenuButtonClick.bind(this))
		}
		if (menuPanel) {
			menuPanel.addEventListener('click', this._handlePanelActionClick.bind(this));
			menuPanel.addEventListener('keydown', this._handlePanelKeydown.bind(this))
		}
		document.addEventListener('mousemove', this._handleDocumentMouseMove.bind(this));
		document.addEventListener('mouseup', this._handleDocumentMouseUp.bind(this));
		document.addEventListener('touchmove', this._handleDocumentMouseMove.bind(this), { passive: false });
		document.addEventListener('touchend', this._handleDocumentMouseUp.bind(this));
		document.addEventListener('keydown', this._handleTabKeyFocusTrap.bind(this))
	};
	Menu._handleMenuButtonClick = function (event) {
		if (Menu.buttonDragOccurred) {
			Menu.buttonDragOccurred = false;
			return
		}
		this.toggleMenu()
	};
	Menu._handlePanelActionClick = function (event) {
		const targetButton = event.target.closest('button');
		if (targetButton && targetButton.dataset.action) {
			this.handleAction(targetButton.dataset.action, targetButton)
		}
	};
	Menu._handlePanelKeydown = function (event) {
		if (event.key === 'Escape' && this.isOpen) {
			this.toggleMenu()
		}
	};
	Menu._handleTabKeyFocusTrap = function (event) {
		if (!this.isOpen)
			return;
		const menuPanel = document.getElementById(MENU_PANEL_ID);
		if (!menuPanel)
			return;
		const focusableElements = Array.from(menuPanel.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])')).filter(el => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement);
		if (focusableElements.length === 0)
			return;
		const firstFocusableEl = focusableElements[0];
		const lastFocusableEl = focusableElements[focusableElements.length - 1];
		if (event.key === 'Tab') {
			if (event.shiftKey) {
				if (document.activeElement === firstFocusableEl) {
					lastFocusableEl.focus();
					event.preventDefault()
				}
			} else {
				if (document.activeElement === lastFocusableEl) {
					firstFocusableEl.focus();
					event.preventDefault()
				} else if (!focusableElements.includes(document.activeElement)) {
					firstFocusableEl.focus();
					event.preventDefault()
				}
			}
		}
	};
	Menu._startDragging = function (event, isButtonDrag) {
		const button = document.getElementById(MENU_BUTTON_ID);
		const panel = document.getElementById(MENU_PANEL_ID);
		if (!button || !panel)
			return;
		let draggedElement = isButtonDrag ? button : panel;
		if (!isButtonDrag) {
			const target = event.target;
			if (target.closest('button')) {
				this.isPanelDragging = false;
				return
			}
			const isPanelItself = target === panel;
			const isPanelTitle = target === panel.querySelector('h3');
			if (!isPanelItself && !isPanelTitle) {
				this.isPanelDragging = false;
				return
			}
		}
		this.isButtonDragging = isButtonDrag;
		this.isPanelDragging = !isButtonDrag;
		if (isButtonDrag)
			Menu.buttonDragOccurred = false;
		draggedElement.classList.add('dragging');
		const coords = getClientCoords(event);
		const buttonRect = button.getBoundingClientRect();
		const panelRect = panel.getBoundingClientRect();
		Menu._initialButtonX = buttonRect.left;
		Menu._initialButtonY = buttonRect.top;
		Menu._initialPanelX = panelRect.left;
		Menu._initialPanelY = panelRect.top;
		Menu._initialMouseX = coords.clientX;
		Menu._initialMouseY = coords.clientY;
		if (isButtonDrag && button.style.transform !== 'none') {
			button.style.transform = 'none'
		}
		if (Menu.isOpen) {
			Menu._panelRelativeOffsetX = panelRect.left - buttonRect.left;
			Menu._panelRelativeOffsetY = panelRect.top - buttonRect.top
		} else {
			const estimatedPanelHeight = panel.offsetHeight || 300;
			const estimatedPanelWidth = panel.offsetWidth || 320;
			const docDir = document.documentElement.dir || window.getComputedStyle(document.documentElement).direction;
			if (docDir === 'rtl') {
				Menu._panelRelativeOffsetX = buttonRect.width - estimatedPanelWidth
			} else {
				Menu._panelRelativeOffsetX = 0
			}
			Menu._panelRelativeOffsetY = -estimatedPanelHeight - 10
		}
		if (event.type === 'touchstart') {
			event.preventDefault()
		}
	};
	Menu._handleButtonMouseDown = function (event) {
		Menu.buttonDragOccurred = false;
		this._startDragging(event, true)
	};
	Menu._handlePanelMouseDown = function (event) {
		this._startDragging(event, false)
	};
	Menu._handleDocumentMouseMove = function (event) {
		if (!this.isButtonDragging && !this.isPanelDragging)
			return;
		const button = document.getElementById(MENU_BUTTON_ID);
		const panel = document.getElementById(MENU_PANEL_ID);
		if (!button || !panel)
			return;
		if (this.isButtonDragging) {
			Menu.buttonDragOccurred = true
		}
		const coords = getClientCoords(event);
		const deltaX = coords.clientX - Menu._initialMouseX;
		const deltaY = coords.clientY - Menu._initialMouseY;
		let targetButtonX, targetButtonY, targetPanelX, targetPanelY;
		if (this.isButtonDragging) {
			targetButtonX = Menu._initialButtonX + deltaX;
			targetButtonY = Menu._initialButtonY + deltaY;
			targetPanelX = targetButtonX + Menu._panelRelativeOffsetX;
			targetPanelY = targetButtonY + Menu._panelRelativeOffsetY
		} else if (this.isPanelDragging) {
			targetPanelX = Menu._initialPanelX + deltaX;
			targetPanelY = Menu._initialPanelY + deltaY;
			targetButtonX = targetPanelX - Menu._panelRelativeOffsetX;
			targetButtonY = targetPanelY - Menu._panelRelativeOffsetY
		}
		const buttonWidth = button.offsetWidth;
		const buttonHeight = button.offsetHeight;
		targetButtonX = Math.max(0, Math.min(targetButtonX, window.innerWidth - buttonWidth));
		targetButtonY = Math.max(0, Math.min(targetButtonY, window.innerHeight - buttonHeight));
		button.style.left = `${ targetButtonX }px`;
		button.style.top = `${ targetButtonY }px`;
		button.style.transform = 'none';
		button.style.right = 'auto';
		button.style.bottom = 'auto';
		if (Menu.isOpen) {
			const panelWidth = panel.offsetWidth;
			const panelHeight = panel.offsetHeight;
			let desiredPanelX = targetButtonX + Menu._panelRelativeOffsetX;
			let desiredPanelY = targetButtonY + Menu._panelRelativeOffsetY;
			desiredPanelX = Math.max(0, Math.min(desiredPanelX, window.innerWidth - panelWidth));
			desiredPanelY = Math.max(0, Math.min(desiredPanelY, window.innerHeight - panelHeight));
			panel.style.left = `${ desiredPanelX }px`;
			panel.style.top = `${ desiredPanelY }px`;
			panel.style.right = 'auto';
			panel.style.bottom = 'auto';
			if (this.isButtonDragging) {
				let adjustedButtonX = desiredPanelX - Menu._panelRelativeOffsetX;
				let adjustedButtonY = desiredPanelY - Menu._panelRelativeOffsetY;
				adjustedButtonX = Math.max(0, Math.min(adjustedButtonX, window.innerWidth - buttonWidth));
				adjustedButtonY = Math.max(0, Math.min(adjustedButtonY, window.innerHeight - buttonHeight));
				button.style.left = `${ adjustedButtonX }px`;
				button.style.top = `${ adjustedButtonY }px`;
				Menu._panelRelativeOffsetX = desiredPanelX - adjustedButtonX;
				Menu._panelRelativeOffsetY = desiredPanelY - adjustedButtonY
			}
		}
		if (event.type === 'touchmove') {
			event.preventDefault()
		}
	};
	Menu._handleDocumentMouseUp = function () {
		if (this.isButtonDragging) {
			this.isButtonDragging = false;
			const button = document.getElementById(MENU_BUTTON_ID);
			if (button)
				button.classList.remove('dragging')
		}
		if (this.isPanelDragging) {
			this.isPanelDragging = false;
			const panel = document.getElementById(MENU_PANEL_ID);
			if (panel)
				panel.classList.remove('dragging')
		}
	};
	Menu.toggleMenu = function () {
		const panel = document.getElementById(MENU_PANEL_ID);
		const button = document.getElementById(MENU_BUTTON_ID);
		if (!panel || !button)
			return;
		this.isOpen = !this.isOpen;
		panel.style.display = this.isOpen ? 'block' : 'none';
		panel.classList.toggle('ar-aaa-menu-open', this.isOpen);
		panel.setAttribute('aria-hidden', String(!this.isOpen));
		button.setAttribute('aria-expanded', String(this.isOpen));
		if (this.isOpen) {
			const panelRect = panel.getBoundingClientRect();
			const buttonRect = button.getBoundingClientRect();
			let newTop = buttonRect.top - panelRect.height - 10;
			let newLeft = buttonRect.left;
			const docDir = document.documentElement.dir || window.getComputedStyle(document.documentElement).direction;
			if (docDir === 'rtl') {
				newLeft = buttonRect.right - panelRect.width
			}
			if (newTop < 10) {
				newTop = buttonRect.bottom + 10
			}
			if (newTop + panelRect.height > window.innerHeight - 10) {
				newTop = Math.max(10, window.innerHeight - panelRect.height - 10)
			}
			if (newLeft < 10)
				newLeft = 10;
			if (newLeft + panelRect.width > window.innerWidth - 10) {
				newLeft = Math.max(10, window.innerWidth - panelRect.width - 10)
			}
			panel.style.position = 'fixed';
			panel.style.top = `${ newTop }px`;
			panel.style.left = `${ newLeft }px`;
			panel.style.bottom = 'auto';
			panel.style.right = 'auto';
			Menu._panelRelativeOffsetX = newLeft - buttonRect.left;
			Menu._panelRelativeOffsetY = newTop - buttonRect.top;
			const firstFocusableButton = panel.querySelector('button:not([disabled])');
			if (firstFocusableButton) {
				firstFocusableButton.focus()
			}
		} else {
			button.focus()
		}
		logAction(`Menu ${ this.isOpen ? 'opened' : 'closed' }`)
	};
	Menu.handleAction = function (action, targetButton) {
		logAction(`Action: ${ action }`, true);
		if (action === 'close-menu') {
			this.toggleMenu();
			return
		}
		switch (action) {
		case 'increase-text':
		case 'decrease-text':
			this._handleTextSizeAction(action, targetButton);
			break;
		case 'contrast-high':
		case 'contrast-invert':
			this._handleContrastAction(action, targetButton);
			break;
		case 'highlight-links':
		case 'enhanced-focus':
			this._handleHighlightAction(action, targetButton);
			break;
		case 'stop-animations':
			this._handleStopAnimationsAction(targetButton);
			break;
		case 'toggle-dyslexia-font':
			this._handleDyslexiaFontAction(targetButton);
			break;
		case 'reset-all':
			this._resetAllSettings();
			break
		}
	};
	Menu._updateButtonActiveState = function (buttonElement, isActive) {
		if (!buttonElement)
			return;
		const action = buttonElement.dataset.action;
		if (isActive && action && action.startsWith('contrast-')) {
			const parentGroup = buttonElement.closest('.ar-aaa-button-row') || buttonElement.closest('.ar-aaa-menu-group');
			if (parentGroup) {
				parentGroup.querySelectorAll('button[data-action^="contrast-"]').forEach(btn => {
					if (btn !== buttonElement) {
						btn.classList.remove('ar-aaa-menu-btn-active')
					}
				})
			}
		}
		buttonElement.classList.toggle('ar-aaa-menu-btn-active', isActive)
	};
	Menu._handleTextSizeAction = function (action, button) {
		let elements = [];
		if (typeof window.ar_getElementsForMenuTextStyleAdjustments === 'function') {
			elements = window.ar_getElementsForMenuTextStyleAdjustments()
		}
		if (!elements || elements.length === 0) {
			console.warn('ARMenu: ar_getElementsForMenuTextStyleAdjustments() not available or returned empty. Using fallback selector.');
			elements = Array.from(document.querySelectorAll('p, li, span, div:not(#' + MENU_PANEL_ID + '):not(#' + MENU_BUTTON_ID + '):not([class*="icon"]):not(:empty),' + 'h1, h2, h3, h4, h5, h6, a, label, td, th, caption, strong, em, b, i, small, big, sub, sup')).filter(el => el.closest(`#${ MENU_PANEL_ID }`) === null && el.closest(`#${ MENU_BUTTON_ID }`) === null)
		}
		let factor = 1;
		if (action === 'increase-text')
			factor = FONT_SIZE_MULTIPLIER;
		else if (action === 'decrease-text')
			factor = 1 / FONT_SIZE_MULTIPLIER;
		elements.forEach(el => {
			if (!document.body.contains(el))
				return;
			if (!Menu._originalFontSizes.has(el)) {
				const initialComputedPx = parseFloat(window.getComputedStyle(el).fontSize);
				Menu._originalFontSizes.set(el, {
					inline: el.style.fontSize || '',
					initialPx: initialComputedPx,
					currentPx: initialComputedPx
				})
			}
			let sizeState = Menu._originalFontSizes.get(el);
			let baseSizeForChange = sizeState.currentPx;
			let newSize = baseSizeForChange * factor;
			if (factor < 1 && newSize < 8)
				newSize = 8;
			if (factor > 1 && newSize > 72)
				newSize = 72;
			el.style.setProperty('font-size', `${ newSize }px`, 'important');
			sizeState.currentPx = newSize
		})
	};
	Menu._handleContrastAction = function (action, button) {
		const htmlEl = document.documentElement;
		const bodyEl = document.body;
		const isHighContrastAction = action === 'contrast-high';
		const isInvertColorsAction = action === 'contrast-invert';
		let newMode = 'default';
		if (isHighContrastAction) {
			newMode = this.activeContrastMode === 'high' ? 'default' : 'high'
		} else if (isInvertColorsAction) {
			newMode = this.activeContrastMode === 'inverted' ? 'default' : 'inverted'
		}
		htmlEl.classList.remove(CLASS_INVERT_COLORS);
		bodyEl.classList.remove(CLASS_HIGH_CONTRAST);
		const parentGroup = button.closest('.ar-aaa-button-row') || button.closest('.ar-aaa-menu-group');
		if (parentGroup) {
			parentGroup.querySelectorAll('button[data-action^="contrast-"]').forEach(btn => {
				this._updateButtonActiveState(btn, false)
			})
		}
		if (newMode === 'high') {
			bodyEl.classList.add(CLASS_HIGH_CONTRAST);
			this._updateButtonActiveState(button, true)
		} else if (newMode === 'inverted') {
			htmlEl.classList.add(CLASS_INVERT_COLORS);
			this._updateButtonActiveState(button, true)
		}
		this.activeContrastMode = newMode;
		logAction(`Contrast mode set to: ${ this.activeContrastMode }`)
	};
	Menu._handleHighlightAction = function (action, button) {
		const body = document.body;
		if (action === 'highlight-links') {
			this.areLinksHighlighted = !this.areLinksHighlighted;
			body.classList.toggle(CLASS_HIGHLIGHT_LINKS, this.areLinksHighlighted);
			this._updateButtonActiveState(button, this.areLinksHighlighted);
			logAction(`Highlight links ${ this.areLinksHighlighted ? 'enabled' : 'disabled' }. Class on body: ${ body.classList.contains(CLASS_HIGHLIGHT_LINKS) }`)
		} else if (action === 'enhanced-focus') {
			this.isFocusEnhanced = !this.isFocusEnhanced;
			body.classList.toggle(CLASS_ENHANCED_FOCUS, this.isFocusEnhanced);
			this._updateButtonActiveState(button, this.isFocusEnhanced);
			logAction(`Enhanced focus ${ this.isFocusEnhanced ? 'enabled' : 'disabled' }. Class on body: ${ body.classList.contains(CLASS_ENHANCED_FOCUS) }`)
		}
	};
	Menu._handleStopAnimationsAction = function (button) {
		this.areAnimationsStopped = !this.areAnimationsStopped;
		document.body.classList.toggle(CLASS_ANIMATIONS_STOPPED, this.areAnimationsStopped);
		this._updateButtonActiveState(button, this.areAnimationsStopped);
		if (this.areAnimationsStopped) {
			const gifsToFreeze = Array.from(document.querySelectorAll('img[src*=".gif"]:not([data-ar-gif-frozen="true"])')).filter(img => {
				try {
					return new URL(img.src, window.location.href).pathname.toLowerCase().endsWith('.gif')
				} catch (e) {
					return (img.src || '').toLowerCase().includes('.gif')
				}
			});
			gifsToFreeze.forEach(img => {
				if (typeof window.ar_isVisuallyHidden === 'function' && window.ar_isVisuallyHidden(img))
					return;
				img.dataset.arOriginalSrc = img.src;
				img.dataset.arOriginalAlt = img.alt || '';
				img.dataset.arOriginalDisplay = img.style.display || '';
				img.dataset.arOriginalWidth = img.offsetWidth + 'px';
				img.dataset.arOriginalHeight = img.offsetHeight + 'px';
				const tempImage = new Image();
				tempImage.crossOrigin = 'Anonymous';
				tempImage.onload = () => {
					const canvas = document.createElement('canvas');
					canvas.width = tempImage.naturalWidth || parseInt(img.dataset.arOriginalWidth) || img.width || 50;
					canvas.height = tempImage.naturalHeight || parseInt(img.dataset.arOriginalHeight) || img.height || 50;
					canvas.className = img.className;
					canvas.style.cssText = img.style.cssText;
					canvas.style.width = img.dataset.arOriginalWidth;
					canvas.style.height = img.dataset.arOriginalHeight;
					if (window.getComputedStyle(img).display === 'inline') {
						canvas.style.display = 'inline-block'
					} else {
						canvas.style.display = img.dataset.arOriginalDisplay || 'block'
					}
					canvas.setAttribute('role', 'img');
					canvas.setAttribute('aria-label', img.dataset.arOriginalAlt || `Frozen animation: ${ img.src.split('/').pop() }`);
					canvas.dataset.arFrozenGifCanvas = 'true';
					if (!img.id) {
						img.id = typeof window.ar_generateUniqueElementId === 'function' ? window.ar_generateUniqueElementId('ar-original-gif-') : `ar-gif-${ Date.now() }-${ Math.random().toString(36).substr(2, 5) }`
					}
					canvas.dataset.arOriginalImgId = img.id;
					const ctx = canvas.getContext('2d');
					try {
						ctx.drawImage(tempImage, 0, 0, canvas.width, canvas.height);
						img.style.display = 'none';
						img.dataset.arGifFrozen = 'true';
						if (img.parentNode) {
							img.parentNode.insertBefore(canvas, img.nextSibling)
						}
					} catch (e) {
						console.error('ARMenu: Failed to draw GIF to canvas. Freezing by replacing src.', e);
						img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
						img.style.display = img.dataset.arOriginalDisplay || '';
						img.dataset.arGifFrozen = 'true';
						img.dataset.arGifFrozenFallback = 'true'
					}
				};
				tempImage.onerror = () => {
					console.error('ARMenu: Failed to load GIF for freezing. Replacing src.');
					img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
					img.dataset.arGifFrozen = 'true';
					img.dataset.arGifFrozenFallback = 'true'
				};
				tempImage.src = img.dataset.arOriginalSrc
			})
		} else {
			document.querySelectorAll('canvas[data-ar-frozen-gif-canvas="true"]').forEach(canvas => {
				const originalImgId = canvas.dataset.arOriginalImgId;
				if (originalImgId) {
					const originalImg = document.getElementById(originalImgId);
					if (originalImg) {
						originalImg.style.display = originalImg.dataset.arOriginalDisplay || '';
						[
							'arGifFrozen',
							'arOriginalSrc',
							'arOriginalAlt',
							'arOriginalDisplay',
							'arOriginalWidth',
							'arOriginalHeight',
							'arGifFrozenFallback'
						].forEach(attr => delete originalImg.dataset[attr])
					}
				}
				if (canvas.parentNode) {
					canvas.parentNode.removeChild(canvas)
				}
			});
			document.querySelectorAll('img[data-ar-gif-frozen-fallback="true"]').forEach(img => {
				if (img.dataset.arOriginalSrc) {
					img.src = img.dataset.arOriginalSrc
				}
				[
					'arGifFrozen',
					'arGifFrozenFallback',
					'arOriginalSrc',
					'arOriginalAlt',
					'arOriginalDisplay',
					'arOriginalWidth',
					'arOriginalHeight'
				].forEach(attr => delete img.dataset[attr])
			})
		}
	};
	Menu._handleDyslexiaFontAction = function (button) {
		this.isDyslexiaFontActive = !this.isDyslexiaFontActive;
		document.body.classList.toggle(CLASS_DYSLEXIA_FONT, this.isDyslexiaFontActive);
		this._updateButtonActiveState(button, this.isDyslexiaFontActive)
	};
	Menu._resetAllSettings = function () {
		Menu._originalFontSizes.forEach((sizeState, el) => {
			if (document.body.contains(el)) {
				if (sizeState.inline === '' || sizeState.inline === null) {
					el.style.removeProperty('font-size')
				} else {
					el.style.setProperty('font-size', sizeState.inline, 'important')
				}
			}
		});
		Menu._originalFontSizes.clear();
		document.documentElement.classList.remove(CLASS_INVERT_COLORS);
		document.body.classList.remove(CLASS_HIGH_CONTRAST);
		this.activeContrastMode = 'default';
		document.querySelectorAll(`#${ MENU_PANEL_ID } button[data-action^="contrast-"]`).forEach(btn => {
			this._updateButtonActiveState(btn, false)
		});
		document.body.classList.remove(CLASS_HIGHLIGHT_LINKS, CLASS_ENHANCED_FOCUS);
		this.areLinksHighlighted = false;
		this.isFocusEnhanced = false;
		document.querySelectorAll(`#${ MENU_PANEL_ID } button[data-action="highlight-links"], #${ MENU_PANEL_ID } button[data-action="enhanced-focus"]`).forEach(btn => {
			this._updateButtonActiveState(btn, false)
		});
		if (this.areAnimationsStopped) {
			this._handleStopAnimationsAction(document.querySelector(`#${ MENU_PANEL_ID } button[data-action="stop-animations"]`))
		}
		if (this.isDyslexiaFontActive) {
			this._handleDyslexiaFontAction(document.querySelector(`#${ MENU_PANEL_ID } button[data-action="toggle-dyslexia-font"]`))
		}
		const menuButton = document.getElementById(MENU_BUTTON_ID);
		if (menuButton) {
			menuButton.style.right = '20px';
			menuButton.style.top = '50%';
			menuButton.style.transform = 'translateY(-50%)';
			menuButton.style.left = 'auto';
			menuButton.style.bottom = 'auto'
		}
		const panel = document.getElementById(MENU_PANEL_ID);
		if (panel && this.isOpen && menuButton) {
			const buttonRect = menuButton.getBoundingClientRect();
			const panelRect = panel.getBoundingClientRect();
			let newTop = buttonRect.top - panelRect.height - 10;
			let newLeft = buttonRect.left;
			const docDir = document.documentElement.dir || window.getComputedStyle(document.documentElement).direction;
			if (docDir === 'rtl')
				newLeft = buttonRect.right - panelRect.width;
			if (newTop < 10)
				newTop = buttonRect.bottom + 10;
			if (newTop + panelRect.height > window.innerHeight - 10)
				newTop = Math.max(10, window.innerHeight - panelRect.height - 10);
			if (newLeft < 10)
				newLeft = 10;
			if (newLeft + panelRect.width > window.innerWidth - 10)
				newLeft = window.innerWidth - panelRect.width - 10;
			panel.style.top = `${ newTop }px`;
			panel.style.left = `${ newLeft }px`;
			panel.style.bottom = 'auto';
			panel.style.right = 'auto';
			Menu._panelRelativeOffsetX = newLeft - buttonRect.left;
			Menu._panelRelativeOffsetY = newTop - buttonRect.top
		}
		logAction('All settings reset.')
	};
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function () {
			AR_AccessibilityMenu.init()
		})
	} else {
		AR_AccessibilityMenu.init()
	}
}(AR_AccessibilityMenu))
