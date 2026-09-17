import React from 'react';

export const safeParseArray = (val: any): any[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'object' && parsed !== null) return [parsed];
      if (typeof parsed === 'string') {
        return parsed.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
      }
    } catch {
      return trimmed.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
    }
  }
  if (typeof val === 'object') return [val];
  return [];
};

export const parseStringList = (val: any): string[] => {
  const rawArray = safeParseArray(val);
  const result: string[] = [];
  for (const item of rawArray) {
    if (typeof item === 'string') {
      const subItems = item.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
      result.push(...subItems);
    } else if (item && typeof item === 'object') {
      const str = item.name || item.title || item.label || item.value || JSON.stringify(item);
      if (str) {
        const subItems = String(str).split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
        result.push(...subItems);
      }
    }
  }
  return result;
};

export const parseEducationList = (val: any): Array<{ qualification: string; institution: string; year: string; cgpa: string }> => {
  const rawArray = safeParseArray(val);
  return rawArray.map(item => {
    if (typeof item === 'string') {
      return { qualification: item, institution: '', year: '', cgpa: '' };
    }
    return {
      qualification: item?.qualification || item?.degree || '',
      institution: item?.institution || item?.college || '',
      year: item?.year || item?.passingYear || '',
      cgpa: item?.cgpa || item?.percentage || '',
    };
  }).filter(e => e.qualification || e.institution);
};

export const parseInternshipsList = (val: any): Array<{ company: string; role: string; duration: string }> => {
  const rawArray = safeParseArray(val);
  return rawArray.map(item => {
    if (typeof item === 'string') {
      return { company: item, role: '', duration: '' };
    }
    return {
      company: item?.company || item?.title || '',
      role: item?.role || item?.designation || '',
      duration: item?.duration || item?.period || '',
    };
  }).filter(i => i.company || i.role);
};

export const parseProjectsList = (val: any): Array<{ title: string; toolsUsed: string }> => {
  const rawArray = safeParseArray(val);
  return rawArray.map(item => {
    if (typeof item === 'string') {
      return { title: item, toolsUsed: '' };
    }
    return {
      title: item?.title || item?.name || item?.projectName || '',
      toolsUsed: item?.toolsUsed || item?.tools || item?.technologies || '',
    };
  }).filter(p => p.title);
};

/**
 * Parses input text and converts any web URLs or email addresses into interactive touchable/clickable hyperlinks (<a> tags).
 */
export function renderWithLinks(input: any): React.ReactNode {
  if (input === null || input === undefined) return null;
  const text = typeof input === 'string' ? input : String(input);
  if (!text) return text;

  // Regex to match email addresses (Group 1) OR web URLs (Group 2)
  const combinedRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(https?:\/\/[^\s,]+|www\.[^\s,]+|(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|io|dev|edu|gov|in|me|co|app|tech|info|ai|xyz)(?:\/[^\s,]*)?)/gi;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(combinedRegex.source, 'gi');

  while ((match = regex.exec(text)) !== null) {
    const matchedStr = match[0];
    const isEmail = !!match[1];
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
    }

    let cleanStr = matchedStr;
    let trailingPunct = '';
    while (cleanStr.length > 0 && /[.,;:)]$/.test(cleanStr)) {
      trailingPunct = cleanStr.slice(-1) + trailingPunct;
      cleanStr = cleanStr.slice(0, -1);
    }

    let href = cleanStr;
    if (isEmail) {
      if (!href.startsWith('mailto:')) {
        href = 'mailto:' + href;
      }
    } else {
      if (!/^https?:\/\//i.test(href)) {
        href = 'https://' + href;
      }
    }

    parts.push(
      React.createElement(
        'a',
        {
          key: `link_${matchIndex}_${cleanStr}`,
          href,
          target: '_blank',
          rel: 'noopener noreferrer',
          style: {
            color: '#000000',
            textDecoration: 'underline',
            wordBreak: 'break-all',
            cursor: 'pointer',
          },
          onClick: (e: any) => e.stopPropagation(),
        },
        cleanStr
      )
    );

    if (trailingPunct) {
      parts.push(trailingPunct);
    }

    lastIndex = matchIndex + matchedStr.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
