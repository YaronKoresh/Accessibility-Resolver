var AR_AccessibilityMenu = AR_AccessibilityMenu || {};
(function (AR_AccessibilityMenuProto) {
	AR_AccessibilityMenuProto.isOpen = false;
	AR_AccessibilityMenuProto.readingGuideLineElement = null;
	AR_AccessibilityMenuProto.readingMaskTopElement = null;
	AR_AccessibilityMenuProto.readingMaskBottomElement = null;
	AR_AccessibilityMenuProto.currentFontSizeMultiplier = 1;
	AR_AccessibilityMenuProto.activeContrastModeClassName = 'default';
	AR_AccessibilityMenuProto.isDyslexiaFontActive = false;
	AR_AccessibilityMenuProto.isVirtualKeyboardActive = false;
	AR_AccessibilityMenuProto.isContentSimplified = false;
	AR_AccessibilityMenuProto.areImagesHidden = false;
	AR_AccessibilityMenuProto.isFocusHighlightActive = false;
	AR_AccessibilityMenuProto.virtualKeyboardElement = null;
	AR_AccessibilityMenuProto.isDragging = false;
	AR_AccessibilityMenuProto.offsetX = 0;
	AR_AccessibilityMenuProto.offsetY = 0;
	AR_AccessibilityMenuProto.isTextToSpeechActive = false;
	AR_AccessibilityMenuProto.currentSpeechUtterance = null;
	AR_AccessibilityMenuProto.currentZoomLevel = 1;
	AR_AccessibilityMenuProto.activeCursorClassName = 'default';
	AR_AccessibilityMenuProto.init = function () {
		this._injectStyles();
		this._createMenuButton();
		this._createMenuPanel();
		this._attachEventListeners();
		console.log('Accessibility Menu Initialized.')
	};
	AR_AccessibilityMenuProto._injectStyles = function () {
		const styleId = 'ar-menu-styles';
		if (document.getElementById(styleId))
			return;
		const css = `
            /* Main Menu Button */
            #${ AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID } {
                position: fixed; bottom: 20px; z-index: 2147483647; /* Ensure highest z-index */
                background-color: #0056b3; color: ${ AR_CONFIG.MENU_ICON_ACTIVE_COLOR }!important;
                border: none; border-radius: 50%; width: 60px; height: 60px;
                font-size: 28px; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.25);
                display: flex; align-items: center; justify-content: center;
                transition: background-color .3s, transform .2s, box-shadow .2s;
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID } .ar-menu-icon svg { fill: ${ AR_CONFIG.MENU_ICON_ACTIVE_COLOR }!important; }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID }:hover, #${ AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID }:focus-visible {
                background-color: #003d82; color: ${ AR_CONFIG.MENU_ICON_ACTIVE_COLOR }!important;
                outline: 3px solid #70a1ff; outline-offset: 2px;
                transform: scale(1.08); box-shadow: 0 6px 20px rgba(0,0,0,0.3);
            }

            /* Main Menu Panel */
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } {
                display: none; position: fixed; bottom: 90px;
                width: 350px; max-height: calc(100vh - 120px); overflow-y: auto;
                background-color: #fff; border: 1px solid #bdbdbd; border-radius: 12px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.15); z-index: 2147483647; /* Ensure highest z-index */
                padding: 20px; font-family: 'Inter', sans-serif; /* Changed font to Inter */
                font-size: 15px; color: #212121;
                cursor: grab;
                transition: box-shadow 0.2s ease-in-out; /* Smooth shadow on drag */
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID }.ar-menu-open { display: block; animation: ar-slide-up .3s ease-out; }
            @keyframes ar-slide-up { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform: translateY(0); } }

            /* Fieldset Groups */
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } fieldset.ar-menu-group {
                border: 1px solid #e0e0e0; padding: 12px 18px 18px; margin-bottom: 18px; border-radius: 8px;
                background-color: #fcfcfc; /* Slightly off-white for depth */
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } legend {
                font-size: 1.15em; font-weight: 600; color: #004a99; padding: 0 8px; margin-left: 8px;
                display: flex; align-items: center; gap: 6px;
                cursor: grab;
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-button-row {
                display: flex; flex-wrap: wrap; margin: 0 -3px;
                gap: 6px; /* Spacing between buttons */
            }

            /* Menu Buttons */
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } button {
                display: flex; align-items: center; justify-content: center; gap: 8px;
                flex: 1 1 calc(50% - 6px); min-width: calc(50% - 6px);
                padding: 10px 8px; border: 1px solid #ccc; border-radius: 8px; /* More rounded */
                background-color: #f0f0f0; /* Lighter background */
                cursor: pointer; font-size: 14px;
                transition: background-color .2s, transform .1s, box-shadow .2s, color .2s, border-color .2s;
                color: #333!important; /* Darker text for better contrast */
                line-height: 1.2; text-align: center;
                box-shadow: 0 1px 2px rgba(0,0,0,0.05); /* Subtle shadow */
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } button .ar-menu-icon {
                display: inline-block; width: 18px; height: 18px; fill: currentColor; vertical-align: middle; transition: fill .2s;
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } button .ar-menu-text { vertical-align: middle; flex-grow:1; text-align:center; }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } button:hover {
                background-color: #e0e0e0; border-color: #0056b3;
                transform: translateY(-1px); /* Slight lift */
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } button:focus-visible {
                outline: 2px solid #0056b3; outline-offset: 2px; /* Increased offset */
                box-shadow: 0 0 0 3px rgba(0,86,179,0.3); /* Focus ring effect */
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-menu-fullwidth-btn { width: calc(100% - 6px); flex-basis: calc(100% - 6px); }

            /* Reset Button Specifics */
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-menu-reset-btn {
                background-color: #e6ffed; border-color: #a3d4b7; font-weight: 500; color: #1e4620!important;
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-menu-reset-btn .ar-menu-icon { fill: #1e4620!important; }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-menu-reset-btn:hover, #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-menu-reset-btn:focus-visible {
                background-color: #c8f0d3; border-color: #4caf50;
            }

            /* Active Button State */
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-menu-btn-active {
                background-color: #0056b3!important; color: ${ AR_CONFIG.MENU_TEXT_ACTIVE_COLOR }!important;
                border-color: #003d82!important; font-weight: bold;
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.2); /* Inset shadow for active */
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-menu-btn-active .ar-menu-icon { fill: ${ AR_CONFIG.MENU_ICON_ACTIVE_COLOR }!important; }

            /* Close Button */
            #ar-menu-close-button { background-color: #f8d7da; border-color: #f5c6cb; color: #721c24!important; margin-top:10px; }
            #ar-menu-close-button:hover, #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } #ar-menu-close-button:focus-visible {
                background-color: #f1b0b7; border-color: #e08890;
            }
            #ar-menu-close-button .ar-menu-icon { fill: #721c24!important; }

            /* New Feature Styles */
            /* Virtual Keyboard */
            #ar-virtual-keyboard {
                position: fixed; bottom: 0; left: 0; width: 100%;
                background-color: #333; padding: 10px; z-index: 2147483647;
                display: flex; flex-wrap: wrap; justify-content: center;
                box-shadow: 0 -4px 15px rgba(0,0,0,0.3);
                border-top-left-radius: 8px; border-top-right-radius: 8px;
                transition: transform 0.3s ease-out; /* Smooth slide in/out */
            }
            #ar-virtual-keyboard.hidden {
                transform: translateY(100%);
            }
            #ar-virtual-keyboard button {
                background-color: #555; color: white; border: 1px solid #666;
                border-radius: 4px; padding: 8px 12px; margin: 4px;
                font-size: 16px; cursor: pointer;
                transition: background-color 0.2s, transform 0.1s;
                min-width: 40px; text-align: center;
            }
            #ar-virtual-keyboard button:hover, #ar-virtual-keyboard button:focus-visible {
                background-color: #777; transform: translateY(-1px);
                outline: 2px solid #0056b3; outline-offset: 1px;
            }
            #ar-virtual-keyboard .key-space { flex-grow: 2; }
            #ar-virtual-keyboard .key-backspace, #ar-virtual-keyboard .key-enter {
                flex-basis: auto; min-width: 80px;
            }
            #ar-virtual-keyboard .key-shift, #ar-virtual-keyboard .key-caps {
                background-color: #0056b3;
            }
            #ar-virtual-keyboard .key-shift.active, #ar-virtual-keyboard .key-caps.active {
                background-color: #003d82;
            }

            /* Content Simplifier */
            .ar-content-simplified body {
                max-width: 800px; margin: 20px auto; padding: 0 20px;
                background-color: #f9f9f9;
            }
            .ar-content-simplified header,
            .ar-content-simplified footer,
            .ar-content-simplified nav,
            .ar-content-simplified aside,
            .ar-content-simplified .sidebar,
            .ar-content-simplified .ad,
            .ar-content-simplified #comments,
            .ar-content-simplified .related-posts,
            .ar-content-simplified [role="complementary"],
            .ar-content-simplified [role="navigation"],
            .ar-content-simplified [role="banner"],
            .ar-content-simplified [role="contentinfo"] {
                display: none !important;
            }
            .ar-content-simplified img {
                max-width: 100%; height: auto; display: block; margin: 15px auto;
            }
            .ar-content-simplified p,
            .ar-content-simplified li {
                line-height: 1.8 !important;
                font-size: 1.1em !important;
                max-width: 65ch; /* Optimal reading width */
            }

            /* Hide Images */
            .ar-hide-images img,
            .ar-hide-images picture,
            .ar-hide-images svg {
                display: none !important;
            }
            .ar-hide-images [style*="background-image"] {
                background-image: none !important;
            }

            /* Focus Highlight */
            .ar-focus-highlight *:focus-visible {
                outline: 4px solid #ffcc00 !important;
                outline-offset: 3px !important;
                box-shadow: 0 0 0 5px rgba(255, 204, 0, 0.5) !important;
                transition: outline-color 0.2s, box-shadow 0.2s;
            }

            /* Custom Cursor */
            .ar-cursor-large { cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="black" d="M10 16.5l6-4.5-6-4.5v9z"/><path fill="white" stroke="black" stroke-width="0.5" d="M10 16.5l6-4.5-6-4.5v9z"/></svg>') 12 12, auto !important; }
            .ar-cursor-xlarge { cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><path fill="black" d="M10 16.5l6-4.5-6-4.5v9z"/><path fill="white" stroke="black" stroke-width="0.5" d="M10 16.5l6-4.5-6-4.5v9z"/></svg>') 18 18, auto !important; }
            .ar-cursor-red { cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="red" d="M10 16.5l6-4.5-6-4.5v9z"/><path fill="white" stroke="black" stroke-width="0.5" d="M10 16.5l6-4.5-6-4.5v9z"/></svg>') 9 9, auto !important; }
            .ar-cursor-green { cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="green" d="M10 16.5l6-4.5-6-4.5v9z"/><path fill="white" stroke="black" stroke-width="0.5" d="M10 16.5l6-4.5-6-4.5v9z"/></svg>') 9 9, auto !important; }

            /* Text-to-Speech Highlight */
            .ar-tts-highlight {
                background-color: yellow;
                box-shadow: 0 0 5px yellow;
                transition: background-color 0.1s ease-in-out;
            }

            /* Page Zoom */
            .ar-page-zoom-active {
                transform-origin: top left; /* Zoom from top-left corner */
            }

            /* Responsive adjustments for menu panel */
            @media (max-width: 768px) {
                #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } {
                    width: calc(100% - 40px);
                    left: 20px;
                    right: 20px;
                    bottom: 20px;
                    max-height: calc(100vh - 40px);
                    padding: 15px;
                }
                #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-button-row button {
                    flex: 1 1 calc(100% - 6px);
                    min-width: calc(100% - 6px);
                }
            }
        `;
		const styleEl = document.createElement('style');
		styleEl.id = styleId;
		styleEl.textContent = css;
		document.head.appendChild(styleEl)
	};
	AR_AccessibilityMenuProto._createMenuButton = function () {
		if (document.getElementById(AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID))
			return;
		const btn = document.createElement('button');
		btn.id = AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID;
		btn.setAttribute('aria-label', 'Accessibility Menu');
		btn.setAttribute('aria-expanded', 'false');
		btn.setAttribute('aria-controls', AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID);
		btn.innerHTML = `<svg class="ar-menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32px" height="32px"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/></svg>`;
		const docDir = document.documentElement.dir || window.getComputedStyle(document.documentElement).direction;
		if (docDir === 'rtl') {
			btn.style.left = '20px';
			btn.style.right = 'auto'
		} else {
			btn.style.right = '20px';
			btn.style.left = 'auto'
		}
		document.body.appendChild(btn)
	};
	AR_AccessibilityMenuProto._createMenuPanel = function () {
		if (document.getElementById(AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID))
			return;
		const panel = document.createElement('div');
		panel.id = AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID;
		panel.setAttribute('role', 'dialog');
		panel.setAttribute('aria-labelledby', 'ar-menu-title');
		panel.setAttribute('aria-hidden', 'true');
		panel.style.display = 'none';
		const docDir = document.documentElement.dir || window.getComputedStyle(document.documentElement).direction;
		if (docDir === 'rtl') {
			panel.style.left = '20px';
			panel.style.right = 'auto'
		} else {
			panel.style.right = '20px';
			panel.style.left = 'auto'
		}
		panel.style.bottom = '90px';
		panel.innerHTML = this._getMenuPanelHTML();
		document.body.appendChild(panel);
		panel.addEventListener('mousedown', this._startDragging.bind(this));
		const legend = panel.querySelector('legend');
		if (legend) {
			legend.addEventListener('mousedown', this._startDragging.bind(this))
		}
	};
	AR_AccessibilityMenuProto._getMenuIconSVG = function (pathData, altText = '') {
		return `<span class="ar-menu-icon" role="img" aria-label="${ altText }"><svg viewBox="0 0 24 24">${ pathData }</svg></span>`
	};
	AR_AccessibilityMenuProto._getMenuButtonHTML = function (action, iconSVG, text, isFullWidth = false, isReset = false) {
		let classNames = [];
		if (isFullWidth)
			classNames.push('ar-menu-fullwidth-btn');
		if (isReset)
			classNames.push('ar-menu-reset-btn');
		return `<button data-action="${ action }" ${ classNames.length ? `class="${ classNames.join(' ') }"` : '' } aria-label="${ text }">
                    ${ iconSVG }<span class="ar-menu-text">${ text }</span>
                </button>`
	};
	AR_AccessibilityMenuProto._getMenuFieldsetHTML = function (legendIconSVG, legendText, buttonsHTML) {
		return `<fieldset class="ar-menu-group">
                    <legend>${ legendIconSVG }<span class="ar-menu-text">${ legendText }</span></legend>
                    <div class="ar-button-row">${ buttonsHTML }</div>
                </fieldset>`
	};
	AR_AccessibilityMenuProto._getMenuPanelHTML = function () {
		const ICONS = {
			fontSize: this._getMenuIconSVG('<path d="M9.93 13.5h4.14L12 7.98zM20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-4.05 11.89h-1.6L12.7 8.33h1.6l1.65 7.56zM6.25 8.33l1.65 7.56h-1.6L4.65 8.33h1.6z"/>', 'Font size'),
			contrast: this._getMenuIconSVG('<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18V4c4.41 0 8 3.59 8 8s-3.59 8-8 8z"/>', 'Contrast'),
			spacing: this._getMenuIconSVG('<path d="M6 17h12v2H6zm8-4H6v2h8zm-4-4H6v2h4zm0-4H6v2h4zm10 0v10h2V5zM4 5H2v10h2z"/>', 'Spacing'),
			alignLeft: this._getMenuIconSVG('<path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/>', 'Align left'),
			alignCenter: this._getMenuIconSVG('<path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/>', 'Align center'),
			highlight: this._getMenuIconSVG('<path d="m17.68 8.47-2.12-2.12c-.2-.2-.51-.2-.71 0l-8.35 8.35-1.06 3.18c-.1.3.12.61.42.72l3.18-1.06 8.35-8.35c.2-.2.2-.51 0-.72zm-9.24 7.09L7 14.12l6.56-6.56 1.44 1.44-6.56 6.56zM4 20h16v-2H4v2z"/>', 'Highlight'),
			readingAid: this._getMenuIconSVG('<path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-1 2v.01L12 13 4 8.01V8h16zm0 8H4v-2.01L12 11l8 4.99V16z"/>', 'Reading aid'),
			fontStyle: this._getMenuIconSVG('<path d="M9.25 4v1.5H6.75V4h-1.5v1.5H2.75V4H1.25v10.5h1.5V16h2.5v-1.5h-2.5V5.5h2.5V7h1.5V5.5h2.5v8.25c0 .93.53 1.74 1.32 2.13.23.11.48.17.73.17.83 0 1.5-.67 1.5-1.5V4h-1.5zm8.5 0v1.5h-2.5V4h-1.5v1.5h-2.5V4H7.25v10.5h1.5V16h2.5v-1.5H8.75V5.5h2.5V7h1.5V5.5h2.5v8.25c0 .93.53 1.74 1.32 2.13.23.11.48.17.73.17.83 0 1.5-.67 1.5-1.5V4h-1.5z"/>', 'Font style'),
			animation: this._getMenuIconSVG('<path d="M8 5v14l11-7z"/>', 'Animation'),
			reset: this._getMenuIconSVG('<path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>', 'Reset'),
			close: this._getMenuIconSVG('<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>', 'Close'),
			textIncrease: this._getMenuIconSVG('<path d="M14.5 16.5h-1.25l-2.6-7h1.25l1.98 5.58L15.85 9.5h1.3l-2.65 7zm5-11H4.5c-.83 0-1.5.67-1.5 1.5v9c0 .83.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5v-9c0-.83-.67-1.5-1.5-1.5zm0 10.5H4.5v-9h15v9zM10 12.5H7.5v-1h2.5v-1H7.5v-1h2.5V8.5H6.25v5h3.75z"/>', 'Increase text'),
			textDecrease: this._getMenuIconSVG('<path d="M14.5 16.5h-1.25l-2.6-7h1.25l1.98 5.58L15.85 9.5h1.3l-2.65 7zm5-11H4.5c-.83 0-1.5.67-1.5 1.5v9c0 .83.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5v-9c0-.83-.67-1.5-1.5-1.5zm0 10.5H4.5v-9h15v9zM10 10.5H6.25v1h3.75z"/>', 'Decrease text'),
			keyboard: this._getMenuIconSVG('<path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2zm0 3h2v2h-2zM8 8h2v2H8zm0 3h2v2H8zm-1 2H5v-2h2zm0-3H5V8h2zm9 7H8v-2h8v2zm-3-4h2v2h-2zm0-3h2v2h-2zm3 3h2v2h-2zm0-3h2v2h-2z"/>', 'Virtual Keyboard'),
			simplify: this._getMenuIconSVG('<path d="M3 13h18v-2H3v2zm0 4h18v-2H3v2zm0-8h18V7H3v2zm0-4h18V3H3v2z"/>', 'Simplify Content'),
			hide: this._getMenuIconSVG('<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>', 'Hide Images'),
			focus: this._getMenuIconSVG('<path d="M12 12c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0-8c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>', 'Focus Highlight'),
			readAloud: this._getMenuIconSVG('<path d="M4 18h16V6H4v12zm2-2v-4h4v4H6zm10 0v-4h4v4h-4z"/>', 'Read Aloud'),
			cursor: this._getMenuIconSVG('<path d="M13 14.5V19h2v-4.5h2V21H7v-6.5h2V19h2v-4.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>', 'Custom Cursor'),
			zoom: this._getMenuIconSVG('<path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>', 'Page Zoom')
		};
		let html = `<h3 id="ar-menu-title">Accessibility Tools</h3>`;
		html += this._getMenuFieldsetHTML(ICONS.fontSize, 'Text & Display', this._getMenuButtonHTML('increase-font', ICONS.textIncrease, 'Increase Text') + this._getMenuButtonHTML('decrease-font', ICONS.textDecrease, 'Decrease Text') + this._getMenuButtonHTML('reset-font', ICONS.reset, 'Reset Text Size', true, true) + this._getMenuButtonHTML('text-spacing-letter', ICONS.spacing, 'Letter Spacing') + this._getMenuButtonHTML('text-spacing-word', ICONS.spacing, 'Word Spacing') + this._getMenuButtonHTML('text-spacing-line', ICONS.spacing, 'Line Height') + this._getMenuButtonHTML('text-spacing-reset', ICONS.reset, 'Reset Spacing', true, true) + this._getMenuButtonHTML('text-align-left', ICONS.alignLeft, 'Align Left') + this._getMenuButtonHTML('text-align-center', ICONS.alignCenter, 'Align Center') + this._getMenuButtonHTML('text-align-reset', ICONS.reset, 'Reset Alignment', true, true) + this._getMenuButtonHTML('toggle-dyslexia-font', ICONS.fontStyle, 'Dyslexia Font', true));
		html += this._getMenuFieldsetHTML(ICONS.contrast, 'Visual & Color', this._getMenuButtonHTML('contrast-high', ICONS.contrast, 'High Contrast') + this._getMenuButtonHTML('contrast-inverted', ICONS.contrast, 'Invert Colors') + this._getMenuButtonHTML('contrast-grayscale', ICONS.contrast, 'Grayscale') + this._getMenuButtonHTML('saturation-low', ICONS.contrast, 'Low Saturation') + this._getMenuButtonHTML('reset-contrast', ICONS.reset, 'Reset Colors', true, true) + this._getMenuButtonHTML('toggle-hide-images', ICONS.hide, 'Hide Images', true));
		html += this._getMenuFieldsetHTML(ICONS.highlight, 'Navigation & Focus', this._getMenuButtonHTML('highlight-links', ICONS.highlight, 'Highlight Links') + this._getMenuButtonHTML('highlight-headings', ICONS.highlight, 'Highlight Headings') + this._getMenuButtonHTML('focus-highlight', ICONS.focus, 'Focus Highlight') + this._getMenuButtonHTML('reset-highlights', ICONS.reset, 'Reset Highlights', true, true) + this._getMenuButtonHTML('toggle-reading-line', ICONS.readingAid, 'Reading Line') + this._getMenuButtonHTML('toggle-reading-mask', ICONS.readingAid, 'Reading Mask'));
		html += this._getMenuFieldsetHTML(this._getMenuIconSVG('<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18V4c4.41 0 8 3.59 8 8s-3.59 8-8 8z"/>', 'Advanced Tools'), 'Advanced Tools', this._getMenuButtonHTML('toggle-virtual-keyboard', ICONS.keyboard, 'Virtual Keyboard', true) + this._getMenuButtonHTML('toggle-content-simplifier', ICONS.simplify, 'Simplify Content', true) + this._getMenuButtonHTML('toggle-text-to-speech', ICONS.readAloud, 'Read Aloud', true) + this._getMenuButtonHTML('stop-text-to-speech', ICONS.reset, 'Stop Reading', true) + this._getMenuButtonHTML('toggle-custom-cursor', ICONS.cursor, 'Custom Cursor', true) + this._getMenuButtonHTML('zoom-in', ICONS.zoom, 'Zoom In') + this._getMenuButtonHTML('zoom-out', ICONS.zoom, 'Zoom Out') + this._getMenuButtonHTML('reset-zoom', ICONS.reset, 'Reset Zoom', true));
		html += `<fieldset class="ar-menu-group">
                    <div class="ar-button-row">
                        ${ this._getMenuButtonHTML('reset-all-menu', ICONS.reset, 'Reset All Settings', true, true) }
                        <button id="ar-menu-close-button" data-action="close-menu" class="ar-menu-fullwidth-btn">
                            ${ ICONS.close }<span class="ar-menu-text">Close Menu</span>
                        </button>
                    </div>
                 </fieldset>`;
		return html
	}
}(AR_AccessibilityMenu));
(function (AR_AccessibilityMenuProto) {
	AR_AccessibilityMenuProto._attachEventListeners = function () {
		const menuButton = document.getElementById(AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID);
		const menuPanel = document.getElementById(AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID);
		if (menuButton) {
			menuButton.addEventListener('click', this.toggleMenu.bind(this))
		}
		if (menuPanel) {
			menuPanel.addEventListener('click', event => {
				const targetButton = event.target.closest('button');
				if (targetButton && targetButton.dataset.action) {
					this.handleAction(targetButton.dataset.action, targetButton)
				}
			});
			menuPanel.addEventListener('keydown', event => {
				if (event.key === 'Escape' && this.isOpen) {
					this.toggleMenu()
				}
			});
			document.addEventListener('mousemove', this._doDragging.bind(this));
			document.addEventListener('mouseup', this._stopDragging.bind(this))
		}
	};
	AR_AccessibilityMenuProto.toggleMenu = function () {
		const panel = document.getElementById(AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID);
		const button = document.getElementById(AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID);
		if (!panel || !button)
			return;
		this.isOpen = !this.isOpen;
		panel.style.display = this.isOpen ? 'block' : 'none';
		panel.classList.toggle('ar-menu-open', this.isOpen);
		panel.setAttribute('aria-hidden', String(!this.isOpen));
		button.setAttribute('aria-expanded', String(this.isOpen));
		if (this.isOpen) {
			const firstFocusableButton = panel.querySelector('button:not([disabled])');
			if (firstFocusableButton)
				firstFocusableButton.focus()
		} else {
			button.focus()
		}
	};
	AR_AccessibilityMenuProto.handleAction = function (action, targetButton) {
		if (action === 'close-menu') {
			this.toggleMenu();
			return
		}
		if (action.includes('font') || action.includes('spacing') || action.includes('align') || action === 'toggle-dyslexia-font') {
			if (action.includes('font'))
				this._handleFontAction(action, targetButton);
			else if (action.includes('spacing'))
				this._handleTextSpacingAction(action, targetButton);
			else if (action.includes('align'))
				this._handleTextAlignAction(action, targetButton);
			else if (action === 'toggle-dyslexia-font')
				this._handleFontStyleAction(action, targetButton)
		} else if (action.includes('contrast') || action.includes('saturation') || action === 'toggle-hide-images') {
			if (action.includes('contrast') || action.includes('saturation'))
				this._handleContrastColorAction(action, targetButton);
			else if (action === 'toggle-hide-images')
				this._handleHideImagesAction(targetButton)
		} else if (action.includes('highlight') || action.includes('reading')) {
			if (action.includes('highlight'))
				this._handleHighlightAction(action, targetButton);
			else if (action.includes('reading'))
				this._handleReadingAidAction(action, targetButton)
		} else if (action === 'stop-animations') {
			this._handleAnimationAction(action, targetButton)
		} else if (action === 'toggle-virtual-keyboard') {
			this._handleVirtualKeyboardAction(targetButton)
		} else if (action === 'toggle-content-simplifier') {
			this._handleContentSimplifierAction(targetButton)
		} else if (action === 'toggle-text-to-speech') {
			this._handleTextToSpeechAction(targetButton)
		} else if (action === 'stop-text-to-speech') {
			this._stopReading(targetButton)
		} else if (action === 'toggle-custom-cursor') {
			this._handleCustomCursorAction(targetButton)
		} else if (action.startsWith('zoom-') || action === 'reset-zoom') {
			this._handlePageZoomAction(action, targetButton)
		} else if (action === 'reset-all-menu') {
			this._resetAllMenuSettings()
		}
	};
	AR_AccessibilityMenuProto._updateButtonActiveState = function (buttonElement, isActive, isToggleableGroup = false) {
		if (!buttonElement)
			return;
		buttonElement.classList.toggle('ar-menu-btn-active', isActive);
		if (isActive && !isToggleableGroup) {
			const parentFieldset = buttonElement.closest('fieldset.ar-menu-group');
			if (parentFieldset && !buttonElement.classList.contains('ar-menu-reset-btn')) {
				Array.from(parentFieldset.querySelectorAll('button:not(.ar-menu-reset-btn)')).forEach(btn => {
					if (btn !== buttonElement) {
						const multiSelectActions = [
							'text-spacing-letter',
							'text-spacing-word',
							'text-spacing-line',
							'highlight-links',
							'highlight-headings'
						];
						if (!multiSelectActions.includes(buttonElement.dataset.action)) {
							btn.classList.remove('ar-menu-btn-active')
						}
					}
				})
			}
		}
	};
	AR_AccessibilityMenuProto._handleFontAction = function (action, targetButton) {
		const elementsForFontAdjust = ar_getElementsForMenuTextStyleAdjustments();
		if (action === 'increase-font') {
			this.currentFontSizeMultiplier = Math.min(AR_CONFIG.MAX_FONT_SIZE_ADJUSTMENT_MULTIPLIER, this.currentFontSizeMultiplier + AR_CONFIG.DEFAULT_FONT_SIZE_ADJUSTMENT_INCREMENT);
			this._applyFontSize(elementsForFontAdjust, false);
			this._updateButtonActiveState(targetButton, true);
			const decreaseButton = targetButton.parentElement.querySelector('[data-action="decrease-font"]');
			if (decreaseButton)
				this._updateButtonActiveState(decreaseButton, false)
		} else if (action === 'decrease-font') {
			this.currentFontSizeMultiplier = Math.max(AR_CONFIG.MIN_FONT_SIZE_ADJUSTMENT_MULTIPLIER, this.currentFontSizeMultiplier - AR_CONFIG.DEFAULT_FONT_SIZE_ADJUSTMENT_INCREMENT);
			this._applyFontSize(elementsForFontAdjust, false);
			this._updateButtonActiveState(targetButton, true);
			const increaseButton = targetButton.parentElement.querySelector('[data-action="increase-font"]');
			if (increaseButton)
				this._updateButtonActiveState(increaseButton, false)
		} else if (action === 'reset-font') {
			this.currentFontSizeMultiplier = 1;
			this._applyFontSize(elementsForFontAdjust, true);
			const parentFieldset = targetButton.closest('fieldset.ar-menu-group');
			if (parentFieldset) {
				parentFieldset.querySelectorAll('button:not(.ar-menu-reset-btn)').forEach(b => this._updateButtonActiveState(b, false))
			}
		}
		this._logMenuChange(`Font size ${ action === 'reset-font' ? 'reset.' : `adjusted by ${ this.currentFontSizeMultiplier.toFixed(1) }x.` }`, action !== 'reset-font')
	};
	AR_AccessibilityMenuProto._applyFontSize = function (elements, reset) {
		elements.forEach(el => {
			const styleProp = 'font-size';
			if (reset) {
				ar_restoreOriginalInlineStyle(el, styleProp)
			} else {
				if (!ar_originalElementStylesMap.has(el) || !ar_originalElementStylesMap.get(el).hasOwnProperty(styleProp)) {
					ar_storeOriginalInlineStyle(el, styleProp)
				}
				const originalInlineStyle = ar_originalElementStylesMap.get(el) ? ar_originalElementStylesMap.get(el)[styleProp] : null;
				let baseSize = originalInlineStyle && parseFloat(originalInlineStyle) ? parseFloat(originalInlineStyle) : parseFloat(window.getComputedStyle(el).fontSize);
				if (!isNaN(baseSize)) {
					el.style.setProperty(styleProp, `${ baseSize * this.currentFontSizeMultiplier }px`, 'important')
				}
			}
		})
	};
	AR_AccessibilityMenuProto._handleContrastColorAction = function (action, targetButton) {
		const bodyEl = document.body;
		const contrastClasses = [
			AR_CONFIG.HIGH_CONTRAST_MODE_CLASS_NAME,
			AR_CONFIG.INVERTED_CONTRAST_MODE_CLASS_NAME,
			AR_CONFIG.GRAYSCALE_CONTRAST_MODE_CLASS_NAME
		];
		const saturationClass = AR_CONFIG.SATURATION_FILTER_CLASS_NAME;
		if (action === 'reset-contrast') {
			bodyEl.classList.remove(...contrastClasses, saturationClass);
			this.activeContrastModeClassName = 'default';
			const parentFieldset = targetButton.closest('fieldset.ar-menu-group');
			if (parentFieldset) {
				parentFieldset.querySelectorAll('button:not(.ar-menu-reset-btn)').forEach(b => this._updateButtonActiveState(b, false))
			}
			this._logMenuChange('Contrast and saturation reset', true);
			return
		}
		let targetClass = '', logMsg = '';
		switch (action) {
		case 'contrast-high':
			targetClass = AR_CONFIG.HIGH_CONTRAST_MODE_CLASS_NAME;
			logMsg = 'High contrast';
			break;
		case 'contrast-inverted':
			targetClass = AR_CONFIG.INVERTED_CONTRAST_MODE_CLASS_NAME;
			logMsg = 'Inverted colors';
			break;
		case 'contrast-grayscale':
			targetClass = AR_CONFIG.GRAYSCALE_CONTRAST_MODE_CLASS_NAME;
			logMsg = 'Grayscale mode';
			break;
		case 'saturation-low':
			targetClass = saturationClass;
			logMsg = 'Low saturation';
			break
		}
		if (targetClass) {
			if (contrastClasses.includes(targetClass)) {
				bodyEl.classList.remove(...contrastClasses.filter(c => c !== targetClass))
			}
			bodyEl.classList.toggle(targetClass);
			const isActive = bodyEl.classList.contains(targetClass);
			this._updateButtonActiveState(targetButton, isActive);
			if (isActive && contrastClasses.includes(targetClass))
				this.activeContrastModeClassName = targetClass;
			else if (!isActive && this.activeContrastModeClassName === targetClass)
				this.activeContrastModeClassName = 'default';
			this._logMenuChange(logMsg, isActive)
		}
	};
	AR_AccessibilityMenuProto._handleTextSpacingAction = function (action, targetButton) {
		const bodyEl = document.body;
		const spacingClasses = {
			'text-spacing-letter': AR_CONFIG.INCREASED_LETTER_SPACING_CLASS_NAME,
			'text-spacing-word': AR_CONFIG.INCREASED_WORD_SPACING_CLASS_NAME,
			'text-spacing-line': AR_CONFIG.INCREASED_LINE_HEIGHT_CLASS_NAME
		};
		if (action === 'text-spacing-reset') {
			bodyEl.classList.remove(...Object.values(spacingClasses));
			const parentFieldset = targetButton.closest('fieldset.ar-menu-group');
			if (parentFieldset) {
				parentFieldset.querySelectorAll('button:not(.ar-menu-reset-btn)').forEach(b => this._updateButtonActiveState(b, false))
			}
			this._logMenuChange('Text spacing reset', true)
		} else if (spacingClasses[action]) {
			const targetClass = spacingClasses[action];
			bodyEl.classList.toggle(targetClass);
			const isActive = bodyEl.classList.contains(targetClass);
			this._updateButtonActiveState(targetButton, isActive, true);
			this._logMenuChange(`${ targetButton.textContent.trim() } spacing`, isActive)
		}
	};
	AR_AccessibilityMenuProto._handleTextAlignAction = function (action, targetButton) {
		const bodyEl = document.body;
		const alignClasses = {
			'text-align-left': `${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }left`,
			'text-align-center': `${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }center`
		};
		bodyEl.classList.remove(...Object.values(alignClasses));
		if (action === 'text-align-reset') {
			const parentFieldset = targetButton.closest('fieldset.ar-menu-group');
			if (parentFieldset) {
				parentFieldset.querySelectorAll('button:not(.ar-menu-reset-btn)').forEach(b => this._updateButtonActiveState(b, false))
			}
			this._logMenuChange('Text alignment reset', true)
		} else if (alignClasses[action]) {
			const targetClass = alignClasses[action];
			bodyEl.classList.add(targetClass);
			this._updateButtonActiveState(targetButton, true);
			this._logMenuChange(`Text align to ${ action.split('-')[2] }`, true)
		}
	};
	AR_AccessibilityMenuProto._handleHighlightAction = function (action, targetButton) {
		const bodyEl = document.body;
		const highlightClasses = {
			'highlight-links': AR_CONFIG.HIGHLIGHTED_LINKS_CLASS_NAME,
			'highlight-headings': AR_CONFIG.HIGHLIGHTED_HEADINGS_CLASS_NAME
		};
		if (action === 'reset-highlights') {
			bodyEl.classList.remove(...Object.values(highlightClasses), 'ar-focus-highlight');
			this.isFocusHighlightActive = false;
			const parentFieldset = targetButton.closest('fieldset.ar-menu-group');
			if (parentFieldset) {
				parentFieldset.querySelectorAll('button:not(.ar-menu-reset-btn)').forEach(b => this._updateButtonActiveState(b, false))
			}
			this._logMenuChange('Highlights reset', true)
		} else if (highlightClasses[action]) {
			const targetClass = highlightClasses[action];
			bodyEl.classList.toggle(targetClass);
			const isActive = bodyEl.classList.contains(targetClass);
			this._updateButtonActiveState(targetButton, isActive, true);
			this._logMenuChange(`${ targetButton.textContent.trim() } highlight`, isActive)
		} else if (action === 'focus-highlight') {
			this.isFocusHighlightActive = !this.isFocusHighlightActive;
			bodyEl.classList.toggle('ar-focus-highlight', this.isFocusHighlightActive);
			this._updateButtonActiveState(targetButton, this.isFocusHighlightActive);
			this._logMenuChange('Focus highlight', this.isFocusHighlightActive)
		}
	};
	AR_AccessibilityMenuProto._handleReadingAidAction = function (action, targetButton) {
		const type = action === 'toggle-reading-line' ? 'line' : 'mask';
		this._toggleReadingGuide(type, targetButton)
	};
	AR_AccessibilityMenuProto._toggleReadingGuide = function (type, buttonElement) {
		const otherGuideType = type === 'line' ? 'mask' : 'line';
		const otherButton = document.querySelector(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } [data-action="toggle-reading-${ otherGuideType }"]`);
		if (ar_activeReadingGuideType === type) {
			this._deactivateReadingGuide(type);
			if (buttonElement)
				this._updateButtonActiveState(buttonElement, false);
			ar_activeReadingGuideType = null
		} else {
			if (ar_activeReadingGuideType) {
				this._deactivateReadingGuide(ar_activeReadingGuideType);
				if (otherButton)
					this._updateButtonActiveState(otherButton, false)
			}
			this._activateReadingGuide(type);
			if (buttonElement)
				this._updateButtonActiveState(buttonElement, true);
			ar_activeReadingGuideType = type
		}
		this._logMenuChange(`Reading guide (${ type })`, ar_activeReadingGuideType === type)
	};
	AR_AccessibilityMenuProto._activateReadingGuide = function (type) {
		if (type === 'line') {
			this.readingGuideLineElement = document.createElement('div');
			this.readingGuideLineElement.id = AR_CONFIG.READING_LINE_ELEMENT_ID;
			Object.assign(this.readingGuideLineElement.style, {
				position: 'fixed',
				left: '0',
				width: '100%',
				height: '3px',
				backgroundColor: 'rgba(0, 0, 255, 0.7)',
				zIndex: '2147483647',
				pointerEvents: 'none'
			});
			document.body.appendChild(this.readingGuideLineElement);
			this._boundUpdateReadingGuide = this._updateReadingGuidePosition.bind(this);
			document.addEventListener('mousemove', this._boundUpdateReadingGuide)
		} else if (type === 'mask') {
			this.readingMaskTopElement = document.createElement('div');
			this.readingMaskBottomElement = document.createElement('div');
			[
				this.readingMaskTopElement,
				this.readingMaskBottomElement
			].forEach((el, index) => {
				el.id = `ar-reading-mask-${ index === 0 ? 'top' : 'bottom' }`;
				el.className = AR_CONFIG.READING_MASK_ELEMENT_ID;
				Object.assign(el.style, {
					position: 'fixed',
					left: '0',
					width: '100%',
					backgroundColor: 'rgba(0, 0, 0, 0.6)',
					zIndex: '2147483646',
					pointerEvents: 'none'
				})
			});
			this.readingMaskTopElement.style.top = '0';
			this.readingMaskBottomElement.style.bottom = '0';
			document.body.appendChild(this.readingMaskTopElement);
			document.body.appendChild(this.readingMaskBottomElement);
			this._boundUpdateReadingGuide = this._updateReadingGuidePosition.bind(this);
			document.addEventListener('mousemove', this._boundUpdateReadingGuide)
		}
	};
	AR_AccessibilityMenuProto._deactivateReadingGuide = function (type) {
		if (type === 'line' && this.readingGuideLineElement) {
			this.readingGuideLineElement.remove();
			this.readingGuideLineElement = null
		} else if (type === 'mask' && this.readingMaskTopElement) {
			this.readingMaskTopElement.remove();
			this.readingMaskBottomElement.remove();
			this.readingMaskTopElement = null;
			this.readingMaskBottomElement = null
		}
		if (this._boundUpdateReadingGuide) {
			document.removeEventListener('mousemove', this._boundUpdateReadingGuide);
			this._boundUpdateReadingGuide = null
		}
	};
	AR_AccessibilityMenuProto._updateReadingGuidePosition = function (event) {
		if (ar_activeReadingGuideType === 'line' && this.readingGuideLineElement) {
			this.readingGuideLineElement.style.top = `${ event.clientY - Math.round(parseFloat(window.getComputedStyle(this.readingGuideLineElement).height) / 2) }px`
		} else if (ar_activeReadingGuideType === 'mask' && this.readingMaskTopElement && this.readingMaskBottomElement) {
			const maskHeight = Math.max(30, Math.round(window.innerHeight * 0.1));
			this.readingMaskTopElement.style.height = `${ event.clientY - maskHeight / 2 }px`;
			this.readingMaskBottomElement.style.height = `${ window.innerHeight - (event.clientY + maskHeight / 2) }px`
		}
	};
	AR_AccessibilityMenuProto._handleFontStyleAction = function (action, targetButton) {
		if (action === 'toggle-dyslexia-font')
			this._toggleDyslexiaFont(targetButton)
	};
	AR_AccessibilityMenuProto._toggleDyslexiaFont = function (buttonElement) {
		const body = document.body;
		this.isDyslexiaFontActive = !this.isDyslexiaFontActive;
		if (this.isDyslexiaFontActive) {
			if (!document.getElementById('ar-dyslexia-font-stylesheet')) {
				const fontLink = document.createElement('link');
				fontLink.id = 'ar-dyslexia-font-stylesheet';
				fontLink.rel = 'stylesheet';
				fontLink.href = AR_CONFIG.DYSLEXIA_FRIENDLY_FONT_STYLESHEET_URL;
				document.head.appendChild(fontLink)
			}
			body.classList.add(AR_CONFIG.DYSLEXIA_FRIENDLY_FONT_CLASS_NAME)
		} else {
			body.classList.remove(AR_CONFIG.DYSLEXIA_FRIENDLY_FONT_CLASS_NAME)
		}
		this._updateButtonActiveState(buttonElement, this.isDyslexiaFontActive);
		this._logMenuChange('Dyslexia friendly font', this.isDyslexiaFontActive)
	};
	AR_AccessibilityMenuProto._handleAnimationAction = function (action, targetButton) {
		if (action === 'stop-animations')
			this._toggleAnimations(targetButton)
	};
	AR_AccessibilityMenuProto._toggleAnimations = function (buttonElement) {
		const body = document.body;
		const stoppedClass = AR_CONFIG.ANIMATIONS_STOPPED_CLASS_NAME;
		const currentlyStopped = body.classList.contains(stoppedClass);
		body.classList.toggle(stoppedClass, !currentlyStopped);
		this._updateButtonActiveState(buttonElement, !currentlyStopped);
		const gifs = document.querySelectorAll('img[src$=".gif"]');
		gifs.forEach(gif => {
			if (!currentlyStopped) {
				if (!gif.dataset.originalSrc && gif.src.endsWith('.gif')) {
					try {
						if (gif.complete && gif.naturalWidth > 0 && gif.naturalHeight > 0) {
							const canvas = document.createElement('canvas');
							canvas.width = gif.naturalWidth;
							canvas.height = gif.naturalHeight;
							const ctx = canvas.getContext('2d');
							if (ctx)
								ctx.drawImage(gif, 0, 0, canvas.width, canvas.height);
							gif.dataset.originalSrc = gif.src;
							gif.src = canvas.toDataURL('image/png')
						} else if (gif.width > 0 && gif.height > 0) {
							const canvas = document.createElement('canvas');
							canvas.width = gif.width;
							canvas.height = gif.height;
							const ctx = canvas.getContext('2d');
							if (ctx)
								ctx.drawImage(gif, 0, 0, canvas.width, canvas.height);
							gif.dataset.originalSrc = gif.src;
							gif.src = canvas.toDataURL('image/png')
						}
					} catch (e) {
						console.warn('Could not pause GIF:', gif.src, e)
					}
				}
			} else {
				if (gif.dataset.originalSrc) {
					gif.src = gif.dataset.originalSrc;
					delete gif.dataset.originalSrc
				}
			}
		});
		this._logMenuChange(`Animations ${ body.classList.contains(stoppedClass) ? 'stopped/paused.' : 'resumed.' }`, true)
	};
	AR_AccessibilityMenuProto._handleVirtualKeyboardAction = function (targetButton) {
		this.isVirtualKeyboardActive = !this.isVirtualKeyboardActive;
		this._updateButtonActiveState(targetButton, this.isVirtualKeyboardActive);
		if (this.isVirtualKeyboardActive) {
			this._createVirtualKeyboard()
		} else {
			this._removeVirtualKeyboard()
		}
		this._logMenuChange('Virtual keyboard', this.isVirtualKeyboardActive)
	};
	AR_AccessibilityMenuProto._createVirtualKeyboard = function () {
		if (this.virtualKeyboardElement)
			return;
		this.virtualKeyboardElement = document.createElement('div');
		this.virtualKeyboardElement.id = 'ar-virtual-keyboard';
		this.virtualKeyboardElement.setAttribute('role', 'group');
		this.virtualKeyboardElement.setAttribute('aria-label', 'Virtual Keyboard');
		const keyboardLayout = [
			[
				'1',
				'2',
				'3',
				'4',
				'5',
				'6',
				'7',
				'8',
				'9',
				'0',
				'Backspace'
			],
			[
				'q',
				'w',
				'e',
				'r',
				't',
				'y',
				'u',
				'i',
				'o',
				'p'
			],
			[
				'a',
				's',
				'd',
				'f',
				'g',
				'h',
				'j',
				'k',
				'l',
				'Enter'
			],
			[
				'Shift',
				'z',
				'x',
				'c',
				'v',
				'b',
				'n',
				'm',
				',',
				'.',
				'Caps'
			],
			['Space']
		];
		const createKey = (char, className = '') => {
			const button = document.createElement('button');
			button.textContent = char;
			button.setAttribute('aria-label', char === 'Space' ? 'Spacebar' : char === 'Backspace' ? 'Backspace' : char === 'Enter' ? 'Enter' : char === 'Shift' ? 'Shift' : char === 'Caps' ? 'Caps Lock' : char);
			if (className)
				button.classList.add(className);
			button.addEventListener('click', () => this._handleKeyPress(char, button));
			return button
		};
		keyboardLayout.forEach(row => {
			row.forEach(key => {
				let keyElement;
				if (key === 'Space') {
					keyElement = createKey(' ', 'key-space')
				} else if (key === 'Backspace') {
					keyElement = createKey('\u232B', 'key-backspace')
				} else if (key === 'Enter') {
					keyElement = createKey('\u23CE', 'key-enter')
				} else if (key === 'Shift') {
					keyElement = createKey('\u21E7', 'key-shift')
				} else if (key === 'Caps') {
					keyElement = createKey('\u21EA', 'key-caps')
				} else {
					keyElement = createKey(key)
				}
				this.virtualKeyboardElement.appendChild(keyElement)
			})
		});
		document.body.appendChild(this.virtualKeyboardElement)
	};
	AR_AccessibilityMenuProto._removeVirtualKeyboard = function () {
		if (this.virtualKeyboardElement) {
			this.virtualKeyboardElement.remove();
			this.virtualKeyboardElement = null
		}
	};
	AR_AccessibilityMenuProto._handleKeyPress = function (key, button) {
		const activeElement = document.activeElement;
		if (!activeElement || !activeElement.tagName === 'INPUT' && !activeElement.tagName === 'TEXTAREA') {
			console.warn('No active input field for virtual keyboard.');
			return
		}
		const isInput = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';
		if (!isInput)
			return;
		let currentValue = activeElement.value || '';
		let start = activeElement.selectionStart;
		let end = activeElement.selectionEnd;
		switch (key) {
		case '\u232B':
			if (start > 0) {
				currentValue = currentValue.substring(0, start - 1) + currentValue.substring(end);
				activeElement.value = currentValue;
				activeElement.setSelectionRange(start - 1, start - 1)
			}
			break;
		case '\u23CE':
			if (activeElement.tagName === 'TEXTAREA') {
				currentValue = currentValue.substring(0, start) + '\n' + currentValue.substring(end);
				activeElement.value = currentValue;
				activeElement.setSelectionRange(start + 1, start + 1)
			} else {
				const event = new Event('change', { bubbles: true });
				activeElement.dispatchEvent(event)
			}
			break;
		case '\u21E7':
			button.classList.toggle('active');
			this._toggleKeyboardCase();
			break;
		case '\u21EA':
			button.classList.toggle('active');
			this._toggleKeyboardCase(true);
			break;
		case ' ':
			currentValue = currentValue.substring(0, start) + ' ' + currentValue.substring(end);
			activeElement.value = currentValue;
			activeElement.setSelectionRange(start + 1, start + 1);
			break;
		default:
			let charToInsert = key;
			const shiftActive = this.virtualKeyboardElement.querySelector('.key-shift.active');
			const capsActive = this.virtualKeyboardElement.querySelector('.key-caps.active');
			if (shiftActive) {
				charToInsert = key.toUpperCase();
				shiftActive.classList.remove('active');
				this._toggleKeyboardCase()
			} else if (capsActive) {
				charToInsert = key.toUpperCase()
			}
			currentValue = currentValue.substring(0, start) + charToInsert + currentValue.substring(end);
			activeElement.value = currentValue;
			activeElement.setSelectionRange(start + charToInsert.length, start + charToInsert.length);
			break
		}
		const inputEvent = new Event('input', { bubbles: true });
		activeElement.dispatchEvent(inputEvent)
	};
	AR_AccessibilityMenuProto._toggleKeyboardCase = function (isCaps = false) {
		const keys = this.virtualKeyboardElement.querySelectorAll('button:not(.key-space):not(.key-backspace):not(.key-enter):not(.key-shift):not(.key-caps)');
		keys.forEach(keyButton => {
			const currentText = keyButton.textContent;
			if (isCaps || keyButton.classList.contains('active')) {
				keyButton.textContent = currentText.toUpperCase()
			} else {
				keyButton.textContent = currentText.toLowerCase()
			}
		})
	};
	AR_AccessibilityMenuProto._handleContentSimplifierAction = function (targetButton) {
		this.isContentSimplified = !this.isContentSimplified;
		this._updateButtonActiveState(targetButton, this.isContentSimplified);
		document.body.classList.toggle('ar-content-simplified', this.isContentSimplified);
		this._logMenuChange('Content simplifier', this.isContentSimplified)
	};
	AR_AccessibilityMenuProto._handleHideImagesAction = function (targetButton) {
		this.areImagesHidden = !this.areImagesHidden;
		this._updateButtonActiveState(targetButton, this.areImagesHidden);
		document.body.classList.toggle('ar-hide-images', this.areImagesHidden);
		this._logMenuChange('Hide images', this.areImagesHidden)
	};
	AR_AccessibilityMenuProto._handleTextToSpeechAction = function (targetButton) {
		this.isTextToSpeechActive = !this.isTextToSpeechActive;
		this._updateButtonActiveState(targetButton, this.isTextToSpeechActive);
		if (this.isTextToSpeechActive) {
			document.body.addEventListener('click', this._readClickedText.bind(this));
			this._logMenuChange('Read Aloud enabled. Click on text to hear it.', true)
		} else {
			document.body.removeEventListener('click', this._readClickedText.bind(this));
			this._stopReading(targetButton);
			this._logMenuChange('Read Aloud disabled.', false)
		}
	};
	AR_AccessibilityMenuProto._readClickedText = function (event) {
		if (this.isTextToSpeechActive && !event.target.closest(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID }`) && !event.target.closest(`#ar-virtual-keyboard`)) {
			const selectedText = window.getSelection().toString().trim();
			let textToSpeak = selectedText;
			if (!textToSpeak && event.target.textContent) {
				textToSpeak = event.target.textContent.trim()
			}
			if (textToSpeak) {
				this._stopReading();
				this.currentSpeechUtterance = new SpeechSynthesisUtterance(textToSpeak);
				this.currentSpeechUtterance.lang = document.documentElement.lang || 'en-US';
				let originalBackgroundColor = event.target.style.backgroundColor;
				let originalBoxShadow = event.target.style.boxShadow;
				event.target.classList.add('ar-tts-highlight');
				this.currentSpeechUtterance.onend = () => {
					event.target.classList.remove('ar-tts-highlight');
					this.currentSpeechUtterance = null
				};
				this.currentSpeechUtterance.onerror = e => {
					console.error('Speech synthesis error:', e);
					event.target.classList.remove('ar-tts-highlight');
					this.currentSpeechUtterance = null
				};
				speechSynthesis.speak(this.currentSpeechUtterance);
				this._logMenuChange(`Reading: "${ textToSpeak.substring(0, 50) }..."`, true)
			}
		}
	};
	AR_AccessibilityMenuProto._stopReading = function (targetButton = null) {
		if (speechSynthesis.speaking) {
			speechSynthesis.cancel()
		}
		if (this.currentSpeechUtterance && this.currentSpeechUtterance.onend) {
			this.currentSpeechUtterance.onend()
		}
		this.currentSpeechUtterance = null;
		if (targetButton) {
			const toggleButton = document.querySelector(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } [data-action="toggle-text-to-speech"]`);
			if (toggleButton)
				this._updateButtonActiveState(toggleButton, false);
			this._logMenuChange('Reading stopped.', false)
		}
	};
	AR_AccessibilityMenuProto._handleCustomCursorAction = function (targetButton) {
		const bodyEl = document.body;
		const cursorClasses = [
			'ar-cursor-large',
			'ar-cursor-xlarge',
			'ar-cursor-red',
			'ar-cursor-green'
		];
		if (this.activeCursorClassName !== 'default') {
			bodyEl.classList.remove(...cursorClasses);
			this.activeCursorClassName = 'default';
			this._updateButtonActiveState(targetButton, false);
			this._logMenuChange('Custom cursor reset.', false)
		} else {
			bodyEl.classList.add('ar-cursor-large');
			this.activeCursorClassName = 'ar-cursor-large';
			this._updateButtonActiveState(targetButton, true);
			this._logMenuChange('Custom cursor enabled (Large).', true)
		}
	};
	AR_AccessibilityMenuProto._handlePageZoomAction = function (action, targetButton) {
		const rootElement = document.documentElement;
		const zoomIncrement = 0.1;
		if (action === 'zoom-in') {
			this.currentZoomLevel = Math.min(2, this.currentZoomLevel + zoomIncrement)
		} else if (action === 'zoom-out') {
			this.currentZoomLevel = Math.max(0.5, this.currentZoomLevel - zoomIncrement)
		} else if (action === 'reset-zoom') {
			this.currentZoomLevel = 1
		}
		rootElement.style.transform = `scale(${ this.currentZoomLevel })`;
		rootElement.classList.toggle('ar-page-zoom-active', this.currentZoomLevel !== 1);
		const zoomInBtn = document.querySelector('[data-action="zoom-in"]');
		const zoomOutBtn = document.querySelector('[data-action="zoom-out"]');
		const resetZoomBtn = document.querySelector('[data-action="reset-zoom"]');
		this._updateButtonActiveState(zoomInBtn, this.currentZoomLevel > 1);
		this._updateButtonActiveState(zoomOutBtn, this.currentZoomLevel < 1);
		this._updateButtonActiveState(resetZoomBtn, this.currentZoomLevel === 1, true);
		this._logMenuChange(`Page zoom set to ${ Math.round(this.currentZoomLevel * 100) }%.`, true)
	};
	AR_AccessibilityMenuProto._startDragging = function (event) {
		const panel = document.getElementById(AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID);
		if (!panel)
			return;
		if (event.target.closest('button')) {
			this.isDragging = false;
			return
		}
		this.isDragging = true;
		panel.style.cursor = 'grabbing';
		panel.style.boxShadow = '0 12px 40px rgba(0,0,0,0.25)';
		const computedStyle = window.getComputedStyle(panel);
		let currentLeft = parseFloat(computedStyle.left);
		let currentBottom = parseFloat(computedStyle.bottom);
		if (isNaN(currentLeft)) {
			currentLeft = window.innerWidth - parseFloat(computedStyle.right) - panel.offsetWidth
		}
		if (isNaN(currentBottom)) {
			currentBottom = window.innerHeight - parseFloat(computedStyle.top) - panel.offsetHeight
		}
		this.offsetX = event.clientX - currentLeft;
		this.offsetY = event.clientY - (window.innerHeight - currentBottom - panel.offsetHeight);
		panel.style.top = `${ window.innerHeight - currentBottom - panel.offsetHeight }px`;
		panel.style.left = `${ currentLeft }px`;
		panel.style.right = 'auto';
		panel.style.bottom = 'auto'
	};
	AR_AccessibilityMenuProto._doDragging = function (event) {
		if (!this.isDragging)
			return;
		const panel = document.getElementById(AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID);
		if (!panel)
			return;
		let newLeft = event.clientX - this.offsetX;
		let newTop = event.clientY - this.offsetY;
		const minX = 0;
		const minY = 0;
		const maxX = window.innerWidth - panel.offsetWidth;
		const maxY = window.innerHeight - panel.offsetHeight;
		newLeft = Math.max(minX, Math.min(newLeft, maxX));
		newTop = Math.max(minY, Math.min(newTop, maxY));
		panel.style.left = `${ newLeft }px`;
		panel.style.top = `${ newTop }px`
	};
	AR_AccessibilityMenuProto._stopDragging = function () {
		if (this.isDragging) {
			this.isDragging = false;
			const panel = document.getElementById(AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID);
			if (panel) {
				panel.style.cursor = 'grab';
				panel.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)'
			}
		}
	};
	AR_AccessibilityMenuProto._resetAllMenuSettings = function () {
		this._handleFontAction('reset-font', document.querySelector(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } [data-action="reset-font"]`));
		this._handleContrastColorAction('reset-contrast', document.querySelector(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } [data-action="reset-contrast"]`));
		this._handleTextSpacingAction('text-spacing-reset', document.querySelector(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } [data-action="text-spacing-reset"]`));
		this._handleTextAlignAction('text-align-reset', document.querySelector(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } [data-action="text-align-reset"]`));
		this._handleHighlightAction('reset-highlights', document.querySelector(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } [data-action="reset-highlights"]`));
		if (ar_activeReadingGuideType) {
			const btn = document.querySelector(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } [data-action="toggle-reading-${ ar_activeReadingGuideType }"]`);
			this._toggleReadingGuide(ar_activeReadingGuideType, btn)
		}
		if (this.isDyslexiaFontActive) {
			this._toggleDyslexiaFont(document.querySelector(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } [data-action="toggle-dyslexia-font"]`))
		}
		if (document.body.classList.contains(AR_CONFIG.ANIMATIONS_STOPPED_CLASS_NAME)) {
			this._toggleAnimations(document.querySelector(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } [data-action="stop-animations"]`))
		}
		if (this.isVirtualKeyboardActive) {
			this._handleVirtualKeyboardAction(document.querySelector(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } [data-action="toggle-virtual-keyboard"]`))
		}
		if (this.isContentSimplified) {
			this._handleContentSimplifierAction(document.querySelector(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } [data-action="toggle-content-simplifier"]`))
		}
		if (this.areImagesHidden) {
			this._handleHideImagesAction(document.querySelector(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } [data-action="toggle-hide-images"]`))
		}
		if (this.isTextToSpeechActive) {
			this._handleTextToSpeechAction(document.querySelector(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } [data-action="toggle-text-to-speech"]`))
		}
		this._stopReading();
		const bodyEl = document.body;
		const cursorClasses = [
			'ar-cursor-large',
			'ar-cursor-xlarge',
			'ar-cursor-red',
			'ar-cursor-green'
		];
		bodyEl.classList.remove(...cursorClasses);
		this.activeCursorClassName = 'default';
		this._updateButtonActiveState(document.querySelector(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } [data-action="toggle-custom-cursor"]`), false);
		this._handlePageZoomAction('reset-zoom', document.querySelector(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } [data-action="reset-zoom"]`));
		Array.from(document.querySelectorAll(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } button.ar-menu-btn-active:not(.ar-menu-reset-btn)`)).forEach(btn => btn.classList.remove('ar-menu-btn-active'));
		this._logMenuChange('Reset all menu settings', true);
		const panel = document.getElementById(AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID);
		if (panel) {
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
	};
	AR_AccessibilityMenuProto._logMenuChange = function (actionDescription, isActive) {
		ar_logAccessibilityIssue('Info', `Accessibility Menu: ${ actionDescription }${ typeof isActive === 'boolean' ? isActive ? ' enabled.' : ' disabled.' : '.' }`, null, '', 'Operable', 'User Interface Customization', true, 'User')
	}
}(AR_AccessibilityMenu))
