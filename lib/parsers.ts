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
