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
	Menu.justDragged = false;
	Menu._originalFontSizes = new Map();
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
			accessibilityIcon: 'אייקון נגישות'
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
			accessibilityIcon: 'Accessibility Icon'
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
            /* כללי גופן OpenDyslexic */
            @font-face {
                font-family: 'OpenDyslexic';
                font-style: normal;
                font-display: swap; /* שימוש ב-swap לביצועים נתפסים טובים יותר */
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

            /* כפתור תפריט */
            #${ MENU_BUTTON_ID } {
                position: fixed;
                z-index: 2147483647; /* Z-index הגבוה ביותר */
                background-color: #0056b3; /* כחול כהה */
                color: white !important;
                border: none;
                border-radius: 50%;
                width: 80px; /* גודל מוגדל לאייקון גדול יותר */
                height: 80px; /* גודל מוגדל לאייקון גדול יותר */
                font-size: 50px; /* גודל גופן מוגדל לאייקון SVG גדול יותר */
                cursor: grab;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s, box-shadow 0.2s; /* הוסר מעבר טרנספורמציה */
            }
            #${ MENU_BUTTON_ID }:hover, #${ MENU_BUTTON_ID }:focus-visible {
                background-color: #003d82; /* כחול כהה יותר בריחוף */
                outline: 2px solid #007bff;
                outline-offset: 2px;
            }
            #${ MENU_BUTTON_ID }.dragging { cursor: grabbing; }

            /* ודא שהאייקון SVG בתוך הכפתור הראשי גלוי וממורכז */
            #${ MENU_BUTTON_ID } .ar-aaa-menu-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100% !important; /* ודא שהספאן ממלא את הכפתור */
                height: 100% !important; /* ודא שהספאן ממלא את הכפתור */
            }
            #${ MENU_BUTTON_ID } .ar-aaa-menu-icon svg {
                width: 100% !important; /* ודא שה-SVG ממלא את הספאן */
                height: 100% !important; /* ודא שה-SVG ממלא את הספאן */
                fill: currentColor !important; /* ודא שהצבע יורש מהכפתור בעדיפות עליונה */
                color: inherit !important; /* ודא שהצבע יורש מהכפתור בעדיפות עליונה */
            }


            /* פאנל תפריט */
            #${ MENU_PANEL_ID } {
                display: none;
                position: fixed;
                width: 320px;
                max-height: calc(100vh - 100px);
                overflow-y: auto;
                background-color: white; /* לבן */
                border: 1px solid #0056b3; /* גבול כחול כהה */
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                z-index: 2147483646; /* מיד מתחת לכפתור */
                padding: 15px;
                font-family: 'Inter', Arial, sans-serif;
                font-size: 14px;
                color: #0056b3; /* צבע טקסט כללי בפאנל: כחול כהה */
                cursor: grab; /* הופך את הפאנל עצמו לניתן לגרירה */
            }
            #${ MENU_PANEL_ID } h3 {
                margin-top: 0;
                margin-bottom: 15px;
                font-size: 1.2em;
                color: #0056b3; /* כחול כהה */
                text-align: center;
                cursor: grab; /* הופך את הכותרת לניתנת לגרירה */
            }
            #${ MENU_PANEL_ID }.ar-aaa-menu-open { display: block; }
            #${ MENU_PANEL_ID } .ar-aaa-menu-group {
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #e9ecef; /* גבול עדין בין קבוצות */
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
                flex: 1 1 calc(50% - 4px); /* שני כפתורים בשורה עם רווח */
                padding: 8px 10px;
                font-size: 0.95em;
                background-color: white; /* לבן */
                color: #0056b3 !important; /* כחול כהה */
                border: 1px solid #0056b3; /* גבול כחול כהה */
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.2s, border-color 0.2s, color 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }
            #${ MENU_PANEL_ID } button:hover, #${ MENU_PANEL_ID } button:focus-visible {
                background-color: #e6f2ff; /* כחול בהיר מאוד בריחוף */
                border-color: #0056b3; /* גבול כחול כהה */
                outline: 1px solid #0056b3;
            }
            #${ MENU_PANEL_ID } button.ar-aaa-menu-btn-active {
                background-color: #0056b3 !important; /* כחול כהה */
                color: white !important; /* לבן */
                border-color: #004085 !important; /* כחול כהה יותר */
            }
            #${ MENU_PANEL_ID } button.ar-aaa-fullwidth-btn {
                flex-basis: 100%; /* כפתור ברוחב מלא */
            }
            #${ MENU_PANEL_ID } button.ar-aaa-reset-btn {
                background-color: white; /* לבן */
                border-color: #0056b3; /* גבול כחול כהה */
                color: #0056b3 !important; /* כחול כהה */
            }
            #${ MENU_PANEL_ID } button.ar-aaa-reset-btn:hover {
                background-color: #e6f2ff; /* כחול בהיר מאוד בריחוף */
            }
            #${ MENU_PANEL_ID } .ar-aaa-menu-icon svg { width: 1em; height: 1em; fill: currentColor; }

            /* שכבת על פילטר למצבי ניגודיות */
            #${ FILTER_OVERLAY_ID } {
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                pointer-events: none; /* מאפשר אינטראקציה עם אלמנטים מתחת */
                z-index: -1; /* בהתחלה מאחורי הכל */
                display: none; /* שכבת על זו אינה נחוצה יותר עבור היפוך עצמו */
            }
            /* מצב היפוך צבעים (עיצוב ישיר באמצעות קלאס) */
            body.${ CLASS_INVERT_COLORS } {
                filter: invert(100%) hue-rotate(180deg) !important;
            }
            /* ודא שממשק המשתמש של התפריט עצמו אינו מושפע מפילטרים */
            #${ MENU_BUTTON_ID }, #${ MENU_PANEL_ID } { filter: none !important; }


            /* מצב ניגודיות גבוהה (עיצוב ישיר באמצעות קלאס) */
            body.${ CLASS_HIGH_CONTRAST } { background-color: #000 !important; color: #fff !important; }
            body.${ CLASS_HIGH_CONTRAST } a { color: #0ff !important; }
            body.${ CLASS_HIGH_CONTRAST } button, body.${ CLASS_HIGH_CONTRAST } input, body.${ CLASS_HIGH_CONTRAST } select, body.${ CLASS_HIGH_CONTRAST } textarea {
                background-color: #222 !important; color: #fff !important; border: 1px solid #fff !important;
            }
            /* אלמנטים בתוך התפריט אינם מושפעים ממצב ניגודיות גבוהה */
            body.${ CLASS_HIGH_CONTRAST } #${ MENU_PANEL_ID },
            body.${ CLASS_HIGH_CONTRAST } #${ MENU_BUTTON_ID } {
                background-color: white !important; /* שמור על צבעי התפריט המוגדרים */
                border-color: #0056b3 !important; /* שמור על צבעי התפריט המוגדרים */
            }
            /* ודא שכל הטקסטים הכלליים בתוך הפאנל יהיו כחולים כהים במצב ניגודיות גבוהה */
            body.${ CLASS_HIGH_CONTRAST } #${ MENU_PANEL_ID } {
                color: #0056b3 !important;
            }
            /* ודא שכפתורים בתוך התפריט שומרים על צבעיהם המיועדים במצב ניגודיות גבוהה */
            body.${ CLASS_HIGH_CONTRAST } #${ MENU_PANEL_ID } button {
                background-color: white !important;
                color: #0056b3 !important;
                border-color: #0056b3 !important;
            }
            /* ודא שכפתורים פעילים בתוך התפריט שומרים על צבעיהם הספציפיים במצב ניגודיות גבוהה */
            body.${ CLASS_HIGH_CONTRAST } #${ MENU_PANEL_ID } button.ar-aaa-menu-btn-active {
                background-color: #0056b3 !important; /* כחול כהה */
                color: white !important; /* לבן */
                border-color: #004085 !important; /* כחול כהה יותר */
            }


            /* הדגשת קישורים */
            body.${ CLASS_HIGHLIGHT_LINKS } a[href] {
                background-color: yellow !important;
                color: black !important;
                outline: 2px solid orange !important;
                border-radius: 2px;
            }

            /* מיקוד משופר */
            body.${ CLASS_ENHANCED_FOCUS } *:focus-visible {
                outline: 3px solid #007bff !important;
                outline-offset: 2px !important;
                box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.5) !important;
            }

            /* עצירת אנימציות */
            body.${ CLASS_ANIMATIONS_STOPPED } *,
            body.${ CLASS_ANIMATIONS_STOPPED } *::before,
            body.${ CLASS_ANIMATIONS_STOPPED } *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                transition-delay: 0ms !important;
                animation-play-state: paused !important;
            }
            /* ודא שאנימציית התפריט עדיין עובדת (אם קיימת) */
            body.${ CLASS_ANIMATIONS_STOPPED } #${ MENU_PANEL_ID }.ar-aaa-menu-open {
                /* אם יש אנימציה ספציפית לפתיחה, הגדר אותה כאן */
                /* animation: ar-slide-up .3s ease-out !important; */
                animation-play-state: running !important;
            }


            /* גופן דיסלקטי */
            body.${ CLASS_DYSLEXIA_FONT } {
                font-family: 'OpenDyslexic', Arial, sans-serif !important;
            }
            /* החל גופן דיסלקטי על כל האלמנטים למעט סקריפטים, סגנונות וקישורים */
            body.${ CLASS_DYSLEXIA_FONT } *:not(script):not(style):not(link) {
                font-family: inherit !important;
            }
            /* ודא שהתפריט עצמו אינו מקבל גופן דיסלקטי אם הגוף מקבל אותו */
            #${ MENU_PANEL_ID }, #${ MENU_PANEL_ID } *,
            #${ MENU_BUTTON_ID }, #${ MENU_BUTTON_ID } * {
                font-family: 'Inter', Arial, sans-serif !important; /* שמור על גופן התפריט עקבי */
            }


            /* רספונסיביות */
            @media (max-width: 480px) {
                #${ MENU_PANEL_ID } {
                    width: calc(100% - 20px);
                    left: 10px;
                    right: 10px;
                    bottom: 10px;
                    max-height: calc(100vh - 80px); /* התאמה לכפתור קטן יותר */
                }
                #${ MENU_BUTTON_ID } {
                    width: 50px; height: 50px; font-size: 20px;
                }
                #${ MENU_PANEL_ID } button {
                    flex-basis: 100%; /* כפתורים ברוחב מלא במסכים קטנים מאוד */
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
		btn.setAttribute('aria-label', Menu._getLocalizedString('menuTitle'));
		btn.setAttribute('aria-expanded', 'false');
		btn.setAttribute('aria-controls', MENU_PANEL_ID);
		btn.innerHTML = `<span class="ar-aaa-menu-icon" role="img" aria-label="${ Menu._getLocalizedString('accessibilityIcon') }"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,7A2,2 0 0,1 14,9A2,2 0 0,1 12,11A2,2 0 0,1 10,9A2,2 0 0,1 12,7M12,13A1,1 0 0,1 13,14V17A1,1 0 0,1 12,18A1,1 0 0,1 11,17V14A1,1 0 0,1 12,13Z" /></svg></span>`;
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
		return `<span class="ar-aaa-menu-icon" role="img" aria-label="${ label }"><svg viewBox="0 0 24 24" width="100%" height="100%">${ pathData }</svg></span>`
	};
	Menu._getMenuPanelHTML = function () {
		const ICONS = {
			textSize: this._getIconSVG('<path d="M2.5,4V7H7.5V19H10.5V7H15.5V4M10.5,10.5H13.5V13.5H10.5"/>', Menu._getLocalizedString('textSize')),
			contrast: this._getIconSVG('<path d="M12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6V18M20,15L19.3,14C19.5,13.4 19.6,12.7 19.6,12C19.6,11.3 19.5,10.6 19.3,10L20,9L17.3,4L16.7,5C15.9,4.3 14.9,3.8 13.8,3.5L13.5,2H10.5L10.2,3.5C9.1,3.8 8.1,4.3 7.3,5L6.7,4L4,9L4.7,10C4.5,10.6 4.4,11.3 4.4,12C4.4,12.7 4.5,13.4 4.7,14L4,15L6.7,20L7.3,19C8.1,19.7 9.1,20.2 10.2,20.5L10.5,22H13.5L13.8,20.5C14.9,20.2 15.9,19.7 16.7,19L17.3,20L20,15Z"/>', Menu._getLocalizedString('contrast')),
			highlight: this._getIconSVG('<path d="M16.2,12L12,16.2L7.8,12L12,7.8M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z"/>', Menu._getLocalizedString('highlight')),
			animation: this._getIconSVG('<path d="M8,5V19L19,12"/>', Menu._getLocalizedString('animation')),
			fontStyle: this._getIconSVG('<path d="M9.25,4V5.5H6.75V4H5.25V5.5H2.75V4H1.25V14.5H2.75V16H5.25V14.5H7.75V16H10.25V14.5H11.75V4H9.25M17.75,4V14.5H19.25V16H21.75V14.5H24.25V4H21.75V5.5H19.25V4H17.75M10.25,7H7.75V13H10.25V7M16.25,7H13.75V13H16.25V7Z"/>', Menu._getLocalizedString('fontStyle')),
			reset: this._getIconSVG('<path d="M12,5V1L7,6L12,11V7A6,6 0 0,1 18,13A6,6 0 0,1 12,19A6,6 0 0,1 6,13H4A8,8 0 0,0 12,21A8,8 0 0,0 20,13A8,8 0 0,0 12,5Z"/>', Menu._getLocalizedString('reset')),
			close: this._getIconSVG('<path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>', Menu._getLocalizedString('closeMenu'))
		};
		let html = `<h3 id="ar-aaa-menu-title">${ Menu._getLocalizedString('menuTitle') }</h3>`;
		html += `
            <div class="ar-aaa-menu-group">
                <div class="ar-aaa-button-row">
                    <button data-action="increase-text">${ ICONS.textSize } ${ Menu._getLocalizedString('increaseText') }</button>
                    <button data-action="decrease-text">${ ICONS.textSize } ${ Menu._getLocalizedString('decreaseText') }</button>
                </div>
            </div>
            <div class="ar-aaa-menu-group">
                <div class="ar-aaa-button-row">
                    <button data-action="contrast-high">${ ICONS.contrast } ${ Menu._getLocalizedString('highContrast') }</button>
                    <button data-action="contrast-invert">${ ICONS.contrast } ${ Menu._getLocalizedString('invertColors') }</button>
                </div>
            </div>
            <div class="ar-aaa-menu-group">
                <div class="ar-aaa-button-row">
                    <button data-action="highlight-links">${ ICONS.highlight } ${ Menu._getLocalizedString('highlightLinks') }</button>
                    <button data-action="enhanced-focus">${ ICONS.highlight } ${ Menu._getLocalizedString('enhancedFocus') }</button>
                </div>
            </div>
            <div class="ar-aaa-menu-group">
                <div class="ar-aaa-button-row">
                    <button data-action="stop-animations" class="ar-aaa-fullwidth-btn">${ ICONS.animation } ${ Menu._getLocalizedString('stopAnimations') }</button>
                </div>
            </div>
            <div class="ar-aaa-menu-group">
                <div class="ar-aaa-button-row">
                    <button data-action="toggle-dyslexia-font" class="ar-aaa-fullwidth-btn">${ ICONS.fontStyle } ${ Menu._getLocalizedString('dyslexiaFont') }</button>
                </div>
            </div>
            <div class="ar-aaa-menu-group">
                <div class="ar-aaa-button-row">
                    <button data-action="reset-all" class="ar-aaa-fullwidth-btn ar-aaa-reset-btn">${ ICONS.reset } ${ Menu._getLocalizedString('resetAll') }</button>
                    <button data-action="close-menu" class="ar-aaa-fullwidth-btn">${ ICONS.close } ${ Menu._getLocalizedString('closeMenu') }</button>
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
		document.addEventListener('touchend', this._handleDocumentMouseUp.bind(this));
		document.addEventListener('keydown', this._handleTabKeyFocusTrap.bind(this))
	};
	Menu._handleMenuButtonClick = function (event) {
		if (Menu.justDragged) {
			Menu.justDragged = false;
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
	Menu._initialButtonX = 0;
	Menu._initialButtonY = 0;
	Menu._initialPanelX = 0;
	Menu._initialPanelY = 0;
	Menu._initialMouseX = 0;
	Menu._initialMouseY = 0;
	Menu._panelRelativeOffsetX = 0;
	Menu._panelRelativeOffsetY = 0;
	Menu._startDragging = function (event, isButtonDrag) {
		const button = document.getElementById(MENU_BUTTON_ID);
		const panel = document.getElementById(MENU_PANEL_ID);
		if (!button || !panel)
			return;
		let draggedElement = isButtonDrag ? button : panel;
		if (!isButtonDrag) {
			const target = event.target;
			const isButtonClick = target.closest('button');
			const isLegendClick = target.closest('legend');
			const isPanelDirectClick = target === panel;
			const isPanelTitleClick = target === panel.querySelector('h3');
			if (isButtonClick || isLegendClick || isPanelDirectClick && !isPanelTitleClick) {
				if (isButtonDrag)
					this.isButtonDragging = false;
				else
					this.isPanelDragging = false;
				return
			}
		}
		this.isButtonDragging = isButtonDrag;
		this.isPanelDragging = !isButtonDrag;
		draggedElement.classList.add('dragging');
		button.style.position = 'fixed';
		panel.style.position = 'fixed';
		const coords = getClientCoords(event);
		const buttonRect = button.getBoundingClientRect();
		const panelRect = panel.getBoundingClientRect();
		Menu._initialButtonX = buttonRect.left;
		Menu._initialButtonY = buttonRect.top;
		Menu._initialPanelX = panelRect.left;
		Menu._initialPanelY = panelRect.top;
		Menu._initialMouseX = coords.clientX;
		Menu._initialMouseY = coords.clientY;
		button.style.transform = 'none';
		if (Menu.isOpen) {
			Menu._panelRelativeOffsetX = panelRect.left - buttonRect.left;
			Menu._panelRelativeOffsetY = panelRect.top - buttonRect.top
		} else {
			Menu._panelRelativeOffsetX = 0;
			Menu._panelRelativeOffsetY = -panelRect.height - 10
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
		if (!this.isButtonDragging && !this.isPanelDragging)
			return;
		const button = document.getElementById(MENU_BUTTON_ID);
		const panel = document.getElementById(MENU_PANEL_ID);
		if (!button || !panel)
			return;
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
		const panelWidth = panel.offsetWidth;
		const panelHeight = panel.offsetHeight;
		targetButtonX = Math.max(0, Math.min(targetButtonX, window.innerWidth - buttonWidth));
		targetButtonY = Math.max(0, Math.min(targetButtonY, window.innerHeight - buttonHeight));
		let clampedPanelX = targetButtonX + Menu._panelRelativeOffsetX;
		let clampedPanelY = targetButtonY + Menu._panelRelativeOffsetY;
		clampedPanelX = Math.max(0, Math.min(clampedPanelX, window.innerWidth - panelWidth));
		clampedPanelY = Math.max(0, Math.min(clampedPanelY, window.innerHeight - panelHeight));
		if (clampedPanelX !== targetButtonX + Menu._panelRelativeOffsetX) {
			targetButtonX = clampedPanelX - Menu._panelRelativeOffsetX
		}
		if (clampedPanelY !== targetButtonY + Menu._panelRelativeOffsetY) {
			targetButtonY = clampedPanelY - Menu._panelRelativeOffsetY
		}
		targetButtonX = Math.max(0, Math.min(targetButtonX, window.innerWidth - buttonWidth));
		targetButtonY = Math.max(0, Math.min(targetButtonY, window.innerHeight - buttonHeight));
		button.style.left = `${ targetButtonX }px`;
		button.style.top = `${ targetButtonY }px`;
		button.style.transform = 'none';
		if (Menu.isOpen) {
			panel.style.left = `${ targetButtonX + Menu._panelRelativeOffsetX }px`;
			panel.style.top = `${ targetButtonY + Menu._panelRelativeOffsetY }px`
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
				button.classList.remove('dragging');
			Menu.justDragged = true;
			setTimeout(() => {
				Menu.justDragged = false
			}, 50)
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
			Menu._panelRelativeOffsetX = newLeft - buttonRect.left;
			Menu._panelRelativeOffsetY = newTop - buttonRect.top;
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
			elements = Array.from(document.querySelectorAll('p, li, span, div:not(#' + MENU_PANEL_ID + '):not(#' + MENU_BUTTON_ID + '), h1, h2, h3, h4, h5, h6, a, label, td, th, caption, strong, em, b, i, small, big, sub, sup'))
		}
		let factor = 1;
		if (action === 'increase-text') {
			factor = FONT_SIZE_MULTIPLIER
		} else if (action === 'decrease-text') {
			factor = 1 / FONT_SIZE_MULTIPLIER
		}
		elements.forEach(el => {
			if (!document.body.contains(el)) {
				return
			}
			if (!Menu._originalFontSizes.has(el)) {
				Menu._originalFontSizes.set(el, window.getComputedStyle(el).fontSize)
			}
			if (action === 'reset-font') {
				const originalSize = Menu._originalFontSizes.get(el);
				if (originalSize !== null && originalSize !== undefined && originalSize !== '') {
					el.style.setProperty('font-size', originalSize, 'important')
				} else {
					el.style.removeProperty('font-size')
				}
				Menu._originalFontSizes.delete(el)
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
				if (typeof window.ar_isVisuallyHidden === 'function' && window.ar_isVisuallyHidden(img)) {
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
					canvas.setAttribute('aria-label', img.dataset.arOriginalAlt || `אנימציה קפואה: ${ img.src.split('/').pop() }`);
					canvas.dataset.arFrozenGifCanvas = 'true';
					if (!img.id) {
						img.id = typeof window.ar_generateUniqueElementId === 'function' ? window.ar_generateUniqueElementId('ar-original-gif-') : `ar-gif-${ Date.now() }-${ Math.random() }`
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
						console.error('ARMenu: failed to freeze GIF using canvas, falling back to blank GIF.', e);
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
		Menu._originalFontSizes.forEach((originalSize, el) => {
			if (document.body.contains(el)) {
				if (originalSize !== null && originalSize !== undefined && originalSize !== '') {
					el.style.setProperty('font-size', originalSize, 'important')
				} else {
					el.style.removeProperty('font-size')
				}
			}
		});
		Menu._originalFontSizes.clear();
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
			menuButton.style.right = '20px';
			menuButton.style.top = '50%';
			menuButton.style.transform = 'translateY(-50%)';
			menuButton.style.left = 'auto';
			menuButton.style.bottom = 'auto'
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
	document.addEventListener('DOMContentLoaded', function () {
		AR_AccessibilityMenu.init()
	})
}(AR_AccessibilityMenu))
