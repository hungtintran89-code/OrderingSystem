import React, { useState, useEffect } from 'react';
import { AdminTable } from '../../types/admin';
import { fetchAdminTablesApi } from '../../api/adminApi';
import {
  QrCode,
  Printer,
  CheckSquare,
  Square,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Users,
  UtensilsCrossed,
  X,
  Plus,
  Edit,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { Modal, message, Popconfirm } from 'antd';

export const TableQRManager: React.FC = () => {
  const [tables, setTables] = useState<AdminTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>('Tất cả');
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Modal Create Table & QR State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableZone, setNewTableZone] = useState('Tầng 1');
  const [newTableCapacity, setNewTableCapacity] = useState<number>(4);

  // Modal Edit Table & QR State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<AdminTable | null>(null);
  const [editTableNumber, setEditTableNumber] = useState('');
  const [editTableZone, setEditTableZone] = useState('Tầng 1');
  const [editTableCapacity, setEditTableCapacity] = useState<number>(4);
  const [editQrUrl, setEditQrUrl] = useState('');

  const loadTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAdminTablesApi();
      setTables(data);
    } catch (err) {
      setError('Không thể tải sơ đồ bàn và mã QR. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const zones = ['Tất cả', 'Tầng 1', 'Tầng 2', 'VIP'];

  const filteredTables = tables.filter((t) => {
    if (selectedZone === 'Tất cả') return true;
    return t.zone === selectedZone;
  });

  const toggleSelectTable = (id: string) => {
    setSelectedTableIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTableIds.length === filteredTables.length) {
      setSelectedTableIds([]);
    } else {
      setSelectedTableIds(filteredTables.map((t) => t.id));
    }
  };

  // --- CREATE TABLE & QR ACTION ---
  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault();
    const num = newTableNumber.trim();
    if (!num) {
      message.error('Vui lòng nhập tên hoặc số bàn (VD: 07, VIP-01)');
      return;
    }

    const qrData = `https://order.restaurant.com/table/${num.toLowerCase()}`;
    const newQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

    const newTableItem: AdminTable = {
      id: `tbl-${Date.now()}`,
      tableNumber: num,
      zone: newTableZone,
      capacity: Number(newTableCapacity),
      status: 'EMPTY',
      qrUrl: newQrUrl,
    };

    setTables((prev) => [newTableItem, ...prev]);
    setIsCreateModalOpen(false);
    setNewTableNumber('');
    message.success(`Đã tạo Bàn ${num} và Mã QR Code mới thành công!`);
  };

  // --- EDIT TABLE & QR ACTION ---
  const handleOpenEditModal = (table: AdminTable) => {
    setEditingTable(table);
    setEditTableNumber(table.tableNumber);
    setEditTableZone(table.zone);
    setEditTableCapacity(table.capacity);
    setEditQrUrl(table.qrUrl);
    setIsEditModalOpen(true);
  };

  const handleRegenerateQR = () => {
    if (!editTableNumber.trim()) return;
    const qrData = `https://order.restaurant.com/table/${editTableNumber.trim().toLowerCase()}?v=${Date.now()}`;
    const newQr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
    setEditQrUrl(newQr);
    message.success('Đã sinh mã QR Code mới!');
  };

  const handleSaveEditTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable || !editTableNumber.trim()) {
      message.error('Vui lòng nhập tên hoặc số bàn');
      return;
    }

    const updated: AdminTable = {
      ...editingTable,
      tableNumber: editTableNumber.trim(),
      zone: editTableZone,
      capacity: Number(editTableCapacity),
      qrUrl: editQrUrl,
    };

    setTables((prev) => prev.map((t) => (t.id === editingTable.id ? updated : t)));
    setIsEditModalOpen(false);
    message.success(`Đã cập nhật thông tin Bàn ${editTableNumber}!`);
  };

  // --- DELETE TABLE & QR ACTION ---
  const handleDeleteTable = (tableId: string) => {
    setTables((prev) => prev.filter((t) => t.id !== tableId));
    setSelectedTableIds((prev) => prev.filter((id) => id !== tableId));
    message.success('Đã xóa bàn và mã QR tương ứng!');
  };

  const handleOpenPrintModal = () => {
    if (selectedTableIds.length === 0) {
      message.warning('Vui lòng chọn ít nhất 1 bàn để xuất file in mã QR');
      return;
    }
    setIsPrintModalOpen(true);
  };

  const handleTriggerBrowserPrint = () => {
    window.print();
  };

  const selectedTablesList = tables.filter((t) => selectedTableIds.includes(t.id));

  return (
    <div className="space-y-4 font-sans">
      {/* TOOLBAR: ZONE TABS & ACTION BUTTONS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Zone Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {zones.map((z) => (
            <button
              key={z}
              onClick={() => setSelectedZone(z)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap min-h-[36px] ${
                selectedZone === z
                  ? 'bg-orange-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {z}
            </button>
          ))}
        </div>

        {/* Multi-select, Create & Print Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Select All */}
          <button
            onClick={handleSelectAll}
            className="h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {selectedTableIds.length === filteredTables.length && filteredTables.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-orange-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Chọn tất cả ({selectedTableIds.length})</span>
          </button>

          {/* Nút Tạo Bàn & Mã QR Mới */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-9 px-3.5 rounded-lg bg-orange-600 hover:bg-orange-700 active:scale-98 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tạo Bàn & Mã QR</span>
          </button>

          {/* Nút In QR File */}
          <button
            onClick={handleOpenPrintModal}
            className="h-9 px-3.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-4 h-4 text-orange-600" />
            <span>Xuất File In QR A6/A7 ({selectedTableIds.length})</span>
          </button>
        </div>
      </div>

      {/* 4 UI STATES HANDLING */}

      {/* STATE 2: LOADING SKELETON */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
              <div className="h-6 bg-slate-200 rounded w-24"></div>
              <div className="w-32 h-32 bg-slate-200 rounded-lg mx-auto"></div>
              <div className="h-8 bg-slate-100 rounded w-full"></div>
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
            onClick={loadTables}
            className="h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* STATE 1: NORMAL DATA TABLE CARDS GRID */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const isSelected = selectedTableIds.includes(table.id);
            return (
              <div
                key={table.id}
                onClick={() => toggleSelectTable(table.id)}
                className={`bg-white rounded-xl p-4 border transition-all cursor-pointer relative shadow-2xs hover:shadow-md flex flex-col justify-between ${
                  isSelected ? 'border-orange-500 ring-2 ring-orange-200' : 'border-slate-200'
                }`}
              >
                {/* Top Action Header: Edit, Delete & Selection Checkbox */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2">
                  <div className="flex items-center gap-1">
                    {/* Nút Chỉnh Sửa Tên Bàn */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(table);
                      }}
                      className="p-1 rounded bg-slate-100 hover:bg-orange-50 text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
                      title="Chỉnh sửa tên bàn & thông tin QR"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {/* Nút Xóa Mã QR & Bàn */}
                    <Popconfirm
                      title="Xóa Bàn & Mã QR"
                      description={`Xóa Bàn ${table.tableNumber}?`}
                      onConfirm={() => handleDeleteTable(table.id)}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                    >
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Xóa bàn này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </Popconfirm>
                  </div>

                  {/* Checkbox Tích Chọn Xuất File In */}
                  <div>
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-orange-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                </div>

                {/* Main Card Content */}
                <div className="space-y-3 text-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {table.zone}
                    </span>
                    <h3 className="font-extrabold text-lg text-slate-900">Bàn {table.tableNumber}</h3>
                    <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                      <Users className="w-3 h-3 text-slate-400" /> {table.capacity} chỗ ngồi
                    </p>
                  </div>

                  {/* QR Code Graphic */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 inline-block shadow-2xs">
                    <img
                      src={table.qrUrl}
                      alt={`QR Bàn ${table.tableNumber}`}
                      className="w-32 h-32 object-contain mx-auto"
                    />
                  </div>

                  <p className="text-[10px] font-mono text-slate-400 truncate">
                    {table.qrUrl}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. MODAL TẠO BÀN & MÃ QR MỚI */}
      <Modal
        title="➕ Tạo Bàn & Sinh Mã QR Mới"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
      >
        <form onSubmit={handleCreateTable} className="space-y-4 pt-2 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Số / Tên Bàn *</label>
            <input
              type="text"
              required
              placeholder="VD: 07, 15, VIP-01..."
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Khu Vực (Zone)</label>
              <select
                value={newTableZone}
                onChange={(e) => setNewTableZone(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500 cursor-pointer"
              >
                <option value="Tầng 1">Tầng 1</option>
                <option value="Tầng 2">Tầng 2</option>
                <option value="VIP">VIP</option>
                <option value="Sân Thượng">Sân Thượng</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số Chỗ Ngồi</label>
              <input
                type="number"
                min={1}
                max={20}
                value={newTableCapacity}
                onChange={(e) => setNewTableCapacity(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
              />
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg text-orange-900 text-[11px] space-y-1">
            <p className="font-bold flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-orange-600" /> Hệ thống sẽ tự động sinh Mã QR Code
            </p>
            <p className="text-orange-700">
              Khách hàng quét mã này bằng điện thoại sẽ tự động mở trang thực đơn đúng Bàn ăn.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold cursor-pointer"
            >
              Tạo Bàn & Sinh Mã QR
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. MODAL CHỈNH SỬA TÊN BÀN & THÔNG TIN QR */}
      <Modal
        title="✏️ Chỉnh Sửa Thông Tin Bàn & Mã QR"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
      >
        <form onSubmit={handleSaveEditTable} className="space-y-4 pt-2 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Số / Tên Bàn *</label>
            <input
              type="text"
              required
              value={editTableNumber}
              onChange={(e) => setEditTableNumber(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Khu Vực (Zone)</label>
              <select
                value={editTableZone}
                onChange={(e) => setEditTableZone(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500 cursor-pointer"
              >
                <option value="Tầng 1">Tầng 1</option>
                <option value="Tầng 2">Tầng 2</option>
                <option value="VIP">VIP</option>
                <option value="Sân Thượng">Sân Thượng</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số Chỗ Ngồi</label>
              <input
                type="number"
                min={1}
                max={20}
                value={editTableCapacity}
                onChange={(e) => setEditTableCapacity(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
              />
            </div>
          </div>

          {/* QR Code Preview & Regenerate Button */}
          <div className="space-y-2 border-t border-b border-slate-100 py-3 text-center">
            <label className="font-semibold text-slate-700 block text-left">Mã QR Code Hiện Tại:</label>
            <img src={editQrUrl} alt="QR Code" className="w-28 h-28 object-contain mx-auto border border-slate-200 rounded-lg p-2 bg-white" />
            <button
              type="button"
              onClick={handleRegenerateQR}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
              <span>Tạo Lại Mã QR Mới (Regenerate)</span>
            </button>
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
              Lưu Cập Nhật Bàn
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. PRINTABLE QR CODES A6/A7 BATCH EXPORTER MODAL */}
      <Modal
        title="Xuất File In Thẻ QR Code Bàn (Khổ A6/A7)"
        open={isPrintModalOpen}
        onCancel={() => setIsPrintModalOpen(false)}
        width={720}
        footer={[
          <button
            key="cancel"
            onClick={() => setIsPrintModalOpen(false)}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer mr-2"
          >
            Đóng
          </button>,
          <button
            key="print"
            onClick={handleTriggerBrowserPrint}
            className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>In Ngay (Print Document)</span>
          </button>,
        ]}
      >
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <p className="text-xs text-slate-500 border-b border-slate-100 pb-2">
            Xem trước mẫu file in chuẩn kích thước thẻ để bàn. Bấm "In Ngay" để xuất sang máy in hoặc file PDF.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {selectedTablesList.map((tbl) => (
              <div
                key={tbl.id}
                className="bg-white border-2 border-slate-900 rounded-xl p-5 text-center space-y-3 shadow-sm print:border-2"
              >
                {/* Brand Header */}
                <div className="flex items-center justify-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-sm text-slate-900 tracking-tight">F&B DINE-IN</span>
                </div>

                {/* Table Title */}
                <div>
                  <h4 className="font-black text-xl text-slate-900">BÀN {tbl.tableNumber}</h4>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {tbl.zone}
                  </span>
                </div>

                {/* QR Image */}
                <div className="p-3 bg-white border border-slate-200 rounded-lg inline-block shadow-2xs">
                  <img src={tbl.qrUrl} alt="QR Code" className="w-36 h-36 mx-auto" />
                </div>

                {/* Tagline */}
                <div className="bg-slate-100 p-2 rounded-lg text-slate-800 font-bold text-[11px]">
                  📲 Quét mã QR để Xem Thực Đơn & Đặt Món
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
