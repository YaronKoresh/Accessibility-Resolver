# Accessibility Resolver

**A comprehensive, real-time browser script for automated web accessibility checks, auto-fixes, and user-controlled accessibility enhancements.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![WCAG 2.1](https://img.shields.io/badge/WCAG-2.1%20AA-green.svg)](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Accessibility Menu](#accessibility-menu)
- [Accessibility Profiles](#accessibility-profiles)
- [WCAG Compliance](#wcag-compliance)
- [Configuration](#configuration)
- [Browser Support](#browser-support)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

---

## About

Accessibility Resolver is a powerful JavaScript and CSS toolkit designed to automatically detect, report, and fix common web accessibility issues in real-time. Created by **Yaron Koresh**, this project helps web developers and content creators ensure their websites are accessible to all users, including those who rely on assistive technologies.

### Key Capabilities

- **Automatic Issue Detection**: Scans your page for WCAG violations and accessibility problems
- **Real-time Auto-fixes**: Automatically corrects many common accessibility issues
- **User Accessibility Menu**: Provides an interactive menu for users to customize their experience
- **Dynamic Content Monitoring**: Uses MutationObserver to handle dynamically loaded content
- **Comprehensive Reporting**: Detailed console logs with severity levels and WCAG references

---

## Features

### 🔍 Automatic Accessibility Checks

| Feature | Description |
|---------|-------------|
| **Contrast Ratio Analysis** | Detects and auto-fixes low contrast text for WCAG 1.4.3 compliance |
| **Image Alt Text** | Generates meaningful alt text for images missing descriptions |
| **Form Labels** | Ensures all form fields have proper labels and ARIA attributes |
| **Heading Structure** | Validates and fixes heading hierarchy (H1-H6) |
| **Link Accessibility** | Ensures links have discernible text and proper purpose |
| **ARIA Validation** | Checks for correct ARIA usage and fixes common mistakes |
| **Focus Indicators** | Injects visible focus styles for keyboard navigation |
| **Landmark Roles** | Ensures proper document structure with semantic landmarks |
| **Skip Links** | Auto-generates skip navigation for keyboard users |
| **Viewport & Zoom** | Ensures users can zoom and scale content |

### 🎛️ User Accessibility Menu

An interactive, draggable accessibility menu that provides:

- **Text Size Controls**: Increase/decrease font size with fine-grained control
- **Contrast Modes**: High contrast (light), inverted colors, dark contrast
- **Link Highlighting**: Make all links visually prominent
- **Enhanced Focus**: Extra-visible focus indicators for keyboard navigation
- **Reading Aids**: Reading mask, reading line, and reading mode
- **Animation Control**: Stop all animations and freeze GIFs
- **Dyslexia-Friendly Font**: OpenDyslexic font for improved readability
- **Text Spacing**: Adjust letter spacing, word spacing, and line height
- **Cursor Options**: Large cursor and reading guide cursor
- **Text-to-Speech**: Read page content aloud
- **Page Structure Panel**: Navigate by headings, landmarks, and links

### ♿ Accessibility Profiles

Pre-configured profiles for common accessibility needs:

- **Motor Impairment**: Enhanced focus, stopped animations
- **ADHD Focus**: Stopped animations, reading mode with reading line
- **Epilepsy Safe**: All animations and flashing content stopped
- **Low Vision**: Increased text size, highlighted links, dark contrast

---

## Installation

### CDN Installation (Recommended)

Add the following to your HTML `<head>` section:

```html
<!-- Pin to a specific version for production stability -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/YaronKoresh/Accessibility-Resolver@v1.0.0/Accessibility-Resolver.css">
<script src="https://cdn.jsdelivr.net/gh/YaronKoresh/Accessibility-Resolver@v1.0.0/Accessibility-Resolver.js" async></script>
```

> **Note:** For production, always pin to a specific version or commit hash to avoid unexpected breaking changes. Replace `v1.0.0` with the desired version.

### Self-Hosted Installation

1. Download both `Accessibility-Resolver.css` and `Accessibility-Resolver.js`
2. Add them to your project:

```html
<link rel="stylesheet" href="/path/to/Accessibility-Resolver.css">
<script src="/path/to/Accessibility-Resolver.js" async></script>
```

### NPM Installation

```bash
npm install accessibility-resolver
```

Then import in your JavaScript:

```javascript
import 'accessibility-resolver/Accessibility-Resolver.css';
import 'accessibility-resolver/Accessibility-Resolver.js';
```

---

## Usage

### Basic Usage

Once installed, Accessibility Resolver automatically:

1. Scans the page for accessibility issues
2. Applies auto-fixes where possible
3. Logs detailed reports to the browser console
4. Displays an accessibility menu button (bottom-right corner)

### Console Output

Open your browser's developer console to see:

- **Critical** (❌): Severe issues that significantly impact accessibility
- **Moderate** (⚠️): Important issues that should be addressed
- **Minor** (💡): Suggestions for improvement
- **Info** (ℹ️): Informational messages and recommendations
- **Auto-Fixed** (✅): Issues that were automatically corrected

### Accessing Scan Results

```javascript
// Access all scan results programmatically
console.log(window.accessibilityScanGlobalResults);
```

---

## Accessibility Menu

The accessibility menu appears as a circular button with an accessibility icon. Users can:

- **Click** to open/close the menu
- **Drag** to reposition the button and menu
- **Use keyboard** (Tab, Enter, Escape) for full keyboard navigation

### Menu Features

| Feature | Description |
|---------|-------------|
| Increase/Decrease Text | Adjust font size in 8% increments |
| High Contrast (Light) | White background, black text, maximum contrast |
| Invert Colors | Invert all page colors (images preserved) |
| High Contrast (Dark) | Black background, white text |
| Highlight Links | Yellow background on all links |
| Enhanced Focus | Extra-large, bright focus indicators |
| Read Aloud | Text-to-speech for selected or all content |
| Reading Mode | Simplified view with only main content |
| Reading Mask | Darkens page except for cursor area |
| Reading Line | Horizontal line following cursor |
| Stop Animations | Pauses all CSS animations and GIFs |
| Dyslexia Font | Applies OpenDyslexic font |
| Letter Spacing | Increases space between letters |
| Word Spacing | Increases space between words |
| Line Height | Increases vertical line spacing |
| Large Cursor | Bigger, more visible cursor |
| Reset All | Returns all settings to default |

---

## Accessibility Profiles

Quick-apply profiles for specific needs:

### Motor Impairment Profile
- ✅ Enhanced Focus
- ✅ Stop Animations

### ADHD Focus Profile
- ✅ Stop Animations
- ✅ Reading Mode
- ✅ Reading Line

### Epilepsy Safe Profile
- ✅ Stop Animations

### Low Vision Profile
- ✅ Text Size +2 levels
- ✅ Highlight Links
- ✅ Dark Contrast

---

## WCAG Compliance

Accessibility Resolver helps achieve compliance with:

### WCAG 2.1 Level A
- 1.1.1 Non-text Content
- 1.3.1 Info and Relationships
- 2.1.1 Keyboard
- 2.4.1 Bypass Blocks
- 2.4.2 Page Titled
- 2.4.4 Link Purpose
- 3.3.2 Labels or Instructions
- 4.1.1 Parsing
- 4.1.2 Name, Role, Value

### WCAG 2.1 Level AA
- 1.4.3 Contrast (Minimum)
- 1.4.4 Resize Text
- 1.4.10 Reflow
- 2.4.6 Headings and Labels
- 2.4.7 Focus Visible

### WCAG 2.1 Level AAA
- 1.4.6 Contrast (Enhanced)
- 2.4.9 Link Purpose
- 2.5.5 Target Size

---

## Configuration

### JavaScript Configuration

Customize behavior by modifying `AR_CONFIG` before the script loads:

```javascript
window.AR_CONFIG = {
  MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX: 24,  // Touch target size (WCAG recommends 44 for AAA)
  CONTRAST_RATIO_AA_NORMAL_TEXT: 4.5,       // Required contrast ratio
  MUTATION_OBSERVER_DEBOUNCE_MILLISECONDS: 750,
  // ... see full config in source
};
```

### Key Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `MINIMUM_INTERACTIVE_ELEMENT_SIZE_PX` | 24 | Minimum size for touch targets |
| `CONTRAST_RATIO_AA_NORMAL_TEXT` | 4.5 | Required contrast for normal text |
| `CONTRAST_RATIO_AA_LARGE_TEXT` | 3.0 | Required contrast for large text |
| `MUTATION_OBSERVER_DEBOUNCE_MILLISECONDS` | 750 | Delay before re-scanning after DOM changes |
| `MAX_CHARS_FOR_WALL_OF_TEXT_DETECTION` | 600 | Threshold for text block warnings |

---

## Browser Support

| Browser | Supported |
|---------|-----------|
| Chrome 80+ | ✅ |
| Firefox 75+ | ✅ |
| Safari 13+ | ✅ |
| Edge 80+ | ✅ |
| Opera 67+ | ✅ |
| IE 11 | ❌ |

### Required Browser Features

- CSS Custom Properties
- MutationObserver
- Web Speech API (for read aloud)
- localStorage (for settings persistence)

---

## Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style and formatting
- Add comments for complex functionality
- Test across multiple browsers
- Update documentation for new features
- Reference WCAG guidelines for accessibility features

---

## Support

### Getting Help

1. Check the [latest release](https://github.com/YaronKoresh/Accessibility-Resolver/releases/latest)
2. Search [existing issues](https://github.com/YaronKoresh/Accessibility-Resolver/issues?q=is%3Aissue)
3. Open a [new issue](https://github.com/YaronKoresh/Accessibility-Resolver/issues/new) with:
   - Browser and version
   - Steps to reproduce
   - Expected vs actual behavior
   - Console error messages (if any)

### Reporting Bugs

Please include:
- Detailed description of the issue
- Steps to reproduce
- Browser/OS information
- Screenshots or screen recordings (if applicable)

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) Yaron Koresh

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Acknowledgments

- [OpenDyslexic](https://opendyslexic.org/) font for dyslexia-friendly typography
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) for accessibility standards
- All contributors who help improve this project

---

**Made with ❤️ for a more accessible web**
