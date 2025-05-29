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
	AR_AccessibilityMenuProto.isButtonDragging = false;
	AR_AccessibilityMenuProto.buttonOffsetX = 0;
	AR_AccessibilityMenuProto.buttonOffsetY = 0;
	AR_AccessibilityMenuProto.isDraggingOccurred = false;
	AR_AccessibilityMenuProto.isTextToSpeechActive = false;
	AR_AccessibilityMenuProto.currentSpeechUtterance = null;
	AR_AccessibilityMenuProto.currentZoomLevel = 1;
	AR_AccessibilityMenuProto.activeCursorClassName = 'default';
	AR_AccessibilityMenuProto.filterOverlayElement = null;
	AR_AccessibilityMenuProto._initialComputedFontSizes = new Map();
	AR_AccessibilityMenuProto._boundUpdateReadingGuide = null;
	AR_AccessibilityMenuProto._boundReadClickedText = null;
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
                position: fixed; bottom: 20px; z-index: 2147483647;
                background-color: #0056b3; color: ${ AR_CONFIG.MENU_ICON_ACTIVE_COLOR }!important;
                border: none; border-radius: 50%; width: 60px; height: 60px;
                font-size: 28px; cursor: grab;
                box-shadow: 0 4px 15px rgba(0,0,0,0.25);
                display: flex !important; align-items: center; justify-content: center;
                transition: background-color .3s, transform .2s, box-shadow .2s;
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID } .ar-menu-icon svg { fill: ${ AR_CONFIG.MENU_ICON_ACTIVE_COLOR }!important; display: block !important; }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID }:hover, #${ AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID }:focus-visible {
                background-color: #003d82; color: ${ AR_CONFIG.MENU_ICON_ACTIVE_COLOR }!important;
                outline: 3px solid #70a1ff; outline-offset: 2px;
                transform: scale(1.08); box-shadow: 0 6px 20px rgba(0,0,0,0.3);
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID }.dragging { cursor: grabbing; box-shadow: 0 8px 25px rgba(0,0,0,0.4); }

            /* Main Menu Panel */
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } {
                display: none; position: fixed; /* bottom/right/left set dynamically */
                width: 400px; max-height: calc(100vh - 120px); overflow-y: auto;
                background-color: #fff; border: 1px solid #bdbdbd; border-radius: 12px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.15); z-index: 2147483647;
                padding: 20px; font-family: 'Inter', sans-serif;
                font-size: 15px; color: #212121; cursor: grab;
                transition: box-shadow 0.2s ease-in-out;
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID }.ar-menu-open { display: block; animation: ar-slide-up .3s ease-out; }
            @keyframes ar-slide-up { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform: translateY(0); } }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID }.dragging { cursor: grabbing; box-shadow: 0 12px 40px rgba(0,0,0,0.25); }

            /* Fieldset Groups */
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } fieldset.ar-menu-group {
                border: 1px solid #e0e0e0; padding: 12px 18px 18px; margin-bottom: 18px; border-radius: 8px;
                background-color: #fcfcfc;
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } legend {
                font-size: 1.15em; font-weight: 600; color: #004a99; padding: 0 8px; margin-left: 8px;
                display: flex; align-items: center; gap: 6px; cursor: grab;
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-button-row { display: flex; flex-wrap: wrap; margin: 0 -3px; gap: 6px; }

            /* Menu Buttons */
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } button {
                display: flex; align-items: center; justify-content: center; gap: 8px;
                flex: 1 1 calc(50% - 6px); min-width: calc(50% - 6px);
                padding: 10px 8px; border: 1px solid #ccc; border-radius: 8px;
                background-color: #f0f0f0; cursor: pointer; 
                transition: background-color .2s, transform .1s, box-shadow .2s, color .2s, border-color .2s;
                color: #333!important; line-height: 1.2; text-align: center;
                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } button .ar-menu-icon { display: inline-block; width: 18px; height: 18px; fill: currentColor; vertical-align: middle; transition: fill .2s; }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } button .ar-menu-text { vertical-align: middle; flex-grow:1; text-align:center; font-size: 16px; line-height: 1.4; }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } button:hover { background-color: #e0e0e0; border-color: #0056b3; transform: translateY(-1px); box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } button:focus-visible { outline: 2px solid #0056b3; outline-offset: 2px; box-shadow: 0 0 0 3px rgba(0,86,179,0.3); }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-menu-fullwidth-btn { width: calc(100% - 6px); flex-basis: calc(100% - 6px); }

            /* Reset Button Specifics */
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-menu-reset-btn { background-color: #e6ffed; border-color: #a3d4b7; font-weight: 500; color: #1e4620!important; }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-menu-reset-btn .ar-menu-icon { fill: #1e4620!important; }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-menu-reset-btn:hover, #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-menu-reset-btn:focus-visible { background-color: #c8f0d3; border-color: #4caf50; }

            /* Active Button State */
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-menu-btn-active {
                background-color: #0056b3!important; color: ${ AR_CONFIG.MENU_TEXT_ACTIVE_COLOR }!important;
                border-color: #003d82!important; font-weight: bold; box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-menu-btn-active .ar-menu-icon { fill: ${ AR_CONFIG.MENU_ICON_ACTIVE_COLOR }!important; }

            /* Close Button */
            #ar-menu-close-button { background-color: #f8d7da; border-color: #f5c6cb; color: #721c24!important; margin-top:10px; }
            #ar-menu-close-button:hover, #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } #ar-menu-close-button:focus-visible { background-color: #f1b0b7; border-color: #e08890; }
            #ar-menu-close-button .ar-menu-icon { fill: #721c24!important; }

            /* Virtual Keyboard */
            #ar-virtual-keyboard {
                position: fixed; bottom: 0; left: 0; width: 100%;
                background-color: #333; padding: 10px; z-index: 2147483647;
                display: flex; flex-wrap: wrap; justify-content: center;
                box-shadow: 0 -4px 15px rgba(0,0,0,0.3);
                border-top-left-radius: 8px; border-top-right-radius: 8px;
                transition: transform 0.3s ease-out;
            }
            #ar-virtual-keyboard.hidden { transform: translateY(100%); }
            #ar-virtual-keyboard button {
                background-color: #555; color: white; border: 1px solid #666;
                border-radius: 4px; padding: 8px 12px; margin: 4px; font-size: 16px; cursor: pointer;
                transition: background-color 0.2s, transform 0.1s; min-width: 40px; text-align: center;
            }
            #ar-virtual-keyboard button:hover, #ar-virtual-keyboard button:focus-visible { background-color: #777; transform: translateY(-1px); outline: 2px solid #0056b3; outline-offset: 1px; }
            #ar-virtual-keyboard .key-space { flex-grow: 2; }
            #ar-virtual-keyboard .key-backspace, #ar-virtual-keyboard .key-enter { flex-basis: auto; min-width: 80px; }
            #ar-virtual-keyboard .key-shift, #ar-virtual-keyboard .key-caps { background-color: #0056b3; }
            #ar-virtual-keyboard .key-shift.active, #ar-virtual-keyboard .key-caps.active { background-color: #003d82; }

            /* Content Simplifier */
            .ar-content-simplified body { max-width: 800px; margin: 20px auto; padding: 0 20px; background-color: #f9f9f9; }
            .ar-content-simplified header, .ar-content-simplified footer, .ar-content-simplified nav, .ar-content-simplified aside,
            .ar-content-simplified .sidebar, .ar-content-simplified .ad, .ar-content-simplified #comments, .ar-content-simplified .related-posts,
            .ar-content-simplified [role="complementary"], .ar-content-simplified [role="navigation"],
            .ar-content-simplified [role="banner"], .ar-content-simplified [role="contentinfo"] { display: none !important; }
            .ar-content-simplified img { max-width: 100%; height: auto; display: block; margin: 15px auto; }
            .ar-content-simplified p, .ar-content-simplified li { line-height: 1.8 !important; font-size: 1.1em !important; max-width: 65ch; }

            /* Hide Images */
            .ar-hide-images img, .ar-hide-images picture, .ar-hide-images figure { display: none !important; width: 0 !important; height: 0 !important; margin: 0 !important; padding: 0 !important; line-height: 0 !important; font-size: 0 !important; }
            .ar-hide-images [style*="background-image"] { background-image: none !important; }

            /* Focus Highlight */
            .ar-focus-highlight *:focus-visible { outline: 4px solid #ffcc00 !important; outline-offset: 3px !important; box-shadow: 0 0 0 5px rgba(255, 204, 0, 0.5) !important; transition: outline-color 0.2s, box-shadow 0.2s; }

            /* Custom Cursor - Applied to HTML element for better persistence */
            html.ar-cursor-large, html.ar-cursor-large body, html.ar-cursor-large a, html.ar-cursor-large button, html.ar-cursor-large input, html.ar-cursor-large textarea, html.ar-cursor-large [role="button"], html.ar-cursor-large [role="link"], html.ar-cursor-large [tabindex]:not([tabindex="-1"]) { cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24"><path fill="black" stroke="white" stroke-width="0.75" d="M10 16.5l6-4.5-6-4.5v9z"/></svg>') 12 12, auto !important; }
            html.ar-cursor-xlarge, html.ar-cursor-xlarge body, html.ar-cursor-xlarge a, html.ar-cursor-xlarge button, html.ar-cursor-xlarge input, html.ar-cursor-xlarge textarea, html.ar-cursor-xlarge [role="button"], html.ar-cursor-xlarge [role="link"], html.ar-cursor-xlarge [tabindex]:not([tabindex="-1"]) { cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24"><path fill="black" stroke="white" stroke-width="1" d="M10 16.5l6-4.5-6-4.5v9z"/></svg>') 16 16, auto !important; }
            html.ar-cursor-red, html.ar-cursor-red body, html.ar-cursor-red a, html.ar-cursor-red button, html.ar-cursor-red input, html.ar-cursor-red textarea, html.ar-cursor-red [role="button"], html.ar-cursor-red [role="link"], html.ar-cursor-red [tabindex]:not([tabindex="-1"]) { cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24"><path fill="red" stroke="white" stroke-width="0.75" d="M10 16.5l6-4.5-6-4.5v9z"/></svg>') 12 12, auto !important; }
            html.ar-cursor-green, html.ar-cursor-green body, html.ar-cursor-green a, html.ar-cursor-green button, html.ar-cursor-green input, html.ar-cursor-green textarea, html.ar-cursor-green [role="button"], html.ar-cursor-green [role="link"], html.ar-cursor-green [tabindex]:not([tabindex="-1"]) { cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24"><path fill="green" stroke="white" stroke-width="0.75" d="M10 16.5l6-4.5-6-4.5v9z"/></svg>') 12 12, auto !important; }
            
            /* Text-to-Speech Highlight */
            .ar-tts-highlight { background-color: yellow !important; color: black !important; box-shadow: 0 0 5px yellow; transition: background-color 0.1s ease-in-out; }

            /* Page Zoom */
            html.ar-page-zoom-active { transform-origin: top left; overflow: auto; }

            /* Text Spacing */
            .${ AR_CONFIG.INCREASED_LETTER_SPACING_CLASS_NAME } p, .${ AR_CONFIG.INCREASED_LETTER_SPACING_CLASS_NAME } li, .${ AR_CONFIG.INCREASED_LETTER_SPACING_CLASS_NAME } span, .${ AR_CONFIG.INCREASED_LETTER_SPACING_CLASS_NAME } div, .${ AR_CONFIG.INCREASED_LETTER_SPACING_CLASS_NAME } a, .${ AR_CONFIG.INCREASED_LETTER_SPACING_CLASS_NAME } button, .${ AR_CONFIG.INCREASED_LETTER_SPACING_CLASS_NAME } input, .${ AR_CONFIG.INCREASED_LETTER_SPACING_CLASS_NAME } textarea, .${ AR_CONFIG.INCREASED_LETTER_SPACING_CLASS_NAME } h1, .${ AR_CONFIG.INCREASED_LETTER_SPACING_CLASS_NAME } h2, .${ AR_CONFIG.INCREASED_LETTER_SPACING_CLASS_NAME } h3, .${ AR_CONFIG.INCREASED_LETTER_SPACING_CLASS_NAME } h4, .${ AR_CONFIG.INCREASED_LETTER_SPACING_CLASS_NAME } h5, .${ AR_CONFIG.INCREASED_LETTER_SPACING_CLASS_NAME } h6 { letter-spacing: 0.12em !important; }
            .${ AR_CONFIG.INCREASED_WORD_SPACING_CLASS_NAME } p, .${ AR_CONFIG.INCREASED_WORD_SPACING_CLASS_NAME } li, .${ AR_CONFIG.INCREASED_WORD_SPACING_CLASS_NAME } span, .${ AR_CONFIG.INCREASED_WORD_SPACING_CLASS_NAME } div, .${ AR_CONFIG.INCREASED_WORD_SPACING_CLASS_NAME } a, .${ AR_CONFIG.INCREASED_WORD_SPACING_CLASS_NAME } button, .${ AR_CONFIG.INCREASED_WORD_SPACING_CLASS_NAME } input, .${ AR_CONFIG.INCREASED_WORD_SPACING_CLASS_NAME } textarea, .${ AR_CONFIG.INCREASED_WORD_SPACING_CLASS_NAME } h1, .${ AR_CONFIG.INCREASED_WORD_SPACING_CLASS_NAME } h2, .${ AR_CONFIG.INCREASED_WORD_SPACING_CLASS_NAME } h3, .${ AR_CONFIG.INCREASED_WORD_SPACING_CLASS_NAME } h4, .${ AR_CONFIG.INCREASED_WORD_SPACING_CLASS_NAME } h5, .${ AR_CONFIG.INCREASED_WORD_SPACING_CLASS_NAME } h6 { word-spacing: 0.16em !important; }
            .${ AR_CONFIG.INCREASED_LINE_HEIGHT_CLASS_NAME } p, .${ AR_CONFIG.INCREASED_LINE_HEIGHT_CLASS_NAME } li, .${ AR_CONFIG.INCREASED_LINE_HEIGHT_CLASS_NAME } span, .${ AR_CONFIG.INCREASED_LINE_HEIGHT_CLASS_NAME } div, .${ AR_CONFIG.INCREASED_LINE_HEIGHT_CLASS_NAME } a, .${ AR_CONFIG.INCREASED_LINE_HEIGHT_CLASS_NAME } button, .${ AR_CONFIG.INCREASED_LINE_HEIGHT_CLASS_NAME } input, .${ AR_CONFIG.INCREASED_LINE_HEIGHT_CLASS_NAME } textarea, .${ AR_CONFIG.INCREASED_LINE_HEIGHT_CLASS_NAME } h1, .${ AR_CONFIG.INCREASED_LINE_HEIGHT_CLASS_NAME } h2, .${ AR_CONFIG.INCREASED_LINE_HEIGHT_CLASS_NAME } h3, .${ AR_CONFIG.INCREASED_LINE_HEIGHT_CLASS_NAME } h4, .${ AR_CONFIG.INCREASED_LINE_HEIGHT_CLASS_NAME } h5, .${ AR_CONFIG.INCREASED_LINE_HEIGHT_CLASS_NAME } h6 { line-height: 1.8 !important; }

            /* Text Alignment */
            .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }left body *:not(#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } *):not(#${ AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID } *),
            .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }left p, .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }left li, .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }left span, .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }left div:not(#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID }):not(#${ AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID }), .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }left a, .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }left button, .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }left input, .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }left textarea, .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }left h1, .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }left h2, .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }left h3, .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }left h4, .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }left h5, .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }left h6 { text-align: left !important; }
            .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }center body *:not(#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } *):not(#${ AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID } *),
            .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }center p, .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }center li, .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }center span, .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }center div:not(#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID }):not(#${ AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID }), .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }center a, .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }center button, .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }center input, .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }center textarea, .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }center h1, .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }center h2, .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }center h3, .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }center h4, .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }center h5, .${ AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX }center h6 { text-align: center !important; }

            /* Dyslexia Font */
            body.${ AR_CONFIG.DYSLEXIA_FRIENDLY_FONT_CLASS_NAME } {
                font-family: 'OpenDyslexic', sans-serif !important;
            }
            body.${ AR_CONFIG.DYSLEXIA_FRIENDLY_FONT_CLASS_NAME } *:not(script):not(style):not(link) {
                font-family: inherit !important;
            }
            /* Explicitly set menu font back to its original, overriding dyslexia font */
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID }, 
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } *,
            #${ AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID },
            #${ AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID } * {
                font-family: 'Inter', sans-serif !important; /* Assuming Inter is the menu's base font */
            }

            /* Contrast & Color Filters */
            #ar-filter-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2147483645; transition: filter 0.3s ease-in-out; display: none; }
            body.${ AR_CONFIG.HIGH_CONTRAST_MODE_CLASS_NAME } #ar-filter-overlay { filter: contrast(200%) brightness(120%) !important; display: block !important; }
            body.${ AR_CONFIG.INVERTED_CONTRAST_MODE_CLASS_NAME } #ar-filter-overlay { filter: invert(100%) hue-rotate(180deg) !important; display: block !important; }
            body.${ AR_CONFIG.GRAYSCALE_CONTRAST_MODE_CLASS_NAME } #ar-filter-overlay { filter: grayscale(100%) !important; display: block !important; }
            body.${ AR_CONFIG.SATURATION_FILTER_CLASS_NAME } #ar-filter-overlay { filter: saturate(30%) !important; display: block !important; }


            /* Ensure menu UI is not affected by filters */
            #${ AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID }, #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID }, #ar-virtual-keyboard { filter: none !important; }

            /* Highlight Links & Headings */
            body.${ AR_CONFIG.HIGHLIGHTED_LINKS_CLASS_NAME } a[href] { outline: 2px solid #FFD700 !important; background-color: rgba(255, 215, 0, 0.2) !important; border-radius: 3px !important; }
            body.${ AR_CONFIG.HIGHLIGHTED_HEADINGS_CLASS_NAME } h1, body.${ AR_CONFIG.HIGHLIGHTED_HEADINGS_CLASS_NAME } h2, body.${ AR_CONFIG.HIGHLIGHTED_HEADINGS_CLASS_NAME } h3, body.${ AR_CONFIG.HIGHLIGHTED_HEADINGS_CLASS_NAME } h4, body.${ AR_CONFIG.HIGHLIGHTED_HEADINGS_CLASS_NAME } h5, body.${ AR_CONFIG.HIGHLIGHTED_HEADINGS_CLASS_NAME } h6 { outline: 2px dashed #008000 !important; background-color: rgba(0, 128, 0, 0.1) !important; border-radius: 3px !important; }

            /* Responsive adjustments */
            @media (max-width: 768px) {
                #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } { width: calc(100% - 40px); left: 20px; right: 20px; bottom: 20px; max-height: calc(100vh - 40px); padding: 15px; }
                #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-button-row button { flex: 1 1 calc(100% - 6px); min-width: calc(100% - 6px); }
            }
        `;
		const styleEl = document.createElement('style');
		styleEl.id = styleId;
		document.head.appendChild(styleEl);
		styleEl.textContent = css
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
		btn.style.top = '50%';
		btn.style.transform = 'translateY(-50%)';
		document.body.appendChild(btn);
		btn.addEventListener('mousedown', this._startButtonDragging.bind(this));
		btn.addEventListener('touchstart', this._startButtonDragging.bind(this), { passive: false })
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
		panel.addEventListener('touchstart', this._startDragging.bind(this), { passive: false });
		if (!this.filterOverlayElement) {
			this.filterOverlayElement = document.createElement('div');
			this.filterOverlayElement.id = 'ar-filter-overlay';
			document.body.appendChild(this.filterOverlayElement)
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
		html += this._getMenuFieldsetHTML(this._getMenuIconSVG('<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18V4c4.41 0 8 3.59 8 8s-3.59 8-8 8z"/>', 'Advanced Tools'), 'Advanced Tools', this._getMenuButtonHTML('toggle-virtual-keyboard', ICONS.keyboard, 'Virtual Keyboard', true) + this._getMenuButtonHTML('toggle-content-simplifier', ICONS.simplify, 'Simplify Content', true) + this._getMenuButtonHTML('toggle-text-to-speech', ICONS.readAloud, 'Read Aloud', true) + this._getMenuButtonHTML('stop-text-to-speech', ICONS.reset, 'Stop Reading', true) + this._getMenuButtonHTML('toggle-custom-cursor', ICONS.cursor, 'Custom Cursor', true) + this._getMenuButtonHTML('zoom-in', ICONS.zoom, 'Zoom In') + this._getMenuButtonHTML('zoom-out', ICONS.zoom, 'Zoom Out') + this._getMenuButtonHTML('reset-zoom', ICONS.reset, 'Reset Zoom', true) + this._getMenuButtonHTML('stop-animations', ICONS.animation, 'Stop Animations', true));
		html += `<fieldset class="ar-menu-group">
                    <div class="ar-button-row">
                        ${ this._getMenuButtonHTML('reset-all-menu', ICONS.reset, 'Reset All Settings', true, true) }
                        <button id="ar-menu-close-button" data-action="close-menu" class="ar-menu-fullwidth-btn">
                            ${ ICONS.close }<span class="ar-menu-text">Close Menu</span>
                        </button>
                    </div>
                 </fieldset>`;
		return html
	};
	AR_AccessibilityMenuProto._attachEventListeners = function () {
		const menuButton = document.getElementById(AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID);
		const menuPanel = document.getElementById(AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID);
		if (menuButton) {
			menuButton.addEventListener('click', event => {
				if (this.isDraggingOccurred) {
					this.isDraggingOccurred = false;
					return
				}
				this.toggleMenu()
			})
		}
		if (menuPanel) {
			menuPanel.addEventListener('click', event => {
				const targetButton = event.target.closest('button');
				if (targetButton && targetButton.dataset.action) {
					this.handleAction(targetButton.dataset.action, targetButton)
				}
			});
			menuPanel.addEventListener('keydown', event => {
				if (event.key === 'Escape' && this.isOpen)
					this.toggleMenu()
			});
			document.addEventListener('mousemove', this._doDragging.bind(this));
			document.addEventListener('mouseup', this._stopDragging.bind(this));
			document.addEventListener('touchmove', this._doDragging.bind(this), { passive: false });
			document.addEventListener('touchend', this._stopDragging.bind(this));
			document.addEventListener('mousemove', this._doButtonDragging.bind(this));
			document.addEventListener('mouseup', this._stopButtonDragging.bind(this));
			document.addEventListener('touchmove', this._doButtonDragging.bind(this), { passive: false });
			document.addEventListener('touchend', this._stopButtonDragging.bind(this))
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
			const panelRect = panel.getBoundingClientRect();
			const buttonRect = button.getBoundingClientRect();
			let newTop = buttonRect.top - panelRect.height - 10;
			let newLeft = buttonRect.left;
			const docDir = document.documentElement.dir || window.getComputedStyle(document.documentElement).direction;
			if (docDir === 'rtl') {
				newLeft = buttonRect.right - panelRect.width
			}
			if (newTop < 10) {
				newTop = buttonRect.bottom + 10;
				if (newTop + panelRect.height > window.innerHeight - 10) {
					newTop = Math.max(10, window.innerHeight - panelRect.height - 10)
				}
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
			if (firstFocusableButton)
				firstFocusableButton.focus()
		} else {
			button.focus();
			if (this.isVirtualKeyboardActive) {
				this._removeVirtualKeyboard();
				const vkButton = document.querySelector(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } [data-action="toggle-virtual-keyboard"]`);
				if (vkButton)
					this._updateButtonActiveState(vkButton, false);
				this.isVirtualKeyboardActive = false
			}
		}
	};
	AR_AccessibilityMenuProto.handleAction = function (action, targetButton) {
		if (action === 'close-menu') {
			this.toggleMenu();
			return
		}
		if (action.startsWith('font') || action.startsWith('text-spacing') || action.startsWith('text-align') || action === 'toggle-dyslexia-font') {
			if (action.includes('font'))
				this._handleFontAction(action, targetButton);
			else if (action.includes('spacing'))
				this._handleTextSpacingAction(action, targetButton);
			else if (action.includes('align'))
				this._handleTextAlignAction(action, targetButton);
			else if (action === 'toggle-dyslexia-font')
				this._handleFontStyleAction(action, targetButton)
		} else if (action.startsWith('contrast') || action.startsWith('saturation') || action === 'toggle-hide-images') {
			if (action.includes('contrast') || action.includes('saturation'))
				this._handleContrastColorAction(action, targetButton);
			else if (action === 'toggle-hide-images')
				this._handleHideImagesAction(targetButton)
		} else if (action.startsWith('highlight') || action.startsWith('reading') || action === 'focus-highlight') {
			if (action.includes('highlight') || action === 'focus-highlight')
				this._handleHighlightAction(action, targetButton);
			else if (action.includes('reading'))
				this._handleReadingAidAction(action, targetButton)
		} else if (action === 'stop-animations') {
			this._handleAnimationAction(action, targetButton)
		} else if (action === 'toggle-virtual-keyboard') {
			this._handleVirtualKeyboardAction(targetButton)
		} else if (action === 'toggle-content-simplifier') {
			this._handleContentSimplifierAction(targetButton)
		} else if (action === 'toggle-text-to-speech' || action === 'stop-text-to-speech') {
			if (action === 'toggle-text-to-speech')
				this._handleTextToSpeechAction(targetButton);
			else
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
						btn.classList.remove('ar-menu-btn-active')
					}
				})
			}
		}
	};
	AR_AccessibilityMenuProto._handleFontAction = function (action, targetButton) {
		let elementsForFontAdjust = [];
		if (typeof ar_getElementsForMenuTextStyleAdjustments === 'function') {
			elementsForFontAdjust = ar_getElementsForMenuTextStyleAdjustments()
		}
		if (!elementsForFontAdjust || elementsForFontAdjust.length === 0) {
			console.warn('AR_Menu: ar_getElementsForMenuTextStyleAdjustments() not found or returned empty. Using fallback selector for font adjustments.');
			elementsForFontAdjust = Array.from(document.querySelectorAll('p, li, span, div:not(#' + AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID + '):not(#' + AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID + '), h1, h2, h3, h4, h5, h6, a, label, td, th, caption'))
		}
		const increment = AR_CONFIG && AR_CONFIG.DEFAULT_FONT_SIZE_ADJUSTMENT_INCREMENT || 0.1;
		const maxMultiplier = AR_CONFIG && AR_CONFIG.MAX_FONT_SIZE_ADJUSTMENT_MULTIPLIER || 3;
		const minMultiplier = AR_CONFIG && AR_CONFIG.MIN_FONT_SIZE_ADJUSTMENT_MULTIPLIER || 0.6;
		let decreaseButton, increaseButton;
		if (targetButton && targetButton.parentElement) {
			decreaseButton = targetButton.parentElement.querySelector('[data-action="decrease-font"]');
			increaseButton = targetButton.parentElement.querySelector('[data-action="increase-font"]')
		}
		if (action === 'increase-font') {
			this.currentFontSizeMultiplier = Math.min(maxMultiplier, this.currentFontSizeMultiplier + increment);
			if (decreaseButton)
				this._updateButtonActiveState(decreaseButton, false)
		} else if (action === 'decrease-font') {
			this.currentFontSizeMultiplier = Math.max(minMultiplier, this.currentFontSizeMultiplier - increment);
			if (increaseButton)
				this._updateButtonActiveState(increaseButton, false)
		} else if (action === 'reset-font') {
			this.currentFontSizeMultiplier = 1;
			const parentFieldset = targetButton.closest('fieldset.ar-menu-group');
			if (parentFieldset) {
				parentFieldset.querySelectorAll('button[data-action="increase-font"], button[data-action="decrease-font"]').forEach(b => this._updateButtonActiveState(b, false))
			}
		}
		this._applyFontSize(elementsForFontAdjust, action === 'reset-font');
		if (action !== 'reset-font' && targetButton)
			this._updateButtonActiveState(targetButton, true);
		this._logMenuChange(`Font size adjusted to ${ this.currentFontSizeMultiplier.toFixed(1) }x.`, action !== 'reset-font')
	};
	AR_AccessibilityMenuProto._applyFontSize = function (elements, reset) {
		elements.forEach(el => {
			const styleProp = 'font-size';
			if (reset) {
				if (typeof ar_restoreOriginalInlineStyle === 'function') {
					ar_restoreOriginalInlineStyle(el, styleProp)
				} else if (this._initialComputedFontSizes.has(el)) {
					el.style.fontSize = ''
				}
				this._initialComputedFontSizes.delete(el)
			} else {
				if (!this._initialComputedFontSizes.has(el)) {
					this._initialComputedFontSizes.set(el, parseFloat(window.getComputedStyle(el).fontSize))
				}
				const baseSize = this._initialComputedFontSizes.get(el);
				if (!isNaN(baseSize) && baseSize > 0) {
					if (typeof ar_storeOriginalInlineStyle === 'function' && (!ar_originalElementStylesMap || !ar_originalElementStylesMap.has(el) || !ar_originalElementStylesMap.get(el).hasOwnProperty(styleProp))) {
						ar_storeOriginalInlineStyle(el, styleProp)
					}
					el.style.setProperty(styleProp, `${ baseSize * this.currentFontSizeMultiplier }px`, 'important')
				}
			}
		})
	};
	AR_AccessibilityMenuProto._handleTextSpacingAction = function (action, targetButton) {
		const bodyEl = document.body;
		const spacingClasses = {
			'text-spacing-letter': AR_CONFIG.INCREASED_LETTER_SPACING_CLASS_NAME,
			'text-spacing-word': AR_CONFIG.INCREASED_WORD_SPACING_CLASS_NAME,
			'text-spacing-line': AR_CONFIG.INCREASED_LINE_HEIGHT_CLASS_NAME
		};
		if (action === 'text-spacing-reset') {
			bodyEl.classList.remove(spacingClasses['text-spacing-letter'], spacingClasses['text-spacing-word'], spacingClasses['text-spacing-line']);
			const parentFieldset = targetButton.closest('fieldset.ar-menu-group');
			if (parentFieldset)
				parentFieldset.querySelectorAll('button[data-action^="text-spacing-"]:not(.ar-menu-reset-btn)').forEach(b => this._updateButtonActiveState(b, false));
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
		const alignPrefix = AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX;
		const alignClasses = {
			'text-align-left': `${ alignPrefix }left`,
			'text-align-center': `${ alignPrefix }center`
		};
		bodyEl.classList.remove(`${ alignPrefix }left`, `${ alignPrefix }center`);
		if (action === 'text-align-reset') {
			const parentFieldset = targetButton.closest('fieldset.ar-menu-group');
			if (parentFieldset)
				parentFieldset.querySelectorAll('button[data-action^="text-align-"]:not(.ar-menu-reset-btn)').forEach(b => this._updateButtonActiveState(b, false));
			this._logMenuChange('Text alignment reset', true)
		} else if (alignClasses[action]) {
			const targetClass = alignClasses[action];
			bodyEl.classList.add(targetClass);
			this._updateButtonActiveState(targetButton, true);
			this._logMenuChange(`Text align to ${ action.split('-')[2] }`, true)
		}
	};
	AR_AccessibilityMenuProto._handleFontStyleAction = function (action, targetButton) {
		if (action === 'toggle-dyslexia-font')
			this._toggleDyslexiaFont(targetButton)
	};
	AR_AccessibilityMenuProto._toggleDyslexiaFont = function (buttonElement) {
		const body = document.body;
		this.isDyslexiaFontActive = !this.isDyslexiaFontActive;
		const dyslexiaFontUrl = AR_CONFIG && AR_CONFIG.DYSLEXIA_FRIENDLY_FONT_STYLESHEET_URL || 'https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic-regular.min.css';
		if (this.isDyslexiaFontActive) {
			if (!document.getElementById('ar-dyslexia-font-stylesheet')) {
				const fontLink = document.createElement('link');
				fontLink.id = 'ar-dyslexia-font-stylesheet';
				fontLink.rel = 'stylesheet';
				fontLink.href = dyslexiaFontUrl;
				document.head.appendChild(fontLink)
			}
			body.classList.add(AR_CONFIG.DYSLEXIA_FRIENDLY_FONT_CLASS_NAME)
		} else {
			body.classList.remove(AR_CONFIG.DYSLEXIA_FRIENDLY_FONT_CLASS_NAME)
		}
		this._updateButtonActiveState(buttonElement, this.isDyslexiaFontActive);
		this._logMenuChange(`Dyslexia font ${ this.isDyslexiaFontActive ? 'enabled' : 'disabled' }.`, this.isDyslexiaFontActive)
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
			if (parentFieldset)
				parentFieldset.querySelectorAll('button:not(.ar-menu-reset-btn)').forEach(b => this._updateButtonActiveState(b, false));
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
		const isActiveNow = !bodyEl.classList.contains(targetClass);
		bodyEl.classList.remove(...contrastClasses, saturationClass);
		if (isActiveNow) {
			bodyEl.classList.add(targetClass);
			this.activeContrastModeClassName = targetClass
		} else {
			this.activeContrastModeClassName = 'default'
		}
		this._updateButtonActiveState(targetButton, isActiveNow);
		this._logMenuChange(logMsg, isActiveNow)
	};
	AR_AccessibilityMenuProto._handleHideImagesAction = function (targetButton) {
		this.areImagesHidden = !this.areImagesHidden;
		this._updateButtonActiveState(targetButton, this.areImagesHidden);
		document.body.classList.toggle('ar-hide-images', this.areImagesHidden);
		this._logMenuChange('Hide images', this.areImagesHidden)
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
			if (parentFieldset)
				parentFieldset.querySelectorAll('button[data-action^="highlight-"], button[data-action="focus-highlight"]').forEach(b => this._updateButtonActiveState(b, false));
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
		this._deactivateReadingGuide(type === 'line' ? 'mask' : 'line');
		if (type === 'line') {
			if (!this.readingGuideLineElement) {
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
				document.body.appendChild(this.readingGuideLineElement)
			}
			this._boundUpdateReadingGuide = this._updateReadingGuidePosition.bind(this);
			document.addEventListener('mousemove', this._boundUpdateReadingGuide)
		} else if (type === 'mask') {
			if (!this.readingMaskTopElement) {
				this.readingMaskTopElement = document.createElement('div');
				this.readingMaskBottomElement = document.createElement('div');
				[
					this.readingMaskTopElement,
					this.readingMaskBottomElement
				].forEach((el, index) => {
					el.id = `ar-reading-mask-${ index === 0 ? 'top' : 'bottom' }`;
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
				document.body.appendChild(this.readingMaskBottomElement)
			}
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
			this.readingMaskTopElement = null;
			this.readingMaskBottomElement.remove();
			this.readingMaskBottomElement = null
		}
		if (this._boundUpdateReadingGuide) {
			document.removeEventListener('mousemove', this._boundUpdateReadingGuide);
			this._boundUpdateReadingGuide = null
		}
	};
	AR_AccessibilityMenuProto._updateReadingGuidePosition = function (event) {
		if (ar_activeReadingGuideType === 'line' && this.readingGuideLineElement) {
			const lineHeight = parseFloat(window.getComputedStyle(this.readingGuideLineElement).height) || 3;
			this.readingGuideLineElement.style.top = `${ event.clientY - Math.round(lineHeight / 2) }px`
		} else if (ar_activeReadingGuideType === 'mask' && this.readingMaskTopElement && this.readingMaskBottomElement) {
			const maskHeight = Math.max(30, Math.round(window.innerHeight * 0.1));
			this.readingMaskTopElement.style.height = `${ Math.max(0, event.clientY - maskHeight / 2) }px`;
			this.readingMaskBottomElement.style.height = `${ Math.max(0, window.innerHeight - (event.clientY + maskHeight / 2)) }px`
		}
	};
	AR_AccessibilityMenuProto._handleAnimationAction = function (action, targetButton) {
		if (action === 'stop-animations')
			this._toggleAnimations(targetButton)
	};
	AR_AccessibilityMenuProto._toggleAnimations = function (buttonElement) {
		const body = document.body;
		const stoppedClass = AR_CONFIG.ANIMATIONS_STOPPED_CLASS_NAME;
		const isCurrentlyStoppedGeneral = body.classList.contains(stoppedClass);
		const areGifsFrozen = document.querySelector('img[data-ar-gif-frozen="true"], canvas[data-ar-frozen-gif-canvas="true"]');
		const nowStopping = !(isCurrentlyStoppedGeneral && areGifsFrozen);
		body.classList.toggle(stoppedClass, nowStopping);
		this._updateButtonActiveState(buttonElement, nowStopping);
		if (nowStopping) {
			const gifsToFreeze = Array.from(document.querySelectorAll('img[src*=".gif"]:not([data-ar-gif-frozen="true"])')).filter(img => {
				try {
					return new URL(img.src, window.location.href).pathname.toLowerCase().endsWith('.gif')
				} catch (e) {
					return (img.src || '').toLowerCase().includes('.gif')
				}
			});
			gifsToFreeze.forEach(img => {
				if (typeof ar_isVisuallyHidden === 'function' && ar_isVisuallyHidden(img))
					return;
				img.dataset.arOriginalSrc = img.src;
				img.dataset.arOriginalAlt = img.alt || '';
				img.dataset.arOriginalDisplay = img.style.display || '';
				const tempImage = new Image();
				tempImage.crossOrigin = 'Anonymous';
				tempImage.onload = () => {
					const canvas = document.createElement('canvas');
					canvas.width = tempImage.naturalWidth || img.width || 50;
					canvas.height = tempImage.naturalHeight || img.height || 50;
					canvas.className = img.className;
					canvas.style.cssText = img.style.cssText;
					canvas.style.width = `${ canvas.width }px`;
					canvas.style.height = `${ canvas.height }px`;
					canvas.setAttribute('role', 'img');
					canvas.setAttribute('aria-label', img.dataset.arOriginalAlt || `Frozen animation: ${ img.src.split('/').pop() }`);
					canvas.dataset.arFrozenGifCanvas = 'true';
					if (!img.id)
						img.id = typeof ar_generateUniqueElementId === 'function' ? ar_generateUniqueElementId('ar-original-gif-') : `ar-gif-${ Date.now() }-${ Math.random() }`;
					canvas.dataset.arOriginalImgId = img.id;
					const ctx = canvas.getContext('2d');
					try {
						ctx.drawImage(tempImage, 0, 0, canvas.width, canvas.height);
						img.style.display = 'none';
						img.dataset.arGifFrozen = 'true';
						if (img.parentNode)
							img.parentNode.insertBefore(canvas, img.nextSibling)
					} catch (e) {
						console.error('AR: Canvas drawImage error for GIF:', img.src, e);
						img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
						img.style.display = img.dataset.arOriginalDisplay || '';
						img.dataset.arGifFrozen = 'true';
						img.dataset.arGifFrozenFallback = 'true'
					}
				};
				tempImage.onerror = () => {
					console.warn('AR: Could not load GIF to freeze:', img.src);
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
							'arGifFrozenFallback'
						].forEach(attr => delete originalImg.dataset[attr])
					}
				}
				if (canvas.parentNode)
					canvas.parentNode.removeChild(canvas)
			});
			document.querySelectorAll('img[data-ar-gif-frozen-fallback="true"]').forEach(img => {
				if (img.dataset.arOriginalSrc)
					img.src = img.dataset.arOriginalSrc;
				[
					'arGifFrozen',
					'arGifFrozenFallback',
					'arOriginalSrc',
					'arOriginalAlt',
					'arOriginalDisplay'
				].forEach(attr => delete img.dataset[attr])
			})
		}
		this._logMenuChange(`Animations ${ nowStopping ? 'stopped/paused.' : 'resumed.' }`, true)
	};
	AR_AccessibilityMenuProto._handleVirtualKeyboardAction = function (targetButton) {
		this.isVirtualKeyboardActive = !this.isVirtualKeyboardActive;
		this._updateButtonActiveState(targetButton, this.isVirtualKeyboardActive);
		if (this.isVirtualKeyboardActive)
			this._createVirtualKeyboard();
		else
			this._removeVirtualKeyboard();
		this._logMenuChange('Virtual keyboard', this.isVirtualKeyboardActive)
	};
	AR_AccessibilityMenuProto._createVirtualKeyboard = function () {
		if (this.virtualKeyboardElement)
			return;
		this.virtualKeyboardElement = document.createElement('div');
		this.virtualKeyboardElement.id = 'ar-virtual-keyboard';
		this.virtualKeyboardElement.setAttribute('role', 'group');
		this.virtualKeyboardElement.setAttribute('aria-label', 'Virtual Keyboard');
		const layout = [
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
				'-',
				'=',
				'\u232B'
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
				'p',
				'[',
				']',
				'\\'
			],
			[
				'\u21EA',
				'a',
				's',
				'd',
				'f',
				'g',
				'h',
				'j',
				'k',
				'l',
				';',
				"'",
				'\u23CE'
			],
			[
				'\u21E7',
				'z',
				'x',
				'c',
				'v',
				'b',
				'n',
				'm',
				',',
				'.',
				'/',
				'\u21E7'
			],
			['Space']
		];
		const createVkKey = keySymbol => {
			const button = document.createElement('button');
			button.dataset.keySymbol = keySymbol;
			button.className = 'ar-vk-key';
			let displayChar = keySymbol;
			let ariaLabel = keySymbol;
			switch (keySymbol) {
			case '\u232B':
				displayChar = 'Backspace';
				ariaLabel = 'Backspace';
				button.classList.add('key-backspace');
				break;
			case '\u23CE':
				displayChar = 'Enter';
				ariaLabel = 'Enter';
				button.classList.add('key-enter');
				break;
			case '\u21E7':
				displayChar = 'Shift';
				ariaLabel = 'Shift';
				button.classList.add('key-shift');
				break;
			case '\u21EA':
				displayChar = 'Caps Lock';
				ariaLabel = 'Caps Lock';
				button.classList.add('key-caps');
				break;
			case 'Space':
				displayChar = 'Space';
				ariaLabel = 'Spacebar';
				button.classList.add('key-space');
				break;
			default:
				button.dataset.originalChar = keySymbol.toLowerCase();
				break
			}
			button.textContent = displayChar;
			button.setAttribute('aria-label', ariaLabel);
			button.addEventListener('click', () => this._handleKeyPress(keySymbol, button));
			return button
		};
		layout.forEach(row => row.forEach(key => this.virtualKeyboardElement.appendChild(createVkKey(key))));
		document.body.appendChild(this.virtualKeyboardElement);
		this.virtualKeyboardElement.classList.remove('hidden');
		this._toggleKeyboardCase(false)
	};
	AR_AccessibilityMenuProto._removeVirtualKeyboard = function () {
		if (this.virtualKeyboardElement) {
			this.virtualKeyboardElement.classList.add('hidden');
			this.virtualKeyboardElement.addEventListener('transitionend', () => {
				if (this.virtualKeyboardElement && this.virtualKeyboardElement.classList.contains('hidden')) {
					this.virtualKeyboardElement.remove();
					this.virtualKeyboardElement = null
				}
			}, { once: true })
		}
	};
	AR_AccessibilityMenuProto._handleKeyPress = function (keySymbol, buttonElement) {
		const activeElement = document.activeElement;
		if (!activeElement || activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA' && !activeElement.isContentEditable)
			return;
		let currentValue = activeElement.value !== undefined ? activeElement.value : activeElement.isContentEditable ? activeElement.textContent : '';
		let start = activeElement.selectionStart !== undefined ? activeElement.selectionStart : activeElement.isContentEditable && window.getSelection().rangeCount > 0 ? window.getSelection().getRangeAt(0).startOffset : currentValue.length;
		let end = activeElement.selectionEnd !== undefined ? activeElement.selectionEnd : activeElement.isContentEditable && window.getSelection().rangeCount > 0 ? window.getSelection().getRangeAt(0).endOffset : currentValue.length;
		const shiftButton = this.virtualKeyboardElement && this.virtualKeyboardElement.querySelector('.key-shift');
		const capsButton = this.virtualKeyboardElement && this.virtualKeyboardElement.querySelector('.key-caps');
		const isShiftActive = shiftButton && shiftButton.classList.contains('active');
		const isCapsActive = capsButton && capsButton.classList.contains('active');
		let charToInsert = '';
		switch (keySymbol) {
		case '\u232B':
			if (start > 0) {
				currentValue = currentValue.substring(0, start - 1) + currentValue.substring(end);
				start--;
				end = start
			}
			break;
		case '\u23CE':
			if (activeElement.tagName === 'TEXTAREA')
				charToInsert = '\n';
			else if (activeElement.isContentEditable) {
				document.execCommand('insertLineBreak');
				return
			} else {
				if (activeElement.form)
					activeElement.form.dispatchEvent(new Event('submit', {
						bubbles: true,
						cancelable: true
					}));
				activeElement.dispatchEvent(new Event('change', { bubbles: true }));
				return
			}
			break;
		case '\u21E7':
			if (shiftButton)
				shiftButton.classList.toggle('active');
			this._toggleKeyboardCase(isCapsActive);
			return;
		case '\u21EA':
			if (capsButton)
				capsButton.classList.toggle('active');
			this._toggleKeyboardCase(capsButton.classList.contains('active'));
			return;
		case 'Space':
			charToInsert = ' ';
			break;
		default:
			charToInsert = buttonElement.textContent;
			if (isShiftActive && !isCapsActive && shiftButton && charToInsert.length === 1) {
				shiftButton.classList.remove('active');
				this._toggleKeyboardCase(isCapsActive)
			}
			break
		}
		if (charToInsert) {
			currentValue = currentValue.substring(0, start) + charToInsert + currentValue.substring(end);
			start += charToInsert.length;
			end = start
		}
		if (activeElement.value !== undefined)
			activeElement.value = currentValue;
		else if (activeElement.isContentEditable)
			activeElement.textContent = currentValue;
		if (activeElement.isContentEditable && window.getSelection && document.createRange) {
			const range = document.createRange();
			const sel = window.getSelection();
			let textNode, offset = start;
			function findTextNodeAndOffsetRecursive(parentNode, targetGlobalOffset) {
				let currentGlobalOffset = 0;
				for (let i = 0; i < parentNode.childNodes.length; i++) {
					const node = parentNode.childNodes[i];
					if (node.nodeType === Node.TEXT_NODE) {
						const nodeLength = node.length;
						if (currentGlobalOffset + nodeLength >= targetGlobalOffset) {
							return {
								node: node,
								offset: targetGlobalOffset - currentGlobalOffset
							}
						}
						currentGlobalOffset += nodeLength
					} else if (node.nodeType === Node.ELEMENT_NODE) {
						const result = findTextNodeAndOffsetRecursive(node, targetGlobalOffset - currentGlobalOffset);
						if (result)
							return result;
						currentGlobalOffset += (node.textContent || '').length
					}
				}
				return null
			}
			const targetPosition = findTextNodeAndOffsetRecursive(activeElement, start);
			if (targetPosition && targetPosition.node) {
				range.setStart(targetPosition.node, Math.min(targetPosition.offset, targetPosition.node.length))
			} else {
				let lastChild = activeElement.lastChild;
				while (lastChild && lastChild.nodeType === Node.ELEMENT_NODE && lastChild.lastChild) {
					lastChild = lastChild.lastChild
				}
				if (lastChild && lastChild.nodeType === Node.TEXT_NODE) {
					range.setStart(lastChild, lastChild.length)
				} else {
					range.selectNodeContents(activeElement);
					range.collapse(false)
				}
			}
			range.collapse(true);
			if (sel) {
				sel.removeAllRanges();
				sel.addRange(range)
			}
		} else if (activeElement.setSelectionRange) {
			activeElement.setSelectionRange(start, end)
		}
		activeElement.dispatchEvent(new Event('input', { bubbles: true }))
	};
	AR_AccessibilityMenuProto._toggleKeyboardCase = function (isCapsActiveExplicit) {
		if (!this.virtualKeyboardElement)
			return;
		const keys = this.virtualKeyboardElement.querySelectorAll('.ar-vk-key');
		const isShiftActive = this.virtualKeyboardElement.querySelector('.key-shift.active');
		const currentCapsState = typeof isCapsActiveExplicit === 'boolean' ? isCapsActiveExplicit : this.virtualKeyboardElement.querySelector('.key-caps') && this.virtualKeyboardElement.querySelector('.key-caps').classList.contains('active');
		keys.forEach(keyButton => {
			const originalChar = keyButton.dataset.originalChar;
			if (originalChar && originalChar.length === 1) {
				let charToShow = originalChar;
				if (currentCapsState) {
					charToShow = isShiftActive ? originalChar.toLowerCase() : originalChar.toUpperCase()
				} else {
					charToShow = isShiftActive ? originalChar.toUpperCase() : originalChar.toLowerCase()
				}
				keyButton.textContent = charToShow
			} else if (keyButton.dataset.keySymbol === '\u21EA') {
				keyButton.textContent = currentCapsState ? 'CAPS' : 'Caps Lock'
			} else if (keyButton.dataset.keySymbol === '\u21E7') {
				keyButton.textContent = isShiftActive ? 'SHIFT' : 'Shift'
			}
		})
	};
	AR_AccessibilityMenuProto._handleContentSimplifierAction = function (targetButton) {
		this.isContentSimplified = !this.isContentSimplified;
		this._updateButtonActiveState(targetButton, this.isContentSimplified);
		document.body.classList.toggle('ar-content-simplified', this.isContentSimplified);
		this._logMenuChange('Content simplifier', this.isContentSimplified)
	};
	AR_AccessibilityMenuProto._handleTextToSpeechAction = function (targetButton) {
		this.isTextToSpeechActive = !this.isTextToSpeechActive;
		this._updateButtonActiveState(targetButton, this.isTextToSpeechActive);
		if (this.isTextToSpeechActive) {
			this._boundReadClickedText = this._readClickedText.bind(this);
			document.body.addEventListener('click', this._boundReadClickedText);
			this._logMenuChange('Read Aloud enabled. Click on text to hear it.', true)
		} else {
			if (this._boundReadClickedText)
				document.body.removeEventListener('click', this._boundReadClickedText);
			this._stopReading();
			this._logMenuChange('Read Aloud disabled.', false)
		}
	};
	AR_AccessibilityMenuProto._readClickedText = function (event) {
		if (!this.isTextToSpeechActive || event.target.closest(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID }, #ar-virtual-keyboard`))
			return;
		let textToSpeak = window.getSelection().toString().trim();
		let targetElementForHighlight = event.target;
		if (!textToSpeak && event.target.textContent)
			textToSpeak = event.target.textContent.trim();
		else if (textToSpeak) {
			const selection = window.getSelection();
			if (selection.rangeCount > 0) {
				const range = selection.getRangeAt(0);
				targetElementForHighlight = range.commonAncestorContainer;
				if (targetElementForHighlight.nodeType === Node.TEXT_NODE)
					targetElementForHighlight = targetElementForHighlight.parentElement
			}
		}
		if (!textToSpeak || textToSpeak.length < 3)
			return;
		this._stopReading();
		this.currentSpeechUtterance = new SpeechSynthesisUtterance(textToSpeak);
		this.currentSpeechUtterance.lang = document.documentElement.lang || 'en-US';
		const oldHighlight = document.querySelector('.ar-tts-highlight');
		if (oldHighlight)
			oldHighlight.classList.remove('ar-tts-highlight');
		if (targetElementForHighlight && targetElementForHighlight.classList && typeof targetElementForHighlight.classList.add === 'function') {
			targetElementForHighlight.classList.add('ar-tts-highlight');
			this.currentSpeechUtterance.onend = () => {
				targetElementForHighlight.classList.remove('ar-tts-highlight');
				this.currentSpeechUtterance = null
			};
			this.currentSpeechUtterance.onerror = e => {
				console.error('AR: TTS error:', e);
				targetElementForHighlight.classList.remove('ar-tts-highlight');
				this.currentSpeechUtterance = null
			}
		} else {
			this.currentSpeechUtterance.onend = () => {
				this.currentSpeechUtterance = null
			};
			this.currentSpeechUtterance.onerror = e => {
				console.error('AR: TTS error:', e);
				this.currentSpeechUtterance = null
			}
		}
		speechSynthesis.speak(this.currentSpeechUtterance);
		this._logMenuChange(`Reading: "${ textToSpeak.substring(0, 50) }..."`, true)
	};
	AR_AccessibilityMenuProto._stopReading = function (targetButton = null) {
		if (speechSynthesis.speaking)
			speechSynthesis.cancel();
		const oldHighlight = document.querySelector('.ar-tts-highlight');
		if (oldHighlight)
			oldHighlight.classList.remove('ar-tts-highlight');
		this.currentSpeechUtterance = null;
		if (targetButton) {
			const toggleButton = document.querySelector(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } [data-action="toggle-text-to-speech"]`);
			if (toggleButton)
				this._updateButtonActiveState(toggleButton, false);
			this.isTextToSpeechActive = false;
			if (this._boundReadClickedText)
				document.body.removeEventListener('click', this._boundReadClickedText);
			this._logMenuChange('Reading stopped.', false)
		}
	};
	AR_AccessibilityMenuProto._handleCustomCursorAction = function (targetButton) {
		const htmlEl = document.documentElement;
		const cursorClasses = [
			'ar-cursor-large',
			'ar-cursor-xlarge',
			'ar-cursor-red',
			'ar-cursor-green'
		];
		let currentCursorIndex = cursorClasses.findIndex(cls => htmlEl.classList.contains(cls));
		htmlEl.classList.remove(...cursorClasses);
		const nextCursorIndex = (currentCursorIndex + 1) % (cursorClasses.length + 1);
		if (nextCursorIndex < cursorClasses.length) {
			this.activeCursorClassName = cursorClasses[nextCursorIndex];
			htmlEl.classList.add(this.activeCursorClassName);
			this._updateButtonActiveState(targetButton, true);
			this._logMenuChange(`Custom cursor: ${ this.activeCursorClassName.replace('ar-cursor-', '') }.`, true)
		} else {
			this.activeCursorClassName = 'default';
			this._updateButtonActiveState(targetButton, false);
			this._logMenuChange('Custom cursor reset.', false)
		}
	};
	AR_AccessibilityMenuProto._handlePageZoomAction = function (action, targetButton) {
		const rootElement = document.documentElement;
		const zoomIncrement = 0.1;
		if (action === 'zoom-in')
			this.currentZoomLevel = Math.min(2, this.currentZoomLevel + zoomIncrement);
		else if (action === 'zoom-out')
			this.currentZoomLevel = Math.max(0.5, this.currentZoomLevel - zoomIncrement);
		else if (action === 'reset-zoom')
			this.currentZoomLevel = 1;
		this.currentZoomLevel = parseFloat(this.currentZoomLevel.toFixed(2));
		rootElement.style.transform = `scale(${ this.currentZoomLevel })`;
		rootElement.classList.toggle('ar-page-zoom-active', this.currentZoomLevel !== 1);
		this._logMenuChange(`Page zoom: ${ Math.round(this.currentZoomLevel * 100) }%.`, this.currentZoomLevel !== 1)
	};
	AR_AccessibilityMenuProto._startDragging = function (event) {
		const panel = document.getElementById(AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID);
		if (!panel)
			return;
		const target = event.target;
		const isButton = target.closest('button');
		const isLegend = target.closest('legend');
		const isPanelDirectClick = target === panel;
		if (isButton) {
			this.isDragging = false;
			return
		}
		if (!isPanelDirectClick && !isLegend) {
			this.isDragging = false;
			return
		}
		this.isDragging = true;
		panel.classList.add('dragging');
		panel.style.cursor = 'grabbing';
		panel.style.position = 'fixed';
		const coords = getClientCoords(event);
		const panelRect = panel.getBoundingClientRect();
		panel.style.left = `${ panelRect.left }px`;
		panel.style.top = `${ panelRect.top }px`;
		panel.style.right = 'auto';
		panel.style.bottom = 'auto';
		this.offsetX = coords.clientX - panelRect.left;
		this.offsetY = coords.clientY - panelRect.top;
		if (event.type === 'touchstart')
			event.preventDefault()
	};
	AR_AccessibilityMenuProto._doDragging = function (event) {
		if (!this.isDragging)
			return;
		const panel = document.getElementById(AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID);
		if (!panel)
			return;
		const coords = getClientCoords(event);
		let newLeft = coords.clientX - this.offsetX;
		let newTop = coords.clientY - this.offsetY;
		const maxX = window.innerWidth - panel.offsetWidth;
		const maxY = window.innerHeight - panel.offsetHeight;
		newLeft = Math.max(0, Math.min(newLeft, maxX));
		newTop = Math.max(0, Math.min(newTop, maxY));
		panel.style.left = `${ newLeft }px`;
		panel.style.top = `${ newTop }px`;
		if (event.type === 'touchmove')
			event.preventDefault()
	};
	AR_AccessibilityMenuProto._stopDragging = function () {
		if (this.isDragging) {
			this.isDragging = false;
			const panel = document.getElementById(AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID);
			if (panel) {
				panel.classList.remove('dragging');
				panel.style.cursor = 'grab'
			}
		}
	};
	AR_AccessibilityMenuProto._startButtonDragging = function (event) {
		const button = document.getElementById(AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID);
		if (!button)
			return;
		this.isButtonDragging = true;
		button.classList.add('dragging');
		button.style.cursor = 'grabbing';
		this.isDraggingOccurred = false;
		const coords = getClientCoords(event);
		const buttonRect = button.getBoundingClientRect();
		button.style.position = 'fixed';
		button.style.left = `${ buttonRect.left }px`;
		button.style.top = `${ buttonRect.top }px`;
		button.style.right = 'auto';
		button.style.bottom = 'auto';
		button.style.transform = 'none';
		this.buttonOffsetX = coords.clientX - buttonRect.left;
		this.buttonOffsetY = coords.clientY - buttonRect.top;
		if (event.type === 'touchstart')
			event.preventDefault()
	};
	AR_AccessibilityMenuProto._doButtonDragging = function (event) {
		if (!this.isButtonDragging)
			return;
		const button = document.getElementById(AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID);
		if (!button)
			return;
		const coords = getClientCoords(event);
		const currentRect = button.getBoundingClientRect();
		if (Math.abs(coords.clientX - (currentRect.left + this.buttonOffsetX)) > 3 || Math.abs(coords.clientY - (currentRect.top + this.buttonOffsetY)) > 3) {
			this.isDraggingOccurred = true
		}
		let newLeft = coords.clientX - this.buttonOffsetX;
		let newTop = coords.clientY - this.buttonOffsetY;
		const maxX = window.innerWidth - button.offsetWidth;
		const maxY = window.innerHeight - button.offsetHeight;
		newLeft = Math.max(0, Math.min(newLeft, maxX));
		newTop = Math.max(0, Math.min(newTop, maxY));
		button.style.left = `${ newLeft }px`;
		button.style.top = `${ newTop }px`;
		if (event.type === 'touchmove')
			event.preventDefault()
	};
	AR_AccessibilityMenuProto._stopButtonDragging = function () {
		if (this.isButtonDragging) {
			this.isButtonDragging = false;
			const button = document.getElementById(AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID);
			if (button) {
				button.classList.remove('dragging');
				button.style.cursor = 'grab'
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
			this._toggleReadingGuide(ar_activeReadingGuideType, document.querySelector(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } [data-action="toggle-reading-${ ar_activeReadingGuideType }"]`))
		}
		if (this.isDyslexiaFontActive) {
			this._toggleDyslexiaFont(document.querySelector(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } [data-action="toggle-dyslexia-font"]`))
		}
		if (document.body.classList.contains(AR_CONFIG.ANIMATIONS_STOPPED_CLASS_NAME) || document.querySelector('img[data-ar-gif-frozen="true"], canvas[data-ar-frozen-gif-canvas="true"]')) {
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
		this._stopReading();
		if (this.isTextToSpeechActive) {
			this._handleTextToSpeechAction(document.querySelector(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } [data-action="toggle-text-to-speech"]`))
		}
		const htmlEl = document.documentElement;
		htmlEl.classList.remove(...[
			'ar-cursor-large',
			'ar-cursor-xlarge',
			'ar-cursor-red',
			'ar-cursor-green',
			'ar-cursor-active-highlight'
		]);
		this.activeCursorClassName = 'default';
		this._updateButtonActiveState(document.querySelector(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } [data-action="toggle-custom-cursor"]`), false);
		this._handlePageZoomAction('reset-zoom', document.querySelector(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } [data-action="reset-zoom"]`));
		Array.from(document.querySelectorAll(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } button.ar-menu-btn-active:not(.ar-menu-reset-btn)`)).forEach(btn => btn.classList.remove('ar-menu-btn-active'));
		this._logMenuChange('Reset all menu settings', true);
		const panel = document.getElementById(AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID);
		const menuButton = document.getElementById(AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID);
		const docDir = document.documentElement.dir || window.getComputedStyle(document.documentElement).direction;
		if (panel) {
			panel.style.top = 'auto';
			panel.style.left = 'auto';
			if (docDir === 'rtl') {
				panel.style.left = '20px';
				panel.style.right = 'auto'
			} else {
				panel.style.right = '20px';
				panel.style.left = 'auto'
			}
			panel.style.bottom = '90px'
		}
		if (menuButton) {
			menuButton.style.top = '50%';
			menuButton.style.transform = 'translateY(-50%)';
			menuButton.style.left = 'auto';
			menuButton.style.bottom = 'auto';
			if (docDir === 'rtl') {
				menuButton.style.left = '20px';
				menuButton.style.right = 'auto'
			} else {
				menuButton.style.right = '20px';
				menuButton.style.left = 'auto'
			}
		}
	};
	AR_AccessibilityMenuProto._logMenuChange = function (actionDescription, isActive) {
		if (typeof ar_logAccessibilityIssue === 'function') {
			ar_logAccessibilityIssue('Info', `Accessibility Menu: ${ actionDescription }${ typeof isActive === 'boolean' ? isActive ? ' enabled.' : ' disabled.' : '.' }`, null, '', 'Operable', 'User Interface Customization', true, 'User')
		} else {
			console.log(`AR_Menu: ${ actionDescription } - ${ isActive === undefined ? '' : isActive }`)
		}
	}
}(AR_AccessibilityMenu))
