(async () => {
    const url = 'https://raw.githubusercontent.com/YaronKoresh/Accessibility-Resolver/refs/heads/main/0.html';
    const placeholderId = 'my-accessibility-resolver-div';

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const htmlContent = await response.text();

        let placeholderDiv = document.getElementById(placeholderId);
        if (!placeholderDiv) {
            placeholderDiv = document.createElement('div');
            placeholderDiv.style.display = 'none';
            placeholderDiv.id = placeholderId;
            document.body.appendChild(placeholderDiv);
            console.log(`Dynamically created <div id="${placeholderId}"> and appended to <body>.`);
        } else {
            console.log(`Div with ID "${placeholderId}" already exists in <head>. Reusing.`);
            placeholderDiv.innerHTML = '';
        }

      
        if (placeholder) {
            placeholder.innerHTML = htmlContent;
            console.log('HTML content loaded successfully!');
            console.log('Fetched content:', htmlContent);
        } else {
            console.error(`Placeholder div with ID "${placeholderId}" not found.`);
        }

    } catch (error) {
        console.error('Fetch failed:', error);
        const placeholder = document.getElementById(placeholderId);
        if (placeholder) {
            placeholder.innerHTML = `<p style="color: red;">Failed to load content: ${error.message}</p>`;
        }
    }
})();
