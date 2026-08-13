/**
 * Utility helper functions for Vietnamese Accent-Insensitive Search,
 * Highlighting, and Enterprise Relevance Scoring & Priority Ranking.
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

/**
 * Tính điểm độ tương quan (Relevance Scoring Engine) cho món ăn theo thuật toán chuẩn Doanh nghiệp.
 *
 * Mức ưu tiên (Priority Weights):
 * - Score = 2000: Khớp chính xác hoàn toàn Tên món
 * - Score = 1500: Tên món BẮT ĐẦU bằng từ khóa (ví dụ: "Lẩu Thái..." với từ khóa "lau")
 * - Score = 1000: Tên món chứa từ khóa ở ranh giới từ (ví dụ: "... Lẩu ...")
 * - Score = 800: Tên món chứa từ khóa rải rác
 * - Score = 400: Mã SKU trùng khớp
 * - Score = 100: Mô tả sản phẩm trùng khớp
 * - Score = 5: Danh mục trùng khớp NHƯNG tên món KHÔNG có từ khóa (Giúp xếp các món nướng xuống cuối cùng)
 */
export const calculateRelevanceScore = (
  name: string,
  query: string,
  sku?: string,
  category?: string,
  description?: string
): number => {
  if (!query || !query.trim()) return 1;

  const normQuery = removeVietnameseTones(query);
  if (!normQuery) return 1;

  const normName = removeVietnameseTones(name || '');
  const normSku = removeVietnameseTones(sku || '');
  const normDesc = removeVietnameseTones(description || '');
  const normCategory = removeVietnameseTones(category || '');

  let score = 0;

  // 1. KHỚP TÊN MÓN ÁN (Trọng số lớn nhất)
  if (normName === normQuery) {
    score += 2000;
  } else if (normName.startsWith(normQuery)) {
    score += 1500;
  } else if (normName.includes(' ' + normQuery) || normName.includes('-' + normQuery)) {
    score += 1000;
  } else if (normName.includes(normQuery)) {
    score += 800;
  }

  // 2. KHỚP MÃ SKU
  if (normSku === normQuery) {
    score += 600;
  } else if (normSku.includes(normQuery)) {
    score += 400;
  }

  // 3. KHỚP MÔ TẢ
  if (normDesc && normDesc.includes(normQuery)) {
    score += 100;
  }

  // 4. KHỚP CỔT DANH MỤC
  if (normCategory && normCategory.includes(normQuery)) {
    if (score > 0) {
      score += 20; // Nếu tên món đã khớp, danh mục khớp sẽ cộng nhẹ 20 điểm bonus
    } else {
      // Trường hợp tên món KHÔNG khớp, nhưng danh mục trùng khớp (ví dụ món nướng nằm trong danh mục "Lẩu & Nướng")
      score = 5; // Điểm cực thấp để món nướng luôn đứng SAU các món Lẩu thật sự!
    }
  }

  return score;
};

/**
 * Hàm Lọc và Sắp Xếp danh sách món ăn thông minh theo Điểm Tương Quan Relevance Score giảm dần.
 */
export const filterAndSortByRelevance = <
  T extends { name?: string; productName?: string; sku?: string; category?: string; categoryName?: string; description?: string }
>(
  items: T[],
  query: string,
  selectedCategoryFilter?: string
): T[] => {
  if (!Array.isArray(items)) return [];

  // 1. Lọc theo Danh mục đã chọn
  const categoryFiltered = items.filter((item) => {
    const itemCat = item.category || item.categoryName || '';
    if (!selectedCategoryFilter || selectedCategoryFilter === 'Tất cả' || selectedCategoryFilter === 'ALL') {
      return true;
    }
    return itemCat === selectedCategoryFilter;
  });

  // Nếu từ khóa rỗng, giữ nguyên danh mục đã lọc
  if (!query || !query.trim()) {
    return categoryFiltered;
  }

  // 2. Tính điểm tương quan cho từng phần tử
  const scoredItems = categoryFiltered
    .map((item) => {
      const itemName = item.name || item.productName || '';
      const itemCat = item.category || item.categoryName || '';
      const score = calculateRelevanceScore(itemName, query, item.sku, itemCat, item.description);
      return { item, score };
    })
    .filter((entry) => entry.score > 0);

  // 3. Sắp xếp theo điểm tương quan giảm dần (Score DESC)
  scoredItems.sort((a, b) => b.score - a.score);

  return scoredItems.map((entry) => entry.item);
};
