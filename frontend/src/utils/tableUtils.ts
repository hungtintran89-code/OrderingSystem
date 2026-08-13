/**
 * Chuẩn hóa và hiển thị tên bàn ăn nhất quán toàn bộ ứng dụng (Tránh lỗi "Bàn Bàn 01").
 */
export const formatTableLabel = (numStr?: string | number): string => {
  if (!numStr) return '';
  const str = String(numStr).trim();
  const lower = str.toLowerCase();
  if (lower.startsWith('bàn ') || lower.startsWith('ban ')) {
    return `Bàn ${str.substring(4).trim()}`;
  }
  return `Bàn ${str}`;
};
