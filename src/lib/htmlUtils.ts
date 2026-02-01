export const stripHtmlTags = (html: string): string => {
  if (!html) return '';

  const temp = document.createElement('div');
  temp.innerHTML = html;

  return temp.textContent || temp.innerText || '';
};

export const decodeHtmlEntities = (text: string): string => {
  if (!text) return '';

  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

export const extractSourceFromHtml = (html: string): string | null => {
  if (!html) return null;

  const fontMatch = html.match(/<font[^>]*>([^<]+)<\/font>/i);
  if (fontMatch && fontMatch[1]) {
    return fontMatch[1].trim();
  }

  const afterLinkMatch = html.match(/<\/a>\s*(.+?)$/i);
  if (afterLinkMatch && afterLinkMatch[1]) {
    return stripHtmlTags(afterLinkMatch[1]).trim();
  }

  return null;
};

export const cleanArticleText = (rawText: string): string => {
  if (!rawText) return '';

  let cleaned = decodeHtmlEntities(rawText);

  cleaned = stripHtmlTags(cleaned);

  cleaned = cleaned
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8230;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
};

export const decodeArticleText = cleanArticleText;
