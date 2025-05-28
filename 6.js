// File 6: ar_check_modules_part1.js

// Part of AR_CheckModules: First half of check functions
(function(AR_CheckModulesProto) {

	AR_CheckModulesProto.checkContentStructure = function (globalState) {
		ar_logSection('Structure and Relationships');
		this._checkVisualHeadings(globalState);
		this._checkPseudoLists();
        this._checkParagraphsWithOnlyImages();
		console.groupEnd();
	};

    AR_CheckModulesProto._checkVisualHeadings = function(globalState) {
        document.querySelectorAll('div, span, p').forEach(el => {
			try {
				if (ar_isVisuallyHidden(el)) return;
				const style = window.getComputedStyle(el);
				const fontSize = parseFloat(style.fontSize);
				const fontWeight = style.fontWeight;
				const isSemanticallyHeading = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(el.tagName);
                const hasHeadingRole = el.getAttribute('role') === 'heading';
				if (fontSize >= 20 && (parseInt(fontWeight) >= 600 || fontWeight === 'bold' || fontWeight === 'bolder') &&
					!isSemanticallyHeading && el.textContent.trim().length > 0) {
					if (!hasHeadingRole) {
                        let level = 2;
                        const h1 = document.querySelector('h1');
                        if (h1) {
                            const h1FontSize = parseFloat(window.getComputedStyle(h1).fontSize);
                            if (fontSize > h1FontSize * 0.85) level = 1;
                            else if (fontSize < h1FontSize * 0.6) level = 3;
                        }
						ar_setAttributeAndLog(el, 'role', 'heading', 'Moderate', 'Visually strong text not semantic heading. Auto-added role="heading".', 'Use H1-H6 or ensure correct aria-level.', 'Operable', '2.4.6 Headings and Labels', 'AA');
						ar_setAttributeAndLog(el, 'aria-level', level.toString(), 'Info', `Auto-set aria-level="${level}". Review.`, 'Ensure aria-level matches visual hierarchy.', 'Operable', '2.4.6 Headings and Labels', 'AA');
					} else if (hasHeadingRole && !el.hasAttribute('aria-level')) {
                        ar_setAttributeAndLog(el, 'aria-level', '2', 'Minor', 'role="heading" without aria-level. Auto-set to "2".', 'Provide aria-level.', 'Operable', '2.4.6 Headings and Labels', 'AA');
                    }
				}
			} catch (e) { console.error('Error: VisualHeadings Check:', e, el); }
		});
    };

    AR_CheckModulesProto._checkPseudoLists = function() {
        document.querySelectorAll('div, p').forEach(el => {
            try {
                if (ar_isVisuallyHidden(el) || el.closest('ul, ol, dl')) return;
                const textContent = (el.textContent || '').trim();
                const isPseudoListItem = textContent.startsWith('• ') || textContent.startsWith('- ') || /^\d+\.\s/.test(textContent);
                if (isPseudoListItem) {
                    let nextSibling = el.nextElementSibling;
                    let similarSiblings = [el];
                    while (nextSibling && !nextSibling.closest('ul,ol,dl')) {
                        const siblingText = (nextSibling.textContent || '').trim();
                        if (siblingText.startsWith('• ') || siblingText.startsWith('- ') || /^\d+\.\s/.test(siblingText)) {
                            similarSiblings.push(nextSibling);
                            nextSibling = nextSibling.nextElementSibling;
                        } else { break; }
                    }
                    if (similarSiblings.length > 1) {
                        const listType = /^\d+\.\s/.test(textContent) ? 'ol' : 'ul';
                        const newList = document.createElement(listType);
                        const parent = el.parentNode;
                        parent.insertBefore(newList, el);
                        similarSiblings.forEach(sibling => {
                            const listItem = document.createElement('li');
                            listItem.appendChild(sibling);
                            newList.appendChild(listItem);
                        });
                        ar_logAccessibilityIssue('Moderate', `Wrapped ${similarSiblings.length} pseudo-list items in <${listType}>.`, newList, 'Review auto-generated list structure.', 'Perceivable', '1.3.1 Info and Relationships', true, 'A');
                    }
                }
            } catch (e) { console.error('Error: PseudoList Check:', e, el); }
        });
    };

    AR_CheckModulesProto._checkParagraphsWithOnlyImages = function() {
        document.querySelectorAll('p').forEach(el => {
            try {
                if (el.children.length === 1 && el.children[0].tagName === 'IMG') {
                    const img = el.children[0];
                    if (((img.alt || '').trim() === '' || img.getAttribute('role') === 'presentation') && !ar_hasAccessibleNameForElement(img)) {
                        ar_setAttributeAndLog(el, 'role', 'presentation', 'Minor', 'Paragraph contains only a decorative image. Added role="presentation" to the paragraph.', 'If the paragraph is purely a decorative container for the image, role="presentation" is appropriate. Otherwise, ensure the image has proper alt text.', 'Perceivable', '1.3.1 Info and Relationships', true, 'A');
                    }
                }
            } catch (e) { console.error('Error: ParagraphsWithOnlyImages Check:', e, el); }
        });
    };

	AR_CheckModulesProto.checkMediaIntegrity = function () {
		ar_logSection('Media Integrity (Images, Links)');
		this._checkBrokenImages();
		this._checkEmptyLinks();
		console.groupEnd();
	};

	AR_CheckModulesProto._checkBrokenImages = function () {
		document.querySelectorAll('img').forEach(img => {
			try {
				if (ar_isVisuallyHidden(img) && !img.hasAttribute('alt')) {
					ar_setAttributeAndLog(img, 'alt', '', 'Info', 'Visually hidden image was missing alt attribute. Auto-set alt="".', 'Ensure decorative hidden images have an empty alt attribute.', 'Perceivable', '1.1.1 Non-text Content', 'A');
					return;
				}
				if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
                    if (img.src.includes('placehold.co') && img.src.includes('Broken%20Image')) return;
					const originalSrc = img.src;
					const altText = (img.alt || 'Broken Image').trim();
					const placeholderWidth = Math.max(50, img.width || parseInt(img.style.width, 10) || 150);
                    const placeholderHeight = Math.max(50, img.height || parseInt(img.style.height, 10) || 100);
					const placeholderSrc = AR_CONFIG.PLACEHOLDER_IMAGE_URL
						.replace('{width}', placeholderWidth.toString())
						.replace('{height}', placeholderHeight.toString())
						.replace('{text}', encodeURIComponent(altText.substring(0, 50)));
					img.setAttribute('data-original-src', originalSrc);
					img.src = placeholderSrc;
                    img.alt = `Placeholder for broken image: ${altText}`;
					ar_logAccessibilityIssue('Critical', 'Broken image detected. Replaced with a placeholder.', img, `Original src: ${originalSrc}. Verify the image source or ensure the alt text is sufficiently descriptive if the image cannot be restored.`, 'Perceivable', '1.1.1 Non-text Content', true, 'A');
				}
			} catch (e) { console.error('Error: BrokenImage Check:', e, img); }
		});
	};

	AR_CheckModulesProto._checkEmptyLinks = function () {
		document.querySelectorAll('a[href]').forEach(a => {
			try {
				if (ar_isVisuallyHidden(a)) return;
				const href = a.getAttribute('href');
				const hasName = ar_hasAccessibleNameForElement(a);
				if (!hasName && (href === '#' || href === '' || !href || href.trim().toLowerCase() === 'javascript:void(0);')) {
					const titleAttr = (a.getAttribute('title') || '').trim();
					if (titleAttr.length > AR_CONFIG.MIN_CHAR_LENGTH_FOR_NON_EMPTY_ALT_TEXT) {
						ar_setAttributeAndLog(a, 'aria-label', titleAttr, 'Minor', 'Link with no discernible text content but a title attribute. Auto-set aria-label from title.', 'Review auto-generated aria-label. Prefer descriptive link text over title attribute for links.', 'Perceivable', '2.4.4 Link Purpose (In Context)', 'A');
					} else {
						const rect = a.getBoundingClientRect();
						if (rect.width < 10 && rect.height < 10 && rect.width > 0 && rect.height > 0) {
							ar_setAttributeAndLog(a, 'aria-hidden', 'true', 'Minor', 'Small, empty, non-functional link auto-hidden with aria-hidden="true".', 'Remove or provide a descriptive name if the link is functional.', 'Perceivable', '2.4.4 Link Purpose (In Context)', true, 'A');
						} else {
							ar_setAttributeAndLog(a, 'aria-label', 'Link - Description Needed', 'Critical', 'Link has no discernible text or accessible name. Auto-added a generic aria-label.', 'Provide descriptive text content or an aria-label for the link.', 'Perceivable', '2.4.4 Link Purpose (In Context)', true, 'A');
						}
					}
				}
			} catch (e) { console.error('Error: EmptyLink Check:', e, a); }
		});
	};

	AR_CheckModulesProto.checkImageAltText = function () {
		ar_logSection('Image Alternative Text');
		document.querySelectorAll('img').forEach(img => {
			try {
				if (ar_isVisuallyHidden(img) && img.hasAttribute('alt')) return;
                if (img.src.includes('placehold.co') && img.alt.startsWith('Placeholder for broken image')) return;
				if (img.naturalWidth === 0 && !img.src.startsWith('data:image/svg+xml') && !img.src.includes('placehold.co')) {
                    if (img.complete && !img.hasAttribute('alt')) {
                        ar_setAttributeAndLog(img, 'alt', 'Broken image (description needed)', 'Critical', 'Image appears broken and is missing alt text.', 'Fix image source or provide descriptive alt text.', 'Perceivable', '1.1.1', 'A');
                    } return;
                }
				if (!img.hasAttribute('alt')) {
					const generatedAlt = this._generateAltTextAttempt(img);
					ar_setAttributeAndLog(img, 'alt', generatedAlt, 'Critical', `Image missing alt attribute. Auto-set to "${generatedAlt}".`, '**Manual review required.**', 'Perceivable', '1.1.1 Non-text Content', 'A');
				} else {
					const alt = (img.alt || '').trim();
					if (alt === '') this._checkDecorativeImageContext(img);
					else this._checkInformativeAltText(img, alt);
				}
			} catch (e) { console.error('Error: ImageAltText Check:', e, img); }
		});
		console.groupEnd();
	};

	AR_CheckModulesProto._generateAltTextAttempt = function (img) {
		let altText = 'Image (description needed)';
		const src = (img.src || '').toLowerCase();
		const className = (img.className || '').toLowerCase();
		if (AR_CONFIG.AVATAR_KEYWORDS.some(kw => src.includes(kw) || className.includes(kw))) {
			altText = 'User avatar';
		} else {
			const filenameMatch = src.match(/[^/\\&?]+\.\w{3,4}(?=([?&].*$|$))/);
			if (filenameMatch) {
				const filename = filenameMatch[0].substring(0, filenameMatch[0].lastIndexOf('.')).replace(AR_CONFIG.FILENAME_CLEANUP_REGEX, ' ');
				if (filename.length > 3 && filename.length < 50 && !/\d{4,}/.test(filename) && !/(icon|logo|banner|image|pic)/i.test(filename)) {
					altText = filename.charAt(0).toUpperCase() + filename.slice(1);
				}
			}
		}
		return altText;
	};

	AR_CheckModulesProto._checkDecorativeImageContext = function (img) {
		const src = (img.src || '').toLowerCase();
		if (/(chart|graph|diagram|stats|figure)/.test(src) && (img.offsetWidth > 50 || img.offsetHeight > 50)) {
			ar_setAttributeAndLog(img, 'alt', 'Image (description needed, was decorative)', 'Moderate', `Image has alt="" but src suggests it might be informative. Auto-set placeholder.`, 'Verify if decorative.', 'Perceivable', '1.1.1', 'A');
		}
		if (/(spacer|1x1)\.(gif|png|jpg)/i.test(src) && img.getAttribute('role') !== 'presentation') {
			ar_setAttributeAndLog(img, 'role', 'presentation', 'Minor', 'Spacer image with alt="". Auto-added role="presentation".', 'Spacers: alt="" and role="presentation".', 'Perceivable', '1.1.1', true, 'A');
		}
	};

	AR_CheckModulesProto._checkInformativeAltText = function (img, alt) {
		const filenameFromSrc = (img.src || '').split('/').pop().split('.')[0].replace(AR_CONFIG.FILENAME_CLEANUP_REGEX, ' ').toLowerCase();
		if (alt.toLowerCase() === filenameFromSrc && alt.length > 3) {
			ar_setAttributeAndLog(img, 'alt', `Image: ${alt} (description needed, was filename)`, 'Minor', `Alt text "${alt}" is filename. Auto-updated.`, 'Replace filename with description.', 'Perceivable', '1.1.1', 'A');
		}
        const genericAlts = ["image", "graphic", "picture", "photo", "logo", "icon", "banner"];
        if (genericAlts.includes(alt.toLowerCase()) && (img.offsetWidth > 30 || img.offsetHeight > 30)) {
             ar_logAccessibilityIssue('Minor', `Alt text "${alt}" is generic.`, img, 'Provide more specific alt text.', 'Perceivable', '1.1.1', false, 'A');
        }
	};

	AR_CheckModulesProto.checkIframeTitles = function () {
		ar_logSection('Iframe Titles');
		document.querySelectorAll('iframe').forEach(iframe => {
			try {
				if (!iframe.title || iframe.title.trim() === '') {
					const generatedTitle = this._generateIframeTitleAttempt(iframe);
					ar_setAttributeAndLog(iframe, 'title', generatedTitle, 'Critical', `Iframe missing title. Auto-set to "${generatedTitle}".`, '**Manual review required.**', 'Operable', '2.4.1, 4.1.2', 'A');
				}
			} catch (e) { console.error('Error: IframeTitles Check:', e, iframe); }
		});
		console.groupEnd();
	};

	AR_CheckModulesProto._generateIframeTitleAttempt = function (iframe) {
		let title = 'Embedded content';
		if (iframe.src) {
			try {
				const url = new URL(iframe.src);
				const hostname = url.hostname.toLowerCase();
				const allowedYouTubeHosts = ['youtube.com', 'youtu.be'];
				const allowedVimeoHosts = ['vimeo.com'];
				const allowedGoogleMapsHosts = ['maps.google.com', 'google.com'];
				if (allowedYouTubeHosts.includes(hostname) || allowedYouTubeHosts.some(h => hostname.endsWith(`.${h}`))) title = 'YouTube video player';
				else if (allowedVimeoHosts.includes(hostname) || allowedVimeoHosts.some(h => hostname.endsWith(`.${h}`))) title = 'Vimeo video player';
				else if (allowedGoogleMapsHosts.includes(hostname) || allowedGoogleMapsHosts.some(h => hostname.endsWith(`.${h}`))) title = 'Google Maps embed';
				else if (url.pathname.endsWith('.pdf')) title = `Embedded PDF document: ${url.pathname.split('/').pop()}`;
				else title = `Embedded content from ${url.hostname}`;
			} catch (e) { /* Keep generic title */ }
		}
		return title;
	};

	AR_CheckModulesProto.checkTableAccessibility = function () {
		ar_logSection('Table Accessibility');
		document.querySelectorAll('table').forEach(table => {
			try {
				if (ar_isVisuallyHidden(table)) return;
				const role = table.getAttribute('role');
				if (role === 'presentation' || role === 'none') {
					this._checkPresentationTable(table); return;
				}
				this._checkDataTableCaption(table);
				this._checkTableHeaders(table);
				this._checkLayoutTableHeuristic(table);
			} catch (e) { console.error('Error: TableAccessibility Check:', e, table); }
		});
		console.groupEnd();
	};

	AR_CheckModulesProto._checkDataTableCaption = function (table) {
		if (!table.querySelector('caption') && table.querySelectorAll('th').length > 0) {
			const caption = document.createElement('caption');
			caption.textContent = 'Table data (auto-caption)';
			Object.assign(caption.style, { position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' });
			table.prepend(caption);
			ar_logAccessibilityIssue('Moderate', 'Data table missing <caption>. Auto-added generic hidden caption.', table, '**Manual review required.**', 'Perceivable', '1.3.1', true, 'A');
		}
	};

	AR_CheckModulesProto._checkTableHeaders = function (table) {
		table.querySelectorAll('thead th').forEach(thEl => {
			if (!thEl.hasAttribute('scope')) {
				ar_setAttributeAndLog(thEl, 'scope', 'col', 'Minor', '<th> in <thead> missing scope. Auto-set "col".', 'Add scope="col".', 'Perceivable', '1.3.1', 'A');
			}
		});
		table.querySelectorAll('tbody tr > th:first-child, tfoot tr > th:first-child').forEach(thEl => {
            const parentRow = thEl.closest('tr');
            if (parentRow && parentRow.querySelectorAll('th').length === 1 && !thEl.hasAttribute('scope')) {
                ar_setAttributeAndLog(thEl, 'scope', 'row', 'Minor', 'First <th> in row missing scope. Auto-set "row".', 'Add scope="row".', 'Perceivable', '1.3.1', 'A');
            }
		});
	};

    AR_CheckModulesProto._checkLayoutTableHeuristic = function(table) {
        const thCount = table.querySelectorAll('th').length;
        const tdCount = table.querySelectorAll('td').length;
        const border = table.getAttribute('border');
        if (thCount === 0 && tdCount > 0 && (!border || border === '0') &&
            !table.querySelector('caption') && !table.hasAttribute('role') && !table.hasAttribute('summary')) {
            if (table.rows.length < 5 && Array.from(table.rows).every(r => r.cells.length < 5)) {
                ar_setAttributeAndLog(table, 'role', 'presentation', 'Minor', 'Table appears for layout. Auto-added role="presentation".', 'If data table, remove role & add semantics.', 'Perceivable', '1.3.1', true, 'A');
            }
        }
    };

    AR_CheckModulesProto._checkPresentationTable = function(table) {
        if (table.querySelector('caption')) {
            ar_logAccessibilityIssue('Minor', 'Table with role="presentation" has <caption>.', table, 'Remove <caption>.', 'Perceivable', '1.3.1', false, 'A');
        }
        if (table.hasAttribute('summary')) {
            ar_logAccessibilityIssue('Minor', 'Table with role="presentation" has summary.', table, 'Remove summary.', 'Perceivable', '1.3.1', false, 'A');
        }
        table.querySelectorAll('th, [scope]').forEach(el => {
            ar_logAccessibilityIssue('Minor', `Table with role="presentation" contains <${el.tagName.toLowerCase()}> or scope.`, el, `Remove <th> or scope. Use <td>.`, 'Perceivable', '1.3.1', false, 'A');
        });
    };

	AR_CheckModulesProto.checkOverlayFocusBlocking = function () {
		ar_logSection('Overlapping Elements (Modals/Popups)');
		document.querySelectorAll('body > div, body > section, body > aside, [role="dialog"], [role="alertdialog"]').forEach(el => {
			try {
				if (ar_isVisuallyHidden(el)) return;
				const style = window.getComputedStyle(el);
				const rect = el.getBoundingClientRect();
				const isOverlay = (style.position === 'fixed' || style.position === 'absolute') &&
					(rect.width >= window.innerWidth * 0.7 || rect.height >= window.innerHeight * 0.7) &&
					parseFloat(style.zIndex) > 0 && style.display !== 'none' && style.visibility !== 'hidden';
				if (isOverlay) {
					this._ensureModalAriaAttributes(el);
					this._manageBackgroundContentInteractivity(el);
				}
			} catch (e) { console.error('Error: OverlayFocusBlocking Check:', e, el); }
		});
		console.groupEnd();
	};

	AR_CheckModulesProto._ensureModalAriaAttributes = function (modalElement) {
		if (modalElement.getAttribute('aria-modal') !== 'true') {
			ar_setAttributeAndLog(modalElement, 'aria-modal', 'true', 'Critical', 'Potential modal lacks aria-modal="true". Auto-fixed.', 'Ensure focus trap & ESC.', 'Operable', '4.1.2 / 2.4.3', 'A');
		}
		const role = modalElement.getAttribute('role');
		if (role !== 'dialog' && role !== 'alertdialog') {
			ar_setAttributeAndLog(modalElement, 'role', 'dialog', 'Critical', 'Potential modal lacks role="dialog/alertdialog". Auto-fixed.', 'Use role="dialog" or "alertdialog".', 'Operable', '4.1.2', 'A');
		}
	};

	AR_CheckModulesProto._manageBackgroundContentInteractivity = function (modalElement) {
		if (modalElement.getAttribute('aria-modal') === 'true') {
			let hiddenElementsCount = 0;
			Array.from(document.body.children).forEach(child => {
				if (child !== modalElement && !modalElement.contains(child) &&
					!['SCRIPT', 'STYLE', 'LINK'].includes(child.tagName.toUpperCase()) &&
                    child.id !== AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID &&
                    child.id !== AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID) {
					if (child.getAttribute('aria-hidden') !== 'true') {
						if (child.hasAttribute('aria-hidden')) {
							child.setAttribute('data-ar-original-aria-hidden', child.getAttribute('aria-hidden'));
						}
						child.setAttribute('aria-hidden', 'true');
						hiddenElementsCount++;
					}
				}
			});
			if (hiddenElementsCount > 0) {
				ar_logAccessibilityIssue('Info', `Modal: ${hiddenElementsCount} background elements auto-set aria-hidden="true".`, modalElement, 'Ensure undone on modal close. Implement focus trap.', 'Operable', '2.4.3', true, 'A');
			}
		}
	};

	AR_CheckModulesProto.checkInteractiveElementSize = function () {
		ar_logSection('Interactive Element Size');
		document.querySelectorAll(AR_SELECTOR_STRINGS.INTERACTIVE_ELEMENTS).forEach(el => {
			try {
				if (ar_isVisuallyHidden(el)) return;
				const rect = el.getBoundingClientRect();
				if (rect.width > 0 && rect.height > 0 &&
					(rect.width < AR_CONFIG.MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX || rect.height < AR_CONFIG.MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX)) {
					const stylesToApply = {};
					const computedStyle = window.getComputedStyle(el);
					if (computedStyle.display === 'inline') stylesToApply['display'] = 'inline-block';
					if (rect.width < AR_CONFIG.MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX) stylesToApply['min-width'] = `${AR_CONFIG.MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX}px`;
					if (rect.height < AR_CONFIG.MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX) stylesToApply['min-height'] = `${AR_CONFIG.MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX}px`;
                    const currentPaddingV = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
                    const currentPaddingH = parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
                    if (rect.height < AR_CONFIG.MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX && currentPaddingV < 4) stylesToApply['padding-top'] = stylesToApply['padding-bottom'] = '0.3em';
                    if (rect.width < AR_CONFIG.MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX && currentPaddingH < 8) stylesToApply['padding-left'] = stylesToApply['padding-right'] = '0.5em';
					if (Object.keys(stylesToApply).length > 0) {
						ar_applyStylesAndLog(el, stylesToApply, 'Moderate', `Interactive element too small. Auto-adjusted.`, `Increase area to ${AR_CONFIG.MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX}x${AR_CONFIG.MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX}px.`, 'Operable', '2.5.5 Target Size', 'AAA');
					} else {
                         ar_logAccessibilityIssue('Moderate', `Interactive element too small. Could not auto-adjust.`, el, `Increase area to ${AR_CONFIG.MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX}x${AR_CONFIG.MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX}px.`, 'Operable', '2.5.5 Target Size', false, 'AAA');
                    }
				}
			} catch (e) { console.error('Error: InteractiveElementSize Check:', e, el); }
		});
		console.groupEnd();
	};

})(AR_CheckModules);
