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
	Menu.panelOffsetX = 0;
	Menu.panelOffsetY = 0;
	Menu.isButtonDragging = false;
	Menu.buttonOffsetX = 0;
	Menu.buttonOffsetY = 0;
	Menu.buttonDragOccurred = false;
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
	function logAction(message, isUserAction) {
		console.log(`[ARMenu] ${ message } ${ isUserAction ? '(User Action)' : '' }`)
	}
	Menu.init = function () {
		if (document.getElementById(MENU_BUTTON_ID)) {
			return
		}
		this._injectStyles();
		this._createMenuButton();
		this._createMenuPanel();
		this._createFilterOverlay();
		this._attachEventListeners();
		logAction('Initialized', false)
	};
	Menu._injectStyles = function () {
		const styleId = 'aaa-menu-styles';
		if (document.getElementById(styleId)) {
			return
		}
		const css = `
            /* OpenDyslexic Font Face Rules */
            @font-face {
                font-family: 'OpenDyslexic';
                font-style: normal;
                font-display: swap; /* Use swap for better perceived performance */
                font-weight: 400;
                src: url(https://cdn.jsdelivr.net/fontsource/fonts/opendyslexic@latest/latin-400-normal.woff2) format('woff2'), url(https://cdn.jsdelivr.net/fontsource/fonts/opendyslexic@latest/latin-400-normal.woff) format('woff');
            }
            @font-face {
                font-family: 'OpenDyslexic';
                font-style: normal;
                font-display: swap;
                font-weight: 700;
                src: url(https://cdn.jsdelivr.net/fontsource/fonts/opendyslexic@latest/latin-700-normal.woff2) format('woff2'), url(https://cdn.jsdelivr.net/fontsource/fonts/opendyslexic@latest/latin-700-normal.woff) format('woff');
            }

            /* Menu Button */
            #${ MENU_BUTTON_ID } {
                position: fixed;
                /* Initial position will be set to center via JS */
                z-index: 2147483647; /* Highest z-index */
                background-color: #0056b3;
                color: white !important;
                border: none;
                border-radius: 50%;
                width: 56px;
                height: 56px;
                font-size: 24px;
                cursor: grab;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s, transform 0.2s, box-shadow 0.2s;
            }
            #${ MENU_BUTTON_ID }:hover, #${ MENU_BUTTON_ID }:focus-visible {
                background-color: #003d82;
                transform: scale(1.1) !important; /* Ensure scale on hover/focus even if centered */
                outline: 2px solid #007bff;
                outline-offset: 2px;
            }
            #${ MENU_BUTTON_ID }.dragging { cursor: grabbing; }

            /* Menu Panel */
            #${ MENU_PANEL_ID } {
                display: none;
                position: fixed;
                width: 320px;
                max-height: calc(100vh - 100px);
                overflow-y: auto;
                background-color: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                z-index: 2147483646; /* Just below button */
                padding: 15px;
                font-family: 'Inter', Arial, sans-serif;
                font-size: 14px;
                color: #212529;
                cursor: grab;
            }
            #${ MENU_PANEL_ID }.ar-aaa-menu-open { display: block; }
            #${ MENU_PANEL_ID } h3 {
                margin-top: 0;
                margin-bottom: 15px;
                font-size: 1.2em;
                color: #0056b3;
                text-align: center;
            }
            #${ MENU_PANEL_ID } .ar-aaa-menu-group {
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #e9ecef;
            }
            #${ MENU_PANEL_ID } .ar-aaa-menu-group:last-of-type {
                margin-bottom: 0;
                padding-bottom: 0;
                border-bottom: none;
            }
            #${ MENU_PANEL_ID } .ar-aaa-button-row {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            #${ MENU_PANEL_ID } button {
                flex: 1 1 calc(50% - 4px); /* Two buttons per row with gap */
                padding: 8px 10px;
                font-size: 0.95em;
                background-color: #e9ecef;
                color: #343a40 !important;
                border: 1px solid #ced4da;
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.2s, border-color 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }
            #${ MENU_PANEL_ID } button:hover, #${ MENU_PANEL_ID } button:focus-visible {
                background-color: #dde1e5;
                border-color: #adb5bd;
                outline: 1px solid #0056b3;
            }
            #${ MENU_PANEL_ID } button.ar-aaa-menu-btn-active {
                background-color: #0056b3 !important;
                color: white !important;
                border-color: #004085 !important;
            }
            #${ MENU_PANEL_ID } button.ar-aaa-fullwidth-btn {
                flex-basis: 100%; /* Full width button */
            }
            #${ MENU_PANEL_ID } button.ar-aaa-reset-btn {
                background-color: #cce5ff;
                border-color: #b8daff;
                color: #004085 !important;
            }
            #${ MENU_PANEL_ID } button.ar-aaa-reset-btn:hover {
                background-color: #b8daff;
            }
            #${ MENU_PANEL_ID } .ar-aaa-menu-icon svg { width: 1em; height: 1em; fill: currentColor; }

            /* Filter Overlay for contrast modes */
            #${ FILTER_OVERLAY_ID } {
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                pointer-events: none; /* Allows interaction with elements beneath */
                z-index: -1; /* Initially behind everything */
                display: none; /* Hidden by default */
                mix-blend-mode: normal;
            }
            body.${ CLASS_INVERT_COLORS } #${ FILTER_OVERLAY_ID } {
                display: block !important;
                filter: invert(100%) hue-rotate(180deg) !important;
                mix-blend-mode: difference; /* Ensures proper inversion */
                background-color: white; /* Base layer for inversion */
                z-index: 2147483640; /* High z-index for overlay */
            }
            /* Ensure menu UI itself is NOT affected by filters */
            #${ MENU_BUTTON_ID }, #${ MENU_PANEL_ID } { filter: none !important; }


            /* High Contrast Mode (Direct Styling via Class) */
            body.${ CLASS_HIGH_CONTRAST } { background-color: #000 !important; color: #fff !important; }
            body.${ CLASS_HIGH_CONTRAST } a { color: #0ff !important; }
            body.${ CLASS_HIGH_CONTRAST } button, body.${ CLASS_HIGH_CONTRAST } input, body.${ CLASS_HIGH_CONTRAST } select, body.${ CLASS_HIGH_CONTRAST } textarea {
                background-color: #222 !important; color: #fff !important; border: 1px solid #fff !important;
            }
            /* Exclude menu from high contrast direct styles */
            body.${ CLASS_HIGH_CONTRAST } #${ MENU_PANEL_ID }, body.${ CLASS_HIGH_CONTRAST } #${ MENU_PANEL_ID } *,
            body.${ CLASS_HIGH_CONTRAST } #${ MENU_BUTTON_ID }, body.${ CLASS_HIGH_CONTRAST } #${ MENU_BUTTON_ID } * {
                background-color: #f8f9fa !important; color: #212529 !important; border-color: #dee2e6 !important;
            }
            body.${ CLASS_HIGH_CONTRAST } #${ MENU_PANEL_ID } button.ar-aaa-menu-btn-active {
                background-color: #0056b3 !important; color: white !important; border-color: #004085 !important;
            }


            /* Highlight Links */
            body.${ CLASS_HIGHLIGHT_LINKS } a[href] {
                background-color: yellow !important;
                color: black !important;
                outline: 2px solid orange !important;
                border-radius: 2px;
            }

            /* Enhanced Focus */
            body.${ CLASS_ENHANCED_FOCUS } *:focus-visible {
                outline: 3px solid #007bff !important;
                outline-offset: 2px !important;
                box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.5) !important;
            }

            /* Stop Animations */
            body.${ CLASS_ANIMATIONS_STOPPED } *,
            body.${ CLASS_ANIMATIONS_STOPPED } *::before,
            body.${ CLASS_ANIMATIONS_STOPPED } *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                transition-delay: 0ms !important;
                animation-play-state: paused !important;
            }
            /* Ensure menu animation still works (if any) */
            body.${ CLASS_ANIMATIONS_STOPPED } #${ MENU_PANEL_ID }.ar-aaa-menu-open {
                /* If you have a specific animation for opening, define it here */
                /* animation: ar-slide-up .3s ease-out !important; */
                animation-play-state: running !important;
            }


            /* Dyslexia Font */
            body.${ CLASS_DYSLEXIA_FONT } {
                font-family: 'OpenDyslexic', Arial, sans-serif !important;
            }
            /* Apply dyslexia font to all elements except scripts, styles, and links */
            body.${ CLASS_DYSLEXIA_FONT } *:not(script):not(style):not(link) {
                font-family: inherit !important;
            }
            /* Ensure menu itself does not get dyslexia font if body has it */
            #${ MENU_PANEL_ID }, #${ MENU_PANEL_ID } *,
            #${ MENU_BUTTON_ID }, #${ MENU_BUTTON_ID } * {
                font-family: 'Inter', Arial, sans-serif !important; /* Keep menu font consistent */
            }


            /* Responsive */
            @media (max-width: 480px) {
                #${ MENU_PANEL_ID } {
                    width: calc(100% - 20px);
                    left: 10px;
                    right: 10px;
                    bottom: 10px;
                    max-height: calc(100vh - 80px); /* Adjust for smaller button */
                }
                #${ MENU_BUTTON_ID } {
                    width: 50px; height: 50px; font-size: 20px;
                }
                #${ MENU_PANEL_ID } button {
                    flex-basis: 100%; /* Full width buttons on very small screens */
                }
            }
        `;
		const styleEl = document.createElement('style');
		styleEl.id = styleId;
		document.head.appendChild(styleEl);
		styleEl.textContent = css
	};
	Menu._createFilterOverlay = function () {
		if (document.getElementById(FILTER_OVERLAY_ID)) {
			return
		}
		this.filterOverlayElement = document.createElement('div');
		this.filterOverlayElement.id = FILTER_OVERLAY_ID;
		document.body.appendChild(this.filterOverlayElement)
	};
	Menu._createMenuButton = function () {
		const btn = document.createElement('button');
		btn.id = MENU_BUTTON_ID;
		btn.setAttribute('aria-label', 'Accessibility Menu');
		btn.setAttribute('aria-expanded', 'false');
		btn.setAttribute('aria-controls', MENU_PANEL_ID);
		btn.innerHTML = `<span class="ar-aaa-menu-icon" role="img" aria-label="Accessibility Icon"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12,2A2,2 0 0,1 14,4A2,2 0 0,1 12,6A2,2 0 0,1 10,4A2,2 0 0,1 12,2M21,9H15V22H13V16H11V22H9V16H3V9A2,2 0 0,1 5,7H19A2,2 0 0,1 21,9Z" /></svg></span>`;
		btn.style.left = '50%';
		btn.style.top = '50%';
		btn.style.transform = 'translate(-50%, -50%)';
		btn.style.bottom = 'auto';
		btn.style.right = 'auto';
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
			textSize: this._getIconSVG('<path d="M2.5,4V7H7.5V19H10.5V7H15.5V4M10.5,10.5H13.5V13.5H10.5"/>', 'Text Size'),
			contrast: this._getIconSVG('<path d="M12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6V18M20,15L19.3,14C19.5,13.4 19.6,12.7 19.6,12C19.6,11.3 19.5,10.6 19.3,10L20,9L17.3,4L16.7,5C15.9,4.3 14.9,3.8 13.8,3.5L13.5,2H10.5L10.2,3.5C9.1,3.8 8.1,4.3 7.3,5L6.7,4L4,9L4.7,10C4.5,10.6 4.4,11.3 4.4,12C4.4,12.7 4.5,13.4 4.7,14L4,15L6.7,20L7.3,19C8.1,19.7 9.1,20.2 10.2,20.5L10.5,22H13.5L13.8,20.5C14.9,20.2 15.9,19.7 16.7,19L17.3,20L20,15Z"/>', 'Contrast'),
			highlight: this._getIconSVG('<path d="M16.2,12L12,16.2L7.8,12L12,7.8M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z"/>', 'Highlight'),
			animation: this._getIconSVG('<path d="M8,5V19L19,12"/>', 'Animation'),
			fontStyle: this._getIconSVG('<path d="M9.25,4V5.5H6.75V4H5.25V5.5H2.75V4H1.25V14.5H2.75V16H5.25V14.5H7.75V16H10.25V14.5H11.75V4H9.25M17.75,4V14.5H19.25V16H21.75V14.5H24.25V4H21.75V5.5H19.25V4H17.75M10.25,7H7.75V13H10.25V7M16.25,7H13.75V13H16.25V7Z"/>', 'Font Style'),
			reset: this._getIconSVG('<path d="M12,5V1L7,6L12,11V7A6,6 0 0,1 18,13A6,6 0 0,1 12,19A6,6 0 0,1 6,13H4A8,8 0 0,0 12,21A8,8 0 0,0 20,13A8,8 0 0,0 12,5Z"/>', 'Reset'),
			close: this._getIconSVG('<path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>', 'Close')
		};
		let html = `<h3 id="ar-aaa-menu-title">Accessibility Tools</h3>`;
		html += `
            <div class="ar-aaa-menu-group">
                <div class="ar-aaa-button-row">
                    <button data-action="increase-text">${ ICONS.textSize } Increase Text</button>
                    <button data-action="decrease-text">${ ICONS.textSize } Decrease Text</button>
                </div>
            </div>
            <div class="ar-aaa-menu-group">
                <div class="ar-aaa-button-row">
                    <button data-action="contrast-high">${ ICONS.contrast } High Contrast</button>
                    <button data-action="contrast-invert">${ ICONS.contrast } Invert Colors</button>
                </div>
            </div>
            <div class="ar-aaa-menu-group">
                <div class="ar-aaa-button-row">
                    <button data-action="highlight-links">${ ICONS.highlight } Highlight Links</button>
                    <button data-action="enhanced-focus">${ ICONS.highlight } Enhanced Focus</button>
                </div>
            </div>
            <div class="ar-aaa-menu-group">
                <div class="ar-aaa-button-row">
                    <button data-action="stop-animations" class="ar-aaa-fullwidth-btn">${ ICONS.animation } Stop Animations</button>
                </div>
            </div>
            <div class="ar-aaa-menu-group">
                <div class="ar-aaa-button-row">
                    <button data-action="toggle-dyslexia-font" class="ar-aaa-fullwidth-btn">${ ICONS.fontStyle } Dyslexia Font</button>
                </div>
            </div>
            <div class="ar-aaa-menu-group">
                <div class="ar-aaa-button-row">
                    <button data-action="reset-all" class="ar-aaa-fullwidth-btn ar-aaa-reset-btn">${ ICONS.reset } Reset All</button>
                    <button data-action="close-menu" class="ar-aaa-fullwidth-btn">${ ICONS.close } Close Menu</button>
                </div>
            </div>
        `;
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
		document.addEventListener('touchend', this._handleDocumentMouseUp.bind(this))
	};
	Menu._handleMenuButtonClick = function (event) {
		if (this.buttonDragOccurred) {
			this.buttonDragOccurred = false;
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
	Menu._startDragging = function (event, isButtonDrag) {
		const element = isButtonDrag ? document.getElementById(MENU_BUTTON_ID) : document.getElementById(MENU_PANEL_ID);
		if (!element)
			return;
		if (!isButtonDrag) {
			const target = event.target;
			const isButtonClick = target.closest('button');
			const isLegendClick = target.closest('legend');
			const isPanelDirectClick = target === element;
			if (isButtonClick || !isPanelDirectClick && !isLegendClick) {
				if (isButtonDrag)
					this.isButtonDragging = false;
				else
					this.isPanelDragging = false;
				return
			}
		}
		if (isButtonDrag)
			this.isButtonDragging = true;
		else
			this.isPanelDragging = true;
		element.classList.add('dragging');
		element.style.position = 'fixed';
		const coords = getClientCoords(event);
		const rect = element.getBoundingClientRect();
		element.style.left = `${ rect.left }px`;
		element.style.top = `${ rect.top }px`;
		element.style.right = 'auto';
		element.style.bottom = 'auto';
		if (isButtonDrag) {
			element.style.transform = 'none'
		}
		if (isButtonDrag) {
			this.buttonOffsetX = coords.clientX - rect.left;
			this.buttonOffsetY = coords.clientY - rect.top;
			this.buttonDragOccurred = false
		} else {
			this.panelOffsetX = coords.clientX - rect.left;
			this.panelOffsetY = coords.clientY - rect.top
		}
		if (event.type === 'touchstart') {
			event.preventDefault()
		}
	};
	Menu._handleButtonMouseDown = function (event) {
		this._startDragging(event, true)
	};
	Menu._handlePanelMouseDown = function (event) {
		this._startDragging(event, false)
	};
	Menu._handleDocumentMouseMove = function (event) {
		let element, offsetX, offsetY;
		if (this.isButtonDragging) {
			element = document.getElementById(MENU_BUTTON_ID);
			offsetX = this.buttonOffsetX;
			offsetY = this.buttonOffsetY;
			this.buttonDragOccurred = true
		} else if (this.isPanelDragging) {
			element = document.getElementById(MENU_PANEL_ID);
			offsetX = this.panelOffsetX;
			offsetY = this.panelOffsetY
		} else {
			return
		}
		if (!element)
			return;
		const coords = getClientCoords(event);
		let newLeft = coords.clientX - offsetX;
		let newTop = coords.clientY - offsetY;
		newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - element.offsetWidth));
		newTop = Math.max(0, Math.min(newTop, window.innerHeight - element.offsetHeight));
		element.style.left = `${ newLeft }px`;
		element.style.top = `${ newTop }px`;
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
			if (newTop < 10)
				newTop = buttonRect.bottom + 10;
			if (newTop + panelRect.height > window.innerHeight - 10) {
				newTop = Math.max(10, window.innerHeight - panelRect.height - 10)
			}
			if (newLeft < 10)
				newLeft = 10;
			if (newLeft + panelRect.width > window.innerWidth - 10) {
				newLeft = window.innerWidth - panelRect.width - 10
			}
			panel.style.position = 'fixed';
			panel.style.top = `${ newTop }px`;
			panel.style.left = `${ newLeft }px`;
			panel.style.bottom = 'auto';
			panel.style.right = 'auto';
			const firstFocusableButton = panel.querySelector('button:not([disabled])');
			if (firstFocusableButton) {
				firstFocusableButton.focus()
			}
		} else {
			button.focus()
		}
	};
	Menu.handleAction = function (action, targetButton) {
		if (action === 'close-menu') {
			this.toggleMenu();
			return
		}
		switch (action) {
		case 'increase-text':
		case 'decrease-text':
		case 'reset-font':
			this._handleTextSizeAction(action, targetButton);
			break;
		case 'contrast-high':
		case 'contrast-invert':
		case 'reset-contrast':
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
		if (isActive && action && action.startsWith('contrast-') && action !== 'reset-contrast') {
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
			elements = Array.from(document.querySelectorAll('p, li, span, div:not(#' + MENU_PANEL_ID + '):not(#' + MENU_BUTTON_ID + '), h1, h2, h3, h4, h5, h6, a, label, td, th, caption'))
		}
		let factor = 1;
		if (action === 'increase-text') {
			factor = FONT_SIZE_MULTIPLIER
		} else if (action === 'decrease-text') {
			factor = 1 / FONT_SIZE_MULTIPLIER
		} else if (action === 'reset-font') {
			factor = 0
		}
		elements.forEach(el => {
			if (factor === 0) {
				el.style.removeProperty('font-size')
			} else {
				const currentSize = parseFloat(window.getComputedStyle(el).fontSize);
				if (!isNaN(currentSize) && currentSize > 0) {
					el.style.setProperty('font-size', `${ currentSize * factor }px`, 'important')
				}
			}
		});
		logAction(`Text size ${ action }`, true);
		if (action === 'reset-font' && button && button.closest('.ar-aaa-menu-group')) {
			button.closest('.ar-aaa-menu-group').querySelectorAll('button[data-action="increase-text"], button[data-action="decrease-text"]').forEach(btn => {
				this._updateButtonActiveState(btn, false)
			})
		}
	};
	Menu._handleContrastAction = function (action, button) {
		const body = document.body;
		body.classList.remove(CLASS_HIGH_CONTRAST, CLASS_INVERT_COLORS);
		const parentGroup = button.closest('.ar-aaa-button-row') || button.closest('.ar-aaa-menu-group');
		if (parentGroup) {
			parentGroup.querySelectorAll('button[data-action^="contrast-"]').forEach(btn => {
				if (btn !== button) {
					this._updateButtonActiveState(btn, false)
				}
			})
		}
		if (action === 'contrast-high') {
			if (this.activeContrastMode !== 'high') {
				body.classList.add(CLASS_HIGH_CONTRAST);
				this.activeContrastMode = 'high';
				this._updateButtonActiveState(button, true);
				logAction('High contrast enabled', true)
			} else {
				this.activeContrastMode = 'default';
				this._updateButtonActiveState(button, false);
				logAction('High contrast disabled', true)
			}
		} else if (action === 'contrast-invert') {
			if (this.activeContrastMode !== 'inverted') {
				body.classList.add(CLASS_INVERT_COLORS);
				this.activeContrastMode = 'inverted';
				this._updateButtonActiveState(button, true);
				logAction('Invert colors enabled', true)
			} else {
				this.activeContrastMode = 'default';
				this._updateButtonActiveState(button, false);
				logAction('Invert colors disabled', true)
			}
		}
	};
	Menu._handleHighlightAction = function (action, button) {
		const body = document.body;
		if (action === 'highlight-links') {
			this.areLinksHighlighted = !this.areLinksHighlighted;
			body.classList.toggle(CLASS_HIGHLIGHT_LINKS, this.areLinksHighlighted);
			this._updateButtonActiveState(button, this.areLinksHighlighted);
			logAction('Highlight links ' + (this.areLinksHighlighted ? 'enabled' : 'disabled'), true)
		} else if (action === 'enhanced-focus') {
			this.isFocusEnhanced = !this.isFocusEnhanced;
			body.classList.toggle(CLASS_ENHANCED_FOCUS, this.isFocusEnhanced);
			this._updateButtonActiveState(button, this.isFocusEnhanced);
			logAction('Enhanced focus ' + (this.isFocusEnhanced ? 'enabled' : 'disabled'), true)
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
				if (typeof ar_isVisuallyHidden === 'function' && ar_isVisuallyHidden(img)) {
					return
				}
				img.dataset.arOriginalSrc = img.src;
				img.dataset.arOriginalAlt = img.alt || '';
				img.dataset.arOriginalDisplay = img.style.display || '';
				img.dataset.arOriginalWidth = img.offsetWidth + 'px';
				img.dataset.arOriginalHeight = img.offsetHeight + 'px';
				const tempImage = new Image();
				tempImage.crossOrigin = 'Anonymous';
				tempImage.onload = () => {
					const canvas = document.createElement('canvas');
					canvas.width = tempImage.naturalWidth || parseInt(img.dataset.arOriginalWidth) || 50;
					canvas.height = tempImage.naturalHeight || parseInt(img.dataset.arOriginalHeight) || 50;
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
						img.id = typeof ar_generateUniqueElementId === 'function' ? ar_generateUniqueElementId('ar-original-gif-') : `ar-gif-${ Date.now() }-${ Math.random() }`
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
						console.error('ARMenu: Failed to freeze GIF using canvas, falling back to blank GIF.', e);
						img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
						img.style.display = img.dataset.arOriginalDisplay || '';
						img.dataset.arGifFrozen = 'true';
						img.dataset.arGifFrozenFallback = 'true'
					}
				};
				tempImage.onerror = () => {
					console.error('ARMenu: Failed to load GIF for freezing, falling back to blank GIF.');
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
						].forEach(attr => {
							delete originalImg.dataset[attr]
						})
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
				].forEach(attr => {
					delete img.dataset[attr]
				})
			})
		}
		logAction('Stop animations ' + (this.areAnimationsStopped ? 'enabled' : 'disabled'), true)
	};
	Menu._handleDyslexiaFontAction = function (button) {
		this.isDyslexiaFontActive = !this.isDyslexiaFontActive;
		document.body.classList.toggle(CLASS_DYSLEXIA_FONT, this.isDyslexiaFontActive);
		this._updateButtonActiveState(button, this.isDyslexiaFontActive);
		logAction('Dyslexia font ' + (this.isDyslexiaFontActive ? 'enabled' : 'disabled'), true)
	};
	Menu._resetAllSettings = function () {
		this._handleTextSizeAction('reset-font', document.querySelector(`#${ MENU_PANEL_ID } button[data-action="reset-font"]`));
		document.body.classList.remove(CLASS_HIGH_CONTRAST, CLASS_INVERT_COLORS);
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
		logAction('All settings reset', true);
		const menuButton = document.getElementById(MENU_BUTTON_ID);
		if (menuButton) {
			menuButton.style.left = '50%';
			menuButton.style.top = '50%';
			menuButton.style.transform = 'translate(-50%, -50%)';
			menuButton.style.bottom = 'auto';
			menuButton.style.right = 'auto'
		}
		const panel = document.getElementById(MENU_PANEL_ID);
		if (panel) {
			if (this.isOpen) {
				this.toggleMenu();
				this.toggleMenu()
			} else {
				const docDir = document.documentElement.dir || window.getComputedStyle(document.documentElement).direction;
				if (docDir === 'rtl') {
					panel.style.left = '20px';
					panel.style.right = 'auto'
				} else {
					panel.style.right = '20px';
					panel.style.left = 'auto'
				}
				panel.style.bottom = '90px';
				panel.style.top = 'auto'
			}
		}
	};
	if (document.readyState === 'complete' || document.readyState === 'interactive') {
		setTimeout(function () {
			AR_AccessibilityMenu.init()
		}, 100)
	} else {
		document.addEventListener('DOMContentLoaded', function () {
			AR_AccessibilityMenu.init()
		})
	}
}(AR_AccessibilityMenu))
