// File 5: ar_menu_actions.js

// Part of AR_AccessibilityMenu: Event handling and action methods
(function(AR_AccessibilityMenuProto) {

	AR_AccessibilityMenuProto._attachEventListeners = function () {
		const menuButton = document.getElementById(AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID);
		const menuPanel = document.getElementById(AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID);
		if (menuButton) {
			menuButton.addEventListener('click', this.toggleMenu.bind(this));
		}
		if (menuPanel) {
			menuPanel.addEventListener('click', (event) => {
				const targetButton = event.target.closest('button');
				if (targetButton && targetButton.dataset.action) {
					this.handleAction(targetButton.dataset.action, targetButton);
				}
			});
			menuPanel.addEventListener('keydown', (event) => {
				if (event.key === 'Escape' && this.isOpen) {
					this.toggleMenu();
				}
			});
		}
	};

	AR_AccessibilityMenuProto.toggleMenu = function () {
		const panel = document.getElementById(AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID);
		const button = document.getElementById(AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID);
		if (!panel || !button) return;
		this.isOpen = !this.isOpen;
		panel.style.display = this.isOpen ? 'block' : 'none';
		panel.classList.toggle('ar-menu-open', this.isOpen);
		panel.setAttribute('aria-hidden', String(!this.isOpen));
		button.setAttribute('aria-expanded', String(this.isOpen));
		if (this.isOpen) {
			const firstFocusableButton = panel.querySelector('button:not([disabled])');
			if (firstFocusableButton) firstFocusableButton.focus();
		} else {
			button.focus();
		}
	};

	AR_AccessibilityMenuProto.handleAction = function (action, targetButton) {
		if (action === 'close-menu') {
			this.toggleMenu();
			return;
		}
		if (action.startsWith('increase-') || action.startsWith('decrease-') || action === 'reset-font') {
			this._handleFontAction(action, targetButton);
		} else if (action.startsWith('contrast-') || action.startsWith('saturation-') || action === 'reset-contrast') {
			this._handleContrastColorAction(action, targetButton);
		} else if (action.startsWith('text-spacing-')) {
			this._handleTextSpacingAction(action, targetButton);
		} else if (action.startsWith('text-align-')) {
			this._handleTextAlignAction(action, targetButton);
		} else if (action.startsWith('highlight-') || action === 'reset-highlights') {
			this._handleHighlightAction(action, targetButton);
		} else if (action.startsWith('toggle-reading-')) {
			this._handleReadingAidAction(action, targetButton);
		} else if (action === 'toggle-dyslexia-font') {
			this._handleFontStyleAction(action, targetButton);
		} else if (action === 'stop-animations') {
			this._handleAnimationAction(action, targetButton);
		} else if (action === 'reset-all-menu') {
			this._resetAllMenuSettings();
		}
	};

    AR_AccessibilityMenuProto._updateButtonActiveState = function(buttonElement, isActive, isToggleableGroup = false) {
        if (!buttonElement) return;
        buttonElement.classList.toggle('ar-menu-btn-active', isActive);
        if (isActive && !isToggleableGroup) {
            const parentFieldset = buttonElement.closest('fieldset.ar-menu-group');
            if (parentFieldset && !buttonElement.classList.contains('ar-menu-reset-btn')) {
                Array.from(parentFieldset.querySelectorAll('button:not(.ar-menu-reset-btn)'))
                    .forEach(btn => {
                        if (btn !== buttonElement) {
                            const multiSelectActions = [
                                'text-spacing-letter', 'text-spacing-word', 'text-spacing-line',
                                'highlight-links', 'highlight-headings'
                            ];
                            if (!multiSelectActions.includes(buttonElement.dataset.action)) {
                                btn.classList.remove('ar-menu-btn-active');
                            }
                        }
                    });
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
            if (decreaseButton) this._updateButtonActiveState(decreaseButton, false);
		} else if (action === 'decrease-font') {
			this.currentFontSizeMultiplier = Math.max(AR_CONFIG.MIN_FONT_SIZE_ADJUSTMENT_MULTIPLIER, this.currentFontSizeMultiplier - AR_CONFIG.DEFAULT_FONT_SIZE_ADJUSTMENT_INCREMENT);
			this._applyFontSize(elementsForFontAdjust, false);
            this._updateButtonActiveState(targetButton, true);
            const increaseButton = targetButton.parentElement.querySelector('[data-action="increase-font"]');
            if (increaseButton) this._updateButtonActiveState(increaseButton, false);
		} else if (action === 'reset-font') {
			this.currentFontSizeMultiplier = 1;
			this._applyFontSize(elementsForFontAdjust, true);
            const parentFieldset = targetButton.closest('fieldset.ar-menu-group');
            if (parentFieldset) {
                parentFieldset.querySelectorAll('button:not(.ar-menu-reset-btn)')
                              .forEach(b => this._updateButtonActiveState(b, false));
            }
		}
	};

	AR_AccessibilityMenuProto._applyFontSize = function (elements, reset) {
		elements.forEach(el => {
			const styleProp = 'font-size';
			if (reset) {
				ar_restoreOriginalInlineStyle(el, styleProp);
			} else {
				if (!ar_originalElementStylesMap.has(el) || !ar_originalElementStylesMap.get(el).hasOwnProperty(styleProp)) {
					ar_storeOriginalInlineStyle(el, styleProp);
				}
				const originalInlineStyle = ar_originalElementStylesMap.get(el) ? ar_originalElementStylesMap.get(el)[styleProp] : null;
				let baseSize = (originalInlineStyle && parseFloat(originalInlineStyle)) ?
					parseFloat(originalInlineStyle) :
					parseFloat(window.getComputedStyle(el).fontSize);
				if (!isNaN(baseSize)) {
					el.style.setProperty(styleProp, `${baseSize * this.currentFontSizeMultiplier}px`, 'important');
				}
			}
		});
		this._logMenuChange(`Font size ${reset ? 'reset.' : `adjusted by ${this.currentFontSizeMultiplier.toFixed(1)}x.`}`, !reset);
	};

	AR_AccessibilityMenuProto._handleContrastColorAction = function (action, targetButton) {
		const bodyEl = document.body;
        const contrastClasses = [
            AR_CONFIG.HIGH_CONTRAST_MODE_CLASS_NAME, AR_CONFIG.INVERTED_CONTRAST_MODE_CLASS_NAME, AR_CONFIG.GRAYSCALE_CONTRAST_MODE_CLASS_NAME
        ];
        const saturationClass = AR_CONFIG.SATURATION_FILTER_CLASS_NAME;
		if (action === 'reset-contrast') {
			bodyEl.classList.remove(...contrastClasses, saturationClass);
			this.activeContrastModeClassName = 'default';
            const parentFieldset = targetButton.closest('fieldset.ar-menu-group');
            if (parentFieldset) {
                parentFieldset.querySelectorAll('button:not(.ar-menu-reset-btn)')
                              .forEach(b => this._updateButtonActiveState(b, false));
            }
			this._logMenuChange('Contrast and saturation reset', true);
			return;
		}
        let targetClass = '', logMsg = '';
        switch(action) {
            case 'contrast-high': targetClass = AR_CONFIG.HIGH_CONTRAST_MODE_CLASS_NAME; logMsg = 'High contrast'; break;
            case 'contrast-inverted': targetClass = AR_CONFIG.INVERTED_CONTRAST_MODE_CLASS_NAME; logMsg = 'Inverted contrast'; break;
            case 'contrast-grayscale': targetClass = AR_CONFIG.GRAYSCALE_CONTRAST_MODE_CLASS_NAME; logMsg = 'Grayscale mode'; break;
            case 'saturation-low': targetClass = saturationClass; logMsg = 'Low saturation'; break;
        }
        if (targetClass) {
            if (contrastClasses.includes(targetClass)) {
                 bodyEl.classList.remove(...contrastClasses.filter(c => c !== targetClass));
            }
            bodyEl.classList.toggle(targetClass);
            const isActive = bodyEl.classList.contains(targetClass);
            this._updateButtonActiveState(targetButton, isActive);
            if (isActive && contrastClasses.includes(targetClass)) this.activeContrastModeClassName = targetClass;
            else if (!isActive && this.activeContrastModeClassName === targetClass) this.activeContrastModeClassName = 'default';
            this._logMenuChange(logMsg, isActive);
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
                parentFieldset.querySelectorAll('button:not(.ar-menu-reset-btn)')
                              .forEach(b => this._updateButtonActiveState(b, false));
            }
            this._logMenuChange('Text spacing reset', true);
        } else if (spacingClasses[action]) {
            const targetClass = spacingClasses[action];
            bodyEl.classList.toggle(targetClass);
            const isActive = bodyEl.classList.contains(targetClass);
            this._updateButtonActiveState(targetButton, isActive, true);
            this._logMenuChange(`${targetButton.textContent.trim()} spacing`, isActive);
        }
	};

	AR_AccessibilityMenuProto._handleTextAlignAction = function (action, targetButton) {
		const bodyEl = document.body;
        const alignClasses = {
            'text-align-left': `${AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX}left`,
            'text-align-center': `${AR_CONFIG.TEXT_ALIGNMENT_CLASS_NAME_PREFIX}center`
        };
        bodyEl.classList.remove(...Object.values(alignClasses));
        if (action === 'text-align-reset') {
            const parentFieldset = targetButton.closest('fieldset.ar-menu-group');
            if (parentFieldset) {
                parentFieldset.querySelectorAll('button:not(.ar-menu-reset-btn)')
                              .forEach(b => this._updateButtonActiveState(b, false));
            }
            this._logMenuChange('Text alignment reset', true);
        } else if (alignClasses[action]) {
            const targetClass = alignClasses[action];
            bodyEl.classList.add(targetClass);
            this._updateButtonActiveState(targetButton, true);
            this._logMenuChange(`Text align to ${action.split('-')[2]}`, true);
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
                parentFieldset.querySelectorAll('button:not(.ar-menu-reset-btn)')
                              .forEach(b => this._updateButtonActiveState(b, false));
            }
            this._logMenuChange('Highlights reset', true);
        } else if (highlightClasses[action]) {
            const targetClass = highlightClasses[action];
            bodyEl.classList.toggle(targetClass);
            const isActive = bodyEl.classList.contains(targetClass);
            this._updateButtonActiveState(targetButton, isActive, true);
            this._logMenuChange(`${targetButton.textContent.trim()} highlight`, isActive);
        }
	};

	AR_AccessibilityMenuProto._handleReadingAidAction = function (action, targetButton) {
        const type = action === 'toggle-reading-line' ? 'line' : 'mask';
        this._toggleReadingGuide(type, targetButton);
	};

	AR_AccessibilityMenuProto._toggleReadingGuide = function (type, buttonElement) {
		const otherGuideType = type === 'line' ? 'mask' : 'line';
		const otherButton = document.querySelector(`#${AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID} [data-action="toggle-reading-${otherGuideType}"]`);
		if (ar_activeReadingGuideType === type) {
			this._deactivateReadingGuide(type);
            if (buttonElement) this._updateButtonActiveState(buttonElement, false);
			ar_activeReadingGuideType = null;
		} else {
			if (ar_activeReadingGuideType) {
				this._deactivateReadingGuide(ar_activeReadingGuideType);
                if (otherButton) this._updateButtonActiveState(otherButton, false);
			}
			this._activateReadingGuide(type);
            if (buttonElement) this._updateButtonActiveState(buttonElement, true);
			ar_activeReadingGuideType = type;
		}
		this._logMenuChange(`Reading guide (${type})`, ar_activeReadingGuideType === type);
	};

	AR_AccessibilityMenuProto._activateReadingGuide = function (type) {
		if (type === 'line') {
			this.readingGuideLineElement = document.createElement('div');
			this.readingGuideLineElement.id = AR_CONFIG.READING_LINE_ELEMENT_ID;
			Object.assign(this.readingGuideLineElement.style, {
				position: 'fixed', left: '0', width: '100%', height: '3px',
				backgroundColor: 'rgba(0, 0, 255, 0.7)', zIndex: '2147483647', pointerEvents: 'none'
			});
			document.body.appendChild(this.readingGuideLineElement);
			this._boundUpdateReadingGuide = this._updateReadingGuidePosition.bind(this);
			document.addEventListener('mousemove', this._boundUpdateReadingGuide);
		} else if (type === 'mask') {
			this.readingMaskTopElement = document.createElement('div');
			this.readingMaskBottomElement = document.createElement('div');
			[this.readingMaskTopElement, this.readingMaskBottomElement].forEach((el, index) => {
				el.id = `ar-reading-mask-${index === 0 ? 'top' : 'bottom'}`;
                el.className = AR_CONFIG.READING_MASK_ELEMENT_ID;
				Object.assign(el.style, {
					position: 'fixed', left: '0', width: '100%',
					backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: '2147483646', pointerEvents: 'none'
				});
			});
            this.readingMaskTopElement.style.top = '0';
            this.readingMaskBottomElement.style.bottom = '0';
			document.body.appendChild(this.readingMaskTopElement);
			document.body.appendChild(this.readingMaskBottomElement);
			this._boundUpdateReadingGuide = this._updateReadingGuidePosition.bind(this);
			document.addEventListener('mousemove', this._boundUpdateReadingGuide);
		}
	};

	AR_AccessibilityMenuProto._deactivateReadingGuide = function (type) {
		if (type === 'line' && this.readingGuideLineElement) {
			this.readingGuideLineElement.remove(); this.readingGuideLineElement = null;
		} else if (type === 'mask' && this.readingMaskTopElement) {
			this.readingMaskTopElement.remove(); this.readingMaskBottomElement.remove();
			this.readingMaskTopElement = null; this.readingMaskBottomElement = null;
		}
		if (this._boundUpdateReadingGuide) {
			document.removeEventListener('mousemove', this._boundUpdateReadingGuide);
			this._boundUpdateReadingGuide = null;
		}
	};

	AR_AccessibilityMenuProto._updateReadingGuidePosition = function (event) {
		if (ar_activeReadingGuideType === 'line' && this.readingGuideLineElement) {
			this.readingGuideLineElement.style.top = `${event.clientY - Math.round(parseFloat(window.getComputedStyle(this.readingGuideLineElement).height) / 2)}px`;
		} else if (ar_activeReadingGuideType === 'mask' && this.readingMaskTopElement && this.readingMaskBottomElement) {
			const maskHeight = Math.max(30, Math.round(window.innerHeight * 0.1));
			this.readingMaskTopElement.style.height = `${event.clientY - maskHeight / 2}px`;
			this.readingMaskBottomElement.style.height = `${window.innerHeight - (event.clientY + maskHeight / 2)}px`;
		}
	};

	AR_AccessibilityMenuProto._handleFontStyleAction = function (action, targetButton) {
		if (action === 'toggle-dyslexia-font') this._toggleDyslexiaFont(targetButton);
	};

	AR_AccessibilityMenuProto._toggleDyslexiaFont = function (buttonElement) {
		const body = document.body;
		this.isDyslexiaFontActive = !this.isDyslexiaFontActive;
		if (this.isDyslexiaFontActive) {
			if (!document.getElementById('ar-dyslexia-font-stylesheet')) {
				const fontLink = document.createElement('link');
				fontLink.id = 'ar-dyslexia-font-stylesheet'; fontLink.rel = 'stylesheet';
				fontLink.href = AR_CONFIG.DYSLEXIA_FRIENDLY_FONT_STYLESHEET_URL;
				document.head.appendChild(fontLink);
			}
			body.classList.add(AR_CONFIG.DYSLEXIA_FRIENDLY_FONT_CLASS_NAME);
		} else {
			body.classList.remove(AR_CONFIG.DYSLEXIA_FRIENDLY_FONT_CLASS_NAME);
		}
        this._updateButtonActiveState(buttonElement, this.isDyslexiaFontActive);
		this._logMenuChange('Dyslexia friendly font', this.isDyslexiaFontActive);
	};

	AR_AccessibilityMenuProto._handleAnimationAction = function (action, targetButton) {
		if (action === 'stop-animations') this._toggleAnimations(targetButton);
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
                            const canvas = document.createElement('canvas'); canvas.width = gif.naturalWidth; canvas.height = gif.naturalHeight;
                            const ctx = canvas.getContext('2d'); if (ctx) ctx.drawImage(gif, 0, 0, canvas.width, canvas.height);
                            gif.dataset.originalSrc = gif.src; gif.src = canvas.toDataURL('image/png');
                        } else if (gif.width > 0 && gif.height > 0) {
                             const canvas = document.createElement('canvas'); canvas.width = gif.width; canvas.height = gif.height;
                            const ctx = canvas.getContext('2d'); if (ctx) ctx.drawImage(gif, 0, 0, canvas.width, canvas.height);
                            gif.dataset.originalSrc = gif.src; gif.src = canvas.toDataURL('image/png');
                        }
					} catch (e) { console.warn('Could not pause GIF:', gif.src, e); }
				}
			} else {
				if (gif.dataset.originalSrc) {
					gif.src = gif.dataset.originalSrc; delete gif.dataset.originalSrc;
				}
			}
		});
		this._logMenuChange(`Animations ${body.classList.contains(stoppedClass) ? 'stopped/paused.' : 'resumed.'}`, true);
	};

	AR_AccessibilityMenuProto._resetAllMenuSettings = function () {
        this._handleFontAction('reset-font', document.querySelector(`#${AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID} [data-action="reset-font"]`));
        this._handleContrastColorAction('reset-contrast', document.querySelector(`#${AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID} [data-action="reset-contrast"]`));
        this._handleTextSpacingAction('text-spacing-reset', document.querySelector(`#${AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID} [data-action="text-spacing-reset"]`));
        this._handleTextAlignAction('text-align-reset', document.querySelector(`#${AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID} [data-action="text-align-reset"]`));
        this._handleHighlightAction('reset-highlights', document.querySelector(`#${AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID} [data-action="reset-highlights"]`));
        if (ar_activeReadingGuideType) {
            const btn = document.querySelector(`#${AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID} [data-action="toggle-reading-${ar_activeReadingGuideType}"]`);
            this._toggleReadingGuide(ar_activeReadingGuideType, btn);
        }
        if (this.isDyslexiaFontActive) {
            this._toggleDyslexiaFont(document.querySelector(`#${AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID} [data-action="toggle-dyslexia-font"]`));
        }
        if (document.body.classList.contains(AR_CONFIG.ANIMATIONS_STOPPED_CLASS_NAME)) {
            this._toggleAnimations(document.querySelector(`#${AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID} [data-action="stop-animations"]`));
        }
        Array.from(document.querySelectorAll(`#${AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID} button.ar-menu-btn-active:not(.ar-menu-reset-btn)`))
            .forEach(btn => btn.classList.remove('ar-menu-btn-active'));
        this._logMenuChange('Reset all menu settings', true);
    };

	AR_AccessibilityMenuProto._logMenuChange = function (actionDescription, isActive) {
		ar_logAccessibilityIssue('Info', `Accessibility Menu: ${actionDescription}${typeof isActive === 'boolean' ? (isActive ? ' enabled.' : ' disabled.') : '.'}`, null, '', 'Operable', 'User Interface Customization', true, 'User');
	};

})(AR_AccessibilityMenu); // Pass the object to attach methods
