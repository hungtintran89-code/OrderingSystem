import type { CategoryMenu, MasterTableOrder, PersonalOrder, TableInfo } from '../types';

// Matching real Flyway database seed: V4__seed_full_test_data.sql
export const MOCK_TABLES: TableInfo[] = [
  { tableId: 1, tableName: "Bàn 01", tableSessionId: 1, qrToken: "qr_tok_table_01" },
  { tableId: 2, tableName: "Bàn 02", tableSessionId: 2, qrToken: "qr_tok_table_02" },
  { tableId: 3, tableName: "Bàn 03", tableSessionId: 3, qrToken: "qr_tok_table_03" },
];

export const MOCK_MENU: CategoryMenu[] = [
  {
    categoryId: 2,
    categoryName: "Món Chính",
    products: [
      {
        productId: 35,
        productName: "Phở Bò Tái Nạm Đặc Biệt",
        productPrice: 85000,
        productImageUrl: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600",
        description: "Bát phở bò nước dùng ninh xương 24h đậm đà thịt tái nạm tươi ngon",
        isAvailable: true,
        categoryId: 2,
        categoryName: "Món Chính"
      },
      {
        productId: 34,
        productName: "Cơm Tấm Sườn Bì Chả Đặc Biệt",
        productPrice: 75000,
        productImageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600",
        description: "Cơm tấm hạt dẻo sườn nướng mỡ hành bì chả trứng ốp la",
        isAvailable: true,
        categoryId: 2,
        categoryName: "Món Chính"
      },
      {
        productId: 36,
        productName: "Bún Chả Hà Nội Truyền Thống",
        productPrice: 70000,
        productImageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600",
        description: "Bún chả thịt nướng than hoa mắm chấm đu đủ giòn ngon",
        isAvailable: true,
        categoryId: 2,
        categoryName: "Món Chính"
      }
    ]
  },
  {
    categoryId: 1,
    categoryName: "Khai Vị",
    products: [
      {
        productId: 1,
        productName: "Gỏi Cuốn Tôm Thịt",
        productPrice: 45000,
        productImageUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600",
        description: "Gỏi cuốn tôm thịt tươi ngon kèm nước chấm tương đen đậu nạch chuẩn vị",
        isAvailable: true,
        categoryId: 1,
        categoryName: "Khai Vị"
      },
      {
        productId: 2,
        productName: "Chả Giò Hải Sản Giòn Rụm",
        productPrice: 65000,
        productImageUrl: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600",
        description: "Chả giò nhân tôm mực chiên vàng giòn rụm chấm sốt mayonaise",
        isAvailable: true,
        categoryId: 1,
        categoryName: "Khai Vị"
      }
    ]
  },
  {
    categoryId: 5,
    categoryName: "Đồ Uống",
    products: [
      {
        productId: 81,
        productName: "Trà Đào Cam Sả Tươi",
        productPrice: 45000,
        productImageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600",
        description: "Trà đào vị ngọt thanh dầm miếng đào giòn thơm hương cam sả",
        isAvailable: true,
        categoryId: 5,
        categoryName: "Đồ Uống"
      },
      {
        productId: 86,
        productName: "Cà Phê Sữa Đá Sài Gòn",
        productPrice: 30000,
        productImageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600",
        description: "Cà phê Robusta đậm đặc pha sữa đặc mặn ngọt chuẩn vị miền Nam",
        isAvailable: true,
        categoryId: 5,
        categoryName: "Đồ Uống"
      }
    ]
  }
];

export const MOCK_PERSONAL_ORDERS: PersonalOrder = {
  tableSessionId: 1,
  threadId: 98765,
  myTotal: 205000,
  myItems: [
    {
      orderItemId: 501,
      productId: 35,
      productName: "Phở Bò Tái Nạm Đặc Biệt",
      quantity: 1,
      priceProduct: 85000,
      priceTotal: 85000,
      note: "Ít cay, nhiều hành",
      threadId: 98765,
      status: "COOKING",
      orderedAt: "19:15"
    },
    {
      orderItemId: 502,
      productId: 1,
      productName: "Gỏi Cuốn Tôm Thịt",
      quantity: 2,
      priceProduct: 45000,
      priceTotal: 90000,
      note: "Tương đậu phộng để riêng",
      threadId: 98765,
      status: "SERVED",
      orderedAt: "18:45"
    },
    {
      orderItemId: 503,
      productId: 86,
      productName: "Cà Phê Sữa Đá Sài Gòn",
      quantity: 1,
      priceProduct: 30000,
      priceTotal: 30000,
      note: "Nhiều đá",
      threadId: 98765,
      status: "SERVED",
      orderedAt: "18:35"
    }
  ]
};

export const MOCK_MASTER_TABLE_ORDER: MasterTableOrder = {
  tableId: 1,
  tableName: "Bàn 01",
  tableSessionId: 1,
  sessionStatus: "ACTIVE",
  totalPrice: 280000,
  openedAt: "18:30",
  allTableItems: [
    {
      orderItemId: 501,
      productId: 35,
      productName: "Phở Bò Tái Nạm Đặc Biệt",
      quantity: 1,
      priceProduct: 85000,
      priceTotal: 85000,
      note: "Ít cay, nhiều hành",
      threadId: 98765,
      status: "COOKING",
      orderedAt: "19:15"
    },
    {
      orderItemId: 502,
      productId: 1,
      productName: "Gỏi Cuốn Tôm Thịt",
      quantity: 2,
      priceProduct: 45000,
      priceTotal: 90000,
      note: "Tương đậu phộng để riêng",
      threadId: 98765,
      status: "SERVED",
      orderedAt: "18:45"
    },
    {
      orderItemId: 503,
      productId: 86,
      productName: "Cà Phê Sữa Đá Sài Gòn",
      quantity: 1,
      priceProduct: 30000,
      priceTotal: 30000,
      note: "Nhiều đá",
      threadId: 98765,
      status: "SERVED",
      orderedAt: "18:35"
    },
    {
      orderItemId: 504,
      productId: 34,
      productName: "Cơm Tấm Sườn Bì Chả Đặc Biệt",
      quantity: 1,
      priceProduct: 75000,
      priceTotal: 75000,
      note: "Thêm mỡ hành",
      threadId: 11223,
      status: "COOKING",
      orderedAt: "19:10"
    }
  ]
};
