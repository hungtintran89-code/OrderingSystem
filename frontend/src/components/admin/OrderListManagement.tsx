import React, { useState, useEffect } from 'react';
import { AdminOrder, AdminOrderStatus } from '../../types/admin';
import { fetchAdminOrdersApi, updateAdminOrderStatusApi } from '../../api/adminApi';
import {
  Receipt,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ChefHat,
  Utensils,
  Ban,
  LayoutGrid,
  List,
  User,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Modal, message, Popconfirm } from 'antd';

export const OrderListManagement: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<AdminOrderStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'TABLE' | 'GRID'>('TABLE');

  // Expanded Row State for Accordion Table View
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  // Selected Order Modal State
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAdminOrdersApi();
      setOrders(data);
    } catch (err) {
      setError('Không thể tải danh sách đơn hàng phục vụ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const formatVND = (num: number) => new Intl.NumberFormat('vi-VN').format(num) + ' đ';

  const toggleExpandOrder = (orderId: string) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const handleUpdateStatus = async (orderId: string, newStatus: AdminOrderStatus) => {
    try {
      const updated = await updateAdminOrderStatusApi(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updated);
      }
      message.success('Đã cập nhật trạng thái đơn hàng thành công!');
    } catch (err) {
      message.error('Không thể cập nhật trạng thái đơn hàng');
    }
  };

  const handleOpenDetailModal = (order: AdminOrder) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  // Clean, high-contrast, whitespace-nowrap badges
  const getStatusBadge = (status: AdminOrderStatus) => {
    switch (status) {
      case 'PENDING':
        return { label: '🟡 Chờ Bếp duyệt', style: 'bg-amber-50 text-amber-800 border-amber-200/80 font-bold' };
      case 'PREPARING':
        return { label: '🟠 Bếp đang làm', style: 'bg-orange-50 text-orange-800 border-orange-200/80 font-bold' };
      case 'SERVED':
        return { label: '🔵 Đã lên món', style: 'bg-blue-50 text-blue-800 border-blue-200/80 font-bold' };
      case 'PAID':
        return { label: '🟢 Đã hoàn tất', style: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 font-extrabold' };
      case 'CANCELLED':
        return { label: '🔴 Đã hủy', style: 'bg-rose-50 text-rose-700 border-rose-200/80 font-semibold' };
      default:
        return { label: status, style: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  // Counts for tabs
  const getCountByStatus = (status: AdminOrderStatus | 'ALL') => {
    if (status === 'ALL') return orders.length;
    return orders.filter((o) => o.status === status).length;
  };

  // Filtered Orders
  const filteredOrders = orders.filter((ord) => {
    const matchesStatus = statusFilter === 'ALL' || ord.status === statusFilter;
    const matchesSearch =
      ord.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.items.some((it) => it.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4 font-sans max-w-7xl mx-auto">
      {/* 1. TOPBAR & LIVE REALTIME HEADER */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shadow-2xs flex-shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-extrabold text-base text-slate-900 tracking-tight">Danh Sách Đơn Hàng Realtime</h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/80">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Realtime
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Tự động đồng bộ đơn từ Khách tại bàn & Nhân viên POS</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <List className="w-4 h-4 text-orange-600" />
                <span>Bảng</span>
              </button>
              <button
                onClick={() => setViewMode('GRID')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'GRID' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-orange-600" />
                <span>Lưới thẻ</span>
              </button>
            </div>

            <button
              onClick={loadOrders}
              className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-600' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* 2. FILTER TABS & SEARCH BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'PENDING', label: '🟡 Chờ Bếp' },
              { id: 'PREPARING', label: '🟠 Đang Làm' },
              { id: 'SERVED', label: '🔵 Đã Phục Vụ' },
              { id: 'PAID', label: '🟢 Đã Thanh Toán' },
              { id: 'CANCELLED', label: '🔴 Đã Hủy' },
            ].map((tab) => {
              const count = getCountByStatus(tab.id as any);
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-slate-800 text-white' : 'bg-slate-200/70 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm mã đơn, số bàn, món..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/80 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
            />
          </div>
        </div>
      </div>

      {/* 4 UI STATES HANDLING */}

      {/* STATE 2: LOADING SKELETON */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-14 bg-slate-100 rounded-xl w-full"></div>
          ))}
        </div>
      )}

      {/* STATE 3: ERROR STATE */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3 max-w-lg mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
          <h3 className="text-sm font-bold text-red-900">{error}</h3>
          <button
            onClick={loadOrders}
            className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* STATE 4: EMPTY STATE */}
      {!loading && !error && filteredOrders.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-2xs">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-800 text-sm">Chưa Có Đơn Hàng Nào</h4>
          <p className="text-xs text-slate-500">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Không tìm thấy đơn hàng phù hợp với bộ lọc hiện tại.'
              : 'Các đơn hàng từ khách quét QR hoặc phục vụ sẽ xuất hiện tại đây.'}
          </p>
        </div>
      )}

      {/* STATE 1: NORMAL DATA DISPLAY */}

      {/* VIEW MODE 1: REDESIGNED APPLE/STRIPE-GRADE COMMERCIAL DATA TABLE */}
      {!loading && !error && filteredOrders.length > 0 && viewMode === 'TABLE' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap">
                <tr>
                  <th className="py-3.5 px-4">Mã Đơn & Vị Trí</th>
                  <th className="py-3.5 px-4">Thời Gian</th>
                  <th className="py-3.5 px-4">Danh Sách Món Đã Đặt</th>
                  <th className="py-3.5 px-4">Tổng Tiền</th>
                  <th className="py-3.5 px-4">Thanh Toán</th>
                  <th className="py-3.5 px-4">Trạng Thái Bếp</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredOrders.map((ord) => {
                  const badge = getStatusBadge(ord.status);
                  const isExpanded = !!expandedOrders[ord.id];

                  return (
                    <React.Fragment key={ord.id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        {/* Order Code & Table */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <button
                              onClick={() => toggleExpandOrder(ord.id)}
                              className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                              title="Xem chi tiết món"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            <div>
                              <span className="font-mono font-extrabold text-slate-900 text-sm block">{ord.orderCode}</span>
                              <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 font-bold text-[11px] border border-orange-200/80 inline-block mt-0.5">
                                Bàn {ord.tableNumber} • {ord.zone}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Created At */}
                        <td className="py-4 px-4 whitespace-nowrap font-mono text-slate-600 text-[11px]">
                          <span className="font-bold text-slate-900 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> {ord.createdAt}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{ord.staffName || 'Khách quét QR'}</span>
                        </td>

                        {/* Items Preview */}
                        <td className="py-4 px-4 min-w-[220px] max-w-xs">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-800 line-clamp-1">
                              {ord.items.map((i) => `${i.name} (${i.quantity})`).join(', ')}
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium">Tổng {ord.items.length} món ăn</p>
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td className="py-4 px-4 whitespace-nowrap font-black text-slate-900 text-sm">
                          {formatVND(ord.totalAmount)}
                        </td>

                        {/* Payment Status (Whitespace Nowrap Clean Badge) */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {ord.paymentStatus === 'PAID' ? (
                            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold text-[11px] inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> VietQR / Đã trả
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[11px] inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" /> Chưa thanh toán
                            </span>
                          )}
                        </td>

                        {/* Kitchen Status Badge (Whitespace Nowrap Clean Badge) */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] border inline-block ${badge.style}`}>
                            {badge.label}
                          </span>
                        </td>

                        {/* Actions (Clean Minimalist Button Group) */}
                        <td className="py-4 px-4 whitespace-nowrap text-right space-x-1.5">
                          <button
                            onClick={() => handleOpenDetailModal(ord)}
                            className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                          >
                            <Receipt className="w-3.5 h-3.5 text-orange-600" />
                            <span>Chi tiết</span>
                          </button>

                          {ord.status === 'PENDING' && (
                            <button
                              onClick={() => handleUpdateStatus(ord.id, 'PREPARING')}
                              className="h-8 px-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                            >
                              <ChefHat className="w-3.5 h-3.5" />
                              <span>Gửi Bếp</span>
                            </button>
                          )}

                          {ord.status === 'PREPARING' && (
                            <button
                              onClick={() => handleUpdateStatus(ord.id, 'SERVED')}
                              className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                            >
                              <Utensils className="w-3.5 h-3.5" />
                              <span>Đã Lên Món</span>
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* EXPANDED ACCORDION ROW FOR ITEM DETAILS & NOTES */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 border-b border-slate-200/80">
                          <td colSpan={7} className="p-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-3 shadow-2xs">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-orange-600" /> Chi tiết các món đặt trong đơn {ord.orderCode}:
                                </h5>
                                <span className="text-[11px] text-slate-400 font-mono">Bàn {ord.tableNumber}</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                {ord.items.map((it) => (
                                  <div key={it.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex justify-between items-center text-xs">
                                    <div>
                                      <p className="font-bold text-slate-900">{it.name}</p>
                                      {it.note && (
                                        <p className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                          Ghi chú: {it.note}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right ml-2 flex-shrink-0">
                                      <span className="font-bold text-orange-600">x{it.quantity}</span>
                                      <p className="font-mono font-bold text-[11px] text-slate-900">{formatVND(it.price * it.quantity)}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {ord.customerNote && (
                                <p className="text-[11px] text-amber-900 bg-amber-50/90 p-2.5 rounded-lg border border-amber-200/80 font-medium">
                                  📌 Ghi chú chung của khách: <strong>{ord.customerNote}</strong>
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: KANBAN GRID CARDS */}
      {!loading && !error && filteredOrders.length > 0 && viewMode === 'GRID' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredOrders.map((ord) => {
            const badge = getStatusBadge(ord.status);
            return (
              <div
                key={ord.id}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 text-sm">{ord.orderCode}</span>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${badge.style}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                    <span className="font-bold text-orange-600">Bàn {ord.tableNumber} ({ord.zone})</span>
                    <span className="text-slate-400 font-mono text-[11px]">{ord.createdAt}</span>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {ord.items.map((it) => (
                      <div key={it.id} className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-800 line-clamp-1">
                          {it.name} <span className="text-orange-600 font-bold">x{it.quantity}</span>
                        </span>
                        <span className="font-mono font-bold text-slate-900">{formatVND(it.price * it.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between items-center font-bold text-slate-900">
                    <span className="text-xs text-slate-500">Tổng tiền:</span>
                    <span className="text-sm font-black">{formatVND(ord.totalAmount)}</span>
                  </div>

                  <button
                    onClick={() => handleOpenDetailModal(ord)}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-orange-600" />
                    <span>Xem Chi Tiết & Vận Hành</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAILED ORDER MODAL & SIMULATED THERMAL SLIP */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-orange-600" />
            <span>Chi Tiết Đơn Hàng {selectedOrder?.orderCode} - Bàn {selectedOrder?.tableNumber}</span>
          </div>
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        width={560}
        footer={null}
      >
        {selectedOrder && (
          <div className="space-y-4 pt-2 text-xs font-sans">
            {/* Header info */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Bàn {selectedOrder.tableNumber} • {selectedOrder.zone}</h4>
                <p className="text-slate-500 font-mono text-[11px]">
                  Mã đơn: <strong>{selectedOrder.orderCode}</strong> • Lúc {selectedOrder.createdAt}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusBadge(selectedOrder.status).style}`}>
                {getStatusBadge(selectedOrder.status).label}
              </span>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Danh sách các món đặt:</p>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                {selectedOrder.items.map((it) => (
                  <div key={it.id} className="p-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{it.name}</p>
                      {it.note && <p className="text-[11px] text-amber-700">Note: {it.note}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">
                        {formatVND(it.price)} <span className="text-orange-600">x{it.quantity}</span>
                      </p>
                      <p className="font-black text-slate-900">{formatVND(it.price * it.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Amount & Notes */}
            <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-xl flex justify-between items-center">
              <span className="font-bold text-orange-950 text-sm">TỔNG TIỀN ĐƠN HÀNG:</span>
              <span className="font-black text-xl text-orange-600">{formatVND(selectedOrder.totalAmount)}</span>
            </div>

            {/* Status Change Controls */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-700 block">Đổi trạng thái đơn hàng:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'PREPARING')}
                  className="p-2 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-900 font-semibold cursor-pointer text-center"
                >
                  🟠 Bếp Đang Làm
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'SERVED')}
                  className="p-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold cursor-pointer text-center"
                >
                  🔵 Đã Lên Món
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'PAID')}
                  className="p-2 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold cursor-pointer text-center"
                >
                  🟢 Đã Thanh Toán
                </button>
              </div>
            </div>

            {/* Print Slip Action */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => message.info('Đang gửi lệnh in phiếu báo bếp (In Bill 80mm)...')}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-4 h-4 text-orange-600" />
                <span>In Phiếu Báo Bếp</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
