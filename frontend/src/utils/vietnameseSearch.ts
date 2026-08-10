/**
 * Utility helper functions for Vietnamese Accent-Insensitive Search & Text Highlighting.
 */

/**
 * Loại bỏ toàn bộ dấu tiếng Việt (chuẩn hóa Unicode NFD, xóa diacritics và chuyển đ/Đ -> d/D).
 * Ví dụ: "Nước ép cam" -> "nuoc ep cam", "Món nướng BBQ" -> "mon nuong bbq"
 */
export const removeVietnameseTones = (str: string): string => {
  if (!str) return '';
  let result = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  result = result.replace(/đ/g, 'd').replace(/Đ/g, 'D');
  return result.toLowerCase().trim();
};

/**
 * Kiểm tra xem chuỗi text có chứa từ khóa query (kể cả không dấu) hay không.
 */
export const isVietnameseMatch = (text: string, query: string): boolean => {
  if (!query || !query.trim()) return true;
  const normalizedText = removeVietnameseTones(text);
  const normalizedQuery = removeVietnameseTones(query);
  return normalizedText.includes(normalizedQuery);
};

export interface HighlightSegment {
  text: string;
  isMatch: boolean;
}

/**
 * Tách chuỗi text thành các đoạn nhỏ để highlight đoạn trùng khớp với từ khóa tìm kiếm.
 */
export const getHighlightedSegments = (text: string, query: string): HighlightSegment[] => {
  if (!query || !query.trim() || !text) {
    return [{ text: text || '', isMatch: false }];
  }

  const normText = removeVietnameseTones(text);
  const normQuery = removeVietnameseTones(query);
  const index = normText.indexOf(normQuery);

  if (index === -1) {
    return [{ text, isMatch: false }];
  }

  const queryLength = normQuery.length;
  const before = text.slice(0, index);
  const match = text.slice(index, index + queryLength);
  const after = text.slice(index + queryLength);

  const segments: HighlightSegment[] = [];
  if (before) segments.push({ text: before, isMatch: false });
  if (match) segments.push({ text: match, isMatch: true });
  if (after) segments.push({ text: after, isMatch: false });

  return segments;
};
