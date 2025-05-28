const url = 'https://raw.githubusercontent.com/YaronKoresh/Accessibility-Resolver/refs/heads/main/0.html';
const response = await fetch(url);
const htmlContent = await response.text();
const parser = new DOMParser();
document.head.innerHTML += parser.parseFromString(htmlContent, 'text/html');
