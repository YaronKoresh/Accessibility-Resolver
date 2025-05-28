var AR_CheckModules = AR_CheckModules || {};
(function (AR_CheckModulesProto) {
	AR_CheckModulesProto.checkContentStructure = function (globalState) {
		ar_logSection('Structure and Relationships');
		this._checkVisualHeadings(globalState);
		this._checkPseudoLists();
		this._checkParagraphsWithOnlyImages();
		console.groupEnd()
	};
	AR_CheckModulesProto._checkVisualHeadings = function (globalState) {
		document.querySelectorAll('div, span, p').forEach(el => {
			try {
				if (ar_isVisuallyHidden(el) || el.closest('h1, h2, h3, h4, h5, h6'))
					return;
				const style = window.getComputedStyle(el);
				const fontSize = parseFloat(style.fontSize);
				const fontWeight = style.fontWeight;
				const isSemanticallyHeading = [
					'H1',
					'H2',
					'H3',
					'H4',
					'H5',
					'H6'
				].includes(el.tagName);
				const hasHeadingRole = el.getAttribute('role') === 'heading';
				if (fontSize >= 20 && (parseInt(fontWeight) >= 600 || fontWeight === 'bold' || fontWeight === 'bolder') && el.textContent.trim().length > 0) {
					if (!isSemanticallyHeading && !hasHeadingRole) {
						let level = 2;
						const h1 = document.querySelector('h1');
						if (h1) {
							const h1FontSize = parseFloat(window.getComputedStyle(h1).fontSize);
							if (fontSize > h1FontSize * 0.85) {
								level = 1
							} else if (fontSize < h1FontSize * 0.6) {
								level = 3
							}
						}
						ar_setAttributeAndLog(el, 'role', 'heading', 'Moderate', 'Visually strong text not semantic heading. Auto-added role="heading".', 'Use H1-H6 or ensure correct aria-level.', 'Operable', '2.4.6 Headings and Labels', 'AA');
						ar_setAttributeAndLog(el, 'aria-level', level.toString(), 'Info', `Auto-set aria-level="${ level }". Review.`, 'Ensure aria-level matches visual hierarchy.', 'Operable', '2.4.6 Headings and Labels', 'AA')
					} else if (hasHeadingRole && !el.hasAttribute('aria-level')) {
						ar_setAttributeAndLog(el, 'aria-level', '2', 'Minor', 'role="heading" without aria-level. Auto-set to "2".', 'Provide aria-level.', 'Operable', '2.4.6 Headings and Labels', 'AA')
					}
				} else if (hasHeadingRole && (fontSize < 16 || parseInt(fontWeight) < 500)) {
					ar_removeAttributeAndLog(el, 'role', 'Minor', 'Element with role="heading" does not appear visually as a heading. Auto-removed role.', 'Remove role="heading" if not a visual heading.', 'Robust', '4.1.2', 'A');
					ar_removeAttributeAndLog(el, 'aria-level', 'Minor', 'Removed associated aria-level.', '', 'Robust', '4.1.2', 'A')
				}
			} catch (e) {
				console.error('Error: VisualHeadings Check:', e, el)
			}
		})
	};
	AR_CheckModulesProto._checkPseudoLists = function () {
		document.querySelectorAll('div, p').forEach(el => {
			try {
				if (ar_isVisuallyHidden(el) || el.closest('ul, ol, dl'))
					return;
				const textContent = (el.textContent || '').trim();
				const isPseudoListItem = textContent.startsWith('\u2022 ') || textContent.startsWith('- ') || /^\d+\.\s/.test(textContent);
				if (isPseudoListItem) {
					let nextSibling = el.nextElementSibling;
					let similarSiblings = [el];
					while (nextSibling && !nextSibling.closest('ul,ol,dl')) {
						const siblingText = (nextSibling.textContent || '').trim();
						if (siblingText.startsWith('\u2022 ') || siblingText.startsWith('- ') || /^\d+\.\s/.test(siblingText)) {
							similarSiblings.push(nextSibling);
							nextSibling = nextSibling.nextElementSibling
						} else {
							break
						}
					}
					if (similarSiblings.length > 1) {
						const listType = /^\d+\.\s/.test(textContent) ? 'ol' : 'ul';
						const newList = document.createElement(listType);
						const parent = el.parentNode;
						if (parent) {
							parent.insertBefore(newList, el);
							similarSiblings.forEach(sibling => {
								const listItem = document.createElement('li');
								while (sibling.firstChild) {
									listItem.appendChild(sibling.firstChild)
								}
								sibling.remove();
								newList.appendChild(listItem)
							});
							ar_logAccessibilityIssue('Moderate', `Wrapped ${ similarSiblings.length } pseudo-list items in <${ listType }>.`, newList, 'Review auto-generated list structure. Ensure nested lists are handled correctly.', 'Perceivable', '1.3.1 Info and Relationships', true, 'A')
						}
					}
				}
			} catch (e) {
				console.error('Error: PseudoList Check:', e, el)
			}
		})
	};
	AR_CheckModulesProto._checkParagraphsWithOnlyImages = function () {
		document.querySelectorAll('p').forEach(el => {
			try {
				if (el.children.length === 1 && el.children[0].tagName === 'IMG') {
					const img = el.children[0];
					if (((img.alt || '').trim() === '' || img.getAttribute('role') === 'presentation') && !ar_hasAccessibleNameForElement(img)) {
						if (el.getAttribute('role') !== 'presentation') {
							ar_setAttributeAndLog(el, 'role', 'presentation', 'Minor', 'Paragraph contains only a decorative image. Added role="presentation" to the paragraph.', 'If the paragraph is purely a decorative container for the image, role="presentation" is appropriate. Otherwise, ensure the image has proper alt text.', 'Perceivable', '1.3.1 Info and Relationships', true, 'A')
						}
					} else if (el.getAttribute('role') === 'presentation' && ar_hasAccessibleNameForElement(img)) {
						ar_removeAttributeAndLog(el, 'role', 'Minor', 'Paragraph with role="presentation" contains informative image. Auto-removed role.', 'Remove role="presentation" if image is informative.', 'Robust', '4.1.2', 'A')
					}
				}
			} catch (e) {
				console.error('Error: ParagraphsWithOnlyImages Check:', e, el)
			}
		})
	};
	AR_CheckModulesProto.checkMediaIntegrity = function () {
		ar_logSection('Media Integrity (Images, Links)');
		this._checkBrokenImages();
		this._checkEmptyLinks();
		console.groupEnd()
	};
	AR_CheckModulesProto._checkBrokenImages = function () {
		document.querySelectorAll('img').forEach(img => {
			try {
				if (ar_isVisuallyHidden(img) && !img.hasAttribute('alt') || img.src.includes('placehold.co') && img.alt.startsWith('Placeholder for broken image')) {
					if (ar_isVisuallyHidden(img) && !img.hasAttribute('alt')) {
						ar_setAttributeAndLog(img, 'alt', '', 'Info', 'Visually hidden image was missing alt attribute. Auto-set alt="".', 'Ensure decorative hidden images have an empty alt attribute.', 'Perceivable', '1.1.1 Non-text Content', 'A')
					}
					return
				}
				if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
					if (img.src.includes('placehold.co') && img.src.includes('Broken%20Image'))
						return;
					const originalSrc = img.src;
					const altText = img.alt && img.alt.trim() !== '' ? img.alt.trim() : 'Broken Image';
					const placeholderWidth = Math.max(50, img.width || parseInt(img.style.width, 10) || 150);
					const placeholderHeight = Math.max(50, img.height || parseInt(img.style.height, 10) || 100);
					const placeholderSrc = AR_CONFIG.PLACEHOLDER_IMAGE_URL.replace('{width}', placeholderWidth.toString()).replace('{height}', placeholderHeight.toString()).replace('{text}', encodeURIComponent(altText.substring(0, 50)));
					img.setAttribute('data-original-src', originalSrc);
					img.src = placeholderSrc;
					img.alt = `Placeholder for broken image: ${ altText }`;
					ar_logAccessibilityIssue('Critical', 'Broken image detected. Replaced with a placeholder.', img, `Original src: ${ originalSrc }. Verify the image source or ensure the alt text is sufficiently descriptive if the image cannot be restored.`, 'Perceivable', '1.1.1 Non-text Content', true, 'A')
				}
			} catch (e) {
				console.error('Error: BrokenImage Check:', e, img)
			}
		})
	};
	AR_CheckModulesProto._checkEmptyLinks = function () {
		document.querySelectorAll('a[href]').forEach(a => {
			try {
				if (ar_isVisuallyHidden(a))
					return;
				const href = a.getAttribute('href');
				const hasName = ar_hasAccessibleNameForElement(a);
				if (!hasName && (href === '#' || href === '' || !href || href.trim().toLowerCase() === 'javascript:void(0);')) {
					const titleAttr = (a.getAttribute('title') || '').trim();
					if (titleAttr.length > AR_CONFIG.MIN_CHAR_LENGTH_FOR_NON_EMPTY_ALT_TEXT) {
						ar_setAttributeAndLog(a, 'aria-label', titleAttr, 'Minor', 'Link with no discernible text content but a title attribute. Auto-set aria-label from title.', 'Review auto-generated aria-label. Prefer descriptive link text over title attribute for links.', 'Perceivable', '2.4.4 Link Purpose (In Context)', 'A')
					} else {
						const rect = a.getBoundingClientRect();
						if (rect.width < 10 && rect.height < 10 && rect.width > 0 && rect.height > 0) {
							ar_setAttributeAndLog(a, 'aria-hidden', 'true', 'Minor', 'Small, empty, non-functional link auto-hidden with aria-hidden="true".', 'Remove or provide a descriptive name if the link is functional.', 'Perceivable', '2.4.4 Link Purpose (In Context)', true, 'A')
						} else {
							ar_setAttributeAndLog(a, 'aria-label', 'Link - Description Needed', 'Critical', 'Link has no discernible text or accessible name. Auto-added a generic aria-label.', 'Provide descriptive text content or an aria-label for the link.', 'Perceivable', '2.4.4 Link Purpose (In Context)', true, 'A')
						}
					}
				}
			} catch (e) {
				console.error('Error: EmptyLink Check:', e, a)
			}
		})
	};
	AR_CheckModulesProto.checkImageAltText = function () {
		ar_logSection('Image Alternative Text');
		document.querySelectorAll('img').forEach(img => {
			try {
				if (ar_isVisuallyHidden(img) && img.hasAttribute('alt') || img.src.includes('placehold.co') && img.alt.startsWith('Placeholder for broken image'))
					return;
				if (img.naturalWidth === 0 && !img.src.startsWith('data:image/svg+xml') && !img.src.includes('placehold.co')) {
					if (img.complete && !img.hasAttribute('alt')) {
						ar_setAttributeAndLog(img, 'alt', 'Broken image (description needed)', 'Critical', 'Image appears broken and is missing alt text.', 'Fix image source or provide descriptive alt text.', 'Perceivable', '1.1.1', 'A')
					}
					return
				}
				if (!img.hasAttribute('alt')) {
					const generatedAlt = this._generateAltTextAttempt(img);
					ar_setAttributeAndLog(img, 'alt', generatedAlt, 'Critical', `Image missing alt attribute. Auto-set to "${ generatedAlt }".`, '**Manual review required.**', 'Perceivable', '1.1.1 Non-text Content', 'A')
				} else {
					const alt = (img.alt || '').trim();
					if (alt === '') {
						this._checkDecorativeImageContext(img)
					} else {
						this._checkInformativeAltText(img, alt)
					}
				}
			} catch (e) {
				console.error('Error: ImageAltText Check:', e, img)
			}
		});
		console.groupEnd()
	};
	AR_CheckModulesProto._generateAltTextAttempt = function (img) {
		let altText = 'Image (description needed)';
		const src = (img.src || '').toLowerCase();
		const className = (img.className || '').toLowerCase();
		if (AR_CONFIG.AVATAR_KEYWORDS.some(kw => src.includes(kw) || className.includes(kw))) {
			altText = 'User avatar'
		} else {
			const filenameMatch = src.match(/[^/\\&?]+\.\w{3,4}(?=([?&].*$|$))/);
			if (filenameMatch) {
				const filename = filenameMatch[0].substring(0, filenameMatch[0].lastIndexOf('.')).replace(AR_CONFIG.FILENAME_CLEANUP_REGEX, ' ');
				if (filename.length > 3 && filename.length < 50 && !/\d{4,}/.test(filename) && !/(icon|logo|banner|image|pic)/i.test(filename)) {
					altText = filename.charAt(0).toUpperCase() + filename.slice(1)
				}
			}
		}
		if (img.title && img.title.trim().length > AR_CONFIG.MIN_CHAR_LENGTH_FOR_NON_EMPTY_ALT_TEXT && !/(image|graphic|picture|photo)/i.test(img.title.trim())) {
			altText = img.title.trim()
		} else if (img.parentElement && img.parentElement.textContent && img.parentElement.textContent.trim().length > 10 && img.parentElement.textContent.trim().length < 100) {
			const parentText = img.parentElement.textContent.trim().replace(/\s+/g, ' ');
			if (!/(image|graphic|picture|photo)/i.test(parentText)) {
				altText = parentText.substring(0, Math.min(parentText.length, 50)) + (parentText.length > 50 ? '...' : '')
			}
		}
		return altText
	};
	AR_CheckModulesProto._checkDecorativeImageContext = function (img) {
		const src = (img.src || '').toLowerCase();
		if (/(chart|graph|diagram|stats|figure)/.test(src) && (img.offsetWidth > 50 || img.offsetHeight > 50)) {
			ar_setAttributeAndLog(img, 'alt', 'Image (description needed, was decorative)', 'Moderate', `Image has alt="" but src suggests it might be informative. Auto-set placeholder.`, 'Verify if decorative. Provide descriptive alt text if informative.', 'Perceivable', '1.1.1', 'A')
		}
		if (/(spacer|1x1)\.(gif|png|jpg)/i.test(src) && img.getAttribute('role') !== 'presentation') {
			ar_setAttributeAndLog(img, 'role', 'presentation', 'Minor', 'Spacer image with alt="". Auto-added role="presentation".', 'Spacers: alt="" and role="presentation".', 'Perceivable', '1.1.1', true, 'A')
		}
	};
	AR_CheckModulesProto._checkInformativeAltText = function (img, alt) {
		const filenameFromSrc = (img.src || '').split('/').pop().split('.')[0].replace(AR_CONFIG.FILENAME_CLEANUP_REGEX, ' ').toLowerCase();
		if (alt.toLowerCase() === filenameFromSrc && alt.length > AR_CONFIG.MIN_CHAR_LENGTH_FOR_NON_EMPTY_ALT_TEXT) {
			ar_setAttributeAndLog(img, 'alt', `Image: ${ alt } (description needed, was filename)`, 'Minor', `Alt text "${ alt }" is filename. Auto-updated.`, 'Replace filename with description.', 'Perceivable', '1.1.1', 'A')
		}
		const genericAlts = [
			'image',
			'graphic',
			'picture',
			'photo',
			'logo',
			'icon',
			'banner'
		];
		if (genericAlts.includes(alt.toLowerCase()) && (img.offsetWidth > 30 || img.offsetHeight > 30)) {
			ar_logAccessibilityIssue('Minor', `Alt text "${ alt }" is generic.`, img, 'Provide more specific alt text.', 'Perceivable', '1.1.1', false, 'A')
		}
	};
	AR_CheckModulesProto.checkIframeTitles = function () {
		ar_logSection('Iframe Titles');
		document.querySelectorAll('iframe').forEach(iframe => {
			try {
				if (!iframe.title || iframe.title.trim() === '') {
					const generatedTitle = this._generateIframeTitleAttempt(iframe);
					ar_setAttributeAndLog(iframe, 'title', generatedTitle, 'Critical', `Iframe missing title. Auto-set to "${ generatedTitle }".`, '**Manual review required.**', 'Operable', '2.4.1, 4.1.2', 'A')
				}
			} catch (e) {
				console.error('Error: IframeTitles Check:', e, iframe)
			}
		});
		console.groupEnd()
	};
	AR_CheckModulesProto._generateIframeTitleAttempt = function (iframe) {
		let title = 'Embedded content';
		if (iframe.src) {
			try {
				const url = new URL(iframe.src);
				const hostname = url.hostname.toLowerCase();
				if (hostname.includes('youtube.com') || hostname.includes('youtu.be'))
					title = 'YouTube video player';
				else if (hostname.includes('vimeo.com'))
					title = 'Vimeo video player';
				else if (hostname.includes('maps.google.com') || hostname.includes('google.com/maps'))
					title = 'Google Maps embed';
				else if (url.pathname.endsWith('.pdf'))
					title = `Embedded PDF document: ${ url.pathname.split('/').pop() }`;
				else if (hostname && hostname !== 'about:blank')
					title = `Embedded content from ${ hostname.replace('www.', '') }`
			} catch (e) {
			}
		}
		return title
	};
	AR_CheckModulesProto.checkTableAccessibility = function () {
		ar_logSection('Table Accessibility');
		document.querySelectorAll('table').forEach(table => {
			try {
				if (ar_isVisuallyHidden(table))
					return;
				const role = table.getAttribute('role');
				if (role === 'presentation' || role === 'none') {
					this._checkPresentationTable(table);
					return
				}
				this._checkDataTableCaption(table);
				this._checkTableHeaders(table);
				this._checkLayoutTableHeuristic(table)
			} catch (e) {
				console.error('Error: TableAccessibility Check:', e, table)
			}
		});
		console.groupEnd()
	};
	AR_CheckModulesProto._checkDataTableCaption = function (table) {
		if (!table.querySelector('caption') && table.querySelectorAll('th').length > 0) {
			const caption = document.createElement('caption');
			caption.textContent = 'Table data (auto-caption)';
			Object.assign(caption.style, {
				position: 'absolute',
				left: '-9999px',
				width: '1px',
				height: '1px',
				overflow: 'hidden'
			});
			table.prepend(caption);
			ar_logAccessibilityIssue('Moderate', 'Data table missing <caption>. Auto-added generic hidden caption.', table, '**Manual review required.** Provide a descriptive caption.', 'Perceivable', '1.3.1', true, 'A')
		}
	};
	AR_CheckModulesProto._checkTableHeaders = function (table) {
		table.querySelectorAll('thead th').forEach(thEl => {
			if (!thEl.hasAttribute('scope')) {
				ar_setAttributeAndLog(thEl, 'scope', 'col', 'Minor', '<th> in <thead> missing scope. Auto-set "col".', 'Add scope="col".', 'Perceivable', '1.3.1', 'A')
			}
		});
		table.querySelectorAll('tbody tr > th:first-child, tfoot tr > th:first-child').forEach(thEl => {
			const parentRow = thEl.closest('tr');
			if (parentRow && parentRow.querySelectorAll('th').length === 1 && !thEl.hasAttribute('scope')) {
				ar_setAttributeAndLog(thEl, 'scope', 'row', 'Minor', 'First <th> in row missing scope. Auto-set "row".', 'Add scope="row".', 'Perceivable', '1.3.1', 'A')
			}
		})
	};
	AR_CheckModulesProto._checkLayoutTableHeuristic = function (table) {
		const thCount = table.querySelectorAll('th').length;
		const tdCount = table.querySelectorAll('td').length;
		const border = table.getAttribute('border');
		if (thCount === 0 && tdCount > 0 && (!border || border === '0') && !table.querySelector('caption') && !table.hasAttribute('role') && !table.hasAttribute('summary')) {
			if (table.rows.length < 5 && Array.from(table.rows).every(r => r.cells.length < 5)) {
				ar_setAttributeAndLog(table, 'role', 'presentation', 'Minor', 'Table appears to be used for layout. Auto-added role="presentation".', 'If this is a data table, remove role and add proper semantics (<th>, <caption>).', 'Perceivable', '1.3.1', true, 'A')
			}
		}
	};
	AR_CheckModulesProto._checkPresentationTable = function (table) {
		if (table.querySelector('caption')) {
			ar_logAccessibilityIssue('Minor', 'Table with role="presentation" has <caption>.', table, 'Remove <caption> from tables used for layout.', 'Perceivable', '1.3.1', false, 'A')
		}
		if (table.hasAttribute('summary')) {
			ar_logAccessibilityIssue('Minor', 'Table with role="presentation" has summary.', table, 'Remove summary from tables used for layout.', 'Perceivable', '1.3.1', false, 'A')
		}
		table.querySelectorAll('th, [scope]').forEach(el => {
			ar_logAccessibilityIssue('Minor', `Table with role="presentation" contains <${ el.tagName.toLowerCase() }> or scope attribute.`, el, `Remove <th> or scope attribute. Use <td> elements for layout tables.`, 'Perceivable', '1.3.1', false, 'A')
		})
	};
	AR_CheckModulesProto.checkOverlayFocusBlocking = function () {
		ar_logSection('Overlapping Elements (Modals/Popups)');
		document.querySelectorAll('body > div, body > section, body > aside, [role="dialog"], [role="alertdialog"]').forEach(el => {
			try {
				if (ar_isVisuallyHidden(el))
					return;
				const style = window.getComputedStyle(el);
				const rect = el.getBoundingClientRect();
				const isOverlay = (style.position === 'fixed' || style.position === 'absolute') && (rect.width >= window.innerWidth * 0.7 || rect.height >= window.innerHeight * 0.7) && parseFloat(style.zIndex) >= 1000 && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity > 0;
				if (isOverlay) {
					this._ensureModalAriaAttributes(el);
					this._manageBackgroundContentInteractivity(el)
				} else if (el.getAttribute('aria-modal') === 'true' || el.getAttribute('role') === 'dialog' || el.getAttribute('role') === 'alertdialog') {
					this._restoreBackgroundContentInteractivity(el)
				}
			} catch (e) {
				console.error('Error: OverlayFocusBlocking Check:', e, el)
			}
		});
		console.groupEnd()
	};
	AR_CheckModulesProto._ensureModalAriaAttributes = function (modalElement) {
		if (modalElement.getAttribute('aria-modal') !== 'true') {
			ar_setAttributeAndLog(modalElement, 'aria-modal', 'true', 'Critical', 'Potential modal lacks aria-modal="true". Auto-fixed.', 'Ensure focus trap & ESC handling. Set aria-modal="true" for modal dialogs.', 'Operable', '4.1.2 / 2.4.3', 'A')
		}
		const role = modalElement.getAttribute('role');
		if (role !== 'dialog' && role !== 'alertdialog') {
			ar_setAttributeAndLog(modalElement, 'role', 'dialog', 'Critical', 'Potential modal lacks role="dialog/alertdialog". Auto-fixed.', 'Use role="dialog" or "alertdialog" for modal dialogs.', 'Operable', '4.1.2', 'A')
		}
	};
	AR_CheckModulesProto._manageBackgroundContentInteractivity = function (modalElement) {
		if (modalElement.getAttribute('aria-modal') === 'true') {
			let hiddenElementsCount = 0;
			Array.from(document.body.children).forEach(child => {
				if (child !== modalElement && !modalElement.contains(child) && ![
						'SCRIPT',
						'STYLE',
						'LINK'
					].includes(child.tagName.toUpperCase()) && child.id !== AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID && child.id !== AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID) {
					if (child.getAttribute('aria-hidden') !== 'true') {
						if (child.hasAttribute('aria-hidden')) {
							child.setAttribute('data-ar-original-aria-hidden', child.getAttribute('aria-hidden'))
						}
						child.setAttribute('aria-hidden', 'true');
						hiddenElementsCount++
					}
				}
			});
			if (hiddenElementsCount > 0) {
				ar_logAccessibilityIssue('Info', `Modal: ${ hiddenElementsCount } background elements auto-set aria-hidden="true".`, modalElement, 'Ensure these elements are made visible on modal close. Implement a robust focus trap.', 'Operable', '2.4.3', true, 'A')
			}
		}
	};
	AR_CheckModulesProto._restoreBackgroundContentInteractivity = function (modalElement) {
		if (ar_isVisuallyHidden(modalElement)) {
			let restoredElementsCount = 0;
			Array.from(document.body.children).forEach(child => {
				if (child.getAttribute('aria-hidden') === 'true' && child.hasAttribute('data-ar-original-aria-hidden')) {
					child.setAttribute('aria-hidden', child.getAttribute('data-ar-original-aria-hidden'));
					child.removeAttribute('data-ar-original-aria-hidden');
					restoredElementsCount++
				} else if (child.getAttribute('aria-hidden') === 'true' && !child.hasAttribute('data-ar-original-aria-hidden') && child !== modalElement && !modalElement.contains(child)) {
					child.removeAttribute('aria-hidden');
					restoredElementsCount++
				}
			});
			if (restoredElementsCount > 0) {
				ar_logAccessibilityIssue('Info', `Modal: ${ restoredElementsCount } background elements auto-restored aria-hidden.`, modalElement, 'Verification of modal close logic is recommended.', 'Operable', '2.4.3', true, 'A')
			}
		}
	};
	AR_CheckModulesProto.checkInteractiveElementSize = function () {
		ar_logSection('Interactive Element Size');
		document.querySelectorAll(AR_SELECTOR_STRINGS.INTERACTIVE_ELEMENTS).forEach(el => {
			try {
				if (ar_isVisuallyHidden(el))
					return;
				const rect = el.getBoundingClientRect();
				if (rect.width > 0 && rect.height > 0 && (rect.width < AR_CONFIG.MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX || rect.height < AR_CONFIG.MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX)) {
					const stylesToApply = {};
					const computedStyle = window.getComputedStyle(el);
					if (computedStyle.display === 'inline') {
						stylesToApply['display'] = 'inline-block'
					}
					if (rect.width < AR_CONFIG.MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX) {
						stylesToApply['min-width'] = `${ AR_CONFIG.MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX }px`
					}
					if (rect.height < AR_CONFIG.MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX) {
						stylesToApply['min-height'] = `${ AR_CONFIG.MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX }px`
					}
					const currentPaddingV = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
					const currentPaddingH = parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
					if (rect.height < AR_CONFIG.MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX && currentPaddingV < 4) {
						stylesToApply['padding-top'] = stylesToApply['padding-bottom'] = '0.3em'
					}
					if (rect.width < AR_CONFIG.MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX && currentPaddingH < 8) {
						stylesToApply['padding-left'] = stylesToApply['padding-right'] = '0.5em'
					}
					if (Object.keys(stylesToApply).length > 0) {
						ar_applyStylesAndLog(el, stylesToApply, 'Moderate', `Interactive element too small. Auto-adjusted.`, `Increase area to ${ AR_CONFIG.MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX }x${ AR_CONFIG.MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX }px.`, 'Operable', '2.5.5 Target Size', 'AAA')
					} else {
						ar_logAccessibilityIssue('Moderate', `Interactive element too small. Could not auto-adjust.`, el, `Increase area to ${ AR_CONFIG.MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX }x${ AR_CONFIG.MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX }px.`, 'Operable', '2.5.5 Target Size', false, 'AAA')
					}
				}
			} catch (e) {
				console.error('Error: InteractiveElementSize Check:', e, el)
			}
		});
		console.groupEnd()
	};
	AR_CheckModulesProto.checkHoverFocusContent = function () {
		ar_logSection('Content on Hover/Focus (ARIA Attributes)');
		document.querySelectorAll('button, a[href], [role="button"], [role="link"], [role="menuitem"]').forEach(el => {
			try {
				if (ar_isVisuallyHidden(el))
					return;
				const hasPopup = el.hasAttribute('aria-haspopup');
				const isExpanded = el.getAttribute('aria-expanded');
				const controlsId = el.getAttribute('aria-controls');
				if (hasPopup) {
					const popupValue = el.getAttribute('aria-haspopup').toLowerCase();
					const validPopupValues = [
						'menu',
						'listbox',
						'tree',
						'grid',
						'dialog',
						'true',
						'false'
					];
					if (!validPopupValues.includes(popupValue)) {
						ar_setAttributeAndLog(el, 'aria-haspopup', 'true', 'Moderate', `Invalid aria-haspopup value "${ popupValue }". Auto-set to "true".`, 'Use valid values (menu, listbox, tree, grid, dialog, true, false).', 'Operable', '4.1.2', 'A')
					}
				}
				if (controlsId) {
					const controlledElement = document.getElementById(controlsId);
					if (controlledElement) {
						const isControlledElementVisible = !ar_isVisuallyHidden(controlledElement);
						if (isExpanded === null) {
							ar_setAttributeAndLog(el, 'aria-expanded', String(isControlledElementVisible), 'Minor', `aria-controls present without aria-expanded. Auto-fixed.`, 'Add and update aria-expanded to reflect the state of the controlled element.', 'Operable', '4.1.2', 'A')
						} else if (isExpanded === 'true' && !isControlledElementVisible || isExpanded === 'false' && isControlledElementVisible) {
							ar_setAttributeAndLog(el, 'aria-expanded', String(isControlledElementVisible), 'Minor', `aria-expanded value mismatch with controlled element visibility. Auto-corrected.`, 'Ensure aria-expanded accurately reflects the visibility state of the controlled element.', 'Operable', '4.1.2', 'A')
						}
					} else if (isExpanded !== null) {
						ar_logAccessibilityIssue('Moderate', `aria-controls points to a non-existent ID "${ controlsId }".`, el, 'Ensure aria-controls points to a valid ID of a controlled element.', 'Robust', '4.1.2', false, 'A')
					}
				} else if (isExpanded !== null) {
					ar_logAccessibilityIssue('Minor', `aria-expanded present without aria-controls.`, el, 'Add aria-controls if content is controlled by this element, or remove aria-expanded.', 'Operable', '4.1.2', false, 'A')
				}
			} catch (e) {
				console.error('Error: HoverFocusContent Check:', e, el)
			}
		});
		console.log('\n\uD83D\uDCA1 Manual Verification for WCAG 1.4.13 (Content on Hover/Focus) is CRUCIAL: Check for Dismissible, Hoverable, Persistent properties of popups.');
		console.groupEnd()
	};
	AR_CheckModulesProto.checkAutoFormSubmission = function () {
		ar_logSection('Automatic Form Submission');
		document.querySelectorAll('form, input:not([type="hidden"]), select, textarea').forEach(el => {
			try {
				if (ar_isVisuallyHidden(el))
					return;
				[
					'onfocus',
					'onchange'
				].forEach(attrName => {
					const attrValue = el.getAttribute(attrName);
					if (attrValue && attrValue.toLowerCase().includes('submit()')) {
						ar_removeAttributeAndLog(el, attrName, 'Minor', `${ el.tagName } with ${ attrName } auto-submits. Auto-removed.`, 'Avoid automatic form submission on focus or change. Use an explicit submit button.', 'Operable', '3.2.2', 'A')
					}
				})
			} catch (e) {
				console.error('Error: AutoFormSubmission Check:', e, el)
			}
		});
		console.groupEnd()
	};
	AR_CheckModulesProto.checkDuplicateIds = function (globalState) {
		ar_logSection('Duplicate IDs');
		document.querySelectorAll('[id]').forEach(el => {
			try {
				const id = el.id;
				if (!id || id.trim() === '')
					return;
				if (globalState.seenIds.has(id)) {
					const originalElement = globalState.seenIds.get(id);
					const newId = ar_generateUniqueElementId(`dup-${ id }-`);
					ar_setAttributeAndLog(el, 'id', newId, 'Critical', `Duplicate ID "#${ id }". Auto-fixed to "#${ newId }".`, `Original element:`, 'Robust', '4.1.1', 'A');
					console.warn('    Original element with conflicting ID:', originalElement);
					document.querySelectorAll(`[aria-labelledby*="${ id }"], [aria-describedby*="${ id }"], label[for="${ id }"]`).forEach(refEl => {
						if (refEl.id === newId)
							return;
						let attrToUpdate = '';
						let oldAttrValue = '';
						if (refEl.hasAttribute('aria-labelledby')) {
							attrToUpdate = 'aria-labelledby';
							oldAttrValue = refEl.getAttribute(attrToUpdate)
						} else if (refEl.hasAttribute('aria-describedby')) {
							attrToUpdate = 'aria-describedby';
							oldAttrValue = refEl.getAttribute(attrToUpdate)
						} else if (refEl.tagName === 'LABEL' && refEl.htmlFor === id) {
							attrToUpdate = 'for';
							oldAttrValue = refEl.htmlFor
						}
						if (attrToUpdate) {
							const newAttrValue = oldAttrValue.split(/\s+/).map(refId => refId === id ? newId : refId).join(' ');
							ar_setAttributeAndLog(refEl, attrToUpdate, newAttrValue, 'Minor', `Updated reference to duplicate ID from "#${ id }" to "#${ newId }".`, 'Ensure all references to the old ID are updated.', 'Robust', '4.1.1', true, 'A')
						}
					})
				} else {
					globalState.seenIds.set(id, el)
				}
			} catch (e) {
				console.error('Error: DuplicateIds Check:', e, el)
			}
		});
		console.groupEnd()
	};
	AR_CheckModulesProto.checkAccessibleNames = function () {
		ar_logSection('Accessible Names for Interactive Elements');
		document.querySelectorAll(`${ AR_SELECTOR_STRINGS.INTERACTIVE_ELEMENTS }, [role="img"]`).forEach(el => {
			try {
				if (ar_isVisuallyHidden(el) || ar_hasAccessibleNameForElement(el))
					return;
				const generatedName = this._generateAccessibleNameCandidate(el);
				if (generatedName && generatedName.trim() !== '') {
					ar_setAttributeAndLog(el, 'aria-label', generatedName, 'Moderate', `Lacked accessible name. Auto-fixed with aria-label: "${ generatedName }".`, '**Manual review required.**', 'Perceivable', '2.4.4 / 4.1.2', 'A')
				} else {
					ar_logAccessibilityIssue('Critical', `Lacked accessible name. Could not auto-generate.`, el, 'Provide descriptive text, title, aria-label, or associate with a <label>.', 'Perceivable', '2.4.4 / 4.1.2', false, 'A')
				}
			} catch (e) {
				console.error('Error: AccessibleNames Check:', e, el)
			}
		});
		console.groupEnd()
	};
	AR_CheckModulesProto._generateAccessibleNameCandidate = function (el) {
		let label = '';
		const tagName = el.tagName.toLowerCase();
		const type = (el.type || '').toLowerCase();
		if (el.placeholder && el.placeholder.trim())
			label = el.placeholder.trim();
		else if (el.title && el.title.trim())
			label = el.title.trim();
		if (tagName === 'input' && [
				'button',
				'submit',
				'reset'
			].includes(type) && el.value && el.value.trim()) {
			label = el.value.trim()
		} else if (tagName === 'input' && type === 'image' && el.src) {
			const filename = el.src.split('/').pop().split('.')[0].replace(AR_CONFIG.FILENAME_CLEANUP_REGEX, ' ');
			label = filename.length > 3 && filename.length < 30 ? `Submit ${ filename }` : 'Submit query';
			ar_setAttributeAndLog(el, 'alt', label, 'Moderate', `Input type="image" missing alt. Auto-set.`, '**Manual review.**', 'Perceivable', '1.1.1', 'A');
			return label
		} else if (tagName === 'img' || el.getAttribute('role') === 'img') {
			label = this._generateAltTextAttempt(el) || 'Image (description needed)'
		} else if (tagName === 'a') {
			const textContent = (el.textContent || '').trim();
			if (textContent.length > 2 && textContent.length < 50) {
				label = `Link: ${ textContent }`
			} else {
				let contextText = '';
				if (el.previousElementSibling && el.previousElementSibling.textContent) {
					contextText += el.previousElementSibling.textContent.trim()
				}
				if (el.nextElementSibling && el.nextElementSibling.textContent) {
					contextText += ' ' + el.nextElementSibling.textContent.trim()
				}
				if (el.parentElement && el.parentElement.textContent) {
					contextText += ' ' + el.parentElement.textContent.trim()
				}
				contextText = contextText.replace(/\s+/g, ' ').trim();
				if (contextText.length > 10 && contextText.length < 100) {
					label = `Link: ${ contextText.substring(0, Math.min(contextText.length, AR_CONFIG.MAX_WORDS_FROM_CONTEXT_FOR_GENERIC_LINK_ARIA_LABEL * 5)).replace(/\s+/g, ' ') }...`
				} else {
					label = 'Link - Description Needed'
				}
			}
		} else if (tagName === 'button') {
			const textContent = (el.textContent || '').trim();
			if (textContent.length > 2 && textContent.length < 50) {
				label = textContent
			} else {
				let iconLabel = '';
				for (const prefix of AR_CONFIG.COMMON_ICON_CLASS_PREFIXES) {
					for (const cssClass of Array.from(el.classList)) {
						if (cssClass.startsWith(prefix)) {
							const potentialLabel = cssClass.substring(prefix.length).replace(AR_CONFIG.FILENAME_CLEANUP_REGEX, ' ').trim();
							if (potentialLabel.length > 2) {
								iconLabel = `${ potentialLabel.charAt(0).toUpperCase() + potentialLabel.slice(1) } button`;
								break
							}
						}
					}
					if (iconLabel)
						break
				}
				label = iconLabel || 'Button - Action Needed'
			}
		}
		if (!label || label.startsWith('Unnamed') || label.includes('Description Needed')) {
			label = `${ el.getAttribute('role') || tagName } - Description Needed`
		}
		if (label.length > AR_CONFIG.MAX_CHAR_LENGTH_FOR_AUTOGENERATED_ARIA_LABEL) {
			label = label.substring(0, AR_CONFIG.MAX_CHAR_LENGTH_FOR_AUTOGENERATED_ARIA_LABEL - 3) + '...'
		}
		return label
	};
	AR_CheckModulesProto.checkLangAttribute = function () {
		ar_logSection('Language Attribute (HTML)');
		const htmlEl = document.documentElement;
		if (!htmlEl.lang || !htmlEl.lang.trim()) {
			ar_setAttributeAndLog(htmlEl, 'lang', 'en', 'Critical', '<html> missing lang attribute. Auto-set to "en".', '**Manual review required.** Verify "en" is the correct language for the page.', 'Understandable', '3.1.1 Language of Page', 'A')
		}
		console.groupEnd()
	};
	AR_CheckModulesProto.checkTabindexUsage = function () {
		ar_logSection('Tabindex Usage');
		document.querySelectorAll('[tabindex]').forEach(el => {
			try {
				const tabindexValue = parseInt(el.getAttribute('tabindex'), 10);
				if (tabindexValue > 0) {
					ar_setAttributeAndLog(el, 'tabindex', '0', 'Moderate', `Positive tabindex="${ tabindexValue }" found. Auto-fixed to "0".`, 'Avoid positive tabindex. Use a logical document order instead.', 'Operable', '2.4.3', 'A')
				}
				const role = el.getAttribute('role');
				const isNativeInteractive = el.matches(AR_SELECTOR_STRINGS.NATIVE_INTERACTIVE_TAGS);
				const commonInteractiveRoles = [
					'button',
					'link',
					'menuitem',
					'tab',
					'checkbox',
					'radio',
					'option',
					'switch',
					'slider',
					'treeitem',
					'textbox',
					'combobox',
					'listbox'
				];
				if (role && commonInteractiveRoles.includes(role) && !isNativeInteractive && tabindexValue < 0) {
					ar_setAttributeAndLog(el, 'tabindex', '0', 'Minor', `Custom control [role="${ role }"] is not focusable (tabindex="-1"). Auto-added tabindex="0".`, 'Ensure custom controls are focusable and in the tab order.', 'Operable', '2.1.1', 'A')
				}
				if (role && commonInteractiveRoles.includes(role) && tabindexValue === -1 && !el.disabled && el.getAttribute('aria-disabled') !== 'true') {
					ar_setAttributeAndLog(el, 'tabindex', '0', 'Minor', `Active custom control [role="${ role }"] has tabindex="-1". Auto-set to "0".`, 'Ensure active interactive controls are included in the tab order.', 'Operable', '2.1.1', 'A')
				}
			} catch (e) {
				console.error('Error: TabindexUsage Check:', e, el)
			}
		});
		console.groupEnd()
	};
	AR_CheckModulesProto.checkAriaMisuse = function () {
		ar_logSection('ARIA Misuse');
		this._checkAriaHiddenOnFocusable();
		this._checkRedundantAriaRoles();
		this._checkInvalidAriaRelationshipIDs();
		console.groupEnd()
	};
	AR_CheckModulesProto._checkAriaHiddenOnFocusable = function () {
		document.querySelectorAll('[aria-hidden="true"]').forEach(el => {
			try {
				const isElementFocusable = el.tabIndex >= 0 || el.matches(AR_SELECTOR_STRINGS.INTERACTIVE_ELEMENTS);
				const hasFocusableDescendant = el.querySelector(AR_SELECTOR_STRINGS.INTERACTIVE_ELEMENTS.split(',').map(s => `${ s.trim() }:not([tabindex="-1"])`).join(',')) !== null;
				if (isElementFocusable || hasFocusableDescendant) {
					ar_removeAttributeAndLog(el, 'aria-hidden', 'Critical', '`aria-hidden="true"` found on or containing focusable element. Auto-removed.', 'Do not use aria-hidden="true" on elements that are focusable or contain focusable descendants.', 'Perceivable', '4.1.2 / 1.3.1', true, 'A')
				}
			} catch (e) {
				console.error('Error: AriaHiddenOnFocusable Check:', e, el)
			}
		})
	};
	AR_CheckModulesProto._checkRedundantAriaRoles = function () {
		document.querySelectorAll('[role]').forEach(el => {
			try {
				const role = el.getAttribute('role').toLowerCase();
				const tagName = el.tagName.toLowerCase();
				const type = (el.type || '').toLowerCase();
				const implicitRoles = {
					'button': 'button',
					'a': 'link',
					'input[type=button]': 'button',
					'input[type=submit]': 'button',
					'input[type=reset]': 'button',
					'input[type=checkbox]': 'checkbox',
					'input[type=radio]': 'radio',
					'input[type=text]': 'textbox',
					'input[type=email]': 'textbox',
					'input[type=password]': 'textbox',
					'input[type=search]': 'searchbox',
					'input[type=tel]': 'textbox',
					'input[type=url]': 'textbox',
					'select': 'listbox',
					'textarea': 'textbox',
					'img': 'img',
					'h1': 'heading',
					'h2': 'heading',
					'h3': 'heading',
					'h4': 'heading',
					'h5': 'heading',
					'h6': 'heading',
					'ul': 'list',
					'ol': 'list',
					'li': 'listitem',
					'nav': 'navigation',
					'header': 'banner',
					'footer': 'contentinfo',
					'main': 'main',
					'aside': 'complementary',
					'form': 'form',
					'section': 'region',
					'article': 'article',
					'dialog': 'dialog',
					'figure': 'figure',
					'figcaption': 'figcaption',
					'table': 'table',
					'tbody': 'rowgroup',
					'tfoot': 'rowgroup',
					'thead': 'rowgroup',
					'tr': 'row',
					'td': 'cell',
					'th': 'columnheader'
				};
				let nativeRole = implicitRoles[tagName];
				if (tagName === 'input' && type) {
					nativeRole = implicitRoles[`input[type=${ type }]`] || nativeRole
				}
				if (tagName === 'a' && !el.hasAttribute('href')) {
					nativeRole = null
				}
				if (tagName === 'img' && (!el.hasAttribute('alt') || el.alt.trim() === '')) {
					nativeRole = null
				}
				if (tagName === 'section' && !ar_hasAccessibleNameForElement(el)) {
					nativeRole = null
				}
				if (nativeRole === role) {
					if (tagName === 'img' && (role === 'presentation' || role === 'none') && (!el.hasAttribute('alt') || el.alt.trim() === '')) {
						return
					}
					ar_removeAttributeAndLog(el, 'role', 'Minor', `Redundant ARIA role="${ role }" on <${ tagName }>. Auto-removed.`, 'Native HTML element implicitly conveys the same semantic meaning.', 'Robust', '4.1.2', 'A')
				}
				if (role === 'text' && el.matches(AR_SELECTOR_STRINGS.INTERACTIVE_ELEMENTS)) {
					ar_removeAttributeAndLog(el, 'role', 'Critical', 'Interactive element has `role="text"`. Auto-removed.', 'Remove role="text" from interactive elements.', 'Robust', '4.1.2', 'A')
				}
				if ((role === 'presentation' || role === 'none') && (el.tabIndex >= 0 || el.matches(AR_SELECTOR_STRINGS.NATIVE_INTERACTIVE_TAGS))) {
					const parentRole = el.parentElement ? el.parentElement.getAttribute('role') : null;
					if (!(role === 'presentation' && tagName === 'li' && (parentRole === 'tablist' || parentRole === 'listbox' || parentRole === 'menu'))) {
						ar_removeAttributeAndLog(el, 'role', 'Moderate', `Focusable element has role="${ role }". Auto-removed.`, `Focusable elements should not have role="presentation" or "none" as this removes their semantics.`, 'Robust', '4.1.2', 'A')
					}
				}
			} catch (e) {
				console.error('Error: RedundantAriaRoles Check:', e, el)
			}
		})
	};
	AR_CheckModulesProto._checkInvalidAriaRelationshipIDs = function () {
		[
			'aria-labelledby',
			'aria-describedby',
			'aria-controls',
			'aria-owns',
			'aria-flowto'
		].forEach(attr => {
			document.querySelectorAll(`[${ attr }]`).forEach(el => {
				try {
					const idRefs = el.getAttribute(attr).split(/\s+/).filter(id => id.trim() !== '');
					const validIdRefs = idRefs.filter(id => document.getElementById(id));
					if (validIdRefs.length !== idRefs.length) {
						if (validIdRefs.length > 0) {
							ar_setAttributeAndLog(el, attr, validIdRefs.join(' '), 'Minor', `${ attr } has invalid ID(s). Auto-removed invalid references.`, `Ensure ${ attr } points to existing element IDs.`, 'Robust', '4.1.2', 'A')
						} else {
							ar_removeAttributeAndLog(el, attr, 'Minor', `${ attr } only contains invalid ID(s). Auto-removed attribute.`, `Ensure ${ attr } points to existing element IDs.`, 'Robust', '4.1.2', 'A')
						}
					}
				} catch (e) {
					console.error(`Error: InvalidAriaRelationshipIDs Check for ${ attr }:`, e, el)
				}
			})
		})
	};
	AR_CheckModulesProto.checkContrastRatioForAllElements = function (targetElement = null) {
		if (!targetElement)
			ar_logSection('Text Contrast Ratios');
		const elementsToCheck = targetElement ? [targetElement] : Array.from(document.querySelectorAll(AR_SELECTOR_STRINGS.TEXT_CONTAINER_ELEMENTS_AFFECTED_BY_MENU));
		elementsToCheck.forEach(el => {
			try {
				if (ar_isVisuallyHidden(el) || el.textContent.trim().length === 0 || el.offsetWidth === 0 || el.offsetHeight === 0 || el.closest(`#${ AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID }`))
					return;
				const style = window.getComputedStyle(el);
				const fgOriginalRgba = ar_parseCssColorString(style.color);
				if (fgOriginalRgba[3] === 0)
					return;
				const bgEffectiveRgba = ar_getEffectiveBackgroundColorOfElement(el);
				const fgPerceivedRgba = ar_blendColors(fgOriginalRgba, bgEffectiveRgba);
				const currentContrast = ar_getContrastRatioBetweenColors(fgPerceivedRgba, bgEffectiveRgba);
				const isLargeText = ar_isTextLargeForWCAG(el);
				const requiredContrast = isLargeText ? AR_CONFIG.CONTRAST_RATIO_AA_LARGE_TEXT : AR_CONFIG.CONTRAST_RATIO_AA_NORMAL_TEXT;
				const originalFgColorString = `rgba(${ fgOriginalRgba.join(',') })`;
				const originalBgColorString = `rgb(${ bgEffectiveRgba.slice(0, 3).join(',') })`;
				if (currentContrast < requiredContrast) {
					const initialFailureKey = `${ el.id || el.dataset.arGeneratedId || ar_generateUniqueElementId('contrast-el-') }::CONTRAST_FAILURE_INITIAL::${ originalFgColorString }-${ originalBgColorString }`;
					if (!ar_loggedIssuesTracker.has(initialFailureKey)) {
						ar_logAccessibilityIssue('Critical', `Low contrast: ${ currentContrast.toFixed(2) }:1 (Req: ${ requiredContrast }:1).`, el, `Original: ${ originalFgColorString } on ${ originalBgColorString }. Attempting autofix.`, 'Perceivable', '1.4.3 Contrast (Minimum)', false, 'AA')
					}
					const fixed = this._attemptContrastFix(el, fgOriginalRgba, bgEffectiveRgba, requiredContrast, originalFgColorString, originalBgColorString);
					if (fixed.success) {
						ar_logAccessibilityIssue('Info', `Low contrast auto-fixed. New text: ${ fixed.newFgCss }, New BG: ${ fixed.newBgCss || 'unchanged' }. New contrast: ${ fixed.newContrast.toFixed(2) }:1. Strategy: ${ fixed.strategy }.`, el, `Original: ${ originalFgColorString }, ${ originalBgColorString }.`, 'Perceivable', '1.4.3', true, 'AA');
						ar_loggedIssuesTracker.add(initialFailureKey)
					} else {
						const failKey = `${ initialFailureKey }::AUTOFIX_FAILED`;
						if (!ar_loggedIssuesTracker.has(failKey)) {
							ar_logAccessibilityIssue('Critical', `Low contrast ${ currentContrast.toFixed(2) }:1. Autofix failed. Best achieved: ${ fixed.newContrast ? fixed.newContrast.toFixed(2) + ':1' : 'N/A' }.`, el, `Original: ${ originalFgColorString } on ${ originalBgColorString }. Manually adjust text or background color.`, 'Perceivable', '1.4.3', false, 'AA');
							ar_loggedIssuesTracker.add(failKey)
						}
					}
				}
			} catch (e) {
				console.error('Error: ContrastRatio Check:', e, el)
			}
		});
		if (!targetElement)
			console.groupEnd()
	};
	AR_CheckModulesProto._attemptContrastFix = function (el, fgRgba, bgRgba, requiredContrast, origFgCss, origBgCss) {
		let currentFgRgba = [...fgRgba], currentBgRgba = [...bgRgba];
		let newContrast = 0, newFgCss = '', newBgCss = null, strategy = '';
		if (currentFgRgba[3] < 1) {
			strategy = 'force_opaque_text';
			currentFgRgba[3] = 1;
			newFgCss = `rgb(${ currentFgRgba.slice(0, 3).join(',') })`;
			ar_storeOriginalInlineStyle(el, 'color');
			el.style.setProperty('color', newFgCss, 'important');
			const reEvaluatedPerceivedFg = ar_blendColors(currentFgRgba, currentBgRgba);
			newContrast = ar_getContrastRatioBetweenColors(reEvaluatedPerceivedFg, currentBgRgba);
			if (newContrast >= requiredContrast)
				return {
					success: true,
					newFgCss,
					newBgCss,
					newContrast,
					strategy
				}
		}
		strategy = 'simple_bw_text';
		const isBgDark = ar_getLuminanceFromRgb(currentBgRgba) < 0.5;
		currentFgRgba = isBgDark ? [
			255,
			255,
			255,
			1
		] : [
			0,
			0,
			0,
			1
		];
		newFgCss = `rgb(${ currentFgRgba.slice(0, 3).join(',') })`;
		ar_storeOriginalInlineStyle(el, 'color');
		el.style.setProperty('color', newFgCss, 'important');
		newContrast = ar_getContrastRatioBetweenColors(currentFgRgba, currentBgRgba);
		if (newContrast >= requiredContrast)
			return {
				success: true,
				newFgCss,
				newBgCss,
				newContrast,
				strategy
			};
		strategy = 'iterative_text_hsl';
		let tempFgRgb = fgRgba.slice(0, 3);
		for (let i = 0; i < AR_CONFIG.CONTRAST_ADJUSTMENT_STEPS; i++) {
			let [h, s, l] = ar_rgbToHsl(...tempFgRgb);
			l = isBgDark ? Math.min(1, l + AR_CONFIG.CONTRAST_ADJUSTMENT_AMOUNT * (i / (AR_CONFIG.CONTRAST_ADJUSTMENT_STEPS - 1) + 0.1)) : Math.max(0, l - AR_CONFIG.CONTRAST_ADJUSTMENT_AMOUNT * (i / (AR_CONFIG.CONTRAST_ADJUSTMENT_STEPS - 1) + 0.1));
			tempFgRgb = ar_hslToRgb(h, s, l);
			currentFgRgba = [
				...tempFgRgb,
				1
			];
			newFgCss = `rgb(${ currentFgRgba.slice(0, 3).join(',') })`;
			ar_storeOriginalInlineStyle(el, 'color');
			el.style.setProperty('color', newFgCss, 'important');
			newContrast = ar_getContrastRatioBetweenColors(currentFgRgba, currentBgRgba);
			if (newContrast >= requiredContrast)
				return {
					success: true,
					newFgCss,
					newBgCss,
					newContrast,
					strategy
				}
		}
		const nonBgChangeTags = [
			'BODY',
			'MAIN',
			'HEADER',
			'FOOTER',
			'NAV',
			'ASIDE'
		];
		if (!nonBgChangeTags.includes(el.tagName.toUpperCase())) {
			strategy += '+iterative_bg_hsl';
			let tempBgRgb = bgRgba.slice(0, 3);
			const isOriginalTextDark = ar_getLuminanceFromRgb(fgRgba) < 0.5;
			ar_restoreOriginalInlineStyle(el, 'color');
			currentFgRgba = [...fgRgba];
			for (let i = 0; i < AR_CONFIG.CONTRAST_ADJUSTMENT_STEPS; i++) {
				let [h, s, l] = ar_rgbToHsl(...tempBgRgb);
				const delta = AR_CONFIG.CONTRAST_ADJUSTMENT_AMOUNT * (i / (AR_CONFIG.CONTRAST_ADJUSTMENT_STEPS - 1) + 0.1);
				if (delta > AR_CONFIG.AGGRESSIVE_CONTRAST_BG_ADJUST_MAX_DELTA)
					break;
				l = isOriginalTextDark ? Math.min(1, l + delta) : Math.max(0, l - delta);
				tempBgRgb = ar_hslToRgb(h, s, l);
				currentBgRgba = [
					...tempBgRgb,
					1
				];
				newBgCss = `rgb(${ currentBgRgba.slice(0, 3).join(',') })`;
				ar_storeOriginalInlineStyle(el, 'background-color');
				el.style.setProperty('background-color', newBgCss, 'important');
				newContrast = ar_getContrastRatioBetweenColors(fgRgba, currentBgRgba);
				if (newContrast >= requiredContrast) {
					return {
						success: true,
						newFgCss: origFgCss,
						newBgCss,
						newContrast,
						strategy
					}
				}
			}
		}
		ar_restoreOriginalInlineStyle(el, 'color');
		ar_restoreOriginalInlineStyle(el, 'background-color');
		return {
			success: false,
			newFgCss: origFgCss,
			newBgCss: origBgCss,
			newContrast: newContrast,
			strategy: 'all_failed'
		}
	};
	AR_CheckModulesProto.checkFormFieldLabels = function () {
		ar_logSection('Form Field Labels');
		document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]), select, textarea').forEach(field => {
			try {
				if (ar_isVisuallyHidden(field) || ar_hasAccessibleNameForElement(field))
					return;
				const fieldId = field.id || ar_generateUniqueElementId('field-');
				if (!field.id)
					field.id = fieldId;
				let labelText = (field.getAttribute('title') || '').trim() || (field.placeholder || '').trim();
				if ((field.type === 'radio' || field.type === 'checkbox') && field.nextSibling && field.nextSibling.nodeType === Node.TEXT_NODE && (field.nextSibling.textContent || '').trim().length > 0) {
					const textNode = field.nextSibling;
					const newLabel = document.createElement('label');
					newLabel.htmlFor = fieldId;
					newLabel.appendChild(document.createTextNode((textNode.textContent || '').trim()));
					textNode.parentNode.insertBefore(newLabel, textNode.nextSibling);
					textNode.parentNode.removeChild(textNode);
					ar_logAccessibilityIssue('Moderate', `Radio/checkbox missing label. Auto-wrapped adjacent text.`, field, '**Manual review required.** Ensure the label accurately describes the input.', 'Perceivable', '3.3.2 / 1.3.1', true, 'A');
					return
				}
				if (labelText) {
					ar_setAttributeAndLog(field, 'aria-label', labelText, 'Moderate', `Field missing label. Auto-set aria-label from title/placeholder: "${ labelText }".`, '**Manual review required.** Prefer visible <label> elements.', 'Perceivable', '3.3.2', 'A')
				} else {
					const newLabel = document.createElement('label');
					newLabel.htmlFor = fieldId;
					newLabel.textContent = field.name ? `Label for ${ field.name }` : `Label for field ${ fieldId }`;
					Object.assign(newLabel.style, {
						position: 'absolute',
						left: '-9999px',
						width: '1px',
						height: '1px',
						overflow: 'hidden'
					});
					if (field.parentElement) {
						field.parentElement.insertBefore(newLabel, field);
						ar_logAccessibilityIssue('Critical', `Field missing label. Auto-added generic hidden <label>.`, field, '**Manual review required.** Provide a descriptive and visible label for this form field.', 'Perceivable', '3.3.2', true, 'A')
					} else {
						ar_logAccessibilityIssue('Critical', `Field missing label. Could not auto-add <label> (no parent element).`, field, 'Provide a visible <label> element for this form field.', 'Perceivable', '3.3.2', false, 'A')
					}
				}
			} catch (e) {
				console.error('Error: FormFieldLabels Check:', e, field)
			}
		});
		console.groupEnd()
	};
	AR_CheckModulesProto.checkFormValidationAria = function () {
		ar_logSection('Form Validation ARIA');
		document.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(el => {
			try {
				if (ar_isVisuallyHidden(el))
					return;
				this._checkRequiredAria(el);
				this._checkInvalidAria(el)
			} catch (e) {
				console.error('Error: FormValidationAria Check:', e, el)
			}
		});
		console.groupEnd()
	};
	AR_CheckModulesProto._checkRequiredAria = function (el) {
		const previousSiblingText = el.previousSibling && el.previousSibling.nodeType === Node.TEXT_NODE ? el.previousSibling.textContent.trim() : '';
		const parentLabel = el.closest('label');
		const labelText = parentLabel ? (parentLabel.textContent || '').trim() : '';
		const nextSiblingText = el.nextSibling && el.nextSibling.nodeType === Node.TEXT_NODE ? el.nextSibling.textContent.trim() : '';
		if ((previousSiblingText.endsWith('*') || labelText.includes('*') || nextSiblingText.startsWith('*')) && !el.hasAttribute('required') && el.getAttribute('aria-required') !== 'true') {
			ar_setAttributeAndLog(el, 'required', '', 'Minor', 'Field visually marked as required ("*") but missing `required` attribute. Auto-added `required`.', 'Ensure required fields have both `required` and `aria-required="true"`.', 'Robust', '3.3.2 / 4.1.2', 'A')
		}
		if (el.hasAttribute('required') && el.getAttribute('aria-required') !== 'true') {
			ar_setAttributeAndLog(el, 'aria-required', 'true', 'Moderate', 'Required field missing aria-required="true". Auto-fixed.', 'Add aria-required="true" for required form fields.', 'Robust', '4.1.2', 'A')
		}
	};
	AR_CheckModulesProto._checkInvalidAria = function (el) {
		const ariaInvalid = el.getAttribute('aria-invalid');
		if (ariaInvalid && ![
				'true',
				'false'
			].includes(ariaInvalid.toLowerCase())) {
			ar_setAttributeAndLog(el, 'aria-invalid', 'false', 'Minor', 'aria-invalid attribute has an invalid value. Auto-set to "false".', 'Use "true" or "false" for aria-invalid.', 'Robust', '4.1.2', 'A')
		}
		if (el.getAttribute('aria-invalid') === 'true' && !el.hasAttribute('aria-describedby')) {
			let errorMsgElement = null;
			const potentialErrorSibling = el.nextElementSibling;
			if (potentialErrorSibling && ((potentialErrorSibling.className || '').toLowerCase().includes('error') || (potentialErrorSibling.className || '').toLowerCase().includes('invalid') || potentialErrorSibling.getAttribute('role') === 'alert')) {
				errorMsgElement = potentialErrorSibling;
				if (!errorMsgElement.id) {
					errorMsgElement.id = ar_generateUniqueElementId('error-msg-')
				}
			} else {
				errorMsgElement = document.createElement('span');
				errorMsgElement.id = ar_generateUniqueElementId('error-msg-');
				errorMsgElement.textContent = 'Invalid input.';
				Object.assign(errorMsgElement.style, {
					position: 'absolute',
					left: '-9999px',
					width: '1px',
					height: '1px',
					overflow: 'hidden'
				});
				errorMsgElement.setAttribute('role', 'alert');
				if (el.parentNode) {
					el.parentNode.insertBefore(errorMsgElement, el.nextSibling)
				}
			}
			if (errorMsgElement && errorMsgElement.id) {
				ar_setAttributeAndLog(el, 'aria-describedby', errorMsgElement.id, 'Minor', `Input aria-invalid="true" missing aria-describedby. Auto-linked/added error message.`, 'Ensure invalid inputs are described by an error message via aria-describedby.', 'Understandable', '3.3.1', true, 'A')
			}
		}
	};
	AR_CheckModulesProto.checkLandmarkRoles = function (globalState) {
		ar_logSection('ARIA Landmark Roles / HTML5 Semantic Elements');
		this._identifyExistingLandmarks(globalState);
		this._ensureEssentialLandmarks(globalState);
		this._checkMultipleUniqueLandmarks(globalState);
		console.groupEnd()
	};
	AR_CheckModulesProto._identifyExistingLandmarks = function (globalState) {
		AR_SELECTOR_STRINGS.LANDMARK_ROLES_ARRAY.forEach(role => {
			globalState.detectedLandmarkRoleCounts[role] = 0
		});
		AR_SELECTOR_STRINGS.LANDMARK_HTML_TAGS_ARRAY.forEach(tag => {
			globalState.detectedLandmarkRoleCounts[tag] = globalState.detectedLandmarkRoleCounts[tag] || 0
		});
		document.querySelectorAll('*').forEach(el => {
			if (ar_isVisuallyHidden(el))
				return;
			const role = el.getAttribute('role');
			const tagName = el.tagName.toLowerCase();
			if (role && AR_SELECTOR_STRINGS.LANDMARK_ROLES_ARRAY.includes(role)) {
				globalState.detectedLandmarkRoleCounts[role]++
			} else if (AR_SELECTOR_STRINGS.LANDMARK_HTML_TAGS_ARRAY.includes(tagName)) {
				const implicitRole = {
					'main': 'main',
					'header': 'banner',
					'footer': 'contentinfo',
					'nav': 'navigation',
					'aside': 'complementary',
					'form': 'form',
					'section': el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby') ? 'region' : null
				}[tagName];
				if (implicitRole)
					globalState.detectedLandmarkRoleCounts[implicitRole]++
			}
		})
	};
	AR_CheckModulesProto._ensureEssentialLandmark = function (globalState, landmarkName, config) {
		const {selector, htmlTag, role, placement, contentHeuristic} = config;
		const body = document.body;
		if (globalState.detectedLandmarkRoleCounts[landmarkName] === 0) {
			let candidateElement = document.querySelector(htmlTag) || document.querySelector(`[role="${ role }"]`) || document.querySelector(selector);
			if (candidateElement) {
				if (candidateElement.tagName.toLowerCase() !== htmlTag && !candidateElement.getAttribute('role')) {
					ar_setAttributeAndLog(candidateElement, 'role', role, 'Moderate', `Missing ${ landmarkName } landmark. Auto-added role to <${ candidateElement.tagName.toLowerCase() }>.`, `Use <${ htmlTag }> or role="${ role }".`, 'Perceivable', '1.3.1', 'A');
					globalState.detectedLandmarkRoleCounts[landmarkName]++
				} else if (candidateElement.tagName.toLowerCase() === htmlTag && !candidateElement.getAttribute('role') && role !== htmlTag && landmarkName === role) {
					ar_setAttributeAndLog(candidateElement, 'role', role, 'Info', `<${ htmlTag }> candidate for ${ landmarkName }. Auto-added explicit role.`, `Consider explicit role for clarity.`, 'Perceivable', '1.3.1', 'A');
					globalState.detectedLandmarkRoleCounts[landmarkName]++
				} else if (!globalState.detectedLandmarkRoleCounts[landmarkName]) {
					globalState.detectedLandmarkRoleCounts[landmarkName]++
				}
			} else {
				const newLandmark = document.createElement(htmlTag);
				if (role !== htmlTag && role)
					newLandmark.setAttribute('role', role);
				let contentMoved = false;
				if (contentHeuristic) {
					const bodyChildren = Array.from(body.children);
					const headerEl = body.querySelector(AR_CheckModules._landmarkConfigs.banner.htmlTag + ', [role=banner]');
					const navEl = body.querySelector(AR_CheckModules._landmarkConfigs.navigation.htmlTag + ', [role=navigation]');
					const footerEl = body.querySelector(AR_CheckModules._landmarkConfigs.contentinfo.htmlTag + ', [role=contentinfo]');
					const childrenToMove = contentHeuristic(bodyChildren, headerEl, navEl, footerEl);
					if (childrenToMove.length > 0) {
						childrenToMove.forEach(child => {
							if (child.parentNode === body && child !== newLandmark && ![
									'SCRIPT',
									'STYLE',
									'LINK'
								].includes(child.tagName) && child.id !== AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID && child.id !== AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID && !child.closest(AR_CheckModules._landmarkConfigs.banner.htmlTag) && !child.closest(AR_CheckModules._landmarkConfigs.navigation.htmlTag) && !child.closest(AR_CheckModules._landmarkConfigs.contentinfo.htmlTag) && !(child.tagName.toLowerCase() === 'main' && landmarkName !== 'main')) {
								newLandmark.appendChild(child);
								contentMoved = true
							}
						})
					}
				}
				if (placement === 'prepend' && body.firstChild)
					body.insertBefore(newLandmark, body.firstChild);
				else if (placement === 'append')
					body.appendChild(newLandmark);
				else if (placement === 'afterHeader') {
					const headerRef = body.querySelector(AR_CheckModules._landmarkConfigs.banner.htmlTag + ', [role=banner]');
					if (headerRef && headerRef.nextSibling)
						body.insertBefore(newLandmark, headerRef.nextSibling);
					else if (body.firstChild)
						body.insertBefore(newLandmark, body.firstChild);
					else
						body.appendChild(newLandmark)
				} else if (placement === 'beforeFooter') {
					const footerRef = body.querySelector(AR_CheckModules._landmarkConfigs.contentinfo.htmlTag + ', [role=contentinfo]');
					if (footerRef)
						body.insertBefore(newLandmark, footerRef);
					else
						body.appendChild(newLandmark)
				} else
					body.appendChild(newLandmark);
				ar_logAccessibilityIssue('Moderate', `Missing "${ landmarkName }" landmark. Aggressively Auto-created <${ htmlTag }>${ contentMoved ? ' and wrapped existing content.' : '.' }`, newLandmark, 'Verify the auto-generated structure. This is a significant DOM change.', 'Perceivable', '1.3.1', true, 'A');
				globalState.detectedLandmarkRoleCounts[landmarkName]++
			}
		}
	};
	AR_CheckModulesProto._landmarkConfigs = {
		'banner': {
			selector: AR_SELECTOR_STRINGS.COMMON_HEADER_SELECTORS,
			htmlTag: 'header',
			role: 'banner',
			placement: 'prepend',
			contentHeuristic: children => children.filter(c => c.tagName.toLowerCase() !== 'script' && c.tagName.toLowerCase() !== 'style' && c.tagName.toLowerCase() !== 'link' && !c.id.includes(AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID) && !c.id.includes(AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID)).slice(0, Math.min(children.length, 3))
		},
		'navigation': {
			selector: AR_SELECTOR_STRINGS.COMMON_NAV_SELECTORS,
			htmlTag: 'nav',
			role: 'navigation',
			placement: 'afterHeader',
			contentHeuristic: children => {
				const navCand = children.find(c => c.tagName === 'UL' && c.querySelectorAll('li > a[href]').length > 2);
				return navCand ? [navCand] : []
			}
		},
		'main': {
			selector: AR_SELECTOR_STRINGS.MAIN_CONTENT_TARGET_SELECTORS,
			htmlTag: 'main',
			role: 'main',
			placement: 'beforeFooter',
			contentHeuristic: (children, header, nav, footer) => {
				const mainContent = [];
				let inMainSection = false;
				for (const child of children) {
					if (child === header || child === nav || child.id === AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID || child.id === AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID || [
							'SCRIPT',
							'STYLE',
							'LINK'
						].includes(child.tagName)) {
						if (!inMainSection && child !== header && child !== nav) {
							continue
						}
					}
					if (child === footer) {
						break
					}
					inMainSection = true;
					mainContent.push(child)
				}
				return mainContent.length > 0 ? mainContent : children.filter(c => c !== header && c !== nav && c !== footer && ![
					'SCRIPT',
					'STYLE'
				].includes(c.tagName) && c.id !== AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID && c.id !== AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID).slice(0, Math.max(1, children.length - (header ? 1 : 0) - (nav ? 1 : 0) - (footer ? 1 : 0) - 2))
			}
		},
		'contentinfo': {
			selector: AR_SELECTOR_STRINGS.COMMON_FOOTER_SELECTORS,
			htmlTag: 'footer',
			role: 'contentinfo',
			placement: 'append',
			contentHeuristic: children => children.length > 1 ? children.slice(Math.max(0, children.length - 2)) : children
		}
	};
	AR_CheckModulesProto._ensureEssentialLandmarks = function (globalState) {
		for (const landmarkName in this._landmarkConfigs) {
			this._ensureEssentialLandmark(globalState, landmarkName, this._landmarkConfigs[landmarkName])
		}
	};
	AR_CheckModulesProto._checkMultipleUniqueLandmarks = function (globalState) {
		[
			'main',
			'banner',
			'contentinfo'
		].forEach(roleName => {
			if (globalState.detectedLandmarkRoleCounts[roleName] > 1) {
				const elements = document.querySelectorAll(`${ this._landmarkConfigs[roleName].htmlTag }, [role="${ roleName }"]`);
				ar_logAccessibilityIssue('Minor', `Multiple "${ roleName }" landmarks (${ globalState.detectedLandmarkRoleCounts[roleName] }).`, elements.length > 0 ? elements[0] : document.body, `There should typically be only one "${ roleName }" landmark per page. Consider consolidating or using other roles.`, 'Perceivable', '1.3.1 / 2.4.1', false, 'A')
			}
		})
	};
	AR_CheckModulesProto.checkFocusIndicators = function () {
		ar_logSection('Focus Indicators');
		let styleTag = document.getElementById('ar-focus-style');
		if (!styleTag) {
			styleTag = document.createElement('style');
			styleTag.id = 'ar-focus-style';
			styleTag.textContent = `${ AR_SELECTOR_STRINGS.INTERACTIVE_ELEMENTS.split(',').map(s => `${ s.trim() }:focus-visible`).join(',\n') } { outline: 3px solid #0056b3 !important; outline-offset: 2px !important; box-shadow: 0 0 0 3px rgba(112, 161, 255, 0.5) !important; }`;
			document.head.appendChild(styleTag);
			ar_logAccessibilityIssue('Info', 'Injected global CSS for :focus-visible. This provides a default focus indicator.', styleTag, 'Review custom focus styles to ensure they are visible and meet WCAG 2.4.7.', 'Operable', '2.4.7 / 2.4.11', true, 'AA')
		}
		document.querySelectorAll(AR_SELECTOR_STRINGS.INTERACTIVE_ELEMENTS).forEach(el => {
			try {
				if (ar_isVisuallyHidden(el))
					return;
				const computedStyle = window.getComputedStyle(el);
				const defaultOutlineNone = computedStyle.outlineStyle === 'none' || parseFloat(computedStyle.outlineWidth) === 0;
				const defaultBoxShadowNone = computedStyle.boxShadow === 'none' || computedStyle.boxShadow === '';
				if (defaultOutlineNone && defaultBoxShadowNone) {
					if (el.style.outline === 'none !important' || el.style.outlineStyle === 'none' && el.style.getPropertyPriority('outline-style') === 'important') {
						ar_logAccessibilityIssue('Moderate', 'Element has `outline: none !important;`. This can override default focus indicators.', el, 'Avoid using `!important` to remove outlines. Ensure a visible focus indicator is provided via `:focus-visible`.', 'Operable', '2.4.7', false, 'AA')
					} else if (defaultOutlineNone) {
						ar_logAccessibilityIssue('Minor', 'Element has `outline: none`. Ensure :focus-visible provides a clear indicator.', el, 'Verify that a visible focus indicator is provided for keyboard users, especially if `outline: none` is used.', 'Operable', '2.4.7', false, 'AA')
					}
				}
			} catch (e) {
				console.error('Error: FocusIndicators Check:', e, el)
			}
		});
		console.log('\n\uD83D\uDCA1 Manual Verification for Focus Indicators is CRUCIAL. Ensure custom focus styles are clearly visible and meet WCAG 2.4.7 and 2.4.11.');
		console.groupEnd()
	};
	AR_CheckModulesProto.checkSkipLinks = function (globalState) {
		ar_logSection('Skip Link');
		const existingSkipLink = document.querySelector('a[href^="#"]:first-child, a.skip-link:first-child, [data-skip-link="true"]:first-child');
		if (!existingSkipLink || ar_isVisuallyHidden(existingSkipLink)) {
			const newSkipLink = this._createSkipLinkElement();
			let mainContentTarget = this._findMainContentTarget();
			if (mainContentTarget) {
				if (!mainContentTarget.id)
					mainContentTarget.id = ar_generateUniqueElementId('main-content-target-');
				if (mainContentTarget.getAttribute('tabindex') === null && !mainContentTarget.matches(AR_SELECTOR_STRINGS.NATIVE_INTERACTIVE_TAGS) && mainContentTarget.getAttribute('role') !== 'region' && mainContentTarget.tagName !== 'MAIN') {
					ar_setAttributeAndLog(mainContentTarget, 'tabindex', '-1', 'Info', 'Main content target for skip link made focusable (tabindex="-1").', 'Ensure the main content area is focusable for skip links to work correctly.', 'Operable', '2.4.1', true, 'A')
				}
				newSkipLink.href = `#${ mainContentTarget.id }`;
				document.body.prepend(newSkipLink);
				ar_logAccessibilityIssue('Moderate', 'No visible "skip to main content" link found. Auto-injected.', newSkipLink, 'Ensure the skip link is the first focusable element, is visible on focus, and targets the main content area.', 'Operable', '2.4.1', true, 'A')
			} else {
				ar_logAccessibilityIssue('Moderate', 'No "skip to main content" link found and no clear main content target identified.', document.body, 'Implement a "skip to main content" link that targets the primary content area of the page.', 'Operable', '2.4.1', false, 'A')
			}
		}
		console.groupEnd()
	};
	AR_CheckModulesProto._createSkipLinkElement = function () {
		const skipLink = document.createElement('a');
		skipLink.textContent = 'Skip to main content';
		Object.assign(skipLink.style, {
			position: 'absolute',
			left: '-9999px',
			top: 'auto',
			width: '1px',
			height: '1px',
			overflow: 'hidden',
			zIndex: '99999',
			padding: '0.5em 1em',
			backgroundColor: '#f0f0f0',
			color: '#333',
			textDecoration: 'none',
			borderRadius: '3px',
			border: '1px solid #ccc',
			transition: 'left 0s 0.3s, top 0s 0.3s'
		});
		skipLink.onfocus = function () {
			Object.assign(this.style, {
				left: '10px',
				top: '10px',
				width: 'auto',
				height: 'auto',
				zIndex: '2147483647',
				boxShadow: '0 0 10px rgba(0,0,0,0.5)',
				transitionDelay: '0s'
			})
		};
		skipLink.onblur = function () {
			Object.assign(this.style, {
				left: '-9999px',
				top: 'auto',
				width: '1px',
				height: '1px',
				zIndex: '99999',
				boxShadow: 'none',
				transitionDelay: '0s 0.3s'
			})
		};
		return skipLink
	};
	AR_CheckModulesProto._findMainContentTarget = function () {
		let target = document.querySelector(AR_SELECTOR_STRINGS.MAIN_CONTENT_TARGET_SELECTORS) || document.querySelector('article') || document.querySelector('section[aria-label], section[aria-labelledby]');
		if (!target) {
			for (let i = 0; i < document.body.children.length; i++) {
				const child = document.body.children[i];
				if (!child.matches('script, style, link') && child.id !== AR_CONFIG.ACCESSIBILITY_MENU_BUTTON_ID && child.id !== AR_CONFIG.ACCESSIBILITY_MENU_PANEL_ID && !child.classList.contains('skip-link')) {
					target = child;
					break
				}
			}
		}
		return target
	};
	AR_CheckModulesProto.checkDocumentGlobals = function () {
		ar_logSection('Global Document Setup');
		const head = document.head;
		const body = document.body;
		this._checkDocumentTitle(head, body);
		this._checkViewportMeta(head);
		this._checkMetaRefresh(head);
		if (!head.querySelector('#ar-focus-style'))
			AR_CheckModules.checkFocusIndicators();
		console.groupEnd()
	};
	AR_CheckModulesProto._checkDocumentTitle = function (head, body) {
		const titleElement = head.querySelector('title');
		if (!titleElement || !(titleElement.textContent || '').trim()) {
			const h1 = body.querySelector('h1');
			const h1Text = h1 && h1.textContent ? h1.textContent.trim().substring(0, 60) : '';
			let newTitleText = (h1Text || 'Untitled Page') + (h1Text ? '' : ' - AutoTitle');
			let newTitleEl = titleElement || document.createElement('title');
			ar_setAttributeAndLog(newTitleEl, 'textContent', newTitleText, 'Critical', `Document title missing or empty. Auto-generated: "${ newTitleText }".`, '**Manual review required.** Provide a descriptive and unique title for the page.', 'Operable', '2.4.2 Page Titled', 'A');
			if (!titleElement)
				head.appendChild(newTitleEl)
		}
	};
	AR_CheckModulesProto._checkViewportMeta = function (head) {
		let viewportMeta = head.querySelector('meta[name="viewport"]');
		const currentContent = viewportMeta ? viewportMeta.content : '';
		let newContent = currentContent;
		let issueFound = false;
		if (!viewportMeta || !currentContent) {
			newContent = 'width=device-width, initial-scale=1.0, user-scalable=yes';
			issueFound = true;
			if (!viewportMeta) {
				viewportMeta = document.createElement('meta');
				viewportMeta.name = 'viewport';
				head.appendChild(viewportMeta)
			}
			ar_setAttributeAndLog(viewportMeta, 'content', newContent, 'Critical', 'Viewport meta tag missing or empty. Auto-added responsive viewport.', 'Ensure a proper viewport meta tag is present for responsive design and user zoom.', 'Perceivable', '1.4.10 / 1.4.4', 'AA');
			return
		}
		if (!currentContent.includes('width=device-width')) {
			newContent = `width=device-width${ newContent.length > 0 ? ',' : '' }${ newContent }`;
			issueFound = true
		}
		if (!/initial-scale\s*=\s*1(\.0*)?/.test(currentContent)) {
			newContent = `${ newContent }${ newContent.length > 0 ? ',' : '' }initial-scale=1.0`;
			issueFound = true
		}
		if (currentContent.includes('user-scalable=no')) {
			newContent = newContent.replace(/user-scalable=no[,]?/g, '');
			issueFound = true
		}
		if (/maximum-scale\s*=\s*1(\.0*)?/.test(currentContent)) {
			newContent = newContent.replace(/maximum-scale\s*=\s*1(\.0*)?[,]?/g, '');
			issueFound = true
		}
		if (!newContent.includes('user-scalable=yes') && !newContent.includes('user-scalable=no')) {
			newContent = `${ newContent }${ newContent.length > 0 ? ',' : '' }user-scalable=yes`;
			issueFound = true
		}
		newContent = newContent.replace(/,{2,}/g, ',').replace(/,\s*$/, '').trim();
		if (issueFound && newContent !== currentContent) {
			ar_setAttributeAndLog(viewportMeta, 'content', newContent, 'Moderate', `Viewport meta tag improper. Auto-corrected to "${ newContent }".`, 'Avoid `user-scalable=no` or `maximum-scale=1.0` to allow users to zoom.', 'Perceivable', '1.4.4 / 1.4.10', 'AA')
		}
	};
	AR_CheckModulesProto._checkMetaRefresh = function (head) {
		const metaRefresh = head.querySelector('meta[http-equiv="refresh"]');
		if (metaRefresh) {
			ar_logAccessibilityIssue('Critical', 'Meta refresh tag found. This can disorient users.', metaRefresh, 'Avoid using meta refresh. Use server-side redirects or JavaScript with user controls for timed updates.', 'Operable', '2.2.1 / 2.2.4', false, 'A')
		}
	}
}(AR_CheckModules))
