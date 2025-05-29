var AR_AccessibilityMenu = AR_AccessibilityMenu || {};
(function (Menu) {
	const MENU_BUTTON_ID = 'aaa-menu-button';
	const MENU_PANEL_ID = 'aaa-menu-panel';
	const PAGE_STRUCTURE_PANEL_ID = 'aaa-page-structure-panel';
	const READING_MASK_TOP_ID = 'aaa-reading-mask-top';
	const READING_MASK_BOTTOM_ID = 'aaa-reading-mask-bottom';
	const READING_LINE_ID = 'aaa-reading-line';
	const FONT_SIZE_MULTIPLIER = 1.1;
	const CLASS_HIGH_CONTRAST = 'ar-aaa-high-contrast';
	const CLASS_INVERT_COLORS = 'ar-aaa-invert-colors';
	const CLASS_HIGHLIGHT_LINKS = 'ar-aaa-highlight-links';
	const CLASS_ENHANCED_FOCUS = 'ar-aaa-enhanced-focus';
	const CLASS_ANIMATIONS_STOPPED = 'ar-aaa-animations-stopped';
	const CLASS_DYSLEXIA_FONT = 'ar-aaa-dyslexia-font';
    const CLASS_READING_MODE = 'ar-aaa-reading-mode';
    const CLASS_TEMP_HIGHLIGHT = 'ar-aaa-temp-highlight';
    const CLASS_TEXT_SCALED = 'ar-text-scaled-by-menu';
    const STORAGE_KEY = 'AR_AccessibilityMenu_Settings_v1.4';
    const EDGE_MARGIN_PX = 38;

	Menu.isOpen = false;
	Menu.isDyslexiaFontActive = false;
	Menu.activeContrastMode = 'default';
	Menu.areLinksHighlighted = false;
	Menu.isFocusEnhanced = false;
	Menu.areAnimationsStopped = false;
	Menu.isReadingAloud = false;
    Menu.fontScaleLevel = 0;
    Menu.isReadingModeActive = false;
    Menu.isReadingMaskActive = false;
    Menu.isReadingLineActive = false;
    Menu.isStructurePanelOpen = false;

	Menu.isPanelDragging = false;
	Menu.isButtonDragging = false;
	Menu.buttonDragOccurred = false;
    Menu.buttonWasDragged = false;
    Menu.panelWasDragged = false;

	Menu._originalFontSizes = new Map();
	Menu._initialButtonX = 0; Menu._initialButtonY = 0;
	Menu._initialPanelX = 0; Menu._initialPanelY = 0;
	Menu._initialMouseX = 0; Menu._initialMouseY = 0;
	Menu._panelRelativeOffsetX = 0; Menu._panelRelativeOffsetY = 0;

    Menu.readingMaskTop = null;
    Menu.readingMaskBottom = null;
    Menu.readingLine = null;
    Menu.pageStructurePanel = null;


    Menu.profiles = {
        'motor': {
            settings: { enhancedFocus: true, stopAnimations: true },
            labelKey: 'profileMotor',
            iconPath: '<path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/>'
        },
        'adhd': {
            settings: { stopAnimations: true, readingMode: true, readingLine: true },
            labelKey: 'profileADHD',
            iconPath: '<path d="M11.5,6C8.46,6 5.83,7.43 4.42,9.59L2.93,8.1L1.87,9.16L3.87,11.16C3.67,11.46 3.5,11.72 3.5,12C3.5,12.28 3.67,12.54 3.87,12.84L1.87,14.84L2.93,15.9L4.42,14.41C5.83,16.57 8.46,18 11.5,18C14.54,18 17.17,16.57 18.58,14.41L20.07,15.9L21.13,14.84L19.13,12.84C19.33,12.54 19.5,12.28 19.5,12C19.5,11.72 19.33,11.46 19.13,11.16L21.13,9.16L20.07,8.1L18.58,9.59C17.17,7.43 14.54,6 11.5,6M11.5,8A4.5,4.5 0 0,1 16,12.5A4.5,4.5 0 0,1 11.5,17A4.5,4.5 0 0,1 7,12.5A4.5,4.5 0 0,1 11.5,8M11.5,10A2.5,2.5 0 0,0 9,12.5A2.5,2.5 0 0,0 11.5,15A2.5,2.5 0 0,0 14,12.5A2.5,2.5 0 0,0 11.5,10Z"/>'
        },
        'epileptic': {
            settings: { stopAnimations: true },
            labelKey: 'profileEpileptic',
            iconPath: '<path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1Z"/>'
        },
        'vision': { 
            settings: { fontScaleLevel: 2, highlightLinks: true, activeContrastMode: 'high' },
            labelKey: 'profileVision',
            iconPath: '<path d="M12,4.5C7,4.5 2.73,7.61 1,12c1.73,4.39 6,7.5 11,7.5s9.27-3.11 11-7.5C21.27,7.61 17,4.5 12,4.5zM12,17a4.5,4.5 0 1,1 0-9 4.5,4.5 0 0,1 0,9zm0-7a2.5,2.5 0 1,0 0,5 2.5,2.5 0 0,0 0-5z"/>'
        }
    };

	Menu.translations = {
		'he': {
			menuTitle: 'כלי נגישות', increaseText: 'הגדל טקסט', decreaseText: 'הקטן טקסט',
			highContrast: 'ניגודיות גבוהה', invertColors: 'היפוך צבעים', highlightLinks: 'הדגש קישורים',
			enhancedFocus: 'מיקוד משופר', stopAnimations: 'עצור אנימציות', dyslexiaFont: 'גופן דיסלקטי',
			readAloud: 'קרא בקול', readingMode: 'מצב קריאה', readingMask: 'מסכת קריאה', readingLine: 'קו קריאה',
            pageStructure: 'מבנה עמוד', pageStructureTitle: 'מבנה עמוד', headings: 'כותרות', landmarks: 'נקודות ציון', links: 'קישורים', noItemsFound: 'לא נמצאו פריטים.',
            profilesTitle: 'פרופילי נגישות', profileMotor: 'לקויות מוטוריות', profileADHD: 'הפרעת קשב', profileEpileptic: 'אפילפסיה', profileVision: 'לקות ראייה',
			resetAll: 'איפוס הכל', closeMenu: 'סגור תפריט', closeStructurePanel: 'סגור מבנה עמוד', accessibilityIcon: 'אייקון נגישות',
			textSize: 'גודל טקסט', contrast: 'ניגודיות', highlight: 'הדגשה',
			animation: 'אנימציה', fontStyle: 'סגנון גופן', reset: 'איפוס', readAloudIcon: 'אייקון קריאה בקול',
            readingModeIcon: 'אייקון מצב קריאה', readingMaskIcon: 'אייקון מסכת קריאה', readingLineIcon: 'אייקון קו קריאה',
            pageStructureIcon: 'אייקון מבנה עמוד', profileIcon: 'אייקון פרופיל',
            speechNotSupported: 'סינתזת דיבור אינה נתמכת בדפדפן זה.'
		},
		'en': {
			menuTitle: 'Accessibility Tools', increaseText: 'Increase Text', decreaseText: 'Decrease Text',
			highContrast: 'High Contrast', invertColors: 'Invert Colors', highlightLinks: 'Highlight Links',
			enhancedFocus: 'Enhanced Focus', stopAnimations: 'Stop Animations', dyslexiaFont: 'Dyslexia Font',
			readAloud: 'Read Aloud', readingMode: 'Reading Mode', readingMask: 'Reading Mask', readingLine: 'Reading Line',
            pageStructure: 'Page Structure', pageStructureTitle: 'Page Structure', headings: 'Headings', landmarks: 'Landmarks', links: 'Links', noItemsFound: 'No items found.',
            profilesTitle: 'Accessibility Profiles', profileMotor: 'Motor Impairment', profileADHD: 'ADHD Focus', profileEpileptic: 'Epilepsy Safe', profileVision: 'Low Vision',
			resetAll: 'Reset All', closeMenu: 'Close Menu', closeStructurePanel: 'Close Structure Panel', accessibilityIcon: 'Accessibility Icon',
			textSize: 'Text Size', contrast: 'Contrast', highlight: 'Highlight',
			animation: 'Animation', fontStyle: 'Font Style', reset: 'Reset', readAloudIcon: 'Read Aloud Icon',
            readingModeIcon: 'Reading Mode Icon', readingMaskIcon: 'Reading Mask Icon', readingLineIcon: 'Reading Line Icon',
            pageStructureIcon: 'Page Structure Icon', profileIcon: 'Profile Icon',
            speechNotSupported: 'Speech synthesis not supported in this browser.'
		}
	};

	Menu._getLocalizedString = function (key) { let lang = document.documentElement.lang || navigator.language || 'en'; lang = lang.split('-')[0]; if (Menu.translations[lang] && Menu.translations[lang][key]) { return Menu.translations[lang][key]; } return Menu.translations['en'][key] || key; };
	function getClientCoords(event) { if (event.touches && event.touches.length > 0) { return { clientX: event.touches[0].clientX, clientY: event.touches[0].clientY }; } return { clientX: event.clientX, clientY: event.clientY }; }
	function logAction(message, isUserAction = false) { console.log(`[ARMenu] ${message} ${isUserAction ? '(User Action)' : ''}`); }

	Menu.init = function () {
		if (document.getElementById(MENU_BUTTON_ID)) { logAction('Already initialized.'); return; }
		this._createMenuButton();
		this._createMenuPanel();
        this._createReadingAidElements(); 
        this._createPageStructurePanel();
		this._attachEventListeners();
        this._loadSettings(); 
		logAction('Initialized successfully.');
	};

	Menu._createFilterOverlay = function () { };
	Menu._createMenuButton = function () { const btn = document.createElement('button'); btn.id = MENU_BUTTON_ID; btn.setAttribute('aria-label', Menu._getLocalizedString('menuTitle')); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', MENU_PANEL_ID); const accessibilityIconSVG = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/></svg>'; btn.innerHTML = `<span class="ar-aaa-menu-icon" role="img" aria-label="${Menu._getLocalizedString('accessibilityIcon')}">${accessibilityIconSVG}</span>`; btn.style.right = '20px'; btn.style.top = '50%'; btn.style.transform = 'translateY(-50%)'; btn.style.left = 'auto'; btn.style.bottom = 'auto'; document.body.appendChild(btn); btn.addEventListener('mousedown', this._handleButtonMouseDown.bind(this)); btn.addEventListener('touchstart', this._handleButtonMouseDown.bind(this), { passive: false }); };
	Menu._createMenuPanel = function () { const panel = document.createElement('div'); panel.id = MENU_PANEL_ID; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'ar-aaa-menu-title'); panel.style.display = 'none'; panel.innerHTML = this._getMenuPanelHTML(); document.body.appendChild(panel); panel.addEventListener('mousedown', this._handlePanelMouseDown.bind(this)); panel.addEventListener('touchstart', this._handlePanelMouseDown.bind(this), { passive: false }); };
	
    Menu._createReadingAidElements = function() {
        Menu.readingMaskTop = document.createElement('div'); Menu.readingMaskTop.className = READING_MASK_TOP_ID; document.body.appendChild(Menu.readingMaskTop);
        Menu.readingMaskBottom = document.createElement('div'); Menu.readingMaskBottom.className = READING_MASK_BOTTOM_ID; document.body.appendChild(Menu.readingMaskBottom);
        Menu.readingLine = document.createElement('div'); Menu.readingLine.className = READING_LINE_ID; document.body.appendChild(Menu.readingLine);
    };

    Menu._createPageStructurePanel = function() {
        Menu.pageStructurePanel = document.createElement('div');
        Menu.pageStructurePanel.id = PAGE_STRUCTURE_PANEL_ID;
        Menu.pageStructurePanel.setAttribute('role', 'dialog');
        Menu.pageStructurePanel.setAttribute('aria-modal', 'true');
        Menu.pageStructurePanel.setAttribute('aria-labelledby', 'ar-aaa-structure-title');
        Menu.pageStructurePanel.style.display = 'none';

        let panelHTML = `<h3 id="ar-aaa-structure-title">${Menu._getLocalizedString('pageStructureTitle')}</h3>`;
        panelHTML += `<div class="ar-structure-category" id="ar-aaa-structure-headings"><h4>${Menu._getLocalizedString('headings')}</h4><ul></ul></div>`;
        panelHTML += `<div class="ar-structure-category" id="ar-aaa-structure-landmarks"><h4>${Menu._getLocalizedString('landmarks')}</h4><ul></ul></div>`;
        panelHTML += `<div class="ar-structure-category" id="ar-aaa-structure-links"><h4>${Menu._getLocalizedString('links')}</h4><ul></ul></div>`;
        panelHTML += `<button class="ar-aaa-structure-close-btn" data-action="close-structure-panel">${Menu._getLocalizedString('closeStructurePanel')}</button>`;
        
        Menu.pageStructurePanel.innerHTML = panelHTML;
        document.body.appendChild(Menu.pageStructurePanel);

        Menu.pageStructurePanel.querySelector('.ar-aaa-structure-close-btn').addEventListener('click', () => {
            this._togglePageStructurePanel(false);
        });
         Menu.pageStructurePanel.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this._togglePageStructurePanel(false);
            }
        });
    };


    Menu._getIconSVG = function (pathData, label = '') { return `<span class="ar-aaa-menu-icon" role="img" aria-label="${label}"><svg viewBox="0 0 24 24">${pathData}</svg></span>`; };
	
    Menu._getMenuPanelHTML = function () { 
        const ICONS = { 
            textSize: this._getIconSVG('<path d="M2.5,4V7H7.5V19H10.5V7H15.5V4M10.5,10.5H13.5V13.5H10.5V10.5Z"/>', Menu._getLocalizedString('textSize')),
			contrast: this._getIconSVG('<path d="M12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6V18M20,15L19.3,14C19.5,13.4 19.6,12.7 19.6,12C19.6,11.3 19.5,10.6 19.3,10L20,9L17.3,4L16.7,5C15.9,4.3 14.9,3.8 13.8,3.5L13.5,2H10.5L10.2,3.5C9.1,3.8 8.1,4.3 7.3,5L6.7,4L4,9L4.7,10C4.5,10.6 4.4,11.3 4.4,12C4.4,12.7 4.5,13.4 4.7,14L4,15L6.7,20L7.3,19C8.1,19.7 9.1,20.2 10.2,20.5L10.5,22H13.5L13.8,20.5C14.9,20.2 15.9,19.7 16.7,19L17.3,20L20,15Z"/>', Menu._getLocalizedString('contrast')),
			highlight: this._getIconSVG('<path d="M16.2,12L12,16.2L7.8,12L12,7.8M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z"/>', Menu._getLocalizedString('highlight')),
            readAloud: this._getIconSVG('<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>', Menu._getLocalizedString('readAloudIcon')),
            readingMode: this._getIconSVG('<path d="M5 5v14h14V5H5zm8 12H7v-2h6v2zm4-4H7v-2h10v2zm0-4H7V7h10v2z"/>', Menu._getLocalizedString('readingModeIcon')), 
            readingMask: this._getIconSVG('<path d="M11.5,6C8.46,6 5.83,7.43 4.42,9.59L2.93,8.1L1.87,9.16L3.87,11.16C3.67,11.46 3.5,11.72 3.5,12C3.5,12.28 3.67,12.54 3.87,12.84L1.87,14.84L2.93,15.9L4.42,14.41C5.83,16.57 8.46,18 11.5,18C14.54,18 17.17,16.57 18.58,14.41L20.07,15.9L21.13,14.84L19.13,12.84C19.33,12.54 19.5,12.28 19.5,12C19.5,11.72 19.33,11.46 19.13,11.16L21.13,9.16L20.07,8.1L18.58,9.59C17.17,7.43 14.54,6 11.5,6M11.5,8A4.5,4.5 0 0,1 16,12.5A4.5,4.5 0 0,1 11.5,17A4.5,4.5 0 0,1 7,12.5A4.5,4.5 0 0,1 11.5,8M11.5,10A2.5,2.5 0 0,0 9,12.5A2.5,2.5 0 0,0 11.5,15A2.5,2.5 0 0,0 14,12.5A2.5,2.5 0 0,0 11.5,10Z"/>', Menu._getLocalizedString('readingMaskIcon')), 
            readingLine: this._getIconSVG('<path d="M19 13H5v-2h14v2z"/>', Menu._getLocalizedString('readingLineIcon')), 
            pageStructure: this._getIconSVG('<path d="M3,3H9V7H3V3M15,3H21V7H15V3M3,10H9V14H3V10M15,10H21V14H15V10M3,17H9V21H3V17M15,17H21V21H15V17Z"/>', Menu._getLocalizedString('pageStructureIcon')),
			animation: this._getIconSVG('<path d="M8,5V19L19,12L8,5Z"/>', Menu._getLocalizedString('animation')),
			fontStyle: this._getIconSVG('<path d="M9.25,4V5.5H6.75V4H5.25V5.5H2.75V4H1.25V14.5H2.75V16H5.25V14.5H7.75V16H10.25V14.5H11.75V4H9.25M17.75,4V14.5H19.25V16H21.75V14.5H24.25V4H21.75V5.5H19.25V4H17.75M10.25,7H7.75V13H10.25V7M16.25,7H13.75V13H16.25V7Z"/>', Menu._getLocalizedString('fontStyle')),
			reset: this._getIconSVG('<path d="M12,5V1L7,6L12,11V7A6,6 0 0,1 18,13A6,6 0 0,1 12,19A6,6 0 0,1 6,13H4A8,8 0 0,0 12,21A8,8 0 0,0 20,13A8,8 0 0,0 12,5Z"/>', Menu._getLocalizedString('reset')),
			close: this._getIconSVG('<path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>', Menu._getLocalizedString('closeMenu'))
        };
		let html = `<h3 id="ar-aaa-menu-title">${Menu._getLocalizedString('menuTitle')}</h3>`;
        html += `<div class="ar-aaa-menu-group"><h4 class="ar-aaa-profile-title">${Menu._getLocalizedString('profilesTitle')}</h4><div class="ar-aaa-button-row">`;
        for (const profileKey in Menu.profiles) {
            const profile = Menu.profiles[profileKey];
            html += `<button data-action="profile-${profileKey}">${Menu._getIconSVG(profile.iconPath, Menu._getLocalizedString('profileIcon'))} ${Menu._getLocalizedString(profile.labelKey)}</button>`;
        }
        html += `</div></div>`;

		html += `
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row"> <button data-action="increase-text">${ICONS.textSize} ${Menu._getLocalizedString('increaseText')}</button> <button data-action="decrease-text">${ICONS.textSize} ${Menu._getLocalizedString('decreaseText')}</button> </div></div>
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row"> <button data-action="contrast-high">${ICONS.contrast} ${Menu._getLocalizedString('highContrast')}</button> <button data-action="contrast-invert">${ICONS.contrast} ${Menu._getLocalizedString('invertColors')}</button> </div></div>
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row"> <button data-action="highlight-links">${ICONS.highlight} ${Menu._getLocalizedString('highlightLinks')}</button> <button data-action="enhanced-focus">${ICONS.highlight} ${Menu._getLocalizedString('enhancedFocus')}</button> </div></div>
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row"> <button data-action="page-structure" class="ar-aaa-fullwidth-btn">${ICONS.pageStructure} ${Menu._getLocalizedString('pageStructure')}</button> </div></div>
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row"> <button data-action="read-aloud" class="ar-aaa-fullwidth-btn">${ICONS.readAloud} ${Menu._getLocalizedString('readAloud')}</button> </div></div>
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row"> <button data-action="reading-mode" class="ar-aaa-fullwidth-btn">${ICONS.readingMode} ${Menu._getLocalizedString('readingMode')}</button> </div></div>
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row"> <button data-action="reading-mask">${ICONS.readingMask} ${Menu._getLocalizedString('readingMask')}</button> <button data-action="reading-line">${ICONS.readingLine} ${Menu._getLocalizedString('readingLine')}</button> </div></div>
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row"> <button data-action="stop-animations" class="ar-aaa-fullwidth-btn">${ICONS.animation} ${Menu._getLocalizedString('stopAnimations')}</button> </div></div>
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row"> <button data-action="toggle-dyslexia-font" class="ar-aaa-fullwidth-btn">${ICONS.fontStyle} ${Menu._getLocalizedString('dyslexiaFont')}</button> </div></div>
            <div class="ar-aaa-menu-group"><div class="ar-aaa-button-row"> <button data-action="reset-all" class="ar-aaa-fullwidth-btn ar-aaa-reset-btn">${ICONS.reset} ${Menu._getLocalizedString('resetAll')}</button> <button data-action="close-menu" class="ar-aaa-fullwidth-btn">${ICONS.close} ${Menu._getLocalizedString('closeMenu')}</button> </div></div>`;
		return html;
    };

	Menu._attachEventListeners = function () { 
        const menuButton = document.getElementById(MENU_BUTTON_ID); const menuPanel = document.getElementById(MENU_PANEL_ID);
		if (menuButton) { menuButton.addEventListener('click', this._handleMenuButtonClick.bind(this)); }
		if (menuPanel) { menuPanel.addEventListener('click', this._handlePanelActionClick.bind(this)); menuPanel.addEventListener('keydown', this._handlePanelKeydown.bind(this));}
		document.addEventListener('mousemove', this._handleDocumentMouseMove.bind(this)); 
        document.addEventListener('mousemove', this._handleReadingAidMouseMove.bind(this)); 
		document.addEventListener('mouseup', this._handleDocumentMouseUp.bind(this));
		document.addEventListener('touchmove', this._handleDocumentMouseMove.bind(this), { passive: false });
		document.addEventListener('touchend', this._handleDocumentMouseUp.bind(this));
		document.addEventListener('keydown', this._handleTabKeyFocusTrap.bind(this)); 
        window.addEventListener('resize', this._handleWindowResize.bind(this));
        if (Menu.pageStructurePanel) {
            Menu.pageStructurePanel.addEventListener('keydown', this._handleStructurePanelKeydown.bind(this));
        }
    };

    Menu._handleStructurePanelKeydown = function(event) {
        if (event.key === 'Escape' && Menu.isStructurePanelOpen) {
            this._togglePageStructurePanel(false);
        }
    };

    Menu._handleReadingAidMouseMove = function(event) { if (Menu.isReadingMaskActive && Menu.readingMaskTop && Menu.readingMaskBottom) { const mouseY = event.clientY; const maskHeight = 80; Menu.readingMaskTop.style.height = `${mouseY - maskHeight / 2}px`; Menu.readingMaskBottom.style.height = `${window.innerHeight - (mouseY + maskHeight / 2)}px`; } if (Menu.isReadingLineActive && Menu.readingLine) { Menu.readingLine.style.top = `${event.clientY}px`; } };
    Menu._handleWindowResize = function() { const button = document.getElementById(MENU_BUTTON_ID); const panel = document.getElementById(MENU_PANEL_ID); if (!button) return; if (Menu.buttonWasDragged) { const buttonWidth = button.offsetWidth; const buttonHeight = button.offsetHeight; let currentLeft = parseFloat(button.style.left); let currentTop = parseFloat(button.style.top); const newButtonX = Math.max(EDGE_MARGIN_PX, Math.min(currentLeft, window.innerWidth - buttonWidth - EDGE_MARGIN_PX)); const newButtonY = Math.max(EDGE_MARGIN_PX, Math.min(currentTop, window.innerHeight - buttonHeight - EDGE_MARGIN_PX)); if (parseFloat(button.style.left) !== newButtonX || parseFloat(button.style.top) !== newButtonY) { button.style.left = `${newButtonX}px`; button.style.top = `${newButtonY}px`; } if (this.isOpen && panel && Menu.panelWasDragged) { const panelWidth = panel.offsetWidth; const panelHeight = panel.offsetHeight; let panelNewLeft = newButtonX + Menu._panelRelativeOffsetX; let panelNewTop = newButtonY + Menu._panelRelativeOffsetY; panelNewLeft = Math.max(EDGE_MARGIN_PX, Math.min(panelNewLeft, window.innerWidth - panelWidth - EDGE_MARGIN_PX)); panelNewTop = Math.max(EDGE_MARGIN_PX, Math.min(panelNewTop, window.innerHeight - panelHeight - EDGE_MARGIN_PX)); panel.style.left = `${panelNewLeft}px`; panel.style.top = `${panelNewTop}px`; panel.style.right = 'auto'; panel.style.bottom = 'auto'; Menu._panelRelativeOffsetX = panelNewLeft - newButtonX; Menu._panelRelativeOffsetY = panelNewTop - newButtonY; } else if (this.isOpen && panel) { this._positionPanelRelativeToButton(button, panel); } } else if (this.isOpen && panel) { this._positionPanelRelativeToButton(button, panel); } };
    Menu._positionPanelRelativeToButton = function(button, panel) { if (!button || !panel) return; const buttonRect = button.getBoundingClientRect(); const panelRect = panel.getBoundingClientRect(); let newTop = buttonRect.top - panelRect.height - 10; let newLeft = buttonRect.left; const docDir = document.documentElement.dir || window.getComputedStyle(document.documentElement).direction; if (docDir === 'rtl') { newLeft = buttonRect.right - panelRect.width; } if (newTop < EDGE_MARGIN_PX) { newTop = Math.max(EDGE_MARGIN_PX, buttonRect.bottom + 10); } if (newTop + panelRect.height > window.innerHeight - EDGE_MARGIN_PX) { newTop = Math.max(EDGE_MARGIN_PX, window.innerHeight - panelRect.height - EDGE_MARGIN_PX); } if (newLeft < EDGE_MARGIN_PX) newLeft = EDGE_MARGIN_PX; if (newLeft + panelRect.width > window.innerWidth - EDGE_MARGIN_PX) { newLeft = Math.max(EDGE_MARGIN_PX, window.innerWidth - panelRect.width - EDGE_MARGIN_PX); } panel.style.top = `${newTop}px`; panel.style.left = `${newLeft}px`; panel.style.bottom = 'auto'; panel.style.right = 'auto'; Menu._panelRelativeOffsetX = newLeft - buttonRect.left; Menu._panelRelativeOffsetY = newTop - buttonRect.top; };
	Menu._handleMenuButtonClick = function (event) { if (Menu.buttonDragOccurred) { Menu.buttonDragOccurred = false; return; } this.toggleMenu(); };
	Menu._handlePanelActionClick = function (event) { const targetButton = event.target.closest('button'); if (targetButton && targetButton.dataset.action) { this.handleAction(targetButton.dataset.action, targetButton); } };
	Menu._handlePanelKeydown = function (event) { if (event.key === 'Escape' && this.isOpen) { this.toggleMenu(); } };
	Menu._handleTabKeyFocusTrap = function (event) { if (!this.isOpen && !Menu.isStructurePanelOpen) return; const activePanel = Menu.isStructurePanelOpen ? Menu.pageStructurePanel : document.getElementById(MENU_PANEL_ID); if (!activePanel) return; const focusableElements = Array.from(activePanel.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])')).filter(el => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement); if (focusableElements.length === 0) return; const firstFocusableEl = focusableElements[0]; const lastFocusableEl = focusableElements[focusableElements.length - 1]; if (event.key === 'Tab') { if (event.shiftKey) { if (document.activeElement === firstFocusableEl) { lastFocusableEl.focus(); event.preventDefault(); } } else { if (document.activeElement === lastFocusableEl) { firstFocusableEl.focus(); event.preventDefault(); } else if (!focusableElements.includes(document.activeElement)) { firstFocusableEl.focus(); event.preventDefault(); } } } };
    Menu._startDragging = function (event, isButtonDrag) { const button = document.getElementById(MENU_BUTTON_ID); const panel = document.getElementById(MENU_PANEL_ID); if (!button || !panel) return; let draggedElement = isButtonDrag ? button : panel; if (!isButtonDrag) { const target = event.target; if (target.closest('button')) { this.isPanelDragging = false; return; } const isPanelItself = target === panel; const isPanelTitle = target === panel.querySelector('h3'); if (!isPanelItself && !isPanelTitle) { this.isPanelDragging = false; return; } } this.isButtonDragging = isButtonDrag; this.isPanelDragging = !isButtonDrag; if (isButtonDrag) { Menu.buttonDragOccurred = false; Menu.buttonWasDragged = true; } else { Menu.panelWasDragged = true; } draggedElement.classList.add('dragging'); const coords = getClientCoords(event); const buttonRect = button.getBoundingClientRect(); const panelRect = panel.getBoundingClientRect(); Menu._initialButtonX = buttonRect.left; Menu._initialButtonY = buttonRect.top; Menu._initialPanelX = panelRect.left; Menu._initialPanelY = panelRect.top; Menu._initialMouseX = coords.clientX; Menu._initialMouseY = coords.clientY; if (isButtonDrag && button.style.transform !== 'none') { button.style.transform = 'none'; } if (Menu.isOpen) { Menu._panelRelativeOffsetX = panelRect.left - buttonRect.left; Menu._panelRelativeOffsetY = panelRect.top - buttonRect.top; } else { const estimatedPanelHeight = panel.offsetHeight || 300; const estimatedPanelWidth = panel.offsetWidth || 320; const docDir = document.documentElement.dir || window.getComputedStyle(document.documentElement).direction; if (docDir === 'rtl') { Menu._panelRelativeOffsetX = buttonRect.width - estimatedPanelWidth; } else { Menu._panelRelativeOffsetX = 0; } Menu._panelRelativeOffsetY = -estimatedPanelHeight - 10; } if (event.type === 'touchstart') { event.preventDefault(); } };
	Menu._handleButtonMouseDown = function (event) { Menu.buttonDragOccurred = false; this._startDragging(event, true); };
	Menu._handlePanelMouseDown = function (event) { this._startDragging(event, false); };
	Menu._handleDocumentMouseMove = function (event) { if (!this.isButtonDragging && !this.isPanelDragging) return; const button = document.getElementById(MENU_BUTTON_ID); const panel = document.getElementById(MENU_PANEL_ID); if (!button || !panel) return; if (this.isButtonDragging) { Menu.buttonDragOccurred = true; } const coords = getClientCoords(event); const deltaX = coords.clientX - Menu._initialMouseX; const deltaY = coords.clientY - Menu._initialMouseY; let targetButtonX, targetButtonY, targetPanelX, targetPanelY; if (this.isButtonDragging) { targetButtonX = Menu._initialButtonX + deltaX; targetButtonY = Menu._initialButtonY + deltaY; } else if (this.isPanelDragging) { targetPanelX = Menu._initialPanelX + deltaX; targetPanelY = Menu._initialPanelY + deltaY; targetButtonX = targetPanelX - Menu._panelRelativeOffsetX; targetButtonY = targetPanelY - Menu._panelRelativeOffsetY; } const buttonWidth = button.offsetWidth; const buttonHeight = button.offsetHeight; targetButtonX = Math.max(EDGE_MARGIN_PX, Math.min(targetButtonX, window.innerWidth - buttonWidth - EDGE_MARGIN_PX)); targetButtonY = Math.max(EDGE_MARGIN_PX, Math.min(targetButtonY, window.innerHeight - buttonHeight - EDGE_MARGIN_PX)); button.style.left = `${targetButtonX}px`; button.style.top = `${targetButtonY}px`; button.style.transform = 'none'; button.style.right = 'auto'; button.style.bottom = 'auto'; if (Menu.isOpen) { const panelWidth = panel.offsetWidth; const panelHeight = panel.offsetHeight; let desiredPanelX = targetButtonX + Menu._panelRelativeOffsetX; let desiredPanelY = targetButtonY + Menu._panelRelativeOffsetY; desiredPanelX = Math.max(EDGE_MARGIN_PX, Math.min(desiredPanelX, window.innerWidth - panelWidth - EDGE_MARGIN_PX)); desiredPanelY = Math.max(EDGE_MARGIN_PX, Math.min(desiredPanelY, window.innerHeight - panelHeight - EDGE_MARGIN_PX)); panel.style.left = `${desiredPanelX}px`; panel.style.top = `${desiredPanelY}px`; panel.style.right = 'auto'; panel.style.bottom = 'auto'; if (this.isButtonDragging) { let adjustedButtonX = desiredPanelX - Menu._panelRelativeOffsetX; let adjustedButtonY = desiredPanelY - Menu._panelRelativeOffsetY; adjustedButtonX = Math.max(EDGE_MARGIN_PX, Math.min(adjustedButtonX, window.innerWidth - buttonWidth - EDGE_MARGIN_PX)); adjustedButtonY = Math.max(EDGE_MARGIN_PX, Math.min(adjustedButtonY, window.innerHeight - buttonHeight - EDGE_MARGIN_PX)); if(button.style.left !== `${adjustedButtonX}px` || button.style.top !== `${adjustedButtonY}px`){ button.style.left = `${adjustedButtonX}px`; button.style.top = `${adjustedButtonY}px`; } Menu._panelRelativeOffsetX = desiredPanelX - adjustedButtonX; Menu._panelRelativeOffsetY = desiredPanelY - adjustedButtonY; } } if (event.type === 'touchmove') { event.preventDefault(); } };
    Menu._handleDocumentMouseUp = function () { let settingsChanged = false; if (this.isButtonDragging) { this.isButtonDragging = false; const button = document.getElementById(MENU_BUTTON_ID); if (button) button.classList.remove('dragging'); settingsChanged = true; } if (this.isPanelDragging) { this.isPanelDragging = false; const panel = document.getElementById(MENU_PANEL_ID); if (panel) panel.classList.remove('dragging'); settingsChanged = true; } if (settingsChanged) { this._saveSettings(); } };
    Menu.toggleMenu = function () { const panel = document.getElementById(MENU_PANEL_ID); const button = document.getElementById(MENU_BUTTON_ID); if (!panel || !button) return; this.isOpen = !this.isOpen; panel.style.display = this.isOpen ? 'block' : 'none'; panel.classList.toggle('ar-aaa-menu-open', this.isOpen); panel.setAttribute('aria-hidden', String(!this.isOpen)); button.setAttribute('aria-expanded', String(this.isOpen)); if (this.isOpen) { if (!Menu.panelWasDragged || !panel.style.left || !panel.style.top) { this._positionPanelRelativeToButton(button, panel); } const firstFocusableButton = panel.querySelector('button:not([disabled])'); if (firstFocusableButton) { firstFocusableButton.focus(); } } else { button.focus(); if(Menu.isStructurePanelOpen) {this._togglePageStructurePanel(false);}} logAction(`Menu ${this.isOpen ? 'opened' : 'closed'}`); this._saveSettings(); };

	Menu.handleAction = function (action, targetButton) {
		logAction(`Action: ${action}`, true);
		if (action === 'close-menu') { this.toggleMenu(); return; } 
        if (action === 'page-structure') { this._togglePageStructurePanel(); return; }
        if (action === 'close-structure-panel') { this._togglePageStructurePanel(false); return; }


        if(action.startsWith('profile-')) {
            const profileName = action.substring('profile-'.length);
            this._applyProfile(profileName);
            this._saveSettings();
            return;
        }

		switch (action) {
			case 'increase-text': case 'decrease-text': this._handleTextSizeAction(action, targetButton); break;
			case 'contrast-high': case 'contrast-invert': this._handleContrastAction(action, targetButton); break;
			case 'highlight-links': case 'enhanced-focus': this._handleHighlightAction(action, targetButton); break;
            case 'read-aloud': this._handleReadAloudAction(targetButton); break; 
            case 'reading-mode': this._handleReadingModeAction(targetButton); break;
            case 'reading-mask': this._handleReadingMaskAction(targetButton); break;
            case 'reading-line': this._handleReadingLineAction(targetButton); break;
			case 'stop-animations': this._handleStopAnimationsAction(targetButton); break;
			case 'toggle-dyslexia-font': this._handleDyslexiaFontAction(targetButton); break;
			case 'reset-all': this._resetAllSettings(); break; 
		}
        if (action !== 'read-aloud') { 
		    this._saveSettings();
        }
	};

    Menu._togglePageStructurePanel = function(forceShow) {
        if (!Menu.pageStructurePanel) return;
        Menu.isStructurePanelOpen = (forceShow !== undefined) ? forceShow : !Menu.isStructurePanelOpen;
        Menu.pageStructurePanel.style.display = Menu.isStructurePanelOpen ? 'block' : 'none';
        Menu.pageStructurePanel.setAttribute('aria-hidden', String(!Menu.isStructurePanelOpen));

        if (Menu.isStructurePanelOpen) {
            this._populatePageStructurePanel();
            const firstFocusable = Menu.pageStructurePanel.querySelector('button, [href]');
            if (firstFocusable) firstFocusable.focus();
        } else {
            const menuButton = document.getElementById(MENU_BUTTON_ID);
            if (menuButton && Menu.isOpen) { 
                const mainPanelFirstButton = document.getElementById(MENU_PANEL_ID)?.querySelector('button');
                if(mainPanelFirstButton) mainPanelFirstButton.focus();
                else menuButton.focus();
            } else if (menuButton) {
                menuButton.focus();
            }
        }
    };

    Menu._populatePageStructurePanel = function() {
        if (!Menu.pageStructurePanel) return;

        const createList = (selector, containerId, itemType) => {
            const container = Menu.pageStructurePanel.querySelector(`#${containerId} ul`);
            if (!container) return;
            container.innerHTML = ''; 
            let elements;
            if (itemType === 'landmarks') {
                const landmarkRoles = ['main', 'navigation', 'banner', 'contentinfo', 'complementary', 'form', 'region', 'search'];
                const semanticLandmarks = 'main, nav, header, footer, aside, section[aria-label], section[aria-labelledby], form[aria-label], form[aria-labelledby]';
                elements = Array.from(document.querySelectorAll(landmarkRoles.map(r => `[role="${r}"]`).join(', ') + `, ${semanticLandmarks}`));
            } else {
                elements = Array.from(document.querySelectorAll(selector));
            }
            
            elements = elements.filter(el => el.offsetWidth > 0 || el.offsetHeight > 0); 

            if (elements.length === 0) {
                container.innerHTML = `<li>${Menu._getLocalizedString('noItemsFound') || 'No items found.'}</li>`;
                return;
            }

            elements.forEach((el, index) => {
                let text = el.textContent.trim().substring(0, 50) + (el.textContent.trim().length > 50 ? '...' : '');
                if (itemType === 'links' && !text) text = el.href;
                if (itemType === 'landmarks' && !text) text = el.getAttribute('aria-label') || el.tagName.toLowerCase();
                if (!text) text = `${itemType} ${index + 1}`;

                const li = document.createElement('li');
                const button = document.createElement('button');
                button.textContent = text;
                button.title = el.textContent.trim();
                button.addEventListener('click', () => {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add(CLASS_TEMP_HIGHLIGHT);
                    setTimeout(() => { el.classList.remove(CLASS_TEMP_HIGHLIGHT); }, 2000);
                    this._togglePageStructurePanel(false); 
                });
                li.appendChild(button);
                container.appendChild(li);
            });
        };

        createList('h1, h2, h3, h4, h5, h6', 'ar-aaa-structure-headings', 'Heading');
        createList('', 'ar-aaa-structure-landmarks', 'landmarks'); 
        createList('a[href]', 'ar-aaa-structure-links', 'Link');
    };


    Menu._applyProfile = function(profileName) {
        const profile = Menu.profiles[profileName];
        if (!profile) {
            logAction(`Profile "${profileName}" not found.`);
            return;
        }
        logAction(`Applying profile: ${profileName}`);
        
        this._resetAllSettings(true); 

        const panel = document.getElementById(MENU_PANEL_ID);

        if (profile.settings.fontScaleLevel !== undefined) {
            Menu.fontScaleLevel = profile.settings.fontScaleLevel;
            this._applyFontScaleToElements();
        }
        if (profile.settings.activeContrastMode) {
            const contrastButton = panel.querySelector(`button[data-action="contrast-${profile.settings.activeContrastMode}"]`);
            if (contrastButton) this._handleContrastAction(`contrast-${profile.settings.activeContrastMode}`, contrastButton);
        }
        if (profile.settings.highlightLinks) {
            const hlButton = panel.querySelector('button[data-action="highlight-links"]');
            if (hlButton && !Menu.areLinksHighlighted) this._handleHighlightAction('highlight-links', hlButton);
        }
        if (profile.settings.enhancedFocus) {
             const efButton = panel.querySelector('button[data-action="enhanced-focus"]');
            if (efButton && !Menu.isFocusEnhanced) this._handleHighlightAction('enhanced-focus', efButton);
        }
        if (profile.settings.stopAnimations) {
            const saButton = panel.querySelector('button[data-action="stop-animations"]');
            if (saButton && !Menu.areAnimationsStopped) this._handleStopAnimationsAction(saButton);
        }
        if (profile.settings.dyslexiaFont) {
            const dfButton = panel.querySelector('button[data-action="toggle-dyslexia-font"]');
            if (dfButton && !Menu.isDyslexiaFontActive) this._handleDyslexiaFontAction(dfButton);
        }
        if (profile.settings.readingMode) {
            const rmButton = panel.querySelector('button[data-action="reading-mode"]');
            if (rmButton && !Menu.isReadingModeActive) this._handleReadingModeAction(rmButton);
        }
        if (profile.settings.readingMask) {
            const rmaskButton = panel.querySelector('button[data-action="reading-mask"]');
            if (rmaskButton && !Menu.isReadingMaskActive) this._handleReadingMaskAction(rmaskButton);
        }
        if (profile.settings.readingLine) {
            const rlineButton = panel.querySelector('button[data-action="reading-line"]');
            if (rlineButton && !Menu.isReadingLineActive) this._handleReadingLineAction(rlineButton);
        }
    };

	Menu._updateButtonActiveState = function (buttonElement, isActive) { if (!buttonElement) return; const action = buttonElement.dataset.action; if (isActive && action && action.startsWith('contrast-')) { const parentGroup = buttonElement.closest('.ar-aaa-button-row') || buttonElement.closest('.ar-aaa-menu-group'); if (parentGroup) { parentGroup.querySelectorAll('button[data-action^="contrast-"]').forEach(btn => { if (btn !== buttonElement) { btn.classList.remove('ar-aaa-menu-btn-active'); } }); } } buttonElement.classList.toggle('ar-aaa-menu-btn-active', isActive); };
	Menu._applyFontScaleToElements = function() { let elements = []; if (typeof window.ar_getElementsForMenuTextStyleAdjustments === 'function') { elements = window.ar_getElementsForMenuTextStyleAdjustments(); } if (!elements || elements.length === 0) { elements = Array.from(document.querySelectorAll( 'p, li, span, div:not(#' + MENU_PANEL_ID + '):not(#' + MENU_BUTTON_ID + '):not([class*="icon"]):not(:empty),' +  'h1, h2, h3, h4, h5, h6, a, label, td, th, caption, strong, em, b, i, small, big, sub, sup' )).filter(el => el.closest(`#${MENU_PANEL_ID}`) === null && el.closest(`#${MENU_BUTTON_ID}`) === null);  } elements.forEach(el => { if (!document.body.contains(el)) return;  if (!Menu._originalFontSizes.has(el)) { const initialComputedPx = parseFloat(window.getComputedStyle(el).fontSize); Menu._originalFontSizes.set(el, {  inline: el.style.fontSize || "", initialPx: initialComputedPx }); } const sizeData = Menu._originalFontSizes.get(el); let newSize = sizeData.initialPx * Math.pow(FONT_SIZE_MULTIPLIER, Menu.fontScaleLevel); if (newSize < 8) newSize = 8;  if (newSize > 72) newSize = 72;  el.classList.add(CLASS_TEXT_SCALED); el.style.setProperty('--ar-scaled-font-size', newSize + 'px'); }); };
    Menu._handleTextSizeAction = function (action, button) { if (action === 'increase-text') { Menu.fontScaleLevel++; } else if (action === 'decrease-text') { Menu.fontScaleLevel--; } this._applyFontScaleToElements(); };
	Menu._handleContrastAction = function (action, button) { const htmlEl = document.documentElement;  const bodyEl = document.body;  const isHighContrastAction = action === 'contrast-high'; const isInvertColorsAction = action === 'contrast-invert'; let newMode = 'default'; if (isHighContrastAction) { newMode = (this.activeContrastMode === 'high') ? 'default' : 'high'; } else if (isInvertColorsAction) { newMode = (this.activeContrastMode === 'inverted') ? 'default' : 'inverted'; }  htmlEl.classList.remove(CLASS_INVERT_COLORS); bodyEl.classList.remove(CLASS_HIGH_CONTRAST); const parentGroup = button.closest('.ar-aaa-button-row') || button.closest('.ar-aaa-menu-group'); if (parentGroup) { parentGroup.querySelectorAll('button[data-action^="contrast-"]').forEach(btn => { this._updateButtonActiveState(btn, false); }); } if (newMode === 'high') { bodyEl.classList.add(CLASS_HIGH_CONTRAST); this._updateButtonActiveState(button, true);  } else if (newMode === 'inverted') { htmlEl.classList.add(CLASS_INVERT_COLORS); this._updateButtonActiveState(button, true);  }  this.activeContrastMode = newMode; logAction(`Contrast mode set to: ${this.activeContrastMode}`); };
	Menu._handleHighlightAction = function (action, button) { const body = document.body; if (action === 'highlight-links') { this.areLinksHighlighted = !this.areLinksHighlighted; body.classList.toggle(CLASS_HIGHLIGHT_LINKS, this.areLinksHighlighted); this._updateButtonActiveState(button, this.areLinksHighlighted); logAction(`Highlight links ${this.areLinksHighlighted ? 'enabled' : 'disabled'}. Class on body: ${body.classList.contains(CLASS_HIGHLIGHT_LINKS)}`); } else if (action === 'enhanced-focus') { this.isFocusEnhanced = !this.isFocusEnhanced; body.classList.toggle(CLASS_ENHANCED_FOCUS, this.isFocusEnhanced); this._updateButtonActiveState(button, this.isFocusEnhanced); logAction(`Enhanced focus ${this.isFocusEnhanced ? 'enabled' : 'disabled'}. Class on body: ${body.classList.contains(CLASS_ENHANCED_FOCUS)}`); } };
    
    Menu._handleReadAloudAction = function (button) {
        if (!('speechSynthesis' in window)) { alert(Menu._getLocalizedString('speechNotSupported') || 'Speech synthesis not supported in this browser.'); button.disabled = true; return; }
        if (Menu.isReadingAloud) { window.speechSynthesis.cancel(); Menu.isReadingAloud = false; this._updateButtonActiveState(button, false); logAction('Speech cancelled by user', true); return; }
        let textToRead = ''; const selectedText = window.getSelection().toString().trim();
        if (selectedText) { textToRead = selectedText; logAction('Reading selected text.');
        } else { const mainContent = document.querySelector('main'); if (mainContent) { textToRead = mainContent.innerText; } else { const bodyClone = document.body.cloneNode(true); bodyClone.querySelectorAll('script, style, noscript, #' + MENU_BUTTON_ID + ', #' + MENU_PANEL_ID).forEach(el => el.remove()); textToRead = bodyClone.innerText; } logAction('Reading main content or body fallback.'); }
        if (textToRead.trim() === '') { logAction('No text found to read.'); return; }
        window.speechSynthesis.cancel(); 
        const utterance = new SpeechSynthesisUtterance(textToRead); const docLang = document.documentElement.lang || 'en'; utterance.lang = docLang;
        utterance.onstart = () => { Menu.isReadingAloud = true; this._updateButtonActiveState(button, true); logAction('Speech started'); };
        utterance.onend = () => { Menu.isReadingAloud = false; this._updateButtonActiveState(button, false); logAction('Speech finished'); };
        utterance.onerror = (event) => { Menu.isReadingAloud = false; this._updateButtonActiveState(button, false); console.error('Speech synthesis error:', event.error); logAction('Speech error'); };
        window.speechSynthesis.speak(utterance);
    };

    Menu._handleReadingModeAction = function(button) { Menu.isReadingModeActive = !Menu.isReadingModeActive; document.body.classList.toggle(CLASS_READING_MODE, Menu.isReadingModeActive); this._updateButtonActiveState(button, Menu.isReadingModeActive); logAction('Reading mode ' + (Menu.isReadingModeActive ? 'enabled' : 'disabled'), true); };
    Menu._handleReadingMaskAction = function(button) { Menu.isReadingMaskActive = !Menu.isReadingMaskActive; if (Menu.readingMaskTop && Menu.readingMaskBottom) { Menu.readingMaskTop.style.display = Menu.isReadingMaskActive ? 'block' : 'none'; Menu.readingMaskBottom.style.display = Menu.isReadingMaskActive ? 'block' : 'none'; } this._updateButtonActiveState(button, Menu.isReadingMaskActive); logAction('Reading mask ' + (Menu.isReadingMaskActive ? 'enabled' : 'disabled'), true); };
    Menu._handleReadingLineAction = function(button) { Menu.isReadingLineActive = !Menu.isReadingLineActive; if (Menu.readingLine) { Menu.readingLine.style.display = Menu.isReadingLineActive ? 'block' : 'none'; } this._updateButtonActiveState(button, Menu.isReadingLineActive); logAction('Reading line ' + (Menu.isReadingLineActive ? 'enabled' : 'disabled'), true); };
	Menu._handleStopAnimationsAction = function (button) { this.areAnimationsStopped = !this.areAnimationsStopped; document.body.classList.toggle(CLASS_ANIMATIONS_STOPPED, this.areAnimationsStopped); this._updateButtonActiveState(button, this.areAnimationsStopped); if (this.areAnimationsStopped) { const gifsToFreeze = Array.from(document.querySelectorAll('img[src*=".gif"]:not([data-ar-gif-frozen="true"])')).filter(img => { try { return new URL(img.src, window.location.href).pathname.toLowerCase().endsWith('.gif'); } catch (e) { return (img.src || '').toLowerCase().includes('.gif'); } }); gifsToFreeze.forEach(img => { if (typeof window.ar_isVisuallyHidden === 'function' && window.ar_isVisuallyHidden(img)) return; img.dataset.arOriginalSrc = img.src; img.dataset.arOriginalAlt = img.alt || ''; img.dataset.arOriginalDisplay = img.style.display || ''; img.dataset.arOriginalWidth = img.offsetWidth + 'px'; img.dataset.arOriginalHeight = img.offsetHeight + 'px'; const tempImage = new Image(); tempImage.crossOrigin = 'Anonymous'; tempImage.onload = () => { const canvas = document.createElement('canvas'); canvas.width = tempImage.naturalWidth || parseInt(img.dataset.arOriginalWidth) || img.width || 50; canvas.height = tempImage.naturalHeight || parseInt(img.dataset.arOriginalHeight) || img.height || 50; canvas.className = img.className; canvas.style.cssText = img.style.cssText;  canvas.style.width = img.dataset.arOriginalWidth; canvas.style.height = img.dataset.arOriginalHeight; if (window.getComputedStyle(img).display === 'inline') { canvas.style.display = 'inline-block'; } else { canvas.style.display = img.dataset.arOriginalDisplay || 'block'; } canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', img.dataset.arOriginalAlt || `Frozen animation: ${img.src.split('/').pop()}`); canvas.dataset.arFrozenGifCanvas = 'true'; if (!img.id) { img.id = (typeof window.ar_generateUniqueElementId === 'function' ? window.ar_generateUniqueElementId('ar-original-gif-') : `ar-gif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`); } canvas.dataset.arOriginalImgId = img.id; const ctx = canvas.getContext('2d'); try { ctx.drawImage(tempImage, 0, 0, canvas.width, canvas.height); img.style.display = 'none'; img.dataset.arGifFrozen = 'true'; if (img.parentNode) { img.parentNode.insertBefore(canvas, img.nextSibling); } } catch (e) { console.error('ARMenu: Failed to draw GIF to canvas. Freezing by replacing src.', e); img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';  img.style.display = img.dataset.arOriginalDisplay || ''; img.dataset.arGifFrozen = 'true'; img.dataset.arGifFrozenFallback = 'true'; } }; tempImage.onerror = () => { console.error('ARMenu: Failed to load GIF for freezing. Replacing src.'); img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; img.dataset.arGifFrozen = 'true'; img.dataset.arGifFrozenFallback = 'true'; }; tempImage.src = img.dataset.arOriginalSrc;  }); } else { document.querySelectorAll('canvas[data-ar-frozen-gif-canvas="true"]').forEach(canvas => { const originalImgId = canvas.dataset.arOriginalImgId; if (originalImgId) { const originalImg = document.getElementById(originalImgId); if (originalImg) { originalImg.style.display = originalImg.dataset.arOriginalDisplay || '';  ['arGifFrozen', 'arOriginalSrc', 'arOriginalAlt', 'arOriginalDisplay', 'arOriginalWidth', 'arOriginalHeight', 'arGifFrozenFallback'].forEach(attr => delete originalImg.dataset[attr]); } } if (canvas.parentNode) { canvas.parentNode.removeChild(canvas); } }); document.querySelectorAll('img[data-ar-gif-frozen-fallback="true"]').forEach(img => { if (img.dataset.arOriginalSrc) { img.src = img.dataset.arOriginalSrc; } ['arGifFrozen', 'arGifFrozenFallback', 'arOriginalSrc', 'arOriginalAlt', 'arOriginalDisplay', 'arOriginalWidth', 'arOriginalHeight'].forEach(attr => delete img.dataset[attr]); }); } };
	Menu._handleDyslexiaFontAction = function (button) { this.isDyslexiaFontActive = !this.isDyslexiaFontActive; document.body.classList.toggle(CLASS_DYSLEXIA_FONT, this.isDyslexiaFontActive); this._updateButtonActiveState(button, this.isDyslexiaFontActive); };

	Menu._resetAllSettings = function (calledByProfile = false) {
        Menu.fontScaleLevel = 0;
        document.querySelectorAll('.' + CLASS_TEXT_SCALED).forEach(el => {
            el.classList.remove(CLASS_TEXT_SCALED);
            el.style.removeProperty('--ar-scaled-font-size');
            if (Menu._originalFontSizes.has(el)) {
                const sizeState = Menu._originalFontSizes.get(el);
                if (sizeState.inline) {
                    el.style.fontSize = sizeState.inline; 
                } else {
                    el.style.removeProperty('font-size');
                }
            } else {
                 el.style.removeProperty('font-size');
            }
        });
		Menu._originalFontSizes.clear(); 
        if (Menu.isReadingAloud && 'speechSynthesis' in window) { window.speechSynthesis.cancel(); }
        Menu.isReadingAloud = false; Menu.isReadingModeActive = false; Menu.isReadingMaskActive = false; Menu.isReadingLineActive = false;
		document.documentElement.classList.remove(CLASS_INVERT_COLORS); 
        document.body.classList.remove( CLASS_HIGH_CONTRAST, CLASS_HIGHLIGHT_LINKS, CLASS_ENHANCED_FOCUS, CLASS_ANIMATIONS_STOPPED, CLASS_DYSLEXIA_FONT, CLASS_READING_MODE );
        this.activeContrastMode = 'default'; this.areLinksHighlighted = false; this.isFocusEnhanced = false; this.areAnimationsStopped = false; this.isDyslexiaFontActive = false;
        if (Menu.readingMaskTop) Menu.readingMaskTop.style.display = 'none'; if (Menu.readingMaskBottom) Menu.readingMaskBottom.style.display = 'none'; if (Menu.readingLine) Menu.readingLine.style.display = 'none';
        if (Menu.isStructurePanelOpen) { this._togglePageStructurePanel(false); }
        const panel = document.getElementById(MENU_PANEL_ID); if (panel) { panel.querySelectorAll('button[data-action]').forEach(btn => { this._updateButtonActiveState(btn, false); }); }
		const menuButton = document.getElementById(MENU_BUTTON_ID); if (menuButton) { menuButton.style.right = '20px'; menuButton.style.top = '50%'; menuButton.style.transform = 'translateY(-50%)'; menuButton.style.left = 'auto'; menuButton.style.bottom = 'auto'; Menu.buttonWasDragged = false; }
        if (panel) { Menu.panelWasDragged = false; if (this.isOpen) { this._positionPanelRelativeToButton(menuButton, panel); } }
		
        if (!calledByProfile) {
            logAction('All settings reset.'); 
            this._saveSettings(); 
        }
	};

    Menu._saveSettings = function() { 
        const button = document.getElementById(MENU_BUTTON_ID); const panel = document.getElementById(MENU_PANEL_ID);
        let buttonPosition = { left: button ? button.style.left : null, top: button ? button.style.top : null, right: button ? button.style.right : null, bottom: button ? button.style.bottom : null, transform: button ? button.style.transform : null, wasDragged: Menu.buttonWasDragged };
        let panelPosition = null; if (Menu.isOpen && panel && Menu.panelWasDragged) { panelPosition = { left: panel.style.left, top: panel.style.top }; }
        const settings = {
            activeContrastMode: Menu.activeContrastMode, areLinksHighlighted: Menu.areLinksHighlighted,
            isFocusEnhanced: Menu.isFocusEnhanced, areAnimationsStopped: Menu.areAnimationsStopped, isDyslexiaFontActive: Menu.isDyslexiaFontActive, 
            fontScaleLevel: Menu.fontScaleLevel, isOpen: Menu.isOpen, buttonPosition: buttonPosition, panelPosition: panelPosition,
            panelWasDragged: Menu.panelWasDragged, isReadingModeActive: Menu.isReadingModeActive,
            isReadingMaskActive: Menu.isReadingMaskActive, isReadingLineActive: Menu.isReadingLineActive
        };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); logAction("Settings saved."); }
        catch (e) { console.error("Error saving settings to localStorage:", e); }
    };

    Menu._loadSettings = function() { 
        try {
            const savedSettingsJSON = localStorage.getItem(STORAGE_KEY); if (!savedSettingsJSON) { logAction("No saved settings found."); return; }
            const savedSettings = JSON.parse(savedSettingsJSON);
            if (!savedSettings ) { logAction("Saved settings are invalid. Using defaults."); localStorage.removeItem(STORAGE_KEY); return; }
            logAction("Loading saved settings.");
            Menu.activeContrastMode = savedSettings.activeContrastMode || 'default';
            if (Menu.activeContrastMode === 'high') document.body.classList.add(CLASS_HIGH_CONTRAST); else if (Menu.activeContrastMode === 'inverted') document.documentElement.classList.add(CLASS_INVERT_COLORS);
            Menu.areLinksHighlighted = savedSettings.areLinksHighlighted || false; if(Menu.areLinksHighlighted) document.body.classList.add(CLASS_HIGHLIGHT_LINKS);
            Menu.isFocusEnhanced = savedSettings.isFocusEnhanced || false; if(Menu.isFocusEnhanced) document.body.classList.add(CLASS_ENHANCED_FOCUS);
            if (savedSettings.areAnimationsStopped) { const stopAnimButton = document.querySelector(`#${MENU_PANEL_ID} button[data-action="stop-animations"]`); if (stopAnimButton) { Menu.areAnimationsStopped = false; this._handleStopAnimationsAction(stopAnimButton); Menu.areAnimationsStopped = true; document.body.classList.add(CLASS_ANIMATIONS_STOPPED);}} 
            Menu.isDyslexiaFontActive = savedSettings.isDyslexiaFontActive || false; if(Menu.isDyslexiaFontActive) document.body.classList.add(CLASS_DYSLEXIA_FONT);
            Menu.fontScaleLevel = savedSettings.fontScaleLevel || 0; if (Menu.fontScaleLevel !== 0) { this._applyFontScaleToElements(); }
            Menu.isReadingModeActive = savedSettings.isReadingModeActive || false; if(Menu.isReadingModeActive) document.body.classList.add(CLASS_READING_MODE);
            Menu.isReadingMaskActive = savedSettings.isReadingMaskActive || false; if(Menu.isReadingMaskActive && Menu.readingMaskTop && Menu.readingMaskBottom) { Menu.readingMaskTop.style.display = 'block'; Menu.readingMaskBottom.style.display = 'block'; }
            Menu.isReadingLineActive = savedSettings.isReadingLineActive || false; if(Menu.isReadingLineActive && Menu.readingLine) { Menu.readingLine.style.display = 'block'; }
            const button = document.getElementById(MENU_BUTTON_ID);
            if (button && savedSettings.buttonPosition) {
                Menu.buttonWasDragged = savedSettings.buttonPosition.wasDragged || false;
                if (Menu.buttonWasDragged && savedSettings.buttonPosition.left && savedSettings.buttonPosition.top) { button.style.left = savedSettings.buttonPosition.left; button.style.top = savedSettings.buttonPosition.top; button.style.right = 'auto'; button.style.bottom = 'auto'; button.style.transform = 'none';
                } else if (savedSettings.buttonPosition.right && savedSettings.buttonPosition.top && savedSettings.buttonPosition.transform) { button.style.right = savedSettings.buttonPosition.right; button.style.top = savedSettings.buttonPosition.top; button.style.transform = savedSettings.buttonPosition.transform; button.style.left = 'auto'; button.style.bottom = 'auto'; }
            }
            const panel = document.getElementById(MENU_PANEL_ID);
            if (panel) {
                this._updateButtonActiveState(panel.querySelector('[data-action="contrast-high"]'), Menu.activeContrastMode === 'high');
                this._updateButtonActiveState(panel.querySelector('[data-action="contrast-invert"]'), Menu.activeContrastMode === 'inverted');
                this._updateButtonActiveState(panel.querySelector('[data-action="highlight-links"]'), Menu.areLinksHighlighted);
                this._updateButtonActiveState(panel.querySelector('[data-action="enhanced-focus"]'), Menu.isFocusEnhanced);
                this._updateButtonActiveState(panel.querySelector('[data-action="stop-animations"]'), Menu.areAnimationsStopped);
                this._updateButtonActiveState(panel.querySelector('[data-action="toggle-dyslexia-font"]'), Menu.isDyslexiaFontActive);
                this._updateButtonActiveState(panel.querySelector('[data-action="reading-mode"]'), Menu.isReadingModeActive);
                this._updateButtonActiveState(panel.querySelector('[data-action="reading-mask"]'), Menu.isReadingMaskActive);
                this._updateButtonActiveState(panel.querySelector('[data-action="reading-line"]'), Menu.isReadingLineActive);
            }
            Menu.panelWasDragged = savedSettings.panelWasDragged || false;
            if (savedSettings.isOpen) {
                Menu.isOpen = false; this.toggleMenu(); 
                if (panel && Menu.panelWasDragged && savedSettings.panelPosition && savedSettings.panelPosition.left && savedSettings.panelPosition.top) {
                    panel.style.left = savedSettings.panelPosition.left; panel.style.top = savedSettings.panelPosition.top;
                    panel.style.right = 'auto'; panel.style.bottom = 'auto';
                    if(button) { const panelRect = panel.getBoundingClientRect(); const buttonRect = button.getBoundingClientRect(); Menu._panelRelativeOffsetX = panelRect.left - buttonRect.left; Menu._panelRelativeOffsetY = panelRect.top - buttonRect.top; }
                }
            }
            this._handleWindowResize(); 
        } catch (e) { console.error("Error loading settings from localStorage:", e); localStorage.removeItem(STORAGE_KEY); }
    };

	if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { 
            AR_AccessibilityMenu.init();
        });
    } else { 
        AR_AccessibilityMenu.init(); 
    }

}(AR_AccessibilityMenu));
