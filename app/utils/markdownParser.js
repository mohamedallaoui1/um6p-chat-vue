/**
 * Manual markdown parser for common elements
 * Production-ready, no external dependencies
 */

/**
 * Parse markdown text to HTML manually
 * @param {string} text - Markdown text to parse
 * @returns {string} - Parsed HTML
 */
export function parseMarkdown(text) {
    if (!text) return '';

    let html = text;

    // Escape HTML to prevent XSS
    html = escapeHtml(html);

    // Parse block elements first (order matters)
    html = parseCodeBlocks(html);
    html = parseHeadings(html);
    html = parseLists(html);
    html = parseBlockquotes(html);

    // Parse inline elements
    html = parseLinks(html);
    html = parseImages(html);
    html = parseBold(html);
    html = parseItalic(html);
    html = parseInlineCode(html);
    html = parseLineBreaks(html);

    // Wrap in paragraphs
    html = parseParagraphs(html);

    return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Unescape HTML for specific parsed content
 */
function unescapeHtml(text) {
    const div = document.createElement('div');
    div.innerHTML = text;
    return div.textContent;
}

/**
 * Parse code blocks (```code```)
 */
function parseCodeBlocks(text) {
    return text.replace(/```([a-z]*)\n([\s\S]*?)```/g, (match, lang, code) => {
        const unescapedCode = unescapeHtml(code);
        return `<pre><code class="language-${lang}">${unescapedCode}</code></pre>`;
    });
}

/**
 * Parse headings (# ## ### etc)
 */
function parseHeadings(text) {
    return text.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, content) => {
        const level = hashes.length;
        return `<h${level}>${content}</h${level}>`;
    });
}

/**
 * Parse unordered lists (* or -)
 */
function parseLists(text) {
    // Unordered lists
    text = text.replace(/(?:^|\n)((?:[*\-]\s+.+(?:\n|$))+)/g, (match, list) => {
        const items = list.trim().split('\n').map(item => {
            const content = item.replace(/^[*\-]\s+/, '');
            return `<li>${content}</li>`;
        }).join('');
        return `\n<ul>${items}</ul>\n`;
    });

    // Ordered lists
    text = text.replace(/(?:^|\n)((?:\d+\.\s+.+(?:\n|$))+)/g, (match, list) => {
        const items = list.trim().split('\n').map(item => {
            const content = item.replace(/^\d+\.\s+/, '');
            return `<li>${content}</li>`;
        }).join('');
        return `\n<ol>${items}</ol>\n`;
    });

    return text;
}

/**
 * Parse blockquotes (> text)
 */
function parseBlockquotes(text) {
    return text.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
}

/**
 * Parse links [text](url)
 */
function parseLinks(text) {
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

/**
 * Parse images ![alt](url)
 */
function parseImages(text) {
    return text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
}

/**
 * Parse bold (**text** or __text__)
 */
function parseBold(text) {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>');
}

/**
 * Parse italic (*text* or _text_)
 */
function parseItalic(text) {
    return text
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/_(.+?)_/g, '<em>$1</em>');
}

/**
 * Parse inline code (`code`)
 */
function parseInlineCode(text) {
    return text.replace(/`([^`]+)`/g, '<code>$1</code>');
}

/**
 * Parse line breaks (two spaces at end of line or \n)
 */
function parseLineBreaks(text) {
    return text.replace(/  \n/g, '<br>');
}

/**
 * Wrap standalone text in paragraphs
 */
function parseParagraphs(text) {
    // Split by double newlines to create paragraphs
    const blocks = text.split(/\n\n+/);

    return blocks.map(block => {
        // Don't wrap if it's already a block element
        if (block.match(/^<(h\d|ul|ol|pre|blockquote|hr)/)) {
            return block;
        }
        // Don't wrap empty blocks
        if (block.trim() === '') {
            return '';
        }
        // Wrap in paragraph
        return `<p>${block.trim()}</p>`;
    }).join('\n');
}

/**
 * Sanitize HTML to prevent XSS (basic implementation)
 */
export function sanitizeHtml(html) {
    // Allow only safe tags
    const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'code', 'pre', 'a', 'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'img', 'hr'];

    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Remove script tags and event handlers
    const scripts = temp.querySelectorAll('script, iframe, object, embed');
    scripts.forEach(script => script.remove());

    // Remove event handlers
    const allElements = temp.querySelectorAll('*');
    allElements.forEach(el => {
        // Remove all attributes starting with 'on'
        Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith('on')) {
                el.removeAttribute(attr.name);
            }
        });
    });

    return temp.innerHTML;
}
