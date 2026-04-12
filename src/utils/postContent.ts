const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

const getTextFromHtml = (content: string): string => {
  if (!content.trim()) return '';

  if (typeof window === 'undefined') {
    return content.replace(/<[^>]*>/g, ' ');
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(content, 'text/html');
  return document.body.textContent ?? '';
};

export const toRenderablePostHtml = (content: string): string => {
  if (HTML_TAG_PATTERN.test(content)) return content;

  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br>');
};

export const toPostExcerpt = (content: string, maxLength = 120): string => {
  const plain = getTextFromHtml(content)
    .replace(/\s+/g, ' ')
    .trim();

  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trimEnd()}...`;
};
