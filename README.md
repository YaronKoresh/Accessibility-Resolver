### Real-time browser script for automated web accessibility checks and auto-fixes.

- - -

# About the project:

* The project was created by Yaron Koresh.

* This project is licensed under the MIT open-source license.

- - -

# What it does?

* Dynamic Content Monitoring: Utilizes a MutationObserver to continuously watch for changes in the DOM, guaranteeing that fixes are re-applied even when content or styles are dynamically loaded or altered by other scripts.
* Comprehensive Console Reporting: Provides detailed logs in the browser's developer console, categorizing issues by severity (Critical, Moderate, Minor, Info) and indicating which issues were successfully auto-fixed. It also offers recommendations and references relevant WCAG guidelines.
* Improved User Experience: Aims to make web content more usable and perceivable for all users, including those relying on assistive technologies.

- - -

# Basic installation:

* Link Accessibility-Resolver to your website externally:
```
<script src="https://cdn.jsdelivr.net/gh/YaronKoresh/Accessibility-Resolver@4ebdb33513025fd2185ace076da9413c3757c5dc/config.js"></script>
<script src="https://cdn.jsdelivr.net/gh/YaronKoresh/Accessibility-Resolver@4ebdb33513025fd2185ace076da9413c3757c5dc/logging.js"></script>
<script src="https://cdn.jsdelivr.net/gh/YaronKoresh/Accessibility-Resolver@4ebdb33513025fd2185ace076da9413c3757c5dc/dom.js"></script>
<script src="https://cdn.jsdelivr.net/gh/YaronKoresh/Accessibility-Resolver@7e30d8e3905acc36371fe37af284ffc447f54b73/menu.js"></script>
<script src="https://cdn.jsdelivr.net/gh/YaronKoresh/Accessibility-Resolver@4ebdb33513025fd2185ace076da9413c3757c5dc/check.js"></script>
<script src="https://cdn.jsdelivr.net/gh/YaronKoresh/Accessibility-Resolver@4ebdb33513025fd2185ace076da9413c3757c5dc/init.js"></script>
```

- - -

# Basic usage:

* the console will show all the logs and will fix most of the errors in real-time.

- - -

# Do you need help?

* Before asking general support questions, please make sure you are using the [latest version](https://github.com/YaronKoresh/Accessibility-Resolver/releases/latest).

* When looking for support, please first search for your question in [open or closed issues](https://github.com/YaronKoresh/Accessibility-Resolver/issues?q=is%3Aissue).

* GitHub issues are a good way for tracking enhancements and bugs, but also for get some help.

* Feel free to open new issues, using one of the available templates, or create an issue from scratch.

- - -

**Enjoy :)**
