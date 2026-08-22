import React, { useState, useEffect } from 'react';
import { AdminTable } from '../../types/admin';
import {
  fetchAdminTablesApi,
  createAdminTableApi,
  updateAdminTableApi,
  deleteAdminTableApi,
  fetchAdminZonesApi,
  createAdminZoneApi,
  updateAdminZoneApi,
  deleteAdminZoneApi,
  AdminZone
} from '../../api/adminApi';
import { formatTableLabel } from '../../utils/tableUtils';
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
  RotateCcw,
  Settings,
  FolderPlus
} from 'lucide-react';
import { Modal, message, Popconfirm } from 'antd';

export const TableQRManager: React.FC = () => {
  const [tables, setTables] = useState<AdminTable[]>([]);
  const [zones, setZones] = useState<AdminZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>('Tất cả');
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Modal Create Table & QR State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableZone, setNewTableZone] = useState('Tầng trệt');
  const [newTableCapacity, setNewTableCapacity] = useState<number | string>(4);

  // Modal Edit Table & QR State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<AdminTable | null>(null);
  const [editTableNumber, setEditTableNumber] = useState('');
  const [editTableZone, setEditTableZone] = useState('Tầng trệt');
  const [editTableCapacity, setEditTableCapacity] = useState<number | string>(4);
  const [editQrUrl, setEditQrUrl] = useState('');
  const [isRegeneratingQr, setIsRegeneratingQr] = useState(false);

  // Modal Zone Management State
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [newZoneNameInput, setNewZoneNameInput] = useState('');
  const [editingZone, setEditingZone] = useState<AdminZone | null>(null);
  const [editZoneNameInput, setEditZoneNameInput] = useState('');

  const loadTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAdminTablesApi();
      const sortedData = [...data].sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
      setTables(sortedData);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách bàn ăn');
    } finally {
      setLoading(false);
    }
  };

  const loadZones = async () => {
    try {
      const zoneList = await fetchAdminZonesApi();
      setZones(zoneList);
      if (zoneList.length > 0 && !newTableZone) {
        setNewTableZone(zoneList[0].zoneName);
      }
    } catch (err) {
      // Handled by fallback
    }
  };

  useEffect(() => {
    loadTables();
    loadZones();
  }, []);

  const filteredTables = tables.filter((t) => {
    if (selectedZone === 'Tất cả') return true;
    return t.zone === selectedZone;
  });

  const toggleSelectTable = (id: string) => {
    setSelectedTableIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTableIds.length === filteredTables.length) {
      setSelectedTableIds([]);
    } else {
      setSelectedTableIds(filteredTables.map((t) => t.id));
    }
  };

  // --- CREATE TABLE ACTION ---
  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = newTableNumber.trim();
    if (!num) {
      message.error('Vui lòng nhập tên hoặc số bàn (VD: 07, VIP-01)');
      return;
    }

    try {
      await createAdminTableApi({
        tableName: num,
        zone: newTableZone,
        capacity: Number(newTableCapacity) || 4,
      });

      setIsCreateModalOpen(false);
      setNewTableNumber('');
      message.success(`Đã tạo Bàn "${num}" và mã QR Code lưu CSDL thành công!`);
      await loadTables();
    } catch (err: any) {
      // Handled by Axios Interceptor
    }
  };

  // --- EDIT TABLE & QR ACTION ---
  const handleOpenEditModal = (table: AdminTable) => {
    setEditingTable(table);
    setEditTableNumber(table.tableNumber);
    setEditTableZone(table.zone);
    setEditTableCapacity(table.capacity ? Number(table.capacity) : 4);
    setEditQrUrl(table.qrUrl);
    setIsRegeneratingQr(false);
    setIsEditModalOpen(true);
  };

  const handleRegenerateQR = () => {
    setIsRegeneratingQr(true);
    message.info('Đã yêu cầu tạo mới thành công vui lòng ấn lưu để cập nhật');
  };

  const handleSaveEditTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable || !editTableNumber.trim()) {
      message.error('Vui lòng nhập tên hoặc số bàn');
      return;
    }

    try {
      await updateAdminTableApi(editingTable.id, {
        tableName: editTableNumber.trim(),
        zone: editTableZone,
        capacity: Number(editTableCapacity) || 4,
        regenerateQr: isRegeneratingQr,
      });

      setIsEditModalOpen(false);
      message.success(`Đã cập nhật thành công thông tin ${formatTableLabel(editTableNumber)}`);
      await loadTables();
    } catch (err: any) {
      // Handled by Axios Interceptor
    }
  };

  // --- DELETE TABLE & QR ACTION ---
  const handleDeleteTable = async (tableId: string) => {
    try {
      await deleteAdminTableApi(tableId);
      setSelectedTableIds((prev) => prev.filter((id) => id !== tableId));
      message.success('Đã xóa bàn và mã QR khỏi CSDL thành công!');
      await loadTables();
    } catch (err: any) {
      // Handled by Axios Interceptor
    }
  };

  // --- DYNAMIC ZONE MANAGEMENT ACTIONS ---
  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newZoneNameInput.trim();
    if (!name) {
      message.error('Vui lòng nhập tên khu vực');
      return;
    }
    try {
      await createAdminZoneApi(name);
      setNewZoneNameInput('');
      message.success(`Đã thêm khu vực "${name}" thành công!`);
      await loadZones();
    } catch (err: any) {
      // Handled by Axios Interceptor
    }
  };

  const handleUpdateZone = async (zoneId: number) => {
    const name = editZoneNameInput.trim();
    if (!name) {
      message.error('Tên khu vực không được để trống');
      return;
    }
    try {
      await updateAdminZoneApi(zoneId, name);
      setEditingZone(null);
      setEditZoneNameInput('');
      message.success(`Đã cập nhật tên khu vực thành "${name}" thành công!`);
      await loadZones();
      await loadTables();
    } catch (err: any) {
      // Handled by Axios Interceptor
    }
  };

  const handleDeleteZone = async (zoneId: number, zoneName: string) => {
    setEditingZone(null);
    try {
      await deleteAdminZoneApi(zoneId);
      message.success(`Đã xóa khu vực "${zoneName}" thành công! Các bàn thuộc khu vực này đã chuyển về Tầng trệt.`);
      if (selectedZone === zoneName) {
        setSelectedZone('Tất cả');
      }
      await loadZones();
      await loadTables();
    } catch (err: any) {
      // Handled by Axios Interceptor
    }
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
    <div className="flex-1 flex flex-col min-h-0 space-y-3 font-sans h-full overflow-hidden">
      {/* TOOLBAR STICKY: ZONE TABS & ACTION BUTTONS */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        {/* Page Title */}
        <div className="flex items-center gap-2.5">
          <QrCode className="w-6 h-6 text-orange-600 stroke-[2.2] flex-shrink-0" />
          <h2 className="font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">Quản Lý Bàn & Mã QR</h2>
        </div>

        {/* Zone Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedZone('Tất cả')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap min-h-[36px] ${
              selectedZone === 'Tất cả'
                ? 'bg-orange-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả
          </button>
          {zones.map((z) => (
            <button
              key={z.zoneId}
              onClick={() => setSelectedZone(z.zoneName)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap min-h-[36px] ${
                selectedZone === z.zoneName
                  ? 'bg-orange-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {z.zoneName}
            </button>
          ))}
        </div>

        {/* Multi-select, Zone Manage, Create & Print Actions */}
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

          {/* Nút Quản Lý Khu Vực (Zone) */}
          <button
            onClick={() => setIsZoneModalOpen(true)}
            className="h-9 px-3.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            title="Quản lý danh sách Khu Vực (Zone) trong nhà hàng"
          >
            <Settings className="w-4 h-4 text-orange-600" />
            <span>Quản Lý Khu Vực</span>
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

      {/* STATE 4: SUCCESS TABLE CARDS GRID INSIDE SCROLLABLE CONTAINER CARD */}
      {!loading && !error && (
        <div className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto custom-scrollbar border border-slate-200/80 rounded-xl bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-2">
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
                        description={`Xóa ${formatTableLabel(table.tableNumber)}?`}
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
                      <h3 className="font-extrabold text-lg text-slate-900">{formatTableLabel(table.tableNumber)}</h3>
                      <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                        <Users className="w-3 h-3 text-slate-400" /> {table.capacity} chỗ ngồi
                      </p>
                    </div>

                    {/* QR Code Graphic */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 inline-block shadow-2xs">
                      <img
                        src={table.qrUrl}
                        alt={`QR ${formatTableLabel(table.tableNumber)}`}
                        className="w-32 h-32 object-contain mx-auto"
                      />
                    </div>

                    <p className="text-[10px] font-mono text-slate-400 truncate">
                      {`${import.meta.env.VITE_FRONTEND_URL || window.location.origin}/menu?tableToken=${table.qrToken || 'qr_tok_' + table.id}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
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
                {zones.map((z) => (
                  <option key={z.zoneId} value={z.zoneName}>
                    {z.zoneName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số Chỗ Ngồi</label>
              <input
                type="number"
                min={1}
                max={50}
                value={newTableCapacity}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') setNewTableCapacity('');
                  else setNewTableCapacity(parseInt(val, 10) || 1);
                }}
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
                {zones.map((z) => (
                  <option key={z.zoneId} value={z.zoneName}>
                    {z.zoneName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số Chỗ Ngồi</label>
              <input
                type="number"
                min={1}
                max={50}
                value={editTableCapacity}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') setEditTableCapacity('');
                  else setEditTableCapacity(parseInt(val, 10) || 1);
                }}
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

      {/* 4. MODAL QUẢN LÝ DANH SÁCH KHU VỰC (ZONE) NGUYÊN BẢN BACKEND POSTGRESQL */}
      <Modal
        title="⚙️ Quản Lý Danh Sách Khu Vực (Zone)"
        open={isZoneModalOpen}
        onCancel={() => {
          setIsZoneModalOpen(false);
          setEditingZone(null);
        }}
        footer={null}
        width={540}
      >
        <div className="space-y-4 pt-2 text-xs">
          <p className="text-slate-500 border-b border-slate-100 pb-2">
            Danh sách các khu vực trong <b>hệ thống nhà hàng</b>. Bạn có thể Thêm mới, Chỉnh sửa tên hoặc Xóa khu vực theo nhu cầu quản lý.
          </p>

          {/* Form Thêm Khu Vực Mới */}
          <form onSubmit={handleCreateZone} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Nhập tên khu vực mới (VD: Tầng trệt, Sân Thượng, VIP 2...)"
              value={newZoneNameInput}
              onChange={(e) => setNewZoneNameInput(e.target.value)}
              className="flex-1 p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Khu Vực</span>
            </button>
          </form>

          {/* Danh Sách Các Khu Vực Hiện Có */}
          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-[300px] overflow-y-auto bg-slate-50/50">
            {zones.map((z) => (
              <div key={z.zoneId} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
                {editingZone?.zoneId === z.zoneId ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <input
                      type="text"
                      value={editZoneNameInput}
                      onChange={(e) => setEditZoneNameInput(e.target.value)}
                      className="flex-1 p-1.5 rounded border border-orange-500 text-xs bg-white focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateZone(z.zoneId)}
                      className="px-3 py-1 rounded bg-orange-600 text-white font-semibold hover:bg-orange-700 transition-colors text-[11px] cursor-pointer"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setEditingZone(null)}
                      className="px-2 py-1 rounded bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition-colors text-[11px] cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <FolderPlus className="w-4 h-4 text-orange-600" />
                      <span className="font-bold text-slate-800">{z.zoneName}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingZone(z);
                          setEditZoneNameInput(z.zoneName);
                        }}
                        className="p-1.5 rounded bg-slate-100 hover:bg-orange-50 text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
                        title="Sửa tên khu vực"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <Popconfirm
                        title="Xóa Khu Vực"
                        description={`Xóa khu vực "${z.zoneName}"? Các bàn thuộc khu vực này sẽ được chuyển về "Tầng trệt".`}
                        onConfirm={() => handleDeleteZone(z.zoneId, z.zoneName)}
                        onOpenChange={(open) => {
                          if (open) setEditingZone(null);
                        }}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <button
                          onClick={() => setEditingZone(null)}
                          className="p-1.5 rounded bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Xóa khu vực"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </Popconfirm>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
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
