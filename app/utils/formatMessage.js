import { h } from 'vue';

/**
 * Format message text with markdown-like syntax (Vue 3 version)
 * Converts to VNodes for proper rendering
 */
export const formatMessageText = (text, isUserMessage = false) => {
    if (!text) return null;

    // Link styling based on message type
    const linkClassName = isUserMessage
        ? "text-white underline font-semibold hover:text-gray-100 cursor-pointer"
        : "text-blue-600 hover:text-blue-800 underline cursor-pointer";

    const lines = text.split('\n');
    const elements = [];

    lines.forEach((line, lineIndex) => {
        // Handle headers (### )
        if (line.startsWith('### ')) {
            elements.push(
                h('h3', {
                    key: lineIndex,
                    class: 'font-semibold text-sm md:text-base mt-3 md:mt-4 mb-2 first:mt-0'
                }, line.replace('### ', ''))
            );
            return;
        }

        // Handle bullet points (- )
        if (line.startsWith('- ')) {
            const bulletContent = line.replace('- ', '');

            // Check if bullet contains links or bold
            if (bulletContent.includes('[') && bulletContent.includes('](')) {
                const parts = [];
                let partIndex = 0;
                const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                let lastIndex = 0;
                let match;

                while ((match = linkRegex.exec(bulletContent)) !== null) {
                    // Add text before the link
                    if (match.index > lastIndex) {
                        parts.push(h('span', { key: `text-${partIndex++}` }, bulletContent.substring(lastIndex, match.index)));
                    }

                    // Add the link
                    parts.push(
                        h('a', {
                            key: `link-${partIndex++}`,
                            href: match[2],
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            class: linkClassName,
                            onClick: (e) => e.stopPropagation()
                        }, match[1])
                    );

                    lastIndex = match.index + match[0].length;
                }

                // Add remaining text
                if (lastIndex < bulletContent.length) {
                    parts.push(h('span', { key: `text-${partIndex++}` }, bulletContent.substring(lastIndex)));
                }

                elements.push(
                    h('li', {
                        key: lineIndex,
                        class: 'ml-4 mb-1 list-disc'
                    }, parts)
                );
            } else if (bulletContent.includes('**')) {
                // Handle bold in bullets
                const parts = bulletContent.split(/(\*\*.*?\*\*)/g).map((part, idx) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return h('strong', { key: idx, class: 'font-semibold' }, part.slice(2, -2));
                    }
                    return part ? h('span', { key: idx }, part) : null;
                }).filter(Boolean);

                elements.push(
                    h('li', {
                        key: lineIndex,
                        class: 'ml-4 mb-1 list-disc'
                    }, parts)
                );
            } else {
                // Plain bullet
                elements.push(
                    h('li', {
                        key: lineIndex,
                        class: 'ml-4 mb-1 list-disc'
                    }, bulletContent)
                );
            }
            return;
        }

        // Handle lines with bold (**text**) or links [text](url)
        if (line.includes('**') || (line.includes('[') && line.includes(']('))) {
            const parts = [];
            let partIndex = 0;

            // First, handle links [text](url)
            if (line.includes('[') && line.includes('](')) {
                const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                let lastIndex = 0;
                let match;

                while ((match = linkRegex.exec(line)) !== null) {
                    // Add text before the link
                    if (match.index > lastIndex) {
                        const textBefore = line.substring(lastIndex, match.index);
                        // Check for bold in text before
                        if (textBefore.includes('**')) {
                            textBefore.split(/(\*\*.*?\*\*)/g).forEach(part => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                    parts.push(
                                        h('strong', {
                                            key: `bold-${partIndex++}`,
                                            class: 'font-semibold'
                                        }, part.slice(2, -2))
                                    );
                                } else if (part) {
                                    parts.push(h('span', { key: `text-${partIndex++}` }, part));
                                }
                            });
                        } else {
                            parts.push(h('span', { key: `text-${partIndex++}` }, textBefore));
                        }
                    }

                    // Add the link
                    parts.push(
                        h('a', {
                            key: `link-${partIndex++}`,
                            href: match[2],
                            target: '_blank',
                            rel: 'noopener noreferrer',
                            class: linkClassName,
                            onClick: (e) => e.stopPropagation()
                        }, match[1])
                    );

                    lastIndex = match.index + match[0].length;
                }

                // Add remaining text after last link
                if (lastIndex < line.length) {
                    const textAfter = line.substring(lastIndex);
                    if (textAfter.includes('**')) {
                        textAfter.split(/(\*\*.*?\*\*)/g).forEach(part => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                parts.push(
                                    h('strong', {
                                        key: `bold-${partIndex++}`,
                                        class: 'font-semibold'
                                    }, part.slice(2, -2))
                                );
                            } else if (part) {
                                parts.push(h('span', { key: `text-${partIndex++}` }, part));
                            }
                        });
                    } else {
                        parts.push(h('span', { key: `text-${partIndex++}` }, textAfter));
                    }
                }
            }
            // Only bold, no links
            else if (line.includes('**')) {
                line.split(/(\*\*.*?\*\*)/g).forEach(part => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        parts.push(
                            h('strong', {
                                key: `bold-${partIndex++}`,
                                class: 'font-semibold'
                            }, part.slice(2, -2))
                        );
                    } else if (part) {
                        parts.push(h('span', { key: `text-${partIndex++}` }, part));
                    }
                });
            }

            if (parts.length > 0) {
                elements.push(h('p', { key: lineIndex, class: 'mb-2' }, parts));
                return;
            }
        }

        // Regular paragraph
        if (line.trim()) {
            elements.push(h('p', { key: lineIndex, class: 'mb-2' }, line));
        } else {
            elements.push(h('br', { key: lineIndex }));
        }
    });

    return elements;
};
