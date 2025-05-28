var AR_AccessibilityMenu = AR_AccessibilityMenu || {};
(function (AR_AccessibilityMenuProto) {
	AR_AccessibilityMenuProto.isOpen = false;
	AR_AccessibilityMenuProto.readingGuideLineElement = null;
	AR_AccessibilityMenuProto.readingMaskTopElement = null;
	AR_AccessibilityMenuProto.readingMaskBottomElement = null;
	AR_AccessibilityMenuProto.currentFontSizeMultiplier = 1;
	AR_AccessibilityMenuProto.activeContrastModeClassName = 'default';
	AR_AccessibilityMenuProto.isDyslexiaFontActive = false;
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
            #${ AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID } {
                position: fixed; bottom: 20px; z-index: 2147483647;
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
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } {
                display: none; position: fixed; bottom: 90px;
                width: 350px; max-height: calc(100vh - 120px); overflow-y: auto;
                background-color: #fff; border: 1px solid #bdbdbd; border-radius: 12px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.15); z-index: 2147483646;
                padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 15px; color: #212121;
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID }.ar-menu-open { display: block; animation: ar-slide-up .3s ease-out; }
            @keyframes ar-slide-up { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform: translateY(0); } }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } fieldset.ar-menu-group {
                border: 1px solid #e0e0e0; padding: 12px 18px 18px; margin-bottom: 18px; border-radius: 8px;
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } legend {
                font-size: 1.15em; font-weight: 600; color: #004a99; padding: 0 8px; margin-left: 8px;
                display: flex; align-items: center; gap: 6px;
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } legend .ar-menu-icon { width: 20px; height: 20px; fill: ${ AR_CONFIG.MENU_ICON_COLOR }; }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-button-row { display: flex; flex-wrap: wrap; margin: 0 -3px; }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } button {
                display: flex; align-items: center; justify-content: center; gap: 8px;
                flex: 1 1 calc(50% - 6px); min-width: calc(50% - 6px);
                padding: 10px 8px; margin: 3px; border: 1px solid #ccc; border-radius: 6px;
                background-color: #f5f5f5; cursor: pointer; font-size: 14px;
                transition: background-color .2s, transform .1s, box-shadow .2s, color .2s, border-color .2s;
                color: ${ AR_CONFIG.MENU_ICON_COLOR }!important; line-height: 1.2; text-align: center;
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } button .ar-menu-icon {
                display: inline-block; width: 18px; height: 18px; fill: currentColor; vertical-align: middle; transition: fill .2s;
            }
             #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } button .ar-menu-text { vertical-align: middle; flex-grow:1; text-align:center; }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } button:hover, #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } button:focus-visible {
                background-color: #e0e0e0; border-color: #0056b3;
                outline: 2px solid transparent; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } button:focus-visible { outline: 2px solid #0056b3; outline-offset: 1px; }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-menu-fullwidth-btn { width: calc(100% - 6px); flex-basis: calc(100% - 6px); }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-menu-reset-btn {
                background-color: #e6ffed; border-color: #a3d4b7; font-weight: 500; color: #1e4620!important;
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-menu-reset-btn .ar-menu-icon { fill: #1e4620!important; }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-menu-reset-btn:hover, #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-menu-reset-btn:focus-visible {
                background-color: #c8f0d3; border-color: #4caf50;
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-menu-btn-active {
                background-color: #0056b3!important; color: ${ AR_CONFIG.MENU_TEXT_ACTIVE_COLOR }!important;
                border-color: #003d82!important; font-weight: bold;
            }
            #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } .ar-menu-btn-active .ar-menu-icon { fill: ${ AR_CONFIG.MENU_ICON_ACTIVE_COLOR }!important; }
            #ar-menu-close-button { background-color: #f8d7da; border-color: #f5c6cb; color: #721c24!important; margin-top:10px; }
            #ar-menu-close-button:hover, #${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } #ar-menu-close-button:focus-visible {
                background-color: #f1b0b7; border-color: #e08890;
            }
            #ar-menu-close-button .ar-menu-icon { fill: #721c24!important; }
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
		panel.innerHTML = this._getMenuPanelHTML();
		document.body.appendChild(panel)
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
			textDecrease: this._getMenuIconSVG('<path d="M14.5 16.5h-1.25l-2.6-7h1.25l1.98 5.58L15.85 9.5h1.3l-2.65 7zm5-11H4.5c-.83 0-1.5.67-1.5 1.5v9c0 .83.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5v-9c0-.83-.67-1.5-1.5-1.5zm0 10.5H4.5v-9h15v9zM10 10.5H6.25v1h3.75z"/>', 'Decrease text')
		};
		let html = `<h3 id="ar-menu-title">Accessibility Tools</h3>`;
		html += this._getMenuFieldsetHTML(ICONS.fontSize, 'Text Size', this._getMenuButtonHTML('increase-font', ICONS.textIncrease, 'Increase') + this._getMenuButtonHTML('decrease-font', ICONS.textDecrease, 'Decrease') + this._getMenuButtonHTML('reset-font', ICONS.reset, 'Reset Font', true, true));
		html += this._getMenuFieldsetHTML(ICONS.contrast, 'Contrast & Color', this._getMenuButtonHTML('contrast-high', ICONS.contrast, 'High') + this._getMenuButtonHTML('contrast-inverted', ICONS.contrast, 'Invert') + this._getMenuButtonHTML('contrast-grayscale', ICONS.contrast, 'Grayscale') + this._getMenuButtonHTML('saturation-low', ICONS.contrast, 'Low Saturation') + this._getMenuButtonHTML('reset-contrast', ICONS.reset, 'Reset Visuals', true, true));
		html += this._getMenuFieldsetHTML(ICONS.spacing, 'Text Spacing', this._getMenuButtonHTML('text-spacing-letter', ICONS.spacing, 'Letter') + this._getMenuButtonHTML('text-spacing-word', ICONS.spacing, 'Word') + this._getMenuButtonHTML('text-spacing-line', ICONS.spacing, 'Line') + this._getMenuButtonHTML('text-spacing-reset', ICONS.reset, 'Reset Spacing', true, true));
		html += this._getMenuFieldsetHTML(ICONS.alignLeft, 'Text Alignment', this._getMenuButtonHTML('text-align-left', ICONS.alignLeft, 'Align Left') + this._getMenuButtonHTML('text-align-center', ICONS.alignCenter, 'Align Center') + this._getMenuButtonHTML('text-align-reset', ICONS.reset, 'Reset Alignment', true, true));
		html += this._getMenuFieldsetHTML(ICONS.highlight, 'Highlight Content', this._getMenuButtonHTML('highlight-links', ICONS.highlight, 'Links') + this._getMenuButtonHTML('highlight-headings', ICONS.highlight, 'Headings') + this._getMenuButtonHTML('reset-highlights', ICONS.reset, 'Reset Highlights', true, true));
		html += this._getMenuFieldsetHTML(ICONS.readingAid, 'Reading Aids', this._getMenuButtonHTML('toggle-reading-line', ICONS.readingAid, 'Reading Line') + this._getMenuButtonHTML('toggle-reading-mask', ICONS.readingAid, 'Reading Mask'));
		html += this._getMenuFieldsetHTML(ICONS.fontStyle, 'Font Style', this._getMenuButtonHTML('toggle-dyslexia-font', ICONS.fontStyle, 'Dyslexia Friendly Font', true));
		html += this._getMenuFieldsetHTML(ICONS.animation, 'Animations & Motion', this._getMenuButtonHTML('stop-animations', ICONS.animation, 'Stop Animations', true));
		html += `<fieldset class="ar-menu-group">
                    <div class="ar-button-row">
                        ${ this._getMenuButtonHTML('reset-all-menu', ICONS.reset, 'Reset All Menu Settings', true, true) }
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
			})
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
		if (action.startsWith('increase-') || action.startsWith('decrease-') || action === 'reset-font') {
			this._handleFontAction(action, targetButton)
		} else if (action.startsWith('contrast-') || action.startsWith('saturation-') || action === 'reset-contrast') {
			this._handleContrastColorAction(action, targetButton)
		} else if (action.startsWith('text-spacing-')) {
			this._handleTextSpacingAction(action, targetButton)
		} else if (action.startsWith('text-align-')) {
			this._handleTextAlignAction(action, targetButton)
		} else if (action.startsWith('highlight-') || action === 'reset-highlights') {
			this._handleHighlightAction(action, targetButton)
		} else if (action.startsWith('toggle-reading-')) {
			this._handleReadingAidAction(action, targetButton)
		} else if (action === 'toggle-dyslexia-font') {
			this._handleFontStyleAction(action, targetButton)
		} else if (action === 'stop-animations') {
			this._handleAnimationAction(action, targetButton)
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
		});
		this._logMenuChange(`Font size ${ reset ? 'reset.' : `adjusted by ${ this.currentFontSizeMultiplier.toFixed(1) }x.` }`, !reset)
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
			logMsg = 'Inverted contrast';
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
			bodyEl.classList.remove(...Object.values(highlightClasses));
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
		Array.from(document.querySelectorAll(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID } button.ar-menu-btn-active:not(.ar-menu-reset-btn)`)).forEach(btn => btn.classList.remove('ar-menu-btn-active'));
		this._logMenuChange('Reset all menu settings', true)
	};
	AR_AccessibilityMenuProto._logMenuChange = function (actionDescription, isActive) {
		ar_logAccessibilityIssue('Info', `Accessibility Menu: ${ actionDescription }${ typeof isActive === 'boolean' ? isActive ? ' enabled.' : ' disabled.' : '.' }`, null, '', 'Operable', 'User Interface Customization', true, 'User')
	}
}(AR_AccessibilityMenu))
