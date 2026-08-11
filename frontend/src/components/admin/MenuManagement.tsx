import React, { useState, useEffect } from 'react';
import { AdminMenuItem } from '../../types/admin';
import {
  fetchAdminMenuItemsApi,
  toggleProductAvailabilityApi,
  createProductApi,
  updateProductApi,
  deleteProductApi
} from '../../api/adminApi';
import {
  Search,
  Plus,
  Filter,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Edit,
  Trash2,
  Upload,
  Image as ImageIcon,
  Tag,
  ChevronRight,
  FolderPlus,
  FolderMinus,
  Settings2,
  Trash,
  Eye
} from 'lucide-react';
import { Modal, Switch, message, Popconfirm, Image as AntImage } from 'antd';
import { SmartSearchBar } from '../common/SmartSearchBar';
import { isVietnameseMatch, filterAndSortByRelevance } from '../../utils/vietnameseSearch';

export const MenuManagement: React.FC = () => {
  const [items, setItems] = useState<AdminMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Categories State
  const [categories, setCategories] = useState<string[]>([
    'Tất cả',
    'Khai Vị',
    'Món Chính',
    'Lẩu & Nướng',
    'Tráng Miệng',
    'Đồ Uống',
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  // Category Manager Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  // Modal Create Product State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Món Chính');
  const [newProductPrice, setNewProductPrice] = useState<string>('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductImage, setNewProductImage] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Modal Edit Product State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminMenuItem | null>(null);
  const [editProductName, setEditProductName] = useState('');
  const [editProductCategory, setEditProductCategory] = useState('Món Chính');
  const [editProductPrice, setEditProductPrice] = useState<string>('');
  const [editProductDesc, setEditProductDesc] = useState('');
  const [editProductImage, setEditProductImage] = useState<string>('');
  const [editProductAvailable, setEditProductAvailable] = useState<boolean>(true);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAdminMenuItemsApi();
      setItems(data);
      if (Array.isArray(data)) {
        const apiCats = Array.from(new Set(data.map((i) => i.category).filter(Boolean)));
        setCategories((prev) => {
          const merged = Array.from(new Set(['Tất cả', ...apiCats, ...prev.filter((c) => c !== 'Tất cả')]));
          return merged;
        });
      }
    } catch (err) {
      setError('Không thể tải danh sách thực đơn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenuItems();
  }, []);

  // --- CATEGORY ACTIONS ---
  const handleAddCategory = () => {
    const trimmed = newCatInput.trim();
    if (!trimmed) {
      message.error('Vui lòng nhập tên danh mục');
      return;
    }
    if (categories.includes(trimmed)) {
      message.warning('Danh mục này đã tồn tại');
      return;
    }
    setCategories((prev) => [...prev, trimmed]);
    setNewCatInput('');
    message.success(`Đã thêm danh mục "${trimmed}"`);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (catToDelete === 'Tất cả') {
      message.error('Không thể xóa danh mục "Tất cả"');
      return;
    }
    setCategories((prev) => prev.filter((c) => c !== catToDelete));
    if (selectedCategory === catToDelete) {
      setSelectedCategory('Tất cả');
    }
    message.success(`Đã xóa danh mục "${catToDelete}"`);
  };

  // --- IMAGE FILE UPLOAD HANDLER ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        message.error('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultStr = reader.result as string;
        if (isEdit) {
          setEditProductImage(resultStr);
        } else {
          setNewProductImage(resultStr);
        }
        message.success('Đã tải ảnh từ máy tính thành công!');
      };
      reader.readAsDataURL(file);
    }
  };

  // --- OPTIMISTIC TOGGLE AVAILABILITY ---
  const handleToggleStock = async (itemId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, isAvailable: nextStatus } : item))
    );

    try {
      await toggleProductAvailabilityApi(itemId, nextStatus);
      message.success(
        nextStatus ? 'Đã bật trạng thái CÒN HÀNG cho món ăn' : 'Đã chuyển trạng thái TẠM HẾT HÀNG'
      );
    } catch (err) {
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, isAvailable: currentStatus } : item))
      );
      message.error('Không thể cập nhật trạng thái món ăn. Đã hoàn tác.');
    }
  };

  // --- CREATE DISH ACTION ---
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) {
      message.error('Vui lòng nhập tên món ăn');
      return;
    }
    const priceNum = Number(newProductPrice);
    if (!newProductPrice || isNaN(priceNum) || priceNum <= 0) {
      message.error('Vui lòng nhập giá bán hợp lệ (VD: 55000)');
      return;
    }

    try {
      setSubmitting(true);
      const created = await createProductApi({
        sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        name: newProductName.trim(),
        category: newProductCategory,
        price: priceNum,
        imageUrl: newProductImage.trim(),
        description: newProductDesc.trim(),
        isAvailable: true,
      });

      setItems((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
      setIsModalOpen(false);
      // Reset form
      setNewProductName('');
      setNewProductPrice('');
      setNewProductDesc('');
      setNewProductImage('');
      message.success(`Đã thêm thành công món "${newProductName}" vào Thực đơn!`);
      await loadMenuItems();
    } catch (err: any) {
      // Thông báo lỗi đã được Axios Interceptor tại api.ts tự động hiển thị duy nhất 1 lần
    } finally {
      setSubmitting(false);
    }
  };

  // --- EDIT DISH MODAL OPEN & SUBMIT ---
  const handleOpenEditModal = (item: AdminMenuItem) => {
    setEditingItem(item);
    setEditProductName(item.name);
    setEditProductCategory(item.category);
    setEditProductPrice(String(item.price));
    setEditProductDesc(item.description || '');
    setEditProductImage(item.imageUrl || '');
    setEditProductAvailable(item.isAvailable);
    setIsEditModalOpen(true);
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editProductName.trim()) {
      message.error('Vui lòng nhập tên món ăn');
      return;
    }
    const priceNum = Number(editProductPrice);
    if (!editProductPrice || isNaN(priceNum) || priceNum <= 0) {
      message.error('Vui lòng nhập giá bán hợp lệ (VD: 55000)');
      return;
    }

    try {
      setSubmitting(true);
      const updated = await updateProductApi(editingItem.id, {
        name: editProductName.trim(),
        category: editProductCategory,
        price: priceNum,
        description: editProductDesc.trim(),
        imageUrl: editProductImage.trim(),
        isAvailable: editProductAvailable,
      });

      setItems((prev) => (Array.isArray(prev) ? prev.map((item) => (item.id === editingItem.id ? updated : item)) : []));
      setIsEditModalOpen(false);
      message.success(`Đã cập nhật thành công thông tin món "${editProductName}"!`);
      await loadMenuItems();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể cập nhật món ăn. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- DELETE DISH ACTION ---
  const handleDeleteDish = async (itemId: string) => {
    try {
      setLoading(true);
      await deleteProductApi(itemId);
      setItems((prev) => (Array.isArray(prev) ? prev.filter((i) => i.id !== itemId) : []));
      message.success('Đã xóa món ăn khỏi cơ sở dữ liệu!');
      await loadMenuItems();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể xóa món ăn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = filterAndSortByRelevance(items, searchQuery, selectedCategory);

  const formatVND = (num: number) => new Intl.NumberFormat('vi-VN').format(num) + ' đ';

  return (
    <div className="space-y-4 font-sans">
      {/* TOOLBAR: CATEGORY CHIPS + CATEGORY MANAGER + SEARCH + CREATE BUTTON */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Category Chips & Category Manager Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap min-h-[36px] ${
                  selectedCategory === cat
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Nút Thêm / Xóa Danh Mục */}
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Quản lý thêm hoặc xóa danh mục thực đơn"
          >
            <Settings2 className="w-3.5 h-3.5 text-orange-600" />
            <span>Quản Lý Danh Mục</span>
          </button>
        </div>

        {/* Right: Smart Autocomplete Search Bar & Create Dish Button */}
        <div className="flex items-center gap-2.5 flex-1 sm:flex-none justify-end">
          <SmartSearchBar
            items={items}
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            onSearchChange={(q) => setSearchQuery(q)}
            onClearCategoryFilter={() => setSelectedCategory('Tất cả')}
          />

          <button
            onClick={() => setIsModalOpen(true)}
            className="h-9 px-3.5 rounded-lg bg-orange-600 hover:bg-orange-700 active:scale-98 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Thêm Món Mới</span>
          </button>
        </div>
      </div>

      {/* 4 UI STATES HANDLING */}

      {/* STATE 2: LOADING SKELETON */}
      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center justify-between py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-40"></div>
                  <div className="h-3 bg-slate-200 rounded w-24"></div>
                </div>
              </div>
              <div className="h-6 bg-slate-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      )}

      {/* STATE 3: ERROR STATE */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3 max-w-lg mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
          <h3 className="text-sm font-bold text-red-900">{error}</h3>
          <button
            onClick={loadMenuItems}
            className="h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* STATE 4: EMPTY STATE */}
      {!loading && !error && filteredItems.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3 shadow-2xs">
          <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-900">Không tìm thấy món ăn nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Thử thay đổi từ khóa tìm kiếm hoặc bấm nút "Thêm Món Mới" để bổ sung thực đơn.
          </p>
        </div>
      )}

      {/* STATE 1: NORMAL DATA COMMERCIAL TABLE */}
      {!loading && !error && filteredItems.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Món Ăn & SKU</th>
                  <th className="p-3.5">Danh Mục</th>
                  <th className="p-3.5">Giá Bán</th>
                  <th className="p-3.5 w-[160px] min-w-[160px]">Trạng Thái Kho</th>
                  <th className="p-3.5 text-right w-[100px] min-w-[100px]">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <div className="w-11 h-11 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                            <AntImage
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-11 h-11 object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">{item.name}</p>
                          <span className="text-[10px] font-mono text-slate-400">{item.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold whitespace-nowrap">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-extrabold text-slate-900 text-xs sm:text-sm whitespace-nowrap">
                        {formatVND(item.price)}
                      </span>
                    </td>
                    <td className="p-3.5 w-[160px] min-w-[160px]">
                      {/* Optimistic Quick Switcher with UI/UX Pro Zero-Shift Layout */}
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.isAvailable}
                          onChange={() => handleToggleStock(item.id, item.isAvailable)}
                          size="small"
                        />
                        <span
                          className={`text-xs font-semibold inline-block min-w-[95px] transition-colors duration-200 select-none ${
                            item.isAvailable ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        >
                          {item.isAvailable ? 'Còn hàng' : 'Tạm hết hàng'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      {/* Nút Thao Tác: Chỉnh Sửa Món Ăn */}
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-orange-50 hover:border-orange-300 text-slate-600 hover:text-orange-600 transition-colors cursor-pointer shadow-2xs"
                        title="Chỉnh sửa thông tin món ăn"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Nút Xóa Món Ăn */}
                      <Popconfirm
                        title="Xóa món ăn"
                        description="Bạn có chắc chắn muốn xóa món này khỏi thực đơn?"
                        onConfirm={() => handleDeleteDish(item.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <button
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:border-red-300 text-slate-400 hover:text-red-600 transition-colors cursor-pointer shadow-2xs"
                          title="Xóa món ăn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Popconfirm>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 1. MODAL QUẢN LÝ DANH MỤC (THÊM / XÓA DANH MỤC) */}
      <Modal
        title="📂 Quản Lý Danh Mục Thực Đơn"
        open={isCategoryModalOpen}
        onCancel={() => setIsCategoryModalOpen(false)}
        footer={null}
      >
        <div className="space-y-4 pt-2 text-xs">
          {/* Ô Thêm Danh Mục Mới */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Nhập tên danh mục mới (VD: Khai vị, Tráng miệng...)"
              value={newCatInput}
              onChange={(e) => setNewCatInput(e.target.value)}
              className="flex-1 p-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-orange-500"
            />
            <button
              onClick={handleAddCategory}
              className="h-9 px-3.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm</span>
            </button>
          </div>

          {/* Danh Sách Các Danh Mục Hiện Có */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="font-bold text-slate-700">Danh mục hiện có:</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <span className="font-semibold text-slate-800 text-xs">{cat}</span>
                  {cat !== 'Tất cả' ? (
                    <Popconfirm
                      title={`Xóa danh mục "${cat}"?`}
                      onConfirm={() => handleDeleteCategory(cat)}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                    >
                      <button className="text-red-500 hover:text-red-700 p-1 cursor-pointer">
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </Popconfirm>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Mặc định</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* 2. MODAL THÊM MÓN ĂN MỚI (Khung ảnh trống tùy chọn - Bấm chọn ảnh & Xem ảnh) */}
      <Modal
        title="➕ Thêm Món Ăn Mới Vào Thực Đơn"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 pt-2 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên món ăn *</label>
            <input
              type="text"
              required
              placeholder="VD: Phở Bò Tái Nạm"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Danh mục món</label>
              <select
                value={newProductCategory}
                onChange={(e) => setNewProductCategory(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500 cursor-pointer"
              >
                {categories
                  .filter((c) => c !== 'Tất cả')
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Giá bán (VND) *</label>
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="Nhập giá bán (VD: 55000)..."
                value={newProductPrice}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, '');
                  const cleaned = raw.replace(/^0+(?=\d)/, '');
                  setNewProductPrice(cleaned);
                }}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500 font-semibold text-slate-900"
              />
            </div>
          </div>

          {/* Ô TRỐNG TẢI & XEM LẠI HÌNH ẢNH MÓN ĂN (KHÔNG DÙNG ẢNH MẶC ĐỊNH) */}
          <div className="space-y-2 border-t border-b border-slate-100 py-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700">
                Hình ảnh món ăn <span className="text-slate-400 font-normal">(Tùy chọn - Ô trống)</span>
              </label>
              {newProductImage && (
                <button
                  type="button"
                  onClick={() => setNewProductImage('')}
                  className="text-red-500 text-[11px] font-semibold hover:underline"
                >
                  Xóa ảnh
                </button>
              )}
            </div>

            {newProductImage ? (
              <div className="relative group w-full h-44 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                <AntImage
                  src={newProductImage}
                  alt="Món ăn"
                  className="w-full h-full object-cover"
                  wrapperClassName="w-full h-full flex items-center justify-center"
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-lg text-white text-[11px]">
                  <label htmlFor="file-upload-new" className="cursor-pointer hover:text-orange-400 font-semibold px-2 py-0.5">
                    Thay ảnh
                  </label>
                </div>
              </div>
            ) : (
              <label
                htmlFor="file-upload-new"
                className="w-full h-36 rounded-xl border-2 border-dashed border-slate-300 hover:border-orange-500 bg-slate-50/80 hover:bg-orange-50/30 flex flex-col items-center justify-center cursor-pointer transition-all space-y-2 group"
              >
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 group-hover:border-orange-300 flex items-center justify-center text-slate-400 group-hover:text-orange-600 transition-colors shadow-2xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-700 group-hover:text-orange-600">
                    Bấm vào đây để chọn ảnh từ máy tính
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Hỗ trợ PNG, JPG, WEBP (Tối đa 5MB)</p>
                </div>
              </label>
            )}

            <input
              id="file-upload-new"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, false)}
              className="hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mô tả món ăn</label>
            <textarea
              rows={2}
              placeholder="Mô tả chi tiết nguyên liệu, hương vị..."
              value={newProductDesc}
              onChange={(e) => setNewProductDesc(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Lưu món ăn'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. MODAL CHỈNH SỬA THÔNG TIN MÓN ĂN (Đã bỏ giá Cost & Không dùng ảnh mặc định) */}
      <Modal
        title="✏️ Chỉnh Sửa Thông Tin Món Ăn"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <form onSubmit={handleSaveEditProduct} className="space-y-4 pt-2 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên món ăn *</label>
            <input
              type="text"
              required
              value={editProductName}
              onChange={(e) => setEditProductName(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Danh mục món</label>
              <select
                value={editProductCategory}
                onChange={(e) => setEditProductCategory(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500 cursor-pointer"
              >
                {categories
                  .filter((c) => c !== 'Tất cả')
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Giá bán (VND) *</label>
              <input
                type="text"
                inputMode="numeric"
                required
                placeholder="Nhập giá bán (VD: 55000)..."
                value={editProductPrice}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, '');
                  const cleaned = raw.replace(/^0+(?=\d)/, '');
                  setEditProductPrice(cleaned);
                }}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500 font-semibold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Trạng thái kho</label>
            <div className="flex items-center gap-2 pt-1">
              <Switch
                checked={editProductAvailable}
                onChange={(val) => setEditProductAvailable(val)}
                size="small"
              />
              <span className={`text-xs font-semibold inline-block min-w-[95px] transition-colors duration-200 select-none ${
                editProductAvailable ? 'text-emerald-600' : 'text-slate-400'
              }`}>
                {editProductAvailable ? 'Còn hàng' : 'Tạm hết hàng'}
              </span>
            </div>
          </div>

          {/* Ô TRỐNG TẢI & XEM LẠI HÌNH ẢNH MÓN ĂN KHI CHỈNH SỬA */}
          <div className="space-y-2 border-t border-b border-slate-100 py-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700">Hình ảnh món ăn</label>
              {editProductImage && (
                <button
                  type="button"
                  onClick={() => setEditProductImage('')}
                  className="text-red-500 text-[11px] font-semibold hover:underline"
                >
                  Xóa ảnh
                </button>
              )}
            </div>

            {editProductImage ? (
              <div className="relative group w-full h-44 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                <AntImage
                  src={editProductImage}
                  alt="Món ăn"
                  className="w-full h-full object-cover"
                  wrapperClassName="w-full h-full flex items-center justify-center"
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-lg text-white text-[11px]">
                  <label htmlFor="file-upload-edit" className="cursor-pointer hover:text-orange-400 font-semibold px-2 py-0.5">
                    Thay ảnh
                  </label>
                </div>
              </div>
            ) : (
              <label
                htmlFor="file-upload-edit"
                className="w-full h-36 rounded-xl border-2 border-dashed border-slate-300 hover:border-orange-500 bg-slate-50/80 hover:bg-orange-50/30 flex flex-col items-center justify-center cursor-pointer transition-all space-y-2 group"
              >
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 group-hover:border-orange-300 flex items-center justify-center text-slate-400 group-hover:text-orange-600 transition-colors shadow-2xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-700 group-hover:text-orange-600">
                    Bấm vào đây để chọn ảnh từ máy tính
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Hỗ trợ PNG, JPG, WEBP (Tối đa 5MB)</p>
                </div>
              </label>
            )}

            <input
              id="file-upload-edit"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, true)}
              className="hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mô tả món ăn</label>
            <textarea
              rows={2}
              value={editProductDesc}
              onChange={(e) => setEditProductDesc(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold cursor-pointer"
            >
              Cập Nhật Món Ăn
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
