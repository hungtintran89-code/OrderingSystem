import React, { useState, useEffect } from 'react';
import { StaffUser, StaffRole } from '../../types/admin';
import { fetchStaffUsersApi } from '../../api/adminApi';
import {
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  Lock,
  User,
  Phone,
  Mail,
  DollarSign,
  Key,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { Modal, message, Popconfirm } from 'antd';

export const StaffManagement: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Create Staff State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<StaffRole>('STAFF');
  const [newSalary, setNewSalary] = useState<number>(7500000);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);

  // Modal Edit Staff State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<StaffRole>('STAFF');
  const [editSalary, setEditSalary] = useState<number>(0);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const loadStaffUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchStaffUsersApi();
      setStaffList(data);
    } catch (err) {
      setError('Không thể tải danh sách nhân viên. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffUsers();
  }, []);

  const formatVND = (num: number) => new Intl.NumberFormat('vi-VN').format(num) + ' đ';

  const getRoleLabel = (role: StaffRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { label: 'Super Admin', color: 'bg-red-50 text-red-700 border-red-200' };
      case 'MANAGER':
        return { label: 'Quản Lý Nhà Hàng', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'KITCHEN':
        return { label: 'Đầu Bếp KDS', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'STAFF':
      default:
        return { label: 'Nhân Viên POS / Phục Vụ', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
  };

  // --- CREATE STAFF ACTION ---
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) {
      message.error('Vui lòng điền đầy đủ Họ tên, Tên đăng nhập và Mật khẩu');
      return;
    }

    const newStaff: StaffUser = {
      id: `usr-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim() || `${newUsername.trim()}@restaurant.com`,
      phone: newPhone.trim() || '0900000000',
      role: newRole,
      salary: Number(newSalary),
      username: newUsername.trim(),
      password: newPassword.trim(),
      status: 'ACTIVE',
      lastActive: 'Vừa tạo',
    };

    setStaffList((prev) => [newStaff, ...prev]);
    setIsCreateModalOpen(false);
    // Reset Form
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewUsername('');
    setNewPassword('123456');
    message.success(`Đã cấp tài khoản thành công cho nhân viên ${newName}!`);
  };

  // --- EDIT STAFF ACTION ---
  const handleOpenEditModal = (staff: StaffUser) => {
    setEditingStaff(staff);
    setEditName(staff.name);
    setEditEmail(staff.email);
    setEditPhone(staff.phone);
    setEditRole(staff.role);
    setEditSalary(staff.salary || 7500000);
    setEditUsername(staff.username || '');
    setEditPassword('');
    setIsEditModalOpen(true);
  };

  const handleSaveEditStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !editName.trim()) {
      message.error('Vui lòng nhập Họ tên nhân viên');
      return;
    }

    const updated: StaffUser = {
      ...editingStaff,
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      role: editRole,
      salary: Number(editSalary),
      username: editUsername.trim(),
      password: editPassword.trim() ? editPassword.trim() : editingStaff.password,
    };

    setStaffList((prev) => prev.map((s) => (s.id === editingStaff.id ? updated : s)));
    setIsEditModalOpen(false);
    message.success(`Đã cập nhật thông tin nhân viên ${editName}!`);
  };

  // --- DELETE / DEACTIVATE STAFF ACTION ---
  const handleDeleteStaff = (staffId: string) => {
    setStaffList((prev) => prev.filter((s) => s.id !== staffId));
    message.success('Đã xóa tài khoản nhân viên khỏi hệ thống');
  };

  return (
    <div className="space-y-4 font-sans">
      {/* HEADER TOOLBAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-orange-600" />
          <div>
            <h3 className="font-bold text-sm text-slate-900">Quản Lý Nhân Viên & Ma Trận Phân Quyền RBAC</h3>
            <p className="text-[11px] text-slate-500">Cấp tài khoản, mức lương và phân quyền truy cập hệ thống</p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="h-9 px-4 rounded-lg bg-orange-600 hover:bg-orange-700 active:scale-98 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Thêm Nhân Viên</span>
        </button>
      </div>

      {/* 4 UI STATES HANDLING */}

      {/* STATE 2: LOADING SKELETON */}
      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center justify-between py-3 border-b border-slate-100">
              <div className="h-4 bg-slate-200 rounded w-40"></div>
              <div className="h-6 bg-slate-200 rounded w-24"></div>
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
            onClick={loadStaffUsers}
            className="h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* STATE 1: NORMAL DATA STAFF TABLE */}
      {!loading && !error && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Họ & Tên Nhân Viên</th>
                  <th className="p-3.5">Tài Khoản / Liên Hệ</th>
                  <th className="p-3.5">Vai Trò (Role)</th>
                  <th className="p-3.5">Mức Lương (VND)</th>
                  <th className="p-3.5">Trạng Thái</th>
                  <th className="p-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {staffList.map((usr) => {
                  const roleBadge = getRoleLabel(usr.role);
                  return (
                    <tr key={usr.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {usr.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm">{usr.name}</p>
                            <span className="text-[10px] text-slate-400">Đăng nhập: {usr.lastActive}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <p className="font-mono text-xs font-semibold text-slate-800">
                          @{usr.username || usr.email.split('@')[0]}
                        </p>
                        <p className="text-[10px] text-slate-500">{usr.email} • {usr.phone}</p>
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${roleBadge.color}`}>
                          {roleBadge.label}
                        </span>
                      </td>

                      <td className="p-3.5 font-extrabold text-slate-900">
                        {usr.salary ? formatVND(usr.salary) : '7.500.000 đ'}
                      </td>

                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 text-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Hoạt động
                        </span>
                      </td>

                      <td className="p-3.5 text-right space-x-1">
                        {/* Nút Thao Tác: Chỉnh Sửa Nhân Viên */}
                        <button
                          onClick={() => handleOpenEditModal(usr)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-orange-50 hover:border-orange-300 text-slate-600 hover:text-orange-600 transition-colors cursor-pointer shadow-2xs"
                          title="Chỉnh sửa thông tin nhân viên"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Nút Xóa Nhân Viên */}
                        <Popconfirm
                          title="Xóa nhân viên"
                          description={`Bạn có chắc muốn xóa tài khoản ${usr.name}?`}
                          onConfirm={() => handleDeleteStaff(usr.id)}
                          okText="Xóa"
                          cancelText="Hủy"
                          okButtonProps={{ danger: true }}
                        >
                          <button
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:border-red-300 text-slate-400 hover:text-red-600 transition-colors cursor-pointer shadow-2xs"
                            title="Xóa nhân viên này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Popconfirm>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 1. MODAL TẠO NHÂN VIÊN MỚI (CHỌN ROLE, LƯƠNG, TÀI KHOẢN MẬT KHẨU) */}
      <Modal
        title="➕ Tạo Tài Khoản & Phân Quyền Nhân Viên Mới"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
      >
        <form onSubmit={handleCreateStaff} className="space-y-4 pt-2 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Họ & Tên nhân viên *</label>
            <input
              type="text"
              required
              placeholder="VD: Lê Thị Thu Ngân"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phân Quyền / Role *</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as StaffRole)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500 cursor-pointer"
              >
                <option value="STAFF">Nhân Viên POS / Phục Vụ</option>
                <option value="KITCHEN">Đầu Bếp KDS</option>
                <option value="MANAGER">Quản Lý Nhà Hàng</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mức Lương (VND/Tháng) *</label>
              <input
                type="number"
                required
                min={1000000}
                step={500000}
                placeholder="VD: 8500000"
                value={newSalary}
                onChange={(e) => setNewSalary(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                placeholder="VD: 0912345678"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email liên hệ</label>
              <input
                type="email"
                placeholder="VD: thungan@restaurant.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
              />
            </div>
          </div>

          {/* CẤP TÀI KHOẢN & MẬT KHẨU */}
          <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-orange-600" /> Cấp Tài Khoản Đăng Nhập Hệ Thống
            </h4>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên đăng nhập (Username) *</label>
              <input
                type="text"
                required
                placeholder="VD: thungan_pos"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs focus:border-orange-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mật khẩu khởi tạo *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 pr-10 rounded-lg border border-slate-200 bg-white text-xs focus:border-orange-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
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
              Cấp Tài Khoản Nhân Viên
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. MODAL CHỈNH SỬA THÔNG TIN NHÂN VIÊN */}
      <Modal
        title="✏️ Chỉnh Sửa Thông Tin & Phân Quyền Nhân Viên"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
      >
        <form onSubmit={handleSaveEditStaff} className="space-y-4 pt-2 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Họ & Tên nhân viên *</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phân Quyền / Role *</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as StaffRole)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500 cursor-pointer"
              >
                <option value="STAFF">Nhân Viên POS / Phục Vụ</option>
                <option value="KITCHEN">Đầu Bếp KDS</option>
                <option value="MANAGER">Quản Lý Nhà Hàng</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mức Lương (VND/Tháng) *</label>
              <input
                type="number"
                required
                min={1000000}
                step={500000}
                value={editSalary}
                onChange={(e) => setEditSalary(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email liên hệ</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
              />
            </div>
          </div>

          {/* CẬP NHẬT TÀI KHOẢN & ĐỔI MẬT KHẨU */}
          <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-orange-600" /> Đổi Mật Khẩu / Tên Đăng Nhập
            </h4>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên đăng nhập (Username)</label>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs focus:border-orange-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mật khẩu mới (Bỏ trống nếu không đổi)</label>
              <input
                type="password"
                placeholder="Nhập mật khẩu mới..."
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs focus:border-orange-500 font-mono"
              />
            </div>
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
              Lưu Thay Đổi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
